"""
Google Veo Video Generator Service
Uses Google Veo 3.1 Fast to generate educational videos showing processes, flows, and how things work.
"""
import os
import httpx
import base64
import asyncio
from typing import Optional, Dict, Any, List

GEMINI_BASE_URL = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL", "")
GEMINI_API_KEY = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY", "")


async def generate_educational_video(
    subject: str,
    topic: str,
    video_type: str = "process_flow",
    duration_seconds: int = 8
) -> Optional[Dict[str, Any]]:
    """
    Generate an educational video using Google Veo.
    
    Args:
        subject: What the video should show (e.g., "blood flowing through the heart")
        topic: The overall lesson topic
        video_type: Type of video (process_flow, working_model, animation, demonstration)
        duration_seconds: Video length (4, 6, or 8 seconds)
    
    Returns:
        Dict with video_base64, mime_type, duration_seconds, or None if failed
    """
    if not GEMINI_API_KEY or not GEMINI_BASE_URL:
        print("[Veo Video] API credentials not found, skipping video generation")
        return None
    
    prompt = create_video_prompt(subject, topic, video_type)
    
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            url = f"{GEMINI_BASE_URL}/models/veo-3.1-fast-generate-preview:generateContent"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "responseModalities": ["video"],
                    "videoDurationSeconds": duration_seconds
                }
            }
            
            response = await client.post(
                url,
                headers={
                    "x-goog-api-key": GEMINI_API_KEY,
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        for part in candidate["content"]["parts"]:
                            if "inlineData" in part:
                                video_data = part["inlineData"]
                                mime_type = video_data.get("mimeType", "video/mp4")
                                base64_data = video_data.get("data", "")
                                if base64_data:
                                    print(f"[Veo Video] Generated video: {subject[:40]}...")
                                    return {
                                        "video_base64": base64_data,
                                        "mime_type": mime_type,
                                        "duration_seconds": duration_seconds,
                                        "subject": subject,
                                        "video_type": video_type
                                    }
                print(f"[Veo Video] No video in response")
                return None
            else:
                error_text = response.text[:500] if response.text else "No error details"
                print(f"[Veo Video] Error {response.status_code}: {error_text}")
                return None
                
    except Exception as e:
        print(f"[Veo Video] Error generating video: {e}")
        return None


def create_video_prompt(
    subject: str,
    topic: str,
    video_type: str = "process_flow"
) -> str:
    """
    Create a detailed prompt for generating educational videos.
    """
    
    type_descriptions = {
        "process_flow": "showing the step-by-step process flow with smooth transitions and clear visual progression",
        "working_model": "demonstrating a working model or mechanism in action, showing how parts move and interact",
        "animation": "as an animated educational visualization with clear, simplified graphics",
        "demonstration": "as a real-world demonstration showing the concept in action",
        "cycle": "showing a complete cycle or loop of the process, starting and ending at the same point",
        "comparison": "comparing different states or conditions side by side"
    }
    
    style_desc = type_descriptions.get(video_type, type_descriptions["process_flow"])
    
    prompt = f"""Create a PROFESSIONAL EDUCATIONAL VIDEO for students (ages 10-12) {style_desc}.

SUBJECT: {subject}
TOPIC: {topic}

VIDEO REQUIREMENTS:
1. CLARITY: The video must be extremely clear and easy to understand
2. SMOOTH MOTION: Use smooth, continuous motion to show processes
3. EDUCATIONAL LABELS: Include helpful text labels or annotations where needed
4. PROFESSIONAL QUALITY: High-quality, realistic visuals suitable for classroom use
5. SCIENTIFIC ACCURACY: Show the process/mechanism accurately as it works in reality

VISUAL STYLE:
- Clean, uncluttered background that doesn't distract
- Bright, clear lighting to show all details
- Smooth camera movements (dolly, pan, or zoom as appropriate)
- Natural colors that accurately represent the subject
- Professional educational video quality

CONTENT:
- Focus on showing HOW things work, not just what they look like
- Include motion to demonstrate processes and flows
- Show cause and effect relationships
- Make invisible processes visible (like blood flow, electrical current, etc.)

DO NOT:
- Include any text watermarks or logos
- Use distracting effects or transitions
- Show violent, scary, or inappropriate content
- Include human faces unless necessary for demonstration

The video should loop smoothly if possible, suitable for continuous playback during a lesson."""

    return prompt


async def generate_video_with_metadata(
    subject: str,
    topic: str,
    title: str,
    description: str = "",
    video_type: str = "process_flow",
    loop: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Generate a video with full metadata for display.
    """
    result = await generate_educational_video(subject, topic, video_type)
    
    if result:
        result["title"] = title
        result["description"] = description
        result["loop"] = loop
        result["display_position"] = "right"
    
    return result


async def test_veo_video():
    """Test function for video generation"""
    result = await generate_educational_video(
        subject="Blood flowing through a human heart, showing the path from right atrium through ventricles and out to lungs and body",
        topic="Human Heart",
        video_type="process_flow"
    )
    if result:
        print(f"Success! Video size: {len(result.get('video_base64', ''))} bytes")
    else:
        print("Failed to generate video")
    return result
