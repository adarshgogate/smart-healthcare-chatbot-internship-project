from flask import Blueprint, request, jsonify
from extensions import db
from models.appointment import Appointment
from models.patient import Patient
from models.doctor import Doctor
from sqlalchemy.exc import IntegrityError
from psycopg2.errors import UniqueViolation
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd

appointments_bp = Blueprint('appointments', __name__)

# ✅ GET all appointments (with optional filters)
@appointments_bp.route('/appointments', methods=['GET'])
def get_appointments():
    doctor_id = request.args.get("doctor_id")
    patient_id = request.args.get("patient_id")
    query = Appointment.query
    if doctor_id:
        query = query.filter_by(doctor_id=doctor_id)
    if patient_id:
        query = query.filter_by(patient_id=patient_id)

    appointments = query.all()
    return jsonify([a.to_dict() for a in appointments])


# ✅ GET single appointment
@appointments_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if appointment:
        return jsonify(appointment.to_dict())
    else:
        return jsonify({"message": "Appointment not found"}), 404


# ✅ CREATE appointment (manual booking)
@appointments_bp.route('/appointments', methods=['POST'])
def add_appointment():
    data = request.get_json()

    # Resolve doctor_id by specialty if provided
    doctor_id = data.get('doctor_id')
    if not doctor_id and data.get('doctor_specialty'):
        doctor_id = data.get("doctor_id")
        specialization = data.get("specialization")

        doctor = Doctor.query.filter_by(doctor_id=doctor_id, specialization=specialization).first()
        if not doctor:
            return jsonify({"success": False, "message": "Doctor not found"}), 404


    # Prevent double booking (manual check)
    existing = Appointment.query.filter_by(
        doctor_id=doctor_id,
        date=data.get('date'),
        time=data.get('time')
    ).first()
    if existing:
        return jsonify({"success": False, "message": "This slot is already booked"}), 400

    new_appointment = Appointment(
        patient_id=data.get('patient_id'),
        doctor_id=doctor_id,
        date=data.get('date'),
        time=data.get('time'),
        description=data.get('description'),
        status="Pending"
    )

    try:
        db.session.add(new_appointment)
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Appointment booked successfully",
            "appointment_id": new_appointment.appointment_id
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        if isinstance(e.orig, UniqueViolation):
            return jsonify({"success": False, "message": "This slot is already booked"}), 400
        return jsonify({"success": False, "message": "Database integrity error"}), 400


# ✅ BOOK appointment via chatbot (JWT protected) — single route, no duplicate
@appointments_bp.route('/appointments/book', methods=['POST'])
@jwt_required()
def book_appointment():
    data = request.get_json(force=True)
    doctor_id = data.get("doctor_id")
    specialization = data.get("specialization")
    slot = data.get("slot")

    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({"success": False, "message": "Patient record not found"}), 400

    # ✅ Correct doctor lookup
    doctor = Doctor.query.filter_by(doctor_id=doctor_id, specialization=specialization).first()
    if not doctor:
        return jsonify({"success": False, "message": "Doctor not found"}), 404

    slots_status = get_slots_status(doctor.doctor_id)
    if slot not in slots_status["available_slots"]:
        return jsonify({"success": False, "message": "Slot already taken"}), 400

    new_appt = Appointment(
        patient_id=patient.patient_id,
        doctor_id=doctor.doctor_id,
        date=data.get("date") or pd.Timestamp.today().strftime("%Y-%m-%d"),
        time=slot,
        description="Booked via chatbot",
        status="Pending"
    )

    try:
        db.session.add(new_appt)
        db.session.commit()
        return jsonify({"success": True, "appointment_id": new_appt.appointment_id}), 201
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"success": False, "message": "Database integrity error"}), 400


# ✅ UPDATE appointment status (general)
@appointments_bp.route("/appointments/<int:appointment_id>", methods=["PUT"])
def update_appointment(appointment_id):
    data = request.get_json()
    new_status = data.get("status")

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    valid_statuses = ["Pending", "Confirmed", "Completed", "Cancelled", "Rejected"]
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400

    try:
        appointment.status = new_status
        db.session.commit()
        return jsonify({
            "message": f"Appointment {appointment_id} updated successfully",
            "appointment_id": appointment.appointment_id,
            "status": appointment.status
        }), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Database integrity error"}), 400


# ✅ Doctor confirms or rejects appointment
@appointments_bp.route('/appointments/<int:appointment_id>/status', methods=['PUT'])
def update_appointment_status(appointment_id):
    data = request.get_json()
    new_status = data.get('status')  # "Confirmed" or "Rejected"

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    if new_status not in ["Confirmed", "Rejected"]:
        return jsonify({"error": "Invalid status"}), 400

    appointment.status = new_status
    db.session.commit()
    return jsonify({
        "message": f"Appointment {new_status.lower()} successfully",
        "appointment_id": appointment.appointment_id,
        "status": appointment.status
    }), 200


# ✅ DELETE appointment
@appointments_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404

    db.session.delete(appointment)
    db.session.commit()
    return jsonify({"message": "Appointment deleted successfully"})


# ✅ Get available and booked slots for a doctor
@appointments_bp.route('/appointments/slots/<int:doctor_id>', methods=['GET'])
def get_available_slots(doctor_id):
    date = request.args.get("date")
    slots_status = get_slots_status(doctor_id, date)

    return jsonify({
        "doctor_id": doctor_id,
        "date": date if date else "any",
        "available_slots": slots_status["available_slots"],
        "booked_slots": slots_status["booked_slots"]
    })


# ✅ Helper: compute slot availability for a doctor
def get_slots_status(doctor_id, date=None):
    query = Appointment.query.filter_by(doctor_id=doctor_id)
    if date:
        query = query.filter_by(date=date)

    booked = query.all()
    booked_times = {str(a.time) for a in booked}
    all_slots = [f"{hour:02d}:00" for hour in range(9, 17)]

    available = [slot for slot in all_slots if slot not in booked_times]
    return {"available_slots": available, "booked_slots": list(booked_times)}