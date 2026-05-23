import os
from dotenv import load_dotenv
from openai import OpenAI

# Load .env from parent folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("❌ OPENAI_API_KEY not found. Check your .env file.")

client = OpenAI(api_key=api_key)
