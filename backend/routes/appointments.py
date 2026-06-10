from flask import Blueprint, request, jsonify
from extensions import db
from datetime import datetime, timedelta
from models.appointment import Appointment
from models.patient import Patient
from models.doctor import Doctor
from sqlalchemy.exc import IntegrityError
from psycopg2.errors import UniqueViolation
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
import json
from utils.notifications import send_notification

appointments_bp = Blueprint("appointments_bp", __name__)


# ─── STATIC / SPECIFIC ROUTES FIRST (no conflict with <int:appointment_id>) ───

# GET all appointments (with optional filters)
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


# CREATE appointment (manual booking)
@appointments_bp.route('/appointments', methods=['POST'])
def add_appointment():
    data = request.get_json()

    doctor_id = data.get('doctor_id')
    if not doctor_id and data.get('doctor_specialty'):
        doctor_id = data.get("doctor_id")
        specialization = data.get("specialization")
        doctor = Doctor.query.filter_by(doctor_id=doctor_id, specialization=specialization).first()
        if not doctor:
            return jsonify({"success": False, "message": "Doctor not found"}), 404

    existing = Appointment.query.filter_by(
    doctor_id=doctor_id,
    date=data.get('date'),
    time=data.get('time')
    ).first()
    if existing:
        if existing.status == "Cancelled":
            # Reuse cancelled slot
            existing.patient_id = data.get('patient_id')
            existing.status = "Pending"
            existing.description = data.get('description')
            db.session.commit()
            return jsonify({"success": True, "message": "Appointment booked successfully", "appointment_id": existing.appointment_id}), 201
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


# BOOK appointment via chatbot (JWT protected)
# ⚠️ Must be before /appointments/<int:appointment_id> routes
@appointments_bp.route('/appointments/book', methods=['POST'])
@jwt_required()
def book_appointment():
    data = request.get_json(force=True)
    identity = json.loads(get_jwt_identity())

    user_id = identity["id"]
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        return jsonify({"success": False, "message": "Patient record not found"}), 400

    doctor_id = data.get("doctor_id") or data.get("doctorId")
    specialization = data.get("specialization")
    slot = data.get("slot") or data.get("time")
    date = data.get("date") or pd.Timestamp.today().strftime("%Y-%m-%d")

    doctor = Doctor.query.filter_by(doctor_id=doctor_id).first()
    if not doctor:
        return jsonify({"success": False, "message": "Doctor not found"}), 404

    slots_status = get_slots_status(doctor.doctor_id, date)
    if slot not in slots_status["available_slots"]:
        return jsonify({"success": False, "message": "Slot already taken"}), 400

    try:
        # ✅ Check if a cancelled record exists for same doctor/date/time — reuse it
        existing = Appointment.query.filter_by(
            doctor_id=doctor.doctor_id,
            date=date,
            time=slot,
            status="Cancelled"
        ).first()

        if existing:
            # Reuse the cancelled slot — just update it
            existing.patient_id = patient.patient_id
            existing.status = "Pending"
            existing.description = "Booked via chatbot"
            db.session.commit()
            appt_id = existing.appointment_id
        else:
            # Fresh booking
            new_appt = Appointment(
                patient_id=patient.patient_id,
                doctor_id=doctor.doctor_id,
                date=date,
                time=slot,
                description="Booked via chatbot",
                status="Pending"
            )
            db.session.add(new_appt)
            db.session.commit()
            appt_id = new_appt.appointment_id

        send_notification("patient", patient.email,
                          "Appointment Request Sent",
                          f"Your request with Dr. {doctor.name} for {slot} on {date} is pending confirmation.")
        send_notification("doctor", doctor.email,
                          "New Appointment Request",
                          f"Patient {patient.name} requested {slot} on {date}.")

        return jsonify({"success": True, "appointment_id": appt_id}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"success": False, "message": "Database integrity error"}), 400
    

# GET available and booked slots for a doctor
@appointments_bp.route('/appointments/slots/<int:doctor_id>', methods=['GET'])
def get_available_slots(doctor_id):
    date = request.args.get('date')
    query = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status != "Cancelled"  # ✅ ADD THIS
    )   
    if date:
        query = query.filter_by(date=date)
    booked = query.all()

    # ✅ Match the format used in generate_slots / get_slots_status
    booked_times = {a.time.strftime("%I:%M %p") for a in booked}
    all_slots = [
        f"{h if h <= 12 else h - 12:02d}:00 {'AM' if h < 12 else 'PM'}"
        for h in range(9, 17)
    ]  
    available = [s for s in all_slots if s not in booked_times]

    return jsonify({
        "available_slots": available,
        "booked_slots": list(booked_times)
    })

# ─── DYNAMIC ROUTES WITH EXTRA SEGMENTS (must be before plain <int:id> routes) ───

# CANCEL appointment — sets status to Cancelled, does NOT delete
# ⚠️ Must be before plain /appointments/<int:appointment_id> PUT/DELETE
@appointments_bp.route('/appointments/<int:appointment_id>/cancel', methods=['PUT'])
def cancel_appointment(appointment_id):
    print(f"🔥 CANCEL ROUTE HIT for id={appointment_id}")  # debug — remove after confirming
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404

    if appointment.status in ["Completed", "Cancelled"]:
        return jsonify({"message": f"Cannot cancel an appointment that is already {appointment.status}"}), 400

    appointment.status = "Cancelled"
    db.session.commit()
    return jsonify({
        "message": "Appointment cancelled successfully",
        "appointment": appointment.to_dict()
    })


# Doctor confirms or rejects appointment
# ⚠️ Must be before plain /appointments/<int:appointment_id> PUT
@appointments_bp.route('/appointments/<int:appointment_id>/status', methods=['PUT'])
def update_appointment_status(appointment_id):
    data = request.get_json()
    new_status = data.get('status')

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    if new_status not in ["Confirmed", "Rejected", "Completed"]:  # ← added Completed
        return jsonify({"error": "Invalid status"}), 400

    patient = Patient.query.get(appointment.patient_id)
    doctor = Doctor.query.get(appointment.doctor_id)
    slot = appointment.time.strftime("%I:%M %p")
    date = appointment.date

    if new_status == "Confirmed":
        send_notification("patient", patient.email,
                          "rmed",
                          f"Your appointment with Dr. {doctor.name} is confirmed for {slot} on {date}.")
    elif new_status == "Rejected":
        send_notification("patient", patient.email,
                          "Appointment Rejected",
                          f"Your appointment with Dr. {doctor.name} was declined. Please choose another slot.")
    elif new_status == "Completed":
        send_notification("patient", patient.email,
                          "Appointment Completed",
                          f"Your appointment with Dr. {doctor.name} on {date} has been marked as completed.")

    appointment.status = new_status
    db.session.commit()
    return jsonify({
        "message": f"Appointment {new_status.lower()} successfully",
        "appointment": appointment.to_dict()
    }), 200

# ─── PLAIN DYNAMIC ROUTES LAST ────────────────────────────────────────────────

# GET single appointment
@appointments_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if appointment:
        return jsonify(appointment.to_dict())
    else:
        return jsonify({"message": "Appointment not found"}), 404


# UPDATE appointment status (general)
@appointments_bp.route("/appointments/<int:appointment_id>", methods=["PUT"])
def update_appointment(appointment_id):
    data = request.get_json()
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    # ✅ Update status if provided
    new_status = data.get("status")
    if new_status is not None:
        valid_statuses = ["Pending", "Confirmed", "Completed", "Cancelled", "Rejected"]
        if new_status not in valid_statuses:
            return jsonify({"error": "Invalid status"}), 400
        appointment.status = new_status

    # ✅ Update date/time/description if provided
    if data.get("date"):
        appointment.date = data["date"]
    if data.get("time"):
        appointment.time = data["time"]
    if data.get("description"):
        appointment.description = data["description"]

    try:
        db.session.commit()
        return jsonify({
            "message": f"Appointment {appointment_id} updated",
            "appointment": appointment.to_dict()
        }), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Database integrity error"}), 400
    
    
# DELETE appointment (hard delete — use /cancel for soft cancel)
@appointments_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404

    db.session.delete(appointment)
    db.session.commit()
    return jsonify({"message": "Appointment deleted successfully"})


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def generate_slots(start_time="09:00 AM", end_time="05:00 PM", interval_minutes=60):
    slots = []
    fmt = "%I:%M %p"
    start = datetime.strptime(start_time, fmt)
    end = datetime.strptime(end_time, fmt)
    while start < end:
        slots.append(start.strftime(fmt))
        start += timedelta(minutes=interval_minutes)
    return slots


def get_slots_status(doctor_id, date):
    # Exclude Cancelled appointments so those slots become available again
    appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.date == date,
        Appointment.status != "Cancelled"
    ).all()

    booked_slots = [appt.time.strftime("%I:%M %p") for appt in appointments]
    all_slots = generate_slots("09:00 AM", "05:00 PM", 60)
    available_slots = [s for s in all_slots if s not in booked_slots]

    return {
        "booked_slots": booked_slots,
        "available_slots": available_slots
    }