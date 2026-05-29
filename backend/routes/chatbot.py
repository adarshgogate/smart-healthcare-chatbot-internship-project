from flask import Blueprint, request, jsonify
import numpy as np
import joblib
import pandas as pd
import json
from models.doctor import Doctor
from models.appointment import Appointment
from models.patient import Patient
from extensions import db
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func   

chatbot_bp = Blueprint("chatbot", __name__)
# --- Doctor recommendation mapping ---
doctor_recommendations = {
    "Drug Reaction": "Dermatologist",
    "GERD": "Gastroenterologist",
    "Dimorphic hemmorhoids(piles)": "Gastroenterologist",
    "Migraine": "Neurologist",
    "Sinusitis": "ENT Specialist",
    "Gastritis": "Gastroenterologist",
    "Diabetes": "Endocrinologist",
    "Hypertension": "Cardiologist",
    "Asthma": "Pulmonologist",
    "Arthritis": "Orthopedic Specialist",
    "Skin Rash": "Dermatologist",
    "Itching": "Dermatologist",   
    "Depression": "Psychiatrist",
    "Paralysis (brain hemorrhage)": "Neurologist",
    "Osteoarthritis": "Orthopedic Specialist",
    "Psoriasis": "Dermatologist",
    "Hepatitis D": "Gastroenterologist",
    "Acidity": "Gastroenterologist",
    "Headache": "Neurologist",
    "Chest Pain": "Cardiologist",
    "Fatigue": "General Physician",
    "Fever": "General Physician"
}

# --- Symptom → Specialist mapping ---
symptom_to_specialist = {
    "itching": "Dermatologist",
    "rash": "Dermatologist",
    "cough": "Pulmonologist",
    "chest pain": "Cardiologist",
    "joint pain": "Orthopedic Specialist",
    "stomach pain": "Gastroenterologist",
    "headache": "Neurologist",
    "fever": "General Physician",
    "fatigue": "General Physician",
    "shortness of breath": "Pulmonologist",
    "depression": "Psychiatrist"
}



# --- Load trained artifacts ---
rf_model = joblib.load("models/random_forest (6).pkl")
label_encoder = joblib.load("models/label_encoder (6).pkl")
symptom_columns = joblib.load("models/symptom_columns (6).pkl")
print("Loaded symptoms:", symptom_columns[:50])

# # --- Load Gen AI model ---
# import requests
# from openai import OpenAI
# import os


# def get_gen_ai_response(prompt: str) -> str:
#     try:
#         response = client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=[{"role": "user", "content": prompt}]
#         )
#         return response.choices[0].message.content.strip()
#     except Exception as e:
#         print("GenAI error:", e)
#         return "⚠️ Unable to generate AI response at the moment. Please consult a doctor directly."


# --- Load book context (normalized keys) ---
with open("book_context.json", "r") as f:
    book_context = {k.strip().lower(): v for k, v in json.load(f).items()}


# --- Prediction function ---
def predict_disease(symptoms_list, threshold=5.0):
    input_vector = np.zeros(len(symptom_columns))
    for symptom in symptoms_list:
        if symptom in symptom_columns:
            input_vector[symptom_columns.index(symptom)] = 1

    input_df = pd.DataFrame([input_vector], columns=symptom_columns)
    pred_proba = rf_model.predict_proba(input_df)[0]
    top_indices = np.argsort(pred_proba)[::-1][:3]
    top_diseases = label_encoder.inverse_transform(top_indices)
    top_confidences = [round(pred_proba[i] * 100, 2) for i in top_indices]

    return [(disease, conf) for disease, conf in zip(top_diseases, top_confidences)]



# --- Gen AI response with book context ---
import json

# Reload JSON so edits are always picked up
with open("book_context.json") as f:
    book_context = json.load(f)
def generate_book_context_response(detected_symptoms, top_predictions):
    disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."

    if not top_predictions or top_predictions[0][0] == "No clear prediction":
        return f"Your symptoms don’t strongly match any disease in my database. Please consult a professional.\n\n{disclaimer}"

    # --- Symptom-driven prioritization ---
    for symptom in detected_symptoms:
        preferred_specialist = symptom_to_specialist.get(symptom.replace("_", " "), None)
        if preferred_specialist:
            for disease, conf in top_predictions:
                spec = doctor_recommendations.get(disease)
                if spec == preferred_specialist:
                    context = book_context.get(disease.lower())
                    if context:
                        return f"{context}\n\n{disclaimer}"

    # --- Special case for Drug Reaction ---
    top_disease, confidence = top_predictions[0]
    if top_disease == "Drug Reaction":
        if "itching" in detected_symptoms or "rash" in detected_symptoms:
            context = book_context.get("drug reaction")
        else:
            context = book_context.get("gerd") or book_context.get("gastritis")
        if context:
            return f"{context}\n\n{disclaimer}"

    # --- Normal flow fallback ---
    normalized_disease = top_disease.strip().lower()
    context = book_context.get(normalized_disease)
    if context:
        return f"{context}\n\n{disclaimer}"
    else:
        return f"{top_disease} detected. Please consult a doctor for further guidance.\n\n{disclaimer}"

# def generate_book_context_response(symptoms_input, top_predictions):
#     disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."

#     if not top_predictions or top_predictions[0][0] == "No clear prediction":
#         return f"Your symptoms don’t strongly match any disease in my database. Please consult a professional.\n\n{disclaimer}"

#     top_disease, confidence = top_predictions[0]
#     normalized_disease = top_disease.strip().title()

#     # --- Always use JSON advice if available ---
#     context = book_context.get(normalized_disease)
#     if context:
#         return f"{context}\n\n{disclaimer}"

#     # --- If no JSON entry, fallback to GenAI ---
#     prompt = f"""
#     Patient reports: {symptoms_input}.
#     Predicted condition: {normalized_disease} ({confidence}%).
#     Write a short, clear doctor-style advice (2–3 sentences).
#     """

#     try:
#         response = get_gen_ai_response(prompt)
#         return f"{response.strip()}\n\n{disclaimer}"
#     except Exception as e:
#         print("GenAI error:", e)
#         return f"⚠️ Unable to generate AI response at the moment. Please consult a doctor directly.\n\n{disclaimer}"


# --- Available slots helper ---
def get_available_slots(doctor_id, date=None):
    query = Appointment.query.filter_by(doctor_id=doctor_id)
    if date:
        query = query.filter_by(date=date)
    booked = query.all()
    booked_times = {str(a.time) for a in booked}
    all_slots = [f"{hour:02d}:00" for hour in range(9, 17)]
    available = [slot for slot in all_slots if slot not in booked_times]
    return available, list(booked_times)   # ← return both now

# # --- Booking Appointments ---
# @chatbot_bp.route("/appointments/book", methods=["POST"])
# @jwt_required()
# def book_slot():
#     try:
#         data = request.get_json(force=True)
#         doctor_name = data.get("doctorName")
#         specialization = data.get("specialization")
#         slot = data.get("slot")

#         user_id = get_jwt_identity()
#         patient = Patient.query.filter_by(user_id=user_id).first()
#         if not patient:
#             return jsonify({"success": False, "message": "Patient record not found"}), 400

#         doctor = Doctor.query.filter_by(name=doctor_name, specialization=specialization).first()
#         if not doctor:
#             return jsonify({"success": False, "message": "Doctor not found"}), 404

#         slots = get_available_slots(doctor.doctor_id)
#         if slot not in slots:
#             return jsonify({"success": False, "message": "Slot already taken"}), 400

#         new_appt = Appointment(
#             patient_id=patient.patient_id,
#             doctor_id=doctor.doctor_id,
#             date=pd.Timestamp.today().strftime("%Y-%m-%d"),
#             time=slot,
#             description="Booked via chatbot",
#             status="Pending"
#         )
#         db.session.add(new_appt)
#         db.session.commit()

#         return jsonify({"success": True, "appointment_id": new_appt.appointment_id})
#     except Exception as e:
#         print("Error booking:", e)
#         return jsonify({"success": False, "message": "Internal error"}), 500
    
# --- Chatbot route ---
@chatbot_bp.route("/chatbot", methods=["POST"])
@jwt_required()
def chatbot():
    try:
        data = request.get_json(force=True)
        print("Received chatbot request:", data)   # ✅ add this line
        query = (data.get("query") or "").lower().strip()
        if not query:
            return jsonify({"error": "No query provided"}), 400

        disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."

        # --- Direct disease handler ---
        for disease in book_context.keys():
            if disease in query:
                spec = doctor_recommendations.get(disease.title(), "General Physician")
                doc_obj = Doctor.query.filter_by(specialization=spec).first()
                slots, booked_slots = get_available_slots(doc_obj.doctor_id) if doc_obj else ([], [])

                return jsonify({
                    "predictions": [{"disease": disease.title(), "confidence": 100.0}],
                    "reply": f"{book_context[disease]}\n\n{disclaimer}",
                    "results": [{
                        "disease": disease.title(),
                        "confidence": 100.0,
                        "recommended_specialist": spec,
                        "doctor_id": doc_obj.doctor_id if doc_obj else None,   # ✅ added
                        "doctor_name": doc_obj.name if doc_obj else "General Physician",
                        "available_slots": slots,
                        "booked_slots": booked_slots
                    }]
                })


         # --- Synonym dictionary ---
        symptom_synonyms = {
            "muscle pain": "muscle_wasting",
            "leg pain": "joint_pain",
            "arm pain": "joint_pain",
            "stomach pain": "stomach_pain",
            "stomach ache": "stomach_pain",
            "chest pain": "chest_pain",
            "heart pain": "chest_pain",
            "back pain": "back_pain",
            "joint pain": "joint_pain",
            "body pain": "body_pain",
            "headache": "headache",
            "migraine": "headache",
            "skin rash": "skin_rash",
            "rash": "skin_rash",
            "itching": "itching",
            "skin itching": "itching",
            "acidity": "acidity",
            "gastric problem": "indigestion",
            "gastric pain": "abdominal_pain",
            "loose motion": "diarrhoea",
            "diarrhea": "diarrhoea",
            "constipation": "constipation",
            "vomiting": "vomiting",
            "nausea": "nausea",
            "loss of appetite": "loss_of_appetite",
            "breathing problem": "shortness_of_breath",
            "difficulty breathing": "shortness_of_breath",
            "shortness of breath": "shortness_of_breath",
            "cough": "cough",
            "breathlessness": "breathlessness",
            "tiredness": "fatigue",
            "weakness": "fatigue",
            "feeling weak": "fatigue",
            "shivering": "shivering",
            "fever": "high_fever",
            "mild fever": "mild_fever",
            "cold hands": "cold_hands_and_feets",
            "sweating": "sweating",
            "chills": "chills",
            "malaise": "malaise",
            "sadness": "depression",
            "depression": "depression",
            "anxious": "anxiety",
            "anxiety": "anxiety",
            "stress": "anxiety",
            "restlessness": "restlessness",
            "lethargy": "lethargy",
            "mood swings": "mood_swings",
            "yellow eyes": "yellowing_of_eyes",
            "yellow skin": "yellowish_skin",
            "dark urine": "dark_urine",
            "blurred vision": "blurred_and_distorted_vision",
            "eye pain": "pain_behind_the_eyes",
            "sunken eyes": "sunken_eyes",
            "swollen stomach": "swelling_of_stomach",
            "swollen lymph nodes": "swelled_lymph_nodes",
            "patches in throat": "patches_in_throat"
        }


        # --- Normalize multi-word phrases BEFORE splitting ---
        for phrase, mapped in symptom_synonyms.items():
            if phrase in query.lower():
                query = query.lower().replace(phrase, mapped)


        tokens = query.split()
        normalized_tokens = [symptom_synonyms.get(token, token) for token in tokens]

        # --- Detect symptoms ---
        from difflib import get_close_matches
        detected_symptoms = []
        for token in normalized_tokens:
            if token in {"problem", "issue", "pain", "ache"}:
                continue
            if token in symptom_columns:
                detected_symptoms.append(token)
                continue
            match = get_close_matches(token, symptom_columns, n=1, cutoff=0.8)
            if match:
                detected_symptoms.append(match[0])

        # ✅ Only one clean log line
        print("Tokens:", tokens)
        print("Normalized tokens:", normalized_tokens)
        print("Detected symptoms:", detected_symptoms)

        print("🔍 Detected symptoms:", detected_symptoms)

        if detected_symptoms:
            predictions_raw = predict_disease(detected_symptoms, threshold=5.0)
            predictions = [{"disease": d, "confidence": c} for d, c in predictions_raw]

            # --- Knowledge-aware fallback ---
            if not predictions or predictions[0]["disease"] == "No clear prediction":
                spec = "General Physician"
                for key, val in symptom_to_specialist.items():
                    if key in query:
                        spec = val
                        break

                doc_obj = Doctor.query.filter_by(specialization=spec).first()
                slots, booked_slots = get_available_slots(doc_obj.doctor_id) if doc_obj else ([], [])

                context = book_context.get(
                    detected_symptoms[0].lower(),
                    "Your symptoms suggest consulting a specialist."
                )

                return jsonify({
                    "predictions": [{
                        "disease": "Symptom-based condition",
                        "confidence": 10.0,
                        "recommended_specialist": spec,
                        "doctor_name": doc_obj.name if doc_obj else None,
                        "available_slots": slots,
                        "booked_slots": booked_slots
                    }],
                    "reply": f"{context}\n\n{disclaimer}"
                })

            # --- Normal flow with predictions ---
            doctor_reply = generate_book_context_response(detected_symptoms, predictions_raw)

            results = []
            for p in predictions:
                disease = p["disease"]
                conf = p["confidence"]
                disease_lower = disease.lower()
                
                # --- Special case for Drug Reaction ---
                if disease == "Drug Reaction":
                    if "itching" in detected_symptoms or "rash" in detected_symptoms:
                        spec = "Dermatologist"
                    else:
                        spec = "Gastroenterologist"
                else:
                    spec = doctor_recommendations.get(disease) or symptom_to_specialist.get(disease_lower) or "General Physician"

                spec = doctor_recommendations.get(disease) or symptom_to_specialist.get(disease_lower) or "General Physician"
                doc_obj = Doctor.query.filter(func.lower(Doctor.specialization) == spec.lower()).first()
                if not doc_obj:
                    spec = "General Physician"
                    doc_obj = Doctor.query.filter(func.lower(Doctor.specialization) == "general physician").first()

                slots, booked_slots = get_available_slots(doc_obj.doctor_id) if doc_obj else ([], [])

                results.append({
                    "disease": disease,
                    "confidence": conf,
                    "recommended_specialist": spec,
                    "doctor_id": doc_obj.doctor_id, 
                    "doctor_name": doc_obj.name if doc_obj else "General Physician",
                    "available_slots": slots,
                    "booked_slots": booked_slots
                })

            # --- Deduplicate doctors ---
            unique_results = []
            seen_doctors = set()
            for r in results:
                key = (r["doctor_name"], r["recommended_specialist"])
                if key not in seen_doctors:
                    unique_results.append(r)
                    seen_doctors.add(key)

            # ✅ Final clean log line
            print("✅ Final results:", unique_results)

            return jsonify({
                "predictions": predictions,
                "reply": doctor_reply,
                "results": unique_results
            })

        # --- No symptoms detected ---
        return jsonify({
        "predictions": [],
        "reply": f"Your input didn’t match any known symptom. Please provide more details.\n\n{disclaimer}",
        "recommended_doctor": "General Physician",
        "available_slots": []
        }), 200


    except Exception as e:
        print("❌ Error:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    