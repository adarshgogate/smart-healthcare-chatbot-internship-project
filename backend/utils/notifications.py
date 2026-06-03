from flask_mail import Message
from extensions import mail
def send_notification(role, recipient_email, subject, body):
    """
    Role-based email notification sender.
    """
    try:
        msg = Message(subject=subject,
                      sender="210901@sdmcujire.in",
                      recipients=[recipient_email])
        msg.body = body
        mail.send(msg)
        print(f"✅ Email sent to {role}: {recipient_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {role}: {e}")
