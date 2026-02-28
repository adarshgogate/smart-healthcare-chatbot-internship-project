# 🩺 Smart Healthcare Chatbot

## 📌 Overview
The **Smart Healthcare Chatbot** is a web-based healthcare assistant that enables patients to interact with an AI-powered chatbot for preliminary diagnosis and appointment scheduling. Doctors can use a dashboard to review patient history and AI suggestions, improving efficiency and reducing hospital load.

---

## 🚀 Features
- Patient chatbot with AI-powered responses.
- Preliminary diagnosis using ML models.
- Doctor dashboard with patient history + AI suggestions.
- Appointment scheduling + reminders (SMS/email).
- Escalation system for critical health issues.
- Secure authentication and encrypted patient data.
- Optional: Virtual consultations via WebRTC/Zoom API.

---

## 🛠 Tech Stack
| Layer        | Technology |
|--------------|------------|
| **Frontend** | React.js, Material-UI |
| **Backend**  | Flask (Python), REST APIs |
| **Database** | PostgreSQL, SQLAlchemy |
| **AI/ML**    | scikit-learn, spaCy/NLTK, Hugging Face Transformers |
| **Auth**     | JWT |
| **Deployment** | Docker, AWS/GCP |
| **Extras**   | Twilio/SendGrid (notifications), WebRTC (video consults) |

---

## 📂 Project Structure
```
smart-healthcare-chatbot/
│── frontend/              # React.js code
│   ├── src/
│   └── public/
│── backend/               # Flask APIs + ML models
│   ├── app.py
│   ├── models/
│   ├── routes/
│   └── ml/
│── database/              # SQLAlchemy models + migrations
│── docs/                  # Documentation, diagrams
│── docker/                # Dockerfile, docker-compose.yml
│── .github/               # CI/CD workflows
│── README.md              # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-healthcare-chatbot.git
cd smart-healthcare-chatbot
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Database Setup
- Configure PostgreSQL in `config.py`.
- Run migrations:
```bash
flask db upgrade
```

### 5. Run with Docker (Optional)
```bash
docker-compose up --build
```

---

## 📊 System Flow
1. **Patient Flow**
   - Patient enters symptoms in chatbot.
   - NLP extracts symptoms → ML model predicts possible conditions.
   - Chatbot provides preliminary advice.
   - Severe cases escalate to doctor immediately.

2. **Doctor Flow**
   - Doctor logs into dashboard.
   - Reviews patient history + AI suggestions.
   - Confirms or overrides AI diagnosis.
   - Manages appointments and reminders.

---

## 📅 Roadmap
- ✅ Phase 1: Setup & Basics (Frontend + Backend + DB)
- ✅ Phase 2: Chatbot + AI integration
- ✅ Phase 3: Doctor dashboard
- ✅ Phase 4: Appointment scheduling + notifications
- ✅ Phase 5: Security + Deployment
- ⬜ Phase 6: Optional enhancements (WebRTC, advanced NLP)

---

## 📈 Impact
- **Patients:** Quick guidance, reduced anxiety, better scheduling.
- **Doctors:** Organized patient data, AI-assisted triage, reduced workload.
- **Healthcare System:** Efficient resource use, reduced hospital crowding, improved outcomes.

---
