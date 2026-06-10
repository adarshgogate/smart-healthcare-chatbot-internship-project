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
        from flask_jwt_extended import get_jwt_identity
        import json

        # Decode identity if stored as JSON string
        identity = get_jwt_identity()
        if isinstance(identity, str):
            identity = json.loads(identity)

        if identity.get("role", "").lower() != "admin":
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

    q = User.query.filter(func.lower(User.role) == "doctor")

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

@admin_bp.route('/analytics/status-breakdown', methods=['GET'])
@admin_required
def analytics_status_breakdown():
    rows = (
        db.session.query(Appointment.status, func.count(Appointment.appointment_id))
        .group_by(Appointment.status)
        .all()
    )
    return jsonify([{"status": r[0], "count": r[1]} for r in rows])


@admin_bp.route('/analytics/monthly-trend', methods=['GET'])
@admin_required
def analytics_monthly_trend():
    rows = (
        db.session.query(
            func.to_char(Appointment.date, 'YYYY-MM').label('month'),
            func.count(Appointment.appointment_id).label('count')
        )
        .group_by('month')
        .order_by('month')
        .all()
    )
    return jsonify([{"month": r.month, "count": r.count} for r in rows])


@admin_bp.route('/analytics/top-doctors', methods=['GET'])
@admin_required
def analytics_top_doctors():
    limit = min(20, int(request.args.get('limit', 10)))
    rows = (
        db.session.query(
            Appointment.doctor_id,
            func.count(Appointment.appointment_id).label('count')
        )
        .group_by(Appointment.doctor_id)
        .order_by(func.count(Appointment.appointment_id).desc())
        .limit(limit)
        .all()
    )
    return jsonify([{"doctor_id": r.doctor_id, "count": r.count} for r in rows])


@admin_bp.route('/analytics/top-patients', methods=['GET'])
@admin_required
def analytics_top_patients():
    limit = min(20, int(request.args.get('limit', 10)))
    rows = (
        db.session.query(
            Appointment.patient_id,
            func.count(Appointment.appointment_id).label('count')
        )
        .group_by(Appointment.patient_id)
        .order_by(func.count(Appointment.appointment_id).desc())
        .limit(limit)
        .all()
    )
    return jsonify([{"patient_id": r.patient_id, "count": r.count} for r in rows])


@admin_bp.route('/analytics/cancellation-rate', methods=['GET'])
@admin_required
def analytics_cancellation_rate():
    total = Appointment.query.count()
    cancelled = Appointment.query.filter(
        Appointment.status.in_(["Cancelled", "Rejected"])
    ).count()
    rate = round((cancelled / total * 100), 2) if total else 0
    return jsonify({
        "total": total,
        "cancelled_or_rejected": cancelled,
        "cancellation_rate_pct": rate
    })


@admin_bp.route('/analytics/weekly-load', methods=['GET'])
@admin_required
def analytics_weekly_load():
    rows = (
        db.session.query(
            func.extract('dow', Appointment.date).label('dow'),
            func.count(Appointment.appointment_id).label('count')
        )
        .group_by('dow')
        .order_by('dow')
        .all()
    )
    day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    result = {d: 0 for d in day_names}
    for r in rows:
        idx = int(r.dow)
        if 0 <= idx <= 6:
            result[day_names[idx]] = r.count
    return jsonify([{"day": k, "count": v} for k, v in result.items()])