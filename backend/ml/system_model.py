def predict_condition(symptoms: str):
    # Dummy logic for now
    if "fever" in symptoms.lower():
        return "Possible Flu"
    elif "cough" in symptoms.lower():
        return "Possible Cold"
    else:
        return "Condition not recognized"
