"""
Lesson Generation Workflow using LangGraph
Sequential workflow that generates comprehensive lessons
"""
import os
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from langchain_openai import ChatOpenAI

from tools.lesson_tools import (
    lesson_planner,
    board_writer,
    diagram_creator,
    image_generator,
    simulation_3d_creator,
    video_storyboard,
    quality_reviewer
)

lesson_sessions: Dict[str, Dict[str, Any]] = {}
workflow_status: Dict[str, Dict[str, Any]] = {}

STEP_DEFINITIONS = [
    {"stepId": "initialize-lesson", "name": "Initialize"},
    {"stepId": "plan-lesson", "name": "Creating Lesson Plan"},
    {"stepId": "generate-board-content", "name": "Writing Board Content"},
    {"stepId": "generate-diagrams", "name": "Creating Diagrams"},
    {"stepId": "generate-images", "name": "Generating Images"},
    {"stepId": "generate-3d-simulation", "name": "Creating 3D Simulation"},
    {"stepId": "generate-video", "name": "Creating Video"},
    {"stepId": "quality-review", "name": "Quality Review"},
    {"stepId": "compile-lesson", "name": "Compiling Lesson"},
]

def generate_session_id() -> str:
    import random
    import string
    timestamp = int(datetime.now().timestamp() * 1000)
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"lesson_{timestamp}_{suffix}"

def get_steps_status(current_step_index: int, completed: bool = False) -> List[Dict[str, Any]]:
    """Generate steps array matching frontend expectations"""
    steps = []
    for i, step_def in enumerate(STEP_DEFINITIONS):
        if completed:
            status = "completed"
        elif i < current_step_index:
            status = "completed"
        elif i == current_step_index:
            status = "running"
        else:
            status = "pending"
        
        steps.append({
            "stepId": step_def["stepId"],
            "name": step_def["name"],
            "status": status,
            "output": None
        })
    return steps

async def run_lesson_workflow(run_id: str, topic: str, target_audience: str = "high school students"):
    """
    Execute the complete lesson generation workflow
    Each step generates a different type of educational content
    """
    session_id = generate_session_id()
    
    workflow_status[run_id] = {
        "runId": run_id,
        "sessionId": session_id,
        "status": "RUNNING",
        "steps": get_steps_status(0),
        "topic": topic,
        "startTime": datetime.now().isoformat(),
        "result": None
    }
    
    lesson_data = {
        "sessionId": session_id,
        "topic": topic,
        "targetAudience": target_audience,
        "createdAt": datetime.now().isoformat(),
    }
    
    results = {
        "lessonPlan": None,
        "boardContent": None,
        "diagrams": [],
        "images": [],
        "simulations": [],
        "videos": [],
        "qualityReview": None
    }
    
    try:
        print(f"\n{'='*60}")
        print(f"🎓 AI TEACHER - Starting Lesson Generation")
        print(f"📚 Topic: {topic}")
        print(f"🆔 Session: {session_id}")
        print(f"{'='*60}\n")
        
        workflow_status[run_id]["steps"] = get_steps_status(1)
        print("📚 [Step 1/8] Creating lesson plan...")
        lesson_plan = lesson_planner.invoke({"topic": topic, "target_audience": target_audience})
        results["lessonPlan"] = lesson_plan
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(2)
        print("✏️ [Step 2/8] Generating blackboard content...")
        board_content = board_writer.invoke({"topic": topic})
        results["boardContent"] = [board_content]
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(3)
        print("📊 [Step 3/8] Creating educational diagrams...")
        diagrams = diagram_creator.invoke({"topic": topic, "diagram_type": "concept_map"})
        results["diagrams"] = [diagrams]
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(4)
        print("🖼️ [Step 4/8] Generating educational images...")
        images = image_generator.invoke({"topic": topic, "image_type": "educational"})
        results["images"] = [images]
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(5)
        print("🎮 [Step 5/8] Creating 3D simulation...")
        simulation = simulation_3d_creator.invoke({"topic": topic})
        results["simulations"] = [simulation]
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(6)
        print("🎬 [Step 6/8] Creating video storyboard...")
        video = video_storyboard.invoke({"topic": topic, "duration": "3 minutes"})
        results["videos"] = [video]
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(7)
        print("🔍 [Step 7/8] Running quality review...")
        quality = quality_reviewer.invoke({"content": results})
        results["qualityReview"] = quality
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(8, completed=True)
        print("📦 [Step 8/8] Compiling final lesson...")
        
        lesson_sessions[session_id] = {**lesson_data, **results}
        
        workflow_status[run_id]["status"] = "COMPLETED"
        workflow_status[run_id]["result"] = results
        
        print(f"\n{'='*60}")
        print("✅ LESSON GENERATION COMPLETE!")
        print(f"📚 Topic: {topic}")
        print(f"🆔 Session: {session_id}")
        print(f"📋 Lesson Plan: ✓")
        print(f"✏️ Board Content: ✓") 
        print(f"📊 Diagrams: ✓")
        print(f"🖼️ Images: ✓")
        print(f"🎮 3D Simulation: ✓")
        print(f"🎬 Video: ✓")
        print(f"🔍 Quality Score: {quality.get('score', 'N/A')}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Error in workflow: {str(e)}")
        import traceback
        traceback.print_exc()
        workflow_status[run_id]["status"] = "FAILED"
        workflow_status[run_id]["error"] = str(e)

def get_workflow_status(run_id: str) -> Optional[Dict[str, Any]]:
    """Get the current status of a workflow run"""
    return workflow_status.get(run_id)
