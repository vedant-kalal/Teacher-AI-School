"""
OpenAI Voice Service for realistic human-like narration
Uses gpt-audio-mini chat completions with audio modalities for Hinglish TTS
(Replit AI Integrations does NOT support /audio/speech endpoint)
"""
import os
import httpx
import base64
from typing import Optional

OPENAI_BASE_URL = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_API_KEY = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "")


async def generate_hinglish_voice_openai(
    text: str,
    use_male_voice: bool = True
) -> Optional[str]:
    """
    Generate Hinglish voice using OpenAI's gpt-audio-mini with chat completions.
    Uses modalities=["text", "audio"] to get audio output.
    
    Available voices: alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
    """
    if not OPENAI_API_KEY:
        print("[OpenAI Voice] API key not found, skipping voice generation")
        return None
    
    voice = "onyx" if use_male_voice else "nova"
    
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            url = f"{OPENAI_BASE_URL}/chat/completions"
            
            payload = {
                "model": "gpt-audio-mini",
                "modalities": ["text", "audio"],
                "audio": {
                    "voice": voice,
                    "format": "mp3"
                },
                "messages": [
                    {
                        "role": "system",
                        "content": """You are a friendly Indian school teacher speaking to students.
Your task is to speak the given text naturally in Hinglish (Hindi-English mix).
Pronounce Hindi words (written in Devanagari) with proper Hindi pronunciation.
Pronounce English words clearly with a natural Indian accent.
Be warm, patient, and encouraging like a real classroom teacher.
Speak at a comfortable pace for young students (10-12 years old).
Just speak the text naturally - do not add anything extra."""
                    },
                    {
                        "role": "user",
                        "content": f"Please speak this text naturally:\n\n{text}"
                    }
                ]
            }
            
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    if "message" in choice and "audio" in choice["message"]:
                        audio_data = choice["message"]["audio"].get("data", "")
                        if audio_data:
                            print(f"[OpenAI Voice] Generated Hinglish audio for {len(text)} chars using {voice}")
                            return audio_data
                print(f"[OpenAI Voice] No audio in response: {data}")
                return None
            else:
                error_text = response.text[:500] if response.text else "No error details"
                print(f"[OpenAI Voice] Error {response.status_code}: {error_text}")
                return None
                
    except Exception as e:
        print(f"[OpenAI Voice] Error generating voice: {e}")
        return None
