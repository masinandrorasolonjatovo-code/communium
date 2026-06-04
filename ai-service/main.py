from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Message(BaseModel):
    text: str

@app.post("/generate")
async def generate_response(message: Message):
    # Placeholder for AI response
    return {"response": f"AI response to: {message.text}"}