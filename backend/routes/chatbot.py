from flask import Blueprint, request, jsonify
from ml.symptom_model import predict_condition

chatbot_bp = Blueprint("chatbot", __name__)

@chatbot_bp.route("/", methods=["POST"])
def chatbot_response():
    data = request.json
    symptoms = data.get("symptoms", "")
    condition = predict_condition(symptoms)
    return jsonify({"condition": condition})
