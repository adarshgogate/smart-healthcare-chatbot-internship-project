from extensions import db

class Appointment(db.Model):
    __tablename__ = "appointments"

    appointment_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.doctor_id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    description = db.Column(db.String(255))
    status = db.Column(db.String(50), default="Pending")
    # Relationships
    patient = db.relationship("Patient", backref=db.backref("appointments", lazy=True))
    doctor = db.relationship("Doctor", backref=db.backref("appointments", lazy=True))

    def to_dict(self):
        return {
            "appointment_id": self.appointment_id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.name if self.doctor else None,
            "date": str(self.date),
            "time": str(self.time),
            "description": self.description,
            "status": self.status
        }
