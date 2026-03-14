from flask import Flask
from extensions import db, migrate, bcrypt, jwt
from routes.auth import auth_bp
from routes.doctors import doctors_bp
from routes.appointments import appointments_bp
from routes.patients import patients_bp
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # allow all origins by default
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Adarsh@localhost/healthcare_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key'

db.init_app(app)
migrate.init_app(app, db)
bcrypt.init_app(app)
jwt.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(patients_bp)
app.register_blueprint(doctors_bp)
app.register_blueprint(appointments_bp)

if __name__ == '__main__':
    app.run(debug=True)