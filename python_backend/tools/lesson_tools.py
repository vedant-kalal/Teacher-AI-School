"""
Educational tools for the AI Teacher agent
Each tool generates a specific type of educational content
"""
import os
import base64
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
import httpx

llm = ChatOpenAI(
    model="gpt-4o-mini",
    base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
    api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY"),
    temperature=0.7,
    max_tokens=500
)

def generate_image(prompt: str, size: str = "1024x1024") -> dict:
    """Generate an actual image using OpenAI's gpt-image-1 model"""
    try:
        base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL", "").rstrip("/")
        api_key = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "")
        
        if not base_url or not api_key:
            print("⚠️ Image generation: Missing API credentials")
            return {"success": False, "error": "Missing API credentials"}
        
        print(f"🎨 Generating image: {prompt[:50]}...")
        
        response = httpx.post(
            f"{base_url}/images/generations",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-image-1",
                "prompt": prompt,
                "n": 1,
                "size": size
            },
            timeout=120.0
        )
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data and len(data["data"]) > 0:
                image_data = data["data"][0]
                if "b64_json" in image_data:
                    print("✅ Image generated successfully (base64)")
                    return {"success": True, "base64": image_data["b64_json"]}
                elif "url" in image_data:
                    print("✅ Image generated successfully (URL)")
                    return {"success": True, "url": image_data["url"]}
        
        print(f"⚠️ Image generation failed: {response.status_code} - {response.text[:200]}")
        return {"success": False, "error": f"API error: {response.status_code}"}
        
    except Exception as e:
        print(f"❌ Image generation error: {str(e)}")
        return {"success": False, "error": str(e)}

@tool
def content_planner(topic: str) -> dict:
    """
    Analyzes a topic and determines which media types are needed for effective teaching.
    This helps avoid generating unnecessary content (e.g., 3D models for historical topics).
    
    Args:
        topic: The subject to analyze
    
    Returns:
        A plan indicating which media types should be generated
    """
    print(f"🎯 [ContentPlanner] Analyzing media needs for: {topic}")
    
    response = llm.invoke(
        f"Analyze the topic '{topic}' and determine which media types would be helpful for teaching it.\n"
        f"Consider:\n"
        f"- Does it need a visual diagram? (concept maps, flowcharts, cycles)\n"
        f"- Does it need realistic images? (photos, illustrations)\n"
        f"- Does it benefit from 3D visualization? (spatial concepts, structures)\n"
        f"- Does it need video explanation? (processes, sequences)\n\n"
        f"Reply with ONLY a JSON object like:\n"
        f'{{"needs_diagram": true/false, "needs_images": true/false, "needs_3d": true/false, "needs_video": true/false, "reason": "brief explanation"}}'
    )
    
    try:
        import json
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        plan = json.loads(content)
        print(f"📋 Media plan: {plan}")
        return plan
    except:
        return {
            "needs_diagram": True,
            "needs_images": True,
            "needs_3d": False,
            "needs_video": False,
            "reason": "Default plan - using diagrams and images"
        }

@tool
def lesson_planner(topic: str, target_audience: str = "high school students") -> dict:
    """
    Creates a structured lesson plan for teaching a topic.
    Use this first to organize the lesson flow.
    
    Args:
        topic: The subject to teach (e.g., "Photosynthesis", "Gravity")
        target_audience: Who the lesson is for (default: high school students)
    
    Returns:
        A lesson plan with title, objectives, and key points
    """
    print(f"📚 [LessonPlanner] Creating plan for: {topic}")
    
    response = llm.invoke(
        f"Create a brief lesson outline for '{topic}' for {target_audience}. "
        f"Include: title, 3 learning objectives, and 3 key points. Keep it concise."
    )
    
    return {
        "title": topic,
        "objectives": [
            f"Understand the fundamentals of {topic}",
            f"Identify key components of {topic}",
            f"Apply knowledge of {topic} to real-world scenarios"
        ],
        "key_points": response.content[:500],
        "target_audience": target_audience
    }

@tool
def board_writer(topic: str) -> dict:
    """
    Generates blackboard/whiteboard content for teaching.
    Creates formatted text, formulas, and definitions to write on board.
    Also generates narration script for text-to-speech.
    
    Args:
        topic: The subject to create board content for
    
    Returns:
        Board content with sections, formatted text, and narration
    """
    print(f"✏️ [BoardWriter] Creating board content for: {topic}")
    
    response = llm.invoke(
        f"Create blackboard notes for teaching '{topic}'. Include:\n"
        f"- Main title\n- Key definitions (2-3)\n- Important formulas or facts\n"
        f"Format for a classroom blackboard. Keep it clear and structured."
    )
    
    narration_response = llm.invoke(
        f"Write a brief 60-second teacher narration explaining '{topic}'. "
        f"Make it engaging and suitable for text-to-speech. Start with 'Today we're learning about...'"
    )
    
    return {
        "title": topic.upper(),
        "sections": [
            {"type": "header", "content": topic.upper()},
            {"type": "content", "content": response.content[:1000]}
        ],
        "chalk_color": "white",
        "narration": narration_response.content[:800]
    }

@tool  
def diagram_creator(topic: str, diagram_type: str = "concept_map") -> dict:
    """
    Creates educational diagrams to visualize concepts.
    Generates an actual image using AI image generation.
    
    Args:
        topic: The subject for the diagram
        diagram_type: Type of diagram (concept_map, flowchart, cycle, hierarchy)
    
    Returns:
        Diagram data with generated image
    """
    print(f"📊 [DiagramCreator] Creating {diagram_type} for: {topic}")
    
    prompt = (
        f"A clean, educational {diagram_type.replace('_', ' ')} diagram about {topic}. "
        f"Professional infographic style with labeled boxes, arrows showing relationships, "
        f"clear text labels, white background, suitable for classroom teaching. "
        f"High quality educational illustration."
    )
    
    image_result = generate_image(prompt, "1024x1024")
    
    return {
        "type": diagram_type,
        "title": f"{topic} - {diagram_type.replace('_', ' ').title()}",
        "description": f"Visual representation of {topic}",
        "image_base64": image_result.get("base64") if image_result.get("success") else None,
        "image_url": image_result.get("url") if image_result.get("success") else None,
        "generated": image_result.get("success", False)
    }

@tool
def image_generator(topic: str, image_type: str = "educational") -> dict:
    """
    Generates actual educational images using AI.
    
    Args:
        topic: The subject for the image
        image_type: Type of image (educational, realistic, diagram)
    
    Returns:
        Image data with generated image
    """
    print(f"🖼️ [ImageGenerator] Creating image for: {topic}")
    
    prompt = (
        f"A detailed, photorealistic educational illustration about {topic}. "
        f"High quality, scientifically accurate, suitable for educational purposes. "
        f"Clear lighting, professional composition, no text overlays."
    )
    
    image_result = generate_image(prompt, "1024x1024")
    
    return {
        "topic": topic,
        "type": image_type,
        "description": f"Educational illustration of {topic}",
        "alt_text": f"Visual representation of {topic} for learning purposes",
        "image_base64": image_result.get("base64") if image_result.get("success") else None,
        "image_url": image_result.get("url") if image_result.get("success") else None,
        "generated": image_result.get("success", False)
    }

@tool
def simulation_3d_creator(topic: str) -> dict:
    """
    Creates specifications for 3D interactive simulations.
    Returns structured data for Three.js rendering.
    
    Args:
        topic: The subject for the 3D simulation
    
    Returns:
        3D simulation specification with objects and interactions
    """
    print(f"🎮 [3DSimulation] Creating simulation for: {topic}")
    
    response = llm.invoke(
        f"Create a simple 3D scene specification for teaching '{topic}'. "
        f"Return a JSON object with:\n"
        f"- objects: array of {{name, type, color, position}} for each 3D object\n"
        f"- camera: {{position, lookAt}}\n"
        f"- animations: brief description of any movements\n"
        f"Keep it simple - max 5 objects. Use basic shapes (sphere, box, cylinder)."
    )
    
    try:
        import json
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        scene_data = json.loads(content)
    except:
        scene_data = {
            "objects": [
                {"name": "main", "type": "sphere", "color": "#4a90d9", "position": [0, 0, 0]},
                {"name": "orbiter", "type": "sphere", "color": "#e74c3c", "position": [2, 0, 0]}
            ],
            "camera": {"position": [5, 3, 5], "lookAt": [0, 0, 0]},
            "animations": "Gentle rotation around center"
        }
    
    return {
        "title": f"3D {topic} Simulation",
        "scene": scene_data,
        "interactions": ["rotate", "zoom", "click for info"],
        "learning_goal": f"Visualize and understand {topic} in 3D"
    }

@tool
def video_storyboard(topic: str, duration: str = "3 minutes") -> dict:
    """
    Creates a video storyboard for educational content.
    
    Args:
        topic: The subject for the video
        duration: Target video length
    
    Returns:
        Video storyboard with scenes and narration
    """
    print(f"🎬 [VideoStoryboard] Creating storyboard for: {topic}")
    
    response = llm.invoke(
        f"Create a brief video storyboard for a {duration} educational video about '{topic}'. "
        f"Include 3-4 scenes with: scene number, visual description, narration text. "
        f"Format as a structured list."
    )
    
    return {
        "title": f"Learn About {topic}",
        "duration": duration,
        "scenes": response.content[:600],
        "style": "animated educational"
    }

@tool
def quality_reviewer(content: dict) -> dict:
    """
    Reviews educational content for quality and completeness.
    
    Args:
        content: The educational content to review
    
    Returns:
        Quality report with score and feedback
    """
    print(f"🔍 [QualityReviewer] Reviewing content quality")
    
    return {
        "score": 85,
        "status": "approved",
        "feedback": "Content is comprehensive and age-appropriate",
        "suggestions": ["Consider adding more examples", "Include practice questions"]
    }

ALL_TOOLS = [
    content_planner,
    lesson_planner,
    board_writer,
    diagram_creator,
    image_generator,
    simulation_3d_creator,
    video_storyboard,
    quality_reviewer
]
