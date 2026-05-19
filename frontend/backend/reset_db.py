from extensions import db
from app import app

with app.app_context():
    db.drop_all()    # drops all tables
    db.create_all()  # recreates tables from models
