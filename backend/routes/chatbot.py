from flask import Blueprint, request, jsonify
import numpy as np
import joblib
import pandas as pd
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from models.doctor import Doctor
from models.appointment import Appointment
from extensions import db
import traceback
import dateparser

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

# --- Load doctor response model ---
try:
    tokenizer = AutoTokenizer.from_pretrained("./doctor_response_model", use_fast=False, legacy=False)
    response_model = AutoModelForSeq2SeqLM.from_pretrained("./doctor_response_model")
except Exception:
    tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base", use_fast=False, legacy=False)
    response_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

# --- Fallback dictionary ---
fallback_responses = {
    "fever": {
        "advice": "Fever is usually a sign of infection. Stay hydrated, rest, and monitor your temperature.",
        "mapped_symptom": "high_fever",
        "doctor": "General Physician"
    },
    "mild_fever": {
        "advice": "Mild fever can be caused by viral infections. Rest and monitor your temperature.",
        "mapped_symptom": "mild_fever",
        "doctor": "General Physician"
    },
    "cough": {
        "advice": "Cough can be due to cold or flu. Drink warm fluids.",
        "mapped_symptom": "cough",
        "doctor": "Pulmonologist"
    },
    "sore_throat": {
        "advice": "A sore throat is often due to infection. Gargle with salt water.",
        "mapped_symptom": "throat_irritation",
        "doctor": "ENT Specialist"
    },
    "runny_nose": {
        "advice": "Runny nose is usually viral. Rest and use steam inhalation.",
        "mapped_symptom": "runny_nose",
        "doctor": "ENT Specialist"
    },
    "headache": {
        "advice": "Headaches are often caused by stress or dehydration. Rest and hydrate.",
        "mapped_symptom": "headache",
        "doctor": "Neurologist"
    },
    "migraine": {
        "advice": "Migraines can be severe. Avoid triggers and consult a neurologist if frequent.",
        "mapped_symptom": "migraine",
        "doctor": "Neurologist"
    },
    "chest_pain": {
        "advice": "Chest pain can be serious. Seek immediate medical attention if severe.",
        "mapped_symptom": "chest_pain",
        "doctor": "Cardiologist"
    },
    "shortness_of_breath": {
        "advice": "Shortness of breath can be serious. Seek medical care.",
        "mapped_symptom": "breathlessness",
        "doctor": "Pulmonologist"
    },
    "dizziness": {
        "advice": "Dizziness can be due to dehydration. Sit down and hydrate.",
        "mapped_symptom": "dizziness",
        "doctor": "Neurologist"
    },
    "fatigue": {
        "advice": "Fatigue can result from stress, poor sleep, or illness. Rest and monitor.",
        "mapped_symptom": "fatigue",
        "doctor": "General Physician"
    },
    "back_pain": {
        "advice": "Back pain is commonly linked to posture. Stretch gently and rest.",
        "mapped_symptom": "back_pain",
        "doctor": "Orthopedic Specialist"
    },
    "joint_pain": {
        "advice": "Joint pain may be due to arthritis or injury. Rest and consult a specialist if persistent.",
        "mapped_symptom": "joint_pain",
        "doctor": "Orthopedic Specialist"
    },
    "stomach_pain": {
        "advice": "Stomach pain can have many causes, including indigestion or infection. Rest, hydrate, and consult a doctor if it persists.",
        "mapped_symptom": "abdominal_pain",
        "doctor": "Gastroenterologist"
    },
    "nausea": {
        "advice": "Nausea may be due to food poisoning or viral infection. Rest and sip clear fluids.",
        "mapped_symptom": "nausea",
        "doctor": "General Physician"
    },
    "vomiting": {
        "advice": "Vomiting can lead to dehydration. Drink fluids and seek care if persistent.",
        "mapped_symptom": "vomiting",
        "doctor": "General Physician"
    },
    "diarrhea": {
        "advice": "Diarrhea may be caused by infection or food intolerance. Stay hydrated.",
        "mapped_symptom": "diarrhea",
        "doctor": "Gastroenterologist"
    },
    "constipation": {
        "advice": "Constipation is often linked to diet. Increase fiber and fluids.",
        "mapped_symptom": "constipation",
        "doctor": "Gastroenterologist"
    },
    "skin_rash": {
        "advice": "Skin rashes can be allergic or infectious. Avoid scratching and consult a dermatologist if severe.",
        "mapped_symptom": "skin_rash",
        "doctor": "Dermatologist"
    },
    "itching": {
        "advice": "Itching may be due to allergies or skin irritation. Avoid scratching and use soothing lotion.",
        "mapped_symptom": "itching",
        "doctor": "Dermatologist"
    },
    "allergy": {
        "advice": "Allergies can cause sneezing, itching, or rash. Avoid triggers and consult a doctor if severe.",
        "mapped_symptom": "allergy",
        "doctor": "Allergist"
    },
    "eye_pain": {
        "advice": "Eye pain can result from strain. See an ophthalmologist if it persists.",
        "mapped_symptom": "eye_pain",
        "doctor": "Ophthalmologist"
    },
    "red_eye": {
        "advice": "Red eyes may be due to infection or irritation. Avoid rubbing and consult a doctor if persistent.",
        "mapped_symptom": "red_eye",
        "doctor": "Ophthalmologist"
    },
    "insomnia": {
        "advice": "Insomnia can be linked to stress. Practice good sleep hygiene.",
        "mapped_symptom": "insomnia",
        "doctor": "Psychiatrist"
    },
    "anxiety": {
        "advice": "Anxiety can cause restlessness and worry. Practice relaxation techniques and consult a professional if severe.",
        "mapped_symptom": "anxiety",
        "doctor": "Psychiatrist"
    },
    "depression": {
        "advice": "Depression can affect mood and energy. Seek support from a mental health professional.",
        "mapped_symptom": "depression",
        "doctor": "Psychiatrist"
    },
    "palpitations": {
        "advice": "Heart palpitations may be due to stress or heart issues. Consult a cardiologist if frequent.",
        "mapped_symptom": "palpitations",
        "doctor": "Cardiologist"
    },
    "high_blood_pressure": {
        "advice": "High blood pressure can be dangerous. Monitor regularly and consult a doctor.",
        "mapped_symptom": "hypertension",
        "doctor": "Cardiologist"
    },
    "diabetes": {
        "advice": "Diabetes requires lifestyle management. Monitor blood sugar and consult an endocrinologist.",
        "mapped_symptom": "diabetes",
        "doctor": "Endocrinologist"
    },
    "asthma": {
        "advice": "Asthma can cause breathing difficulty. Use prescribed inhalers and consult a pulmonologist.",
        "mapped_symptom": "asthma",
        "doctor": "Pulmonologist"
    },
    "arthritis": {
        "advice": "Arthritis causes joint stiffness. Consult an orthopedic specialist for management.",
        "mapped_symptom": "arthritis",
        "doctor": "Orthopedic Specialist"
    }
}

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

# --- Doctor response generator ---
def generate_doctor_response(symptoms_input, top_predictions):
    if top_predictions[0][0] == "No clear prediction":
        return "Your symptoms don’t strongly match any disease in my database. Please consult a professional."
    
    preds_text = ", ".join([f"{disease} ({conf}%)" for disease, conf in top_predictions])
    prompt = (
        f"Patient symptoms: {symptoms_input}\n"
        f"Top predicted diseases: {preds_text}\n\n"
        "Now write a professional doctor's response advising rest and consultation."
    )
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = response_model.generate(**inputs, max_new_tokens=150)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# --- Available slots helper ---
def get_available_slots(doctor_id, date=None):
    query = Appointment.query.filter_by(doctor_id=doctor_id)
    if date:
        query = query.filter_by(date=date)
    booked = query.all()
    booked_times = {str(a.time) for a in booked}
    all_slots = [f"{hour:02d}:00" for hour in range(9, 17)]
    return [slot for slot in all_slots if slot not in booked_times]

# --- Chatbot route ---
@chatbot_bp.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        data = request.get_json(force=True)
        query = (data.get("query") or "").lower().strip()
        patient_id = data.get("patient_id")
        if not query:
            return jsonify({"error": "No query provided"}), 400

        disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."
        normalized_query = query.replace(" ", "_")

        # Track last doctor in this request
        last_doctor = None

        # --- Fallback check ---
        for phrase, resp in fallback_responses.items():
            if phrase in normalized_query:
                advice = resp["advice"]
                mapped_symptom = resp["mapped_symptom"]
                doctor_name = resp["doctor"]
                last_doctor = doctor_name   # ✅ store doctor

                predictions = []
                if mapped_symptom and len(query.split()) > 1:
                    predictions = predict_disease([mapped_symptom], threshold=40.0)

                slots = []
                if doctor_name:
                    doctor = Doctor.query.filter_by(specialization=doctor_name).first()
                    if doctor:
                        slots = get_available_slots(doctor.doctor_id)

                return jsonify({
                    "predictions": [{"disease": d, "confidence": c} for d, c in predictions] if predictions else [],
                    "reply": f"{advice}\n\n{disclaimer}",
                    "recommended_doctor": doctor_name,
                    "available_slots": slots
                })

        # --- Doctor consultation intent ---
        if any(word in query for word in ["consult", "doctor", "specialist", "recommend"]):
            doctors = Doctor.query.all()
            doctor_list = []
            for doc in doctors:
                slots = get_available_slots(doc.doctor_id)
                doctor_list.append({
                    "name": doc.name,
                    "specialization": doc.specialization,
                    "available_slots": slots
                })

            return jsonify({
                "reply": f"Here is the list of available doctors you can consult.\n\n{disclaimer}",
                "doctors": doctor_list
            })


        # --- Appointment booking intent ---
        if "book" in query or "appointment" in query or "schedule" in query:
            parsed = dateparser.parse(query)
            chosen_date = None
            chosen_time = None
            if parsed:
                chosen_date = parsed.strftime("%Y-%m-%d")
                chosen_time = parsed.strftime("%H:%M")

            for word in query.split():
                if ":00" in word:
                    chosen_time = word
                    if not chosen_date:
                        chosen_date = pd.Timestamp.today().strftime("%Y-%m-%d")

            if not chosen_time:
                return jsonify({"reply": "Please specify a valid time slot to book."})

            doctor = Doctor.query.first()  # Replace with prediction → specialization mapping
            if not doctor:
                return jsonify({"reply": "No doctor available for booking."})

            slots = get_available_slots(doctor.doctor_id, chosen_date)
            if chosen_time not in slots:
                return jsonify({
                    "reply": f"Sorry, {chosen_time} on {chosen_date} is not available. Free slots: {slots}"
                })

            new_appt = Appointment(
                patient_id=patient_id,
                doctor_id=doctor.doctor_id,
                date=chosen_date,
                time=chosen_time,
                description=f"Booked via chatbot for query: {query}",
                status="Pending"
            )
            db.session.add(new_appt)
            db.session.commit()

            return jsonify({
                "reply": f"✅ Appointment confirmed with Dr. {doctor.name} "
                         f"({doctor.specialization}) on {chosen_date} at {chosen_time}.",
                "appointment_id": new_appt.appointment_id,
                "status": new_appt.status,
                "disclaimer": disclaimer
            })

        # --- Prediction flow ---
        symptoms_list = [s.strip().replace(" ", "_") for s in query.split()]
        if len(symptoms_list) < 2:
            return jsonify({
                "reply": f"Your input is too vague. Please provide more symptoms for better suggestions.\n\n{disclaimer}",
                "predictions": []
            })

        top_predictions = predict_disease(symptoms_list, threshold=40.0)
        doctor_reply = generate_doctor_response(query, top_predictions)

        results = []
        for disease, conf in top_predictions:
            if disease == "No clear prediction":
                continue
            spec = doctor_recommendations.get(disease, "General Physician")
            doc_obj = Doctor.query.filter_by(specialization=spec).first()
            slots = get_available_slots(doc_obj.doctor_id) if doc_obj else []
            results.append({
                "disease": disease,
                "confidence": conf,
                "recommended_specialist": spec,
                "available_slots": slots
            })

        return jsonify({
            "predictions": results,
            "reply": f"{doctor_reply}\n\n{disclaimer}"
        })

    except Exception as e:
        print("Error:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
