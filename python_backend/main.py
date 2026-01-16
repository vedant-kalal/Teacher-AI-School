"""
AI Teacher - Python Backend with LangGraph
FastAPI server that handles lesson generation using LangGraph agents
"""
import os
import uuid
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from workflows.lesson_workflow import run_lesson_workflow, get_workflow_status, lesson_sessions

app = FastAPI(title="AI Teacher", description="Educational AI that generates comprehensive lessons")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LessonRequest(BaseModel):
    topic: str
    target_audience: Optional[str] = "high school students"

class LessonResponse(BaseModel):
    run_id: str
    status: str
    message: str

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/workflows/ai-teacher-workflow/start-async")
async def start_lesson(request: dict):
    """Start a new lesson generation workflow"""
    input_data = request.get("inputData", {})
    topic = input_data.get("topic", "The Solar System")
    
    run_id = str(uuid.uuid4())
    
    print(f"🎓 [AI Teacher] Starting lesson on: {topic}")
    print(f"📝 Run ID: {run_id}")
    
    asyncio.create_task(run_lesson_workflow(run_id, topic))
    
    return {"runId": run_id, "status": "RUNNING"}

@app.get("/api/workflows/ai-teacher-workflow/{run_id}")
async def get_lesson_status(run_id: str):
    """Get the status of a lesson generation workflow"""
    status = get_workflow_status(run_id)
    
    if not status:
        return {"runId": run_id, "status": "NOT_FOUND", "result": None}
    
    return status

@app.get("/api/lessons/{session_id}")
async def get_lesson_content(session_id: str):
    """Get the full content of a generated lesson"""
    if session_id not in lesson_sessions:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return lesson_sessions[session_id]

import pathlib
BASE_DIR = pathlib.Path(__file__).parent.parent

try:
    app.mount("/assets", StaticFiles(directory=str(BASE_DIR / "dist" / "assets")), name="assets")
except RuntimeError:
    print("Warning: dist/assets not found, UI will not be served")

@app.get("/ui")
async def serve_ui():
    return FileResponse(str(BASE_DIR / "dist" / "index.html"))

@app.get("/ui/{path:path}")
async def serve_ui_paths(path: str):
    return FileResponse(str(BASE_DIR / "dist" / "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PYTHON_SERVER_PORT", "8001"))
    print(f"🐍 Python AI Teacher starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
