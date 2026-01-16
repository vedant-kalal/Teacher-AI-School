"""
AI Teacher - Python Backend with Streaming Support
FastAPI server that handles real-time lesson delivery using SSE
"""
import os
import uuid
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from workflows.lesson_workflow import run_lesson_workflow, get_workflow_status, lesson_sessions
from workflows.streaming_workflow import start_streaming_lesson, get_streaming_status
from streaming.lesson_streamer import get_streamer, create_streamer, remove_streamer

app = FastAPI(title="AI Teacher", description="Real-time Educational AI with Streaming Lessons")

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
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "streaming": True}

@app.post("/api/stream/lesson/start")
async def start_streaming_lesson_endpoint(request: dict):
    """Start a new streaming lesson"""
    input_data = request.get("inputData", {})
    topic = input_data.get("topic", "The Solar System")
    
    run_id = str(uuid.uuid4())
    
    print(f"🎓 [Streaming Lesson] Starting on: {topic}")
    print(f"📝 Run ID: {run_id}")
    
    streamer = create_streamer(run_id, topic)
    
    asyncio.create_task(start_streaming_lesson(run_id, topic))
    
    return {"runId": run_id, "status": "STARTED", "streamUrl": f"/api/stream/lesson/{run_id}"}

@app.get("/api/stream/lesson/{run_id}")
async def stream_lesson_events(run_id: str):
    """SSE endpoint for streaming lesson events"""
    streamer = get_streamer(run_id)
    
    if not streamer:
        raise HTTPException(status_code=404, detail="Lesson stream not found")
    
    async def event_generator():
        try:
            async for event in streamer.get_events():
                yield event
        except asyncio.CancelledError:
            print(f"Stream cancelled for run_id: {run_id}")
        finally:
            pass
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/stream/lesson/{run_id}/status")
async def get_streaming_lesson_status(run_id: str):
    """Get status of a streaming lesson"""
    status = get_streaming_status(run_id)
    if not status:
        return {"runId": run_id, "status": "NOT_FOUND"}
    return {"runId": run_id, **status}

@app.delete("/api/stream/lesson/{run_id}")
async def stop_streaming_lesson(run_id: str):
    """Stop a streaming lesson"""
    remove_streamer(run_id)
    return {"runId": run_id, "status": "STOPPED"}

@app.post("/api/workflows/ai-teacher-workflow/start-async")
async def start_lesson(request: dict):
    """Start a new lesson generation workflow (legacy batch mode)"""
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
