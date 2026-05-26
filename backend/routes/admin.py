from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.doctor import Doctor
from models.appointment import Appointment
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import or_
from datetime import datetime
from sqlalchemy import func
from models.patient import Patient


admin_bp = Blueprint('admin', __name__, url_prefix="/admin")

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role", "").lower() != "admin":
            return jsonify({'message': 'Forbidden: admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def paginate(query, page, per_page=20):
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, {
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
    }
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    search   = request.args.get('search', '').strip()
    role     = request.args.get('role', '').strip()
    page     = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 20))))

    q = User.query
    if search:
        like = f'%{search}%'
        q = q.filter(or_(User.username.ilike(like), User.email.ilike(like)))
    if role:
        q = q.filter_by(role=role)

    users, meta = paginate(q.order_by(User.id.desc()), page, per_page)

    return jsonify({
        'users': [
            {'id': u.id, 'username': u.username, 'email': u.email, 'role': u.role}
            for u in users
        ],
        'meta': meta,
    })

@admin_bp.route('/doctors', methods=['GET'])
@admin_required
def get_doctors():
    search = request.args.get('search', '').strip()
    spec   = request.args.get('specialization', '').strip()

    q = User.query.filter_by(role='Doctor')
    if search:
        like = f'%{search}%'
        q = q.filter(or_(User.username.ilike(like), User.email.ilike(like)))
    if spec:
        try:
            q = q.join(Doctor, Doctor.user_id == User.id).filter(
                Doctor.specialization.ilike(f'%{spec}%')
            )
        except Exception:
            pass

    doctors = q.order_by(User.username).all()
    return jsonify([
        {'id': d.id, 'username': d.username, 'email': d.email}
        for d in doctors
    ])
from datetime import datetime
from sqlalchemy import or_
from datetime import datetime

@admin_bp.route('/appointments', methods=['GET'])
@admin_required
def get_appointments():
    status     = request.args.get('status', '').strip()
    patient_id = request.args.get('patient_id')
    doctor_id  = request.args.get('doctor_id')
    date_str   = request.args.get('date', '').strip()
    page       = max(1, int(request.args.get('page', 1)))
    per_page   = min(100, max(1, int(request.args.get('per_page', 20))))

    q = Appointment.query
    if status:
        q = q.filter_by(status=status)
    if patient_id:
        q = q.filter_by(patient_id=int(patient_id))
    if doctor_id:
        q = q.filter_by(doctor_id=int(doctor_id))
    if date_str:
        try:
            # Parse YYYY-MM-DD into a date object
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            q = q.filter(Appointment.date == date_obj)
        except ValueError:
            return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

    appts, meta = paginate(q.order_by(Appointment.appointment_id.desc()), page, per_page)


    return jsonify({
        'appointments': [
            {
                'id': a.appointment_id,
                'patient_id': a.patient_id,
                'doctor_id': a.doctor_id,
                'date': str(a.date),
                'status': a.status,
            }
            for a in appts
        ],
        'meta': meta,
    })

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_users = User.query.count()
    total_doctors = Doctor.query.count()
    total_patients = Patient.query.count()
    total_appointments = Appointment.query.count()

    return jsonify({
        "total_users": total_users,
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "total_appointments": total_appointments
    })
