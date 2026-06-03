from flask import Flask,request, jsonify
from extensions import db, migrate, bcrypt, jwt
from routes.auth import auth_bp
from routes.doctors import doctors_bp
from routes.chatbot import chatbot_bp
from routes.appointments import appointments_bp
from routes.patients import patients_bp
from routes.admin import admin_bp
from models import User, Patient, Doctor, Appointment, ChatMessage
from flask_cors import CORS
import joblib
import os
from dotenv import load_dotenv
from openai import OpenAI
from services.openai_client import client
from extensions import mail
from flask_mail import Mail, Message
from utils.notifications import send_notification


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Mail config
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = '210901@sdmcujire.in'
app.config['MAIL_PASSWORD'] = 'djdv rwpq huto vrgd'  # App Password

mail.init_app(app)

# DB + JWT config
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Adarsh@localhost/healthcare_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = "super_secure_secret_key_with_at_least_32_chars"

db.init_app(app)
migrate.init_app(app, db)
bcrypt.init_app(app)
jwt.init_app(app)

# Load trained artifacts once
svc_model = joblib.load("models/svc_model (1).pkl")
vectorizer = joblib.load("models/vectorizer (3).pkl")

# ✅ Register blueprints only once
app.register_blueprint(auth_bp)
app.register_blueprint(patients_bp)
app.register_blueprint(doctors_bp)
app.register_blueprint(appointments_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(admin_bp)

@app.route("/send-test-email", methods=["POST"])
def send_test_email():
    data = request.get_json(force=True)
    recipient = data.get("recipient_email", "210901@sdmcujire.in")

    try:
        send_notification("test", recipient,
                          "✅ Flask-Mail Test",
                          "Hello Adarsh, your Flask-Mail setup works perfectly!")
        return jsonify({"success": True, "message": f"Test email sent to {recipient}"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(host="127.0.0.1", port=5000, debug=True)
