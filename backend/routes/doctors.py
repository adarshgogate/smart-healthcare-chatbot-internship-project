from flask import Blueprint, request, jsonify
from extensions import db
from models.doctor import Doctor

doctors_bp = Blueprint('doctors', __name__)

# CREATE
@doctors_bp.route('/doctors', methods=['POST'])
def add_doctor():
    data = request.json
    new_doctor = Doctor(
        name=data['name'],
        specialization=data['specialization'],
        email=data['email'],
        experience=data.get('experience', 0)
    )
    db.session.add(new_doctor)
    db.session.commit()
    return jsonify({"message": "Doctor added successfully", "doctor_id": new_doctor.doctor_id}), 201

# READ ALL
@doctors_bp.route('/doctors', methods=['GET'])
def get_doctors():
    doctors = Doctor.query.all()
    return jsonify([
        {
            "doctor_id": d.doctor_id,
            "name": d.name,
            "specialization": d.specialization,
            "email": d.email,
            "experience": d.experience
        }
        for d in doctors
    ])

# READ ONE
@doctors_bp.route('/doctors/<int:doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    if doctor:
        return jsonify({
            "doctor_id": doctor.doctor_id,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "email": doctor.email,
            "experience": doctor.experience
        })
    else:
        return jsonify({"message": "Doctor not found"}), 404

# UPDATE
@doctors_bp.route('/doctors/<int:doctor_id>', methods=['PUT'])
def update_doctor(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({"message": "Doctor not found"}), 404

    data = request.json
    doctor.name = data.get('name', doctor.name)
    doctor.specialization = data.get('specialization', doctor.specialization)
    doctor.email = data.get('email', doctor.email)
    doctor.experience = data.get('experience', doctor.experience)

    db.session.commit()
    return jsonify({"message": "Doctor updated successfully"})

# DELETE
@doctors_bp.route('/doctors/<int:doctor_id>', methods=['DELETE'])
def delete_doctor(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({"message": "Doctor not found"}), 404

    db.session.delete(doctor)
    db.session.commit()
    return jsonify({"message": "Doctor deleted successfully"})
