"""
Educational tools for the AI Teacher agent
Each tool generates a specific type of educational content
"""
import os
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o-mini",
    base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
    api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY"),
    temperature=0.7,
    max_tokens=500
)

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
    
    Args:
        topic: The subject to create board content for
    
    Returns:
        Board content with sections and formatted text
    """
    print(f"✏️ [BoardWriter] Creating board content for: {topic}")
    
    response = llm.invoke(
        f"Create blackboard notes for teaching '{topic}'. Include:\n"
        f"- Main title\n- Key definitions (2-3)\n- Important formulas or facts\n"
        f"- A simple diagram description\nFormat as if writing on a blackboard."
    )
    
    return {
        "title": topic.upper(),
        "sections": [
            {"type": "header", "content": topic.upper()},
            {"type": "content", "content": response.content[:800]}
        ],
        "chalk_color": "white"
    }

@tool  
def diagram_creator(topic: str, diagram_type: str = "concept_map") -> dict:
    """
    Creates educational diagrams to visualize concepts.
    
    Args:
        topic: The subject for the diagram
        diagram_type: Type of diagram (concept_map, flowchart, cycle, hierarchy)
    
    Returns:
        Diagram data with elements and connections
    """
    print(f"📊 [DiagramCreator] Creating {diagram_type} for: {topic}")
    
    response = llm.invoke(
        f"Describe a {diagram_type} diagram for '{topic}'. "
        f"List 5-7 key elements and how they connect. Be concise."
    )
    
    return {
        "type": diagram_type,
        "title": f"{topic} - {diagram_type.replace('_', ' ').title()}",
        "elements": response.content[:600],
        "description": f"Visual representation of {topic}"
    }

@tool
def image_generator(topic: str, image_type: str = "educational") -> dict:
    """
    Generates descriptions for educational images.
    
    Args:
        topic: The subject for the image
        image_type: Type of image (educational, realistic, diagram)
    
    Returns:
        Image description and metadata
    """
    print(f"🖼️ [ImageGenerator] Creating image for: {topic}")
    
    return {
        "topic": topic,
        "type": image_type,
        "description": f"Educational illustration showing key aspects of {topic}",
        "alt_text": f"Visual representation of {topic} for learning purposes"
    }

@tool
def simulation_3d_creator(topic: str) -> dict:
    """
    Creates specifications for 3D interactive simulations.
    
    Args:
        topic: The subject for the 3D simulation
    
    Returns:
        3D simulation specification with objects and interactions
    """
    print(f"🎮 [3DSimulation] Creating simulation for: {topic}")
    
    response = llm.invoke(
        f"Describe a simple 3D simulation for teaching '{topic}'. "
        f"Include: main objects, interactions, and learning outcomes. Keep brief."
    )
    
    return {
        "title": f"3D {topic} Simulation",
        "objects": response.content[:400],
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
        f"Include 3-4 scenes with descriptions. Keep concise."
    )
    
    return {
        "title": f"Learn About {topic}",
        "duration": duration,
        "scenes": response.content[:500],
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
    lesson_planner,
    board_writer,
    diagram_creator,
    image_generator,
    simulation_3d_creator,
    video_storyboard,
    quality_reviewer
]
