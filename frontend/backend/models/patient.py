from extensions import db

class Patient(db.Model):
    __tablename__ = "patients"

    patient_id = db.Column(db.Integer, primary_key=True)  
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20), nullable=True)

    # Relationship back to User
    user = db.relationship("User", backref=db.backref("patient_profile", uselist=False))
