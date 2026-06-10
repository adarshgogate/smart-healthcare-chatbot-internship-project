from flask import Blueprint, request, jsonify
import numpy as np
import joblib
import pandas as pd
import json
from models.doctor import Doctor
from models.appointment import Appointment
from models.patient import Patient
from models.chat_message import ChatMessage
from extensions import db
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func


chatbot_bp = Blueprint("chatbot", __name__)

# --- Doctor recommendation mapping ---
doctor_recommendations = {
    "drug reaction": "Dermatologist",
    "gerd": "Gastroenterologist",
    "dimorphic hemmorhoids(piles)": "Gastroenterologist",
    "migraine": "Neurologist",
    "sinusitis": "ENT Specialist",
    "gastritis": "Gastroenterologist",
    "diabetes": "Endocrinologist",
    "hypertension": "Cardiologist",
    "asthma": "Pulmonologist",
    "arthritis": "Orthopedic Specialist",
    "skin rash": "Dermatologist",
    "itching": "Dermatologist",
    "depression": "Psychiatrist",
    "paralysis (brain hemorrhage)": "Neurologist",
    "osteoarthritis": "Orthopedic Specialist",
    "psoriasis": "Dermatologist",
    "hepatitis d": "Gastroenterologist",
    "acidity": "Gastroenterologist",
    "headache": "Neurologist",
    "chest pain": "Cardiologist",
    "fatigue": "General Physician",
    "fever": "General Physician",
}


# --- Symptom → Specialist mapping ---
# FIX: keys now use underscores to match symptom_columns format
symptom_to_specialist = {
    "itching": "Dermatologist",
    "skin_rash": "Dermatologist",
    "cough": "Pulmonologist",
    "chest_pain": "Cardiologist",
    "joint_pain": "Orthopedics",
    "stomach_pain": "Gastroenterologist",
    "headache": "Neurologist",
    "high_fever": "General Physician",
    "fatigue": "General Physician",
    "shortness_of_breath": "Pulmonologist",
    "depression": "Psychiatrist",
}

# --- Load trained artifacts ---
rf_model = joblib.load("models/random_forest (6).pkl")
label_encoder = joblib.load("models/label_encoder (6).pkl")
symptom_columns = joblib.load("models/symptom_columns (6).pkl")
print("Loaded symptoms:", symptom_columns[:50])

# --- Load book context (normalized keys) ---
# FIX: load only ONCE with normalized keys so .get(key.lower()) works everywhere
with open("book_context.json", "r") as f:
    book_context = {k.strip().lower(): v for k, v in json.load(f).items()}


# --- Prediction function ---
# FIX: threshold parameter is now actually used to filter low-confidence predictions
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

    # FIX: filter out predictions below the confidence threshold
    results = [
        (disease, conf)
        for disease, conf in zip(top_diseases, top_confidences)
        if conf >= threshold
    ]
    return results if results else [("No clear prediction", 0.0)]


# --- Gen AI response with book context ---
def generate_book_context_response(detected_symptoms, top_predictions):
    disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."

    if not top_predictions or top_predictions[0][0] == "No clear prediction":
        return f"Your symptoms don't strongly match any disease in my database. Please consult a professional.\n\n{disclaimer}"

    # --- Symptom-driven prioritization ---
    # FIX: symptom keys now use underscores to correctly match symptom_to_specialist
    for symptom in detected_symptoms:
        preferred_specialist = symptom_to_specialist.get(symptom, None)
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
        if "itching" in detected_symptoms or "skin_rash" in detected_symptoms:
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


# --- Available slots helper ---
# FIX: always unpack both return values consistently at every call site
def get_available_slots(doctor_id, date=None):
    query = Appointment.query.filter_by(doctor_id=doctor_id)
    if date:
        query = query.filter_by(date=date)
    booked = query.all()
    booked_times = {str(a.time) for a in booked}
    all_slots = [f"{hour:02d}:00" for hour in range(9, 17)]
    available = [slot for slot in all_slots if slot not in booked_times]
    return available, list(booked_times)


# --- Chatbot route ---
@chatbot_bp.route("/chatbot", methods=["POST"])
@jwt_required()
def chatbot():
    try:
        data = request.get_json(force=True)
        print("👉 Incoming data:", data)

        identity = json.loads(get_jwt_identity())   # decode back to dict
        user_id = identity["id"]
        role_id = identity["role_id"]
        role = identity["role"]

        print("👉 JWT identity:", identity)
        print("👉 Using patient_id:", role_id)

        # Extract user message first
        user_msg = (data.get("query") or "").strip()
        if not user_msg:
            return jsonify({"error": "No query provided"}), 400

        # Save patient message with correct patient_id
        patient_msg = ChatMessage(patient_id=role_id, sender="patient", text=user_msg)
        db.session.add(patient_msg)
        db.session.commit()

        # Continue with lowercased query for prediction logic
        query = user_msg.lower()

        disclaimer = "⚠️ Preliminary suggestions only, not a medical diagnosis."

        # --- Direct disease handler ---
        for disease in book_context.keys():
            if disease in query:
                spec = doctor_recommendations.get(disease.strip().lower(), "General Physician")
                doc_obj = Doctor.query.filter_by(specialization=spec).first()
                # FIX: always unpack both values from get_available_slots
                slots, booked_slots = get_available_slots(doc_obj.doctor_id) if doc_obj else ([], [])

                reply_text = f"{book_context[disease]}\n\n{disclaimer}"
                bot_msg = ChatMessage(
                    patient_id=role_id,
                    sender="bot",
                    text=reply_text,
                    prediction=disease.title(),
                    confidence_score=100.0,
                    recommended_doctor=spec
                )
                db.session.add(bot_msg)
                db.session.commit()

                return jsonify({
                    "predictions": [{"disease": disease.title(), "confidence": 100.0}],
                    "reply": reply_text,
                    "results": [{
                        "disease": disease.title(),
                        "confidence": 100.0,
                        "recommended_specialist": spec,
                        "doctor_id": doc_obj.doctor_id if doc_obj else None,
                        "doctor_name": doc_obj.name if doc_obj else "General Physician",
                        "available_slots": slots,
                        "booked_slots": booked_slots
                    }]
                })

        # --- Casual talk handler ---
        CASUAL_TALKS = {
            "hello": "👋 Hello! Please tell me your symptoms.",
            "hi": "Hi there! How are you feeling today?",
            "good morning": "🌞 Good morning! Hope you're doing well.",
            "good evening": "🌙 Good evening! Tell me your symptoms.",
            "thank you": "You're welcome! 💙",
            "how are you": "I'm here to help you with your health queries!"
        }

        for phrase, reply in CASUAL_TALKS.items():
            if phrase in query:
                bot_msg = ChatMessage(
                    patient_id=role_id,
                    sender="bot",
                    text=reply,
                    prediction="Casual Talk",
                    confidence_score=0.0,
                    recommended_doctor="General Physician"
                )
                db.session.add(bot_msg)
                db.session.commit()
                return jsonify({
                    "predictions": [],
                    "reply": reply,
                    "recommended_doctor": "General Physician",
                    "available_slots": [],
                    # FIX: consistent response shape — include booked_slots in all responses
                    "booked_slots": []
                })

        # --- Synonym dictionary ---
        symptom_synonyms = {
            # Pain-related
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
            # Skin-related
            "skin rash": "skin_rash",
            "rash": "skin_rash",
            "itching": "itching",
            "skin itching": "itching",
            "red spots": "skin_rash",
            "eczema": "skin_rash",
            "acne": "skin_rash",
            # Digestive
            "acidity": "acidity",
            "gastric problem": "indigestion",
            "gastric pain": "abdominal_pain",
            "loose motion": "diarrhoea",
            "diarrhea": "diarrhoea",
            "constipation": "constipation",
            "vomiting": "vomiting",
            "nausea": "nausea",
            "loss of appetite": "loss_of_appetite",
            "indigestion": "indigestion",
            "stomach upset": "abdominal_pain",
            # Breathing
            "breathing problem": "shortness_of_breath",
            "difficulty breathing": "shortness_of_breath",
            "shortness of breath": "shortness_of_breath",
            "cough": "cough",
            "breathlessness": "breathlessness",
            "wheezing": "shortness_of_breath",
            "asthma": "asthma",
            # General
            "tiredness": "fatigue",
            "weakness": "fatigue",
            "feeling weak": "fatigue",
            "fatigue": "fatigue",
            "shivering": "shivering",
            "fever": "high_fever",
            "mild fever": "mild_fever",
            "cold hands": "cold_hands_and_feets",
            "sweating": "sweating",
            "chills": "chills",
            "malaise": "malaise",
            # Mental health
            "sadness": "depression",
            "depression": "depression",
            "anxious": "anxiety",
            "anxiety": "anxiety",
            "stress": "anxiety",
            "restlessness": "restlessness",
            "lethargy": "lethargy",
            "mood swings": "mood_swings",
            # Eye-related
            "yellow eyes": "yellowing_of_eyes",
            "yellow skin": "yellowish_skin",
            "dark urine": "dark_urine",
            "blurred vision": "blurred_and_distorted_vision",
            "eye pain": "pain_behind_the_eyes",
            "sunken eyes": "sunken_eyes",
            # Swelling / lymph
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

        print("Tokens:", tokens)
        print("Normalized tokens:", normalized_tokens)
        print("🔍 Detected symptoms:", detected_symptoms)

        if detected_symptoms:
            predictions_raw = predict_disease(detected_symptoms, threshold=5.0)
            predictions = [{"disease": d, "confidence": c} for d, c in predictions_raw]

            # --- Knowledge-aware fallback ---
            if not predictions_raw or predictions_raw[0][0] == "No clear prediction":
                spec = "General Physician"
                # FIX: symptom_to_specialist keys now use underscores — lookup works correctly
                for symptom in detected_symptoms:
                    if symptom in symptom_to_specialist:
                        spec = symptom_to_specialist[symptom]
                        break

                doc_obj = Doctor.query.filter_by(specialization=spec).first()
                # FIX: always unpack both values
                slots, booked_slots = get_available_slots(doc_obj.doctor_id) if doc_obj else ([], [])

                context = book_context.get(
                    detected_symptoms[0].lower(),
                    "Your symptoms suggest consulting a specialist."
                )

                reply_text = f"{context}\n\n{disclaimer}"
                bot_msg = ChatMessage(
                    patient_id=role_id,
                    sender="bot",
                    text=reply_text,
                    prediction="Symptom-based condition",
                    confidence_score=10.0,
                    recommended_doctor=spec
                )
                db.session.add(bot_msg)
                db.session.commit()

                return jsonify({
                    "predictions": [{
                        "disease": "Symptom-based condition",
                        "confidence": 10.0,
                        "recommended_specialist": spec,
                        "doctor_name": doc_obj.name if doc_obj else None,
                        "available_slots": slots,
                        "booked_slots": booked_slots
                    }],
                    "reply": reply_text
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
                    if "itching" in detected_symptoms or "skin_rash" in detected_symptoms:
                        spec = "Dermatologist"
                    else:
                        spec = "Gastroenterologist"
                else:
                    # FIX: symptom_to_specialist is keyed by symptoms, not disease names,
                    # so we look up by detected symptoms as the fallback instead of disease_lower
                    spec = doctor_recommendations.get(disease)
                    if not spec:
                        for symptom in detected_symptoms:
                            if symptom in symptom_to_specialist:
                                spec = symptom_to_specialist[symptom]
                                break
                    spec = spec or "General Physician"

                doc_obj = Doctor.query.filter(func.lower(Doctor.specialization) == spec.lower()).first()
                if not doc_obj:
                    spec = "General Physician"
                    doc_obj = Doctor.query.filter(func.lower(Doctor.specialization) == "general physician").first()

                # FIX: always unpack both values
                slots, booked_slots = get_available_slots(doc_obj.doctor_id) if doc_obj else ([], [])

                results.append({
                    "disease": disease,
                    "confidence": conf,
                    "recommended_specialist": spec,
                    "doctor_id": doc_obj.doctor_id if doc_obj else None,
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

            # Save bot message with prediction fields (only once, after loop)
            top_disease, top_confidence = predictions_raw[0]
            recommended_doctor = unique_results[0]["recommended_specialist"] if unique_results else "General Physician"

            bot_msg = ChatMessage(
                patient_id=role_id,
                sender="bot",
                text=doctor_reply,
                prediction=top_disease,
                confidence_score=top_confidence,
                recommended_doctor=recommended_doctor
            )
            db.session.add(bot_msg)
            db.session.commit()

            print("✅ Final results:", unique_results)

            return jsonify({
                "predictions": predictions,
                "reply": doctor_reply,
                "results": unique_results
            })

        # --- No symptoms detected ---
        reply_text = f"Your input didn't match any known symptom. Please provide more details.\n\n{disclaimer}"
        bot_msg = ChatMessage(
            patient_id=role_id,
            sender="bot",
            text=reply_text,
            prediction="No match",
            confidence_score=0.0,
            recommended_doctor="General Physician"
        )
        db.session.add(bot_msg)
        db.session.commit()

        return jsonify({
            "predictions": [],
            "reply": reply_text,
            "recommended_doctor": "General Physician",
            "available_slots": [],
            # FIX: consistent response shape
            "booked_slots": []
        }), 200

    except Exception as e:
        print("❌ Error:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500