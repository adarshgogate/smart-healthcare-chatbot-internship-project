from flask import Blueprint, request, jsonify,make_response
from extensions import db
from models.patient import Patient
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from models.appointment import Appointment
from models.chat_message import ChatMessage
from datetime import timedelta

patients_bp = Blueprint('patients', __name__)

# CREATE
@patients_bp.route('/patients', methods=['POST'])
def add_patient():
    data = request.json
    new_patient = Patient(
        name=data['name'],
        age=data.get('age'),
        gender=data.get('gender'),
        email=data['email']
    )
    db.session.add(new_patient)
    db.session.commit()
    return jsonify({"message": "Patient added successfully", "patient_id": new_patient.patient_id}), 201

# READ ALL
@patients_bp.route('/patients', methods=['GET'])
def get_patients():
    patients = Patient.query.all()
    return jsonify([
        {
            "patient_id": p.patient_id,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "email": p.email
        }
        for p in patients
    ])

# READ ONE
@patients_bp.route('/patients/<int:patient_id>', methods=['GET'])
def get_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if patient:
        return jsonify({
            "patient_id": patient.patient_id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "email": patient.email
        })
    else:
        return jsonify({"message": "Patient not found"}), 404

# UPDATE
@patients_bp.route('/patients/<int:patient_id>', methods=['PUT'])
def update_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    data = request.json
    patient.name = data.get('name', patient.name)
    patient.age = data.get('age', patient.age)
    patient.gender = data.get('gender', patient.gender)
    patient.email = data.get('email', patient.email)

    db.session.commit()
    return jsonify({"message": "Patient updated successfully"})

# DELETE
@patients_bp.route('/patients/<int:patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": "Patient deleted successfully"})


@patients_bp.route('/patients/me', methods=['GET'])
@jwt_required()
def get_my_patient_profile():
    identity = get_jwt_identity()
    role_id = identity["role_id"]   # patient_id from JWT
    patient = Patient.query.get(role_id)
    if not patient:
        return jsonify({"message": "Patient not found"}), 404
    return jsonify(patient.to_dict())

@patients_bp.route("/patients/<int:patient_id>/report", methods=["GET", "OPTIONS"])
def patient_report(patient_id):
    # Handle OPTIONS preflight — must return 200 immediately, no auth check
    if request.method == "OPTIONS":
        return make_response("", 200)

    from flask_jwt_extended import verify_jwt_in_request
    try:
        verify_jwt_in_request()
    except Exception:
        return jsonify({"error": "Unauthorized"}), 401


    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    messages = ChatMessage.query.filter_by(patient_id=patient_id).order_by(ChatMessage.timestamp.asc()).all()
    conversation = [
        {
            "timestamp": (msg.timestamp + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),            "sender": msg.sender,
            "text": msg.text,
            "prediction": msg.prediction,
            "confidence": msg.confidence_score,
            "recommended_doctor": msg.recommended_doctor
        }
        for msg in messages
    ]

    appointments = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.date.asc()).all()
    appt_history = [
        {
            "appointment_id": appt.appointment_id,
            "doctor_id": appt.doctor_id,
            "date": appt.date.strftime("%Y-%m-%d"),
            "time": appt.time.strftime("%H:%M"),
            "status": appt.status,
            "description": appt.description
        }
        for appt in appointments
    ]

    return jsonify({
        "patient_id": patient.patient_id,
        "patient_name": patient.name,
        "email": patient.email,
        "conversation_history": conversation,
        "appointment_history": appt_history
    }), 200