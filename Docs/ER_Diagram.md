# 📊 ER Diagram

![ER Diagram](screenshots/er_diagram.png)

**Entities:**
- **Patient** (id, name, age, symptoms, history)
- **Doctor** (id, name, specialization)
- **Appointment** (id, patient_id, doctor_id, date, status)
- **ChatHistory** (id, patient_id, message, timestamp)

**Relationships:**
- Patient ↔ Appointment ↔ Doctor
- Patient ↔ ChatHistory
