"""
ElevenLabs Voice Service for realistic human-like narration
"""
import os
import httpx
import base64
from typing import Optional

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

VOICE_IDS = {
    "male_indian": "pNInz6obpgDQGcFmaJgB",
    "female_indian": "EXAVITQu4vr4xnSDxMaL",
    "male_teacher": "VR6AewLTigWG4xSOukaG",
    "female_teacher": "21m00Tcm4TlvDq8ikWAM",
}


async def generate_voice_audio(
    text: str,
    voice_id: str = "pNInz6obpgDQGcFmaJgB",
    model_id: str = "eleven_multilingual_v2"
) -> Optional[str]:
    """
    Generate voice audio using ElevenLabs API.
    Returns base64 encoded audio or None if failed.
    """
    if not ELEVENLABS_API_KEY:
        print("[Voice] ElevenLabs API key not found, skipping voice generation")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}",
                headers={
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY
                },
                json={
                    "text": text,
                    "model_id": model_id,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.5,
                        "use_speaker_boost": True
                    }
                }
            )
            
            if response.status_code == 200:
                audio_bytes = response.content
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
                print(f"[Voice] Generated audio for {len(text)} chars")
                return audio_base64
            else:
                print(f"[Voice] ElevenLabs error: {response.status_code} - {response.text[:200]}")
                return None
                
    except Exception as e:
        print(f"[Voice] Error generating voice: {e}")
        return None


async def generate_hinglish_voice(
    text: str,
    use_male_voice: bool = True
) -> Optional[str]:
    """
    Generate Hinglish voice using ElevenLabs multilingual model.
    The multilingual model handles Hindi-English mixing well.
    """
    voice_id = VOICE_IDS["male_indian" if use_male_voice else "female_indian"]
    return await generate_voice_audio(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2"
    )
