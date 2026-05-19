from flask import Blueprint, request, jsonify
import numpy as np
import joblib
import pandas as pd
import json
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from models.doctor import Doctor
from models.appointment import Appointment
from models.patient import Patient
from extensions import db
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity
from transformers import pipeline

chatbot_bp = Blueprint("chatbot", __name__)

# --- Doctor recommendation mapping ---
doctor_recommendations = {
    "Migraine": "Neurologist",
    "Sinusitis": "ENT Specialist",
    "Gastritis": "Gastroenterologist",
    "Diabetes": "Endocrinologist",
    "Hypertension": "Cardiologist",
    "Asthma": "Pulmonologist",
    "Arthritis": "Orthopedic Specialist",
    "Skin Rash": "Dermatologist",
    "Depression": "Psychiatrist",
    "Paralysis (brain hemorrhage)": "Neurologist"
}

# --- Load trained artifacts ---
rf_model = joblib.load("models/random_forest.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")
symptom_columns = joblib.load("models/symptom_columns.pkl")
print("Loaded symptoms:", symptom_columns[:20])

# --- Load Gen AI model ---
import requests

def get_gen_ai_response(prompt):
    with open("ngrok_url.txt") as f:   # ✅ local file in backend folder
        url = f.read().strip()
    response = requests.post(f"{url}/chatbot", json={"prompt": prompt})
    return response.json()["reply"]

# --- Load book context ---
with open("book_context.json", "r") as f:
    book_context = json.load(f)

# --- Prediction function ---
def predict_disease(symptoms_list, threshold=20.0):
    input_vector = np.zeros(len(symptom_columns))
    for symptom in symptoms_list:
        if symptom in symptom_columns:
            input_vector[symptom_columns.index(symptom)] = 1
    
    input_df = pd.DataFrame([input_vector], columns=symptom_columns)
    pred_proba = rf_model.predict_proba(input_df)[0]
    top_indices = np.argsort(pred_proba)[::-1][:3]
    top_diseases = label_encoder.inverse_transform(top_indices)
    top_confidences = [round(pred_proba[i] * 100, 2) for i in top_indices]
    
    filtered = [(disease, conf) for disease, conf in zip(top_diseases, top_confidences) if conf >= threshold]
    return filtered if filtered else [("No clear prediction", 0.0)]

# --- Gen AI response with book context ---
import json

# Reload JSON so edits are always picked up
with open("book_context.json") as f:
    book_context = json.load(f)
    
def generate_book_context_response(symptoms_input, top_predictions):
    disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."

    if not top_predictions or top_predictions[0][0] == "No clear prediction":
        return f"Your symptoms don’t strongly match any disease in my database. Please consult a professional.\n\n{disclaimer}"

    top_disease, confidence = top_predictions[0]
    normalized_disease = top_disease.strip().title()

    # --- Always use JSON advice if available ---
    context = book_context.get(normalized_disease)
    if context:
        return f"{context}\n\n{disclaimer}"

    # --- If no JSON entry, fallback to GenAI ---
    prompt = f"""
    Patient reports: {symptoms_input}.
    Predicted condition: {normalized_disease} ({confidence}%).
    Write a short, clear doctor-style advice (2–3 sentences).
    """

    try:
        response = get_gen_ai_response(prompt)
        return f"{response.strip()}\n\n{disclaimer}"
    except Exception as e:
        print("GenAI error:", e)
        return f"⚠️ Unable to generate AI response at the moment. Please consult a doctor directly.\n\n{disclaimer}"


# --- Available slots helper ---
def get_available_slots(doctor_id, date=None):
    query = Appointment.query.filter_by(doctor_id=doctor_id)
    if date:
        query = query.filter_by(date=date)
    booked = query.all()
    booked_times = {str(a.time) for a in booked}
    all_slots = [f"{hour:02d}:00" for hour in range(9, 17)]
    return [slot for slot in all_slots if slot not in booked_times]

# --- Booking Appointments ---
@chatbot_bp.route("/appointments/book", methods=["POST"])
@jwt_required()
def book_slot():
    try:
        data = request.get_json(force=True)
        doctor_name = data.get("doctorName")
        specialization = data.get("specialization")
        slot = data.get("slot")

        user_id = get_jwt_identity()
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient:
            return jsonify({"success": False, "message": "Patient record not found"}), 400

        doctor = Doctor.query.filter_by(name=doctor_name, specialization=specialization).first()
        if not doctor:
            return jsonify({"success": False, "message": "Doctor not found"}), 404

        slots = get_available_slots(doctor.doctor_id)
        if slot not in slots:
            return jsonify({"success": False, "message": "Slot already taken"}), 400

        new_appt = Appointment(
            patient_id=patient.patient_id,
            doctor_id=doctor.doctor_id,
            date=pd.Timestamp.today().strftime("%Y-%m-%d"),
            time=slot,
            description="Booked via chatbot",
            status="Pending"
        )
        db.session.add(new_appt)
        db.session.commit()

        return jsonify({"success": True, "appointment_id": new_appt.appointment_id})
    except Exception as e:
        print("Error booking:", e)
        return jsonify({"success": False, "message": "Internal error"}), 500

# --- Chatbot route ---
@chatbot_bp.route("/chatbot", methods=["POST"])
@jwt_required()
def chatbot():
    try:
        data = request.get_json(force=True)
        query = (data.get("query") or "").lower().strip()
        if not query:
            return jsonify({"error": "No query provided"}), 400

        disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."

        # --- Synonym dictionary ---
        symptom_synonyms = {
            "skin rash": "skin_rash",
            "rash": "skin_rash",
            "breathing problem": "shortness_of_breath",
            "difficulty breathing": "shortness_of_breath",
            "stomach ache": "stomach_pain",
            "skin itching": "itching",
            "stomach pain": "stomach_pain", 
            "itching": "itching",
            "acidity": "acidity",
            "tiredness": "fatigue",
            "shivering":"shivering",
            "feeling weak": "fatigue",
            "heart pain": "chest_pain",
            "loose motion": "diarrhoea",
            "constipated": "constipation",
            "sadness": "depression",
            "anxious": "anxiety",
            "acidity problem": "acidity",
            "skin rash": "skin_rash",
            "rash": "skin_rash",
            "stomach ache": "stomach_pain",
            "heart pain": "chest_pain",
            "weak": "fatigue"
        }

        # --- Normalize multi-word phrases BEFORE splitting ---
        for phrase, mapped in symptom_synonyms.items():
            if phrase in query:
                query = query.replace(phrase, mapped)

        tokens = query.split()  # keep words separated
        normalized_tokens = [symptom_synonyms.get(token, token) for token in tokens]


        # --- Detect symptoms ---
        from difflib import get_close_matches

        # --- Detect symptoms with fuzzy matching ---
        detected_symptoms = []
        for token in normalized_tokens:
            # strip filler words like "problem", "issue", "pain", "ache"
            if token in {"problem", "issue", "pain", "ache"}:
                continue

            # try exact match first
            if token in symptom_columns:
                detected_symptoms.append(token)
                continue

            # fuzzy match for spelling mistakes / variants
            match = get_close_matches(token, symptom_columns, n=1, cutoff=0.8)
            if match:
                detected_symptoms.append(match[0])

        print("User tokens:", tokens)
        print("Normalized tokens:", normalized_tokens)
        print("Detected symptoms:", detected_symptoms)

        if detected_symptoms:
            predictions = predict_disease(detected_symptoms, threshold=20.0)

            # --- Knowledge-aware fallback ---
            if predictions[0][0] == "No clear prediction":
                # Use detected symptoms + knowledge file + GenAI
                symptom = detected_symptoms[0]
                context = book_context.get(symptom, "No extra context available.")
                prompt = f"""
                Patient query: {query}
                Symptoms detected: {detected_symptoms}
                Knowledge: {context}
                Generate a professional doctor's response with advice.
                """
                doctor_reply = get_gen_ai_response(prompt)
                return jsonify({
                    "predictions": [],
                    "reply": f"{doctor_reply}\n\n{disclaimer}",
                    "recommended_doctor": None,
                    "available_slots": []
                })

            # --- Normal flow with predictions ---
            doctor_reply = generate_book_context_response(query, predictions)

           # ✅ Symptom-level fallback: check both lowercase and Title case keys
            for symptom in detected_symptoms:
                key_lower = symptom.lower()
                key_title = symptom.strip().title()

                if key_lower in book_context:
                    doctor_reply = f"{book_context[key_lower]}\n\n{disclaimer}"
                    break
                elif key_title in book_context:
                    doctor_reply = f"{book_context[key_title]}\n\n{disclaimer}"
                    break


            results = []
            for disease, conf in predictions:
                if disease == "No clear prediction":
                    continue
                spec = doctor_recommendations.get(disease, "General Physician")
                doc_obj = Doctor.query.filter_by(specialization=spec).first()
                slots = get_available_slots(doc_obj.doctor_id) if doc_obj else []
                results.append({
                    "disease": disease,
                    "confidence": conf,
                    "recommended_specialist": spec,
                    "doctor_name": doc_obj.name if doc_obj else None,
                    "available_slots": slots
                })

            return jsonify({
                "predictions": results,
                "reply": doctor_reply   # ✅ no extra disclaimer here
            })


        # --- No symptoms detected ---
        return jsonify({
            "predictions": [],
            "reply": f"Your input didn’t match any known symptom. Please provide more details.\n\n{disclaimer}",
            "recommended_doctor": None,
            "available_slots": []
        })

    except Exception as e:
        print("Error:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
