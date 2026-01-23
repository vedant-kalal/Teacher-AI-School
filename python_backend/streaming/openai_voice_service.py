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


audio_cache: dict = {}


async def generate_hinglish_voice_openai(
    text: str,
    use_male_voice: bool = True,
    use_cache: bool = True
) -> Optional[str]:
    """
    Generate Hinglish voice using OpenAI's gpt-audio-mini with chat completions.
    Uses modalities=["text", "audio"] to get audio output.
    Includes caching to avoid regenerating the same audio.
    
    Available voices: alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
    Best quality voices: onyx (deep male), nova (warm female), ash (clear male)
    """
    if not OPENAI_API_KEY:
        print("[OpenAI Voice] API key not found, skipping voice generation")
        return None
    
    cache_key = f"{hash(text)}_{use_male_voice}"
    if use_cache and cache_key in audio_cache:
        print(f"[OpenAI Voice] Using cached audio")
        return audio_cache[cache_key]
    
    voice = "ash" if use_male_voice else "nova"
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
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
                        "content": """You are an experienced, warm Indian school teacher speaking to students aged 10-12.
Your task is to speak the given text naturally in Hinglish (Hindi-English mix).

VOICE QUALITY GUIDELINES:
- Pronounce Hindi words (Devanagari script) with clear, authentic Hindi pronunciation
- Pronounce English words clearly with a pleasant Indian accent
- Speak at a moderate, comfortable pace - not too fast, not too slow
- Use natural pauses at commas and periods
- Add warmth and encouragement in your tone
- Sound like a caring teacher explaining to students in a real classroom
- Be expressive but not theatrical - natural and genuine
- Emphasize key concepts slightly for better learning retention

Just speak the text as written - do not add extra words, greetings, or commentary."""
                    },
                    {
                        "role": "user",
                        "content": f"Speak this naturally:\n\n{text}"
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
                            if use_cache:
                                audio_cache[cache_key] = audio_data
                            print(f"[OpenAI Voice] Generated high-quality Hinglish audio for {len(text)} chars using {voice}")
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
