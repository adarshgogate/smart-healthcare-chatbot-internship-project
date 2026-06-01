from extensions import db
from datetime import datetime

class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.patient_id"))
    sender = db.Column(db.String(50))
    text = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # New fields for predictions
    prediction = db.Column(db.String(100), nullable=True)
    confidence_score = db.Column(db.Float, nullable=True)
    recommended_doctor = db.Column(db.String(100), nullable=True)
