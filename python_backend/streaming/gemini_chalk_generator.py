"""
Gemini Chalk Diagram Generator
Uses Gemini's nano banana model to generate realistic chalk-style educational diagrams
"""
import os
import httpx
import base64
from typing import Optional, Dict, Any, List

GEMINI_BASE_URL = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")
GEMINI_API_KEY = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY", "")


async def generate_chalk_diagram(
    subject: str,
    topic: str,
    key_parts: List[str],
    style: str = "educational_diagram"
) -> Optional[Dict[str, Any]]:
    """
    Generate a realistic chalk-style diagram using Gemini's nano banana model.
    Returns base64 image data that looks like a real chalk drawing on a blackboard.
    """
    if not GEMINI_API_KEY:
        print("[Gemini Chalk] API key not found, skipping chalk diagram generation")
        return None
    
    detailed_prompt = create_chalk_diagram_prompt(subject, topic, key_parts, style)
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            url = f"{GEMINI_BASE_URL}/models/gemini-2.5-flash-image:generateContent"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": detailed_prompt
                    }]
                }],
                "generationConfig": {
                    "responseModalities": ["image", "text"],
                    "imageSizeOptions": {
                        "aspectRatio": "3:2"
                    }
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
                                image_data = part["inlineData"]
                                mime_type = image_data.get("mimeType", "image/png")
                                base64_data = image_data.get("data", "")
                                if base64_data:
                                    print(f"[Gemini Chalk] Generated diagram: {subject[:40]}...")
                                    return {
                                        "image_base64": base64_data,
                                        "mime_type": mime_type,
                                        "subject": subject,
                                        "style": "chalk_diagram"
                                    }
                print(f"[Gemini Chalk] No image in response")
                return None
            else:
                error_text = response.text[:500] if response.text else "No error details"
                print(f"[Gemini Chalk] Error {response.status_code}: {error_text}")
                return None
                
    except Exception as e:
        print(f"[Gemini Chalk] Error generating diagram: {e}")
        return None


def create_chalk_diagram_prompt(
    subject: str,
    topic: str,
    key_parts: List[str],
    style: str = "educational_diagram"
) -> str:
    """
    Create a highly detailed prompt for generating a realistic chalk-style diagram.
    The prompt is optimized to produce images that look like actual chalk drawings on a blackboard.
    """
    parts_description = ", ".join(key_parts) if key_parts else "main components and features"
    
    prompt = f"""Generate a REALISTIC CHALK DRAWING on a dark green chalkboard/blackboard.

SUBJECT TO DRAW: {subject}
TOPIC: {topic}
KEY PARTS TO SHOW: {parts_description}

CRITICAL STYLE REQUIREMENTS:
1. BACKGROUND: Dark green chalkboard texture (like a real classroom blackboard, RGB approximately #1a3d2e to #2d5a45)
2. CHALK EFFECT: 
   - Use WHITE chalk (#ffffff, #f5f5f5) for main outlines and text
   - Use YELLOW chalk (#ffd700, #ffeb3b) for titles and highlights
   - Use LIGHT BLUE chalk (#87ceeb, #add8e6) for secondary elements
   - Use PINK/RED chalk (#ff9999, #ffb6c1) for important labels
3. CHALK TEXTURE: Lines should have slight irregularity like real chalk
   - Slightly dusty edges
   - Not perfectly smooth - some texture and grain
   - Occasional chalk dust smudges around drawings
4. DRAWING STYLE:
   - Hand-drawn educational diagram style
   - Clear, bold outlines (3-4 pixels thick)
   - Labeled parts with arrows pointing to them
   - Clean and readable but with natural chalk imperfections

COMPOSITION:
- Main diagram centered with good proportions
- All key parts clearly visible and labeled
- Labels written in clean chalk handwriting style
- Arrows connecting labels to parts (simple straight or curved arrows)
- Title at top in larger yellow chalk

QUALITY:
- High resolution and detailed
- Professional educational illustration
- Should look exactly like a skilled teacher drew it on a blackboard
- All text must be clearly readable

DO NOT:
- Use colors outside the chalk palette (no bright colors, no gradients)
- Make it look digital or computer-generated
- Add shadows or 3D effects (keep it flat chalk style)
- Include any watermarks or logos

The final image should look like a photograph of an actual classroom blackboard with a detailed educational diagram drawn in chalk."""

    return prompt


async def generate_chalk_diagram_with_labels(
    subject: str,
    topic: str,
    key_parts: List[str],
    explanation: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Generate a chalk diagram with proper labels and arrows.
    Returns the image plus metadata for optional overlay animations.
    """
    result = await generate_chalk_diagram(subject, topic, key_parts, "labeled_diagram")
    
    if result:
        result["key_parts"] = key_parts
        result["explanation"] = explanation
        result["label_positions"] = []
        for i, part in enumerate(key_parts[:8]):
            angle = (i * 45) % 360
            result["label_positions"].append({
                "label": part,
                "angle": angle,
                "index": i
            })
    
    return result


async def test_gemini_chalk():
    """Test function for chalk diagram generation"""
    result = await generate_chalk_diagram(
        subject="A detailed cross-section of a human heart showing all four chambers",
        topic="Human Heart",
        key_parts=["Right Atrium", "Left Atrium", "Right Ventricle", "Left Ventricle", "Aorta", "Pulmonary Artery"]
    )
    if result:
        print(f"Success! Image size: {len(result.get('image_base64', ''))} bytes")
    else:
        print("Failed to generate chalk diagram")
    return result
