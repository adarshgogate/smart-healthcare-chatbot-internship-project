from flask import Blueprint, request, jsonify
from extensions import db
from models.patient import Patient

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
