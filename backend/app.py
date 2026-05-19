from flask import Flask
from extensions import db, migrate, bcrypt, jwt
from routes.auth import auth_bp
from routes.doctors import doctors_bp
from routes.chatbot import chatbot_bp
from routes.appointments import appointments_bp
from routes.patients import patients_bp
from flask_cors import CORS
import joblib
# import logging
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv() 
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# # Show errors but suppress request logs
# logging.getLogger('werkzeug').setLevel(logging.ERROR)

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # allow all origins by default
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

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(patients_bp)
app.register_blueprint(doctors_bp)
app.register_blueprint(appointments_bp)
app.register_blueprint(chatbot_bp)


if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(host="127.0.0.1", port=5000, debug=True)