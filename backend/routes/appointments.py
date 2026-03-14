from flask import Blueprint, request, jsonify
from extensions import db
from models.appointment import Appointment

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/appointments', methods=['GET'])
def get_appointments():
    appointments = Appointment.query.all()
    return jsonify([
        {"id": a.id, "patient_id": a.patient_id, "doctor_id": a.doctor_id, "date": str(a.date), "time": str(a.time)}
        for a in appointments
    ])

@appointments_bp.route('/appointments/<int:id>', methods=['GET'])
def get_appointment(id):
    appointment = Appointment.query.get(id)
    if appointment:
        return jsonify({
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "date": str(appointment.date),
            "time": str(appointment.time)
        })
    else:
        return jsonify({"message": "Appointment not found"}), 404

@appointments_bp.route('/appointments', methods=['POST'])
def add_appointment():
    data = request.json
    new_appointment = Appointment(
        patient_id=data['patient_id'],
        doctor_id=data['doctor_id'],
        date=data['date'],
        time=data['time']
    )
    db.session.add(new_appointment)
    db.session.commit()
    return jsonify({"message": "Appointment booked successfully"}), 201

@appointments_bp.route('/appointments/<int:id>', methods=['PUT'])
def update_appointment(id):
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404

    data = request.json
    appointment.date = data.get('date', appointment.date)
    appointment.time = data.get('time', appointment.time)
    appointment.patient_id = data.get('patient_id', appointment.patient_id)
    appointment.doctor_id = data.get('doctor_id', appointment.doctor_id)

    db.session.commit()
    return jsonify({"message": "Appointment updated successfully"})


@appointments_bp.route('/appointments/<int:id>', methods=['DELETE'])
def delete_appointment(id):
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404

    db.session.delete(appointment)
    db.session.commit()
    return jsonify({"message": "Appointment deleted successfully"})
