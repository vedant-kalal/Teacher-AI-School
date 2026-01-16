"""
Lesson Generation Workflow using LangGraph
Sequential workflow that generates comprehensive lessons with smart content planning
"""
import os
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from langchain_openai import ChatOpenAI

from tools.lesson_tools import (
    content_planner,
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
    {"stepId": "plan-content", "name": "Planning Content Types"},
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

def get_steps_status(current_step_index: int, completed: bool = False, skipped_steps: List[str] = None) -> List[Dict[str, Any]]:
    """Generate steps array matching frontend expectations"""
    skipped_steps = skipped_steps or []
    steps = []
    for i, step_def in enumerate(STEP_DEFINITIONS):
        if step_def["stepId"] in skipped_steps:
            status = "skipped"
        elif completed:
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
    Uses content planner to determine which media types to generate
    """
    session_id = generate_session_id()
    skipped_steps = []
    
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
        "qualityReview": None,
        "contentPlan": None
    }
    
    try:
        print(f"\n{'='*60}")
        print(f"🎓 AI TEACHER - Starting Lesson Generation")
        print(f"📚 Topic: {topic}")
        print(f"🆔 Session: {session_id}")
        print(f"{'='*60}\n")
        
        workflow_status[run_id]["steps"] = get_steps_status(1)
        print("🎯 [Step 1/9] Analyzing content needs...")
        content_plan = content_planner.invoke({"topic": topic})
        results["contentPlan"] = content_plan
        
        needs_diagram = content_plan.get("needs_diagram", True)
        needs_images = content_plan.get("needs_images", True)
        needs_3d = content_plan.get("needs_3d", False)
        needs_video = content_plan.get("needs_video", False)
        
        print(f"📋 Content Plan: Diagram={needs_diagram}, Images={needs_images}, 3D={needs_3d}, Video={needs_video}")
        
        if not needs_3d:
            skipped_steps.append("generate-3d-simulation")
        if not needs_video:
            skipped_steps.append("generate-video")
        
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(2, skipped_steps=skipped_steps)
        print("📚 [Step 2/9] Creating lesson plan...")
        lesson_plan = lesson_planner.invoke({"topic": topic, "target_audience": target_audience})
        results["lessonPlan"] = lesson_plan
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(3, skipped_steps=skipped_steps)
        print("✏️ [Step 3/9] Generating blackboard content...")
        board_content = board_writer.invoke({"topic": topic})
        results["boardContent"] = [board_content]
        await asyncio.sleep(0.1)
        
        if needs_diagram:
            workflow_status[run_id]["steps"] = get_steps_status(4, skipped_steps=skipped_steps)
            print("📊 [Step 4/9] Creating educational diagrams (generating actual image)...")
            diagrams = diagram_creator.invoke({"topic": topic, "diagram_type": "concept_map"})
            results["diagrams"] = [diagrams]
        else:
            skipped_steps.append("generate-diagrams")
            print("⏭️ [Step 4/9] Skipping diagrams (not needed for this topic)")
            results["diagrams"] = []
        await asyncio.sleep(0.1)
        
        if needs_images:
            workflow_status[run_id]["steps"] = get_steps_status(5, skipped_steps=skipped_steps)
            print("🖼️ [Step 5/9] Generating educational images (generating actual image)...")
            images = image_generator.invoke({"topic": topic, "image_type": "educational"})
            results["images"] = [images]
        else:
            skipped_steps.append("generate-images")
            print("⏭️ [Step 5/9] Skipping images (not needed for this topic)")
            results["images"] = []
        await asyncio.sleep(0.1)
        
        if needs_3d:
            workflow_status[run_id]["steps"] = get_steps_status(6, skipped_steps=skipped_steps)
            print("🎮 [Step 6/9] Creating 3D simulation...")
            simulation = simulation_3d_creator.invoke({"topic": topic})
            results["simulations"] = [simulation]
        else:
            print("⏭️ [Step 6/9] Skipping 3D simulation (not needed for this topic)")
            results["simulations"] = []
        await asyncio.sleep(0.1)
        
        if needs_video:
            workflow_status[run_id]["steps"] = get_steps_status(7, skipped_steps=skipped_steps)
            print("🎬 [Step 7/9] Creating video storyboard...")
            video = video_storyboard.invoke({"topic": topic, "duration": "3 minutes"})
            results["videos"] = [video]
        else:
            print("⏭️ [Step 7/9] Skipping video (not needed for this topic)")
            results["videos"] = []
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(8, skipped_steps=skipped_steps)
        print("🔍 [Step 8/9] Running quality review...")
        quality = quality_reviewer.invoke({"content": results})
        results["qualityReview"] = quality
        await asyncio.sleep(0.1)
        
        workflow_status[run_id]["steps"] = get_steps_status(9, completed=True, skipped_steps=skipped_steps)
        print("📦 [Step 9/9] Compiling final lesson...")
        
        lesson_sessions[session_id] = {**lesson_data, **results}
        
        workflow_status[run_id]["status"] = "COMPLETED"
        workflow_status[run_id]["result"] = results
        
        print(f"\n{'='*60}")
        print("✅ LESSON GENERATION COMPLETE!")
        print(f"📚 Topic: {topic}")
        print(f"🆔 Session: {session_id}")
        print(f"📋 Content Plan: {content_plan.get('reason', 'N/A')}")
        print(f"📋 Lesson Plan: ✓")
        print(f"✏️ Board Content: ✓ (with narration)")
        print(f"📊 Diagrams: {'✓ (with AI image)' if needs_diagram else '⏭️ Skipped'}")
        print(f"🖼️ Images: {'✓ (with AI image)' if needs_images else '⏭️ Skipped'}")
        print(f"🎮 3D Simulation: {'✓' if needs_3d else '⏭️ Skipped'}")
        print(f"🎬 Video: {'✓' if needs_video else '⏭️ Skipped'}")
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
