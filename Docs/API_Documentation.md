# 📡 API Documentation

## Authentication
- `POST /login` → Returns JWT token

## Chatbot
- `POST /chat` → Input symptoms, returns AI response

## Patients
- `GET /patients/:id` → Fetch patient details

## Appointments
- `POST /appointments` → Create appointment
- `GET /appointments/:id` → Appointment details

## Doctor Dashboard
- `GET /doctor/dashboard` → Patient history + AI suggestions
