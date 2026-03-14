from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from models.user import User
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
import datetime
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

# Role-based decorator
def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            claims = get_jwt()   # read extra claims
            if claims.get("role") != required_role:
                return jsonify({"message": "Access denied"}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Email already registered"}), 400

    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_pw,
        role=data.get('role', 'patient')
    )
    db.session.add(new_user)
    db.session.commit()

    # Role-specific insert
    if new_user.role == "doctor":
        from models.doctor import Doctor
        doctor = Doctor(
            user_id=new_user.id,
            name=new_user.username,
            email=new_user.email,
            specialization=data.get("specialization"),
        )
        db.session.add(doctor)

    elif new_user.role == "patient":
        from models.patient import Patient
        patient = Patient(
            user_id=new_user.id,
            name=new_user.username,
            email=new_user.email,
            age=data.get("age"),
            gender=data.get("gender")
        )
        db.session.add(patient)

    db.session.commit()

    return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201
@auth_bp.route('/login', methods=['POST']) 
def login(): 
    data = request.json 
    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "username": user.username,
                "role": user.role
            },
            expires_delta=datetime.timedelta(hours=1)
        )

        role_id = None
        if user.role == "doctor":
            from models.doctor import Doctor
            doctor = Doctor.query.filter_by(user_id=user.id).first()
            role_id = doctor.id if doctor else None
        elif user.role == "patient":
            from models.patient import Patient
            patient = Patient.query.filter_by(user_id=user.id).first()
            role_id = patient.id if patient else None

        return jsonify({
            "access_token": access_token,
            "user_id": user.id,
            "role": user.role,
            "role_id": role_id
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401

# Example protected routes
@auth_bp.route('/admin-only', methods=['GET'])
@role_required("admin")
def admin_only():
    return jsonify({"message": "Welcome, Admin!"})

@auth_bp.route('/doctor-only', methods=['GET'])
@role_required("doctor")
def doctor_only():
    return jsonify({"message": "Welcome, Doctor!"})

@auth_bp.route('/patient-only', methods=['GET'])
@role_required("patient")
def patient_only():
    return jsonify({"message": "Welcome, Patient!"})

# Generic endpoint to check current user identity
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    identity = get_jwt_identity()   # user id
    claims = get_jwt()              # extra claims
    return jsonify({
        "id": identity,
        "username": claims.get("username"),
        "role": claims.get("role")
    })
