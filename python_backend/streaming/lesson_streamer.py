"""
Real-time Lesson Streaming Service
Handles SSE-based synchronized lesson delivery with parallel content generation
"""
import asyncio
import json
import uuid
from typing import AsyncGenerator, Dict, Any, Optional, Callable
from datetime import datetime

from schemas.events import (
    EventType, MediaType, BoardWriteStyle,
    LessonStreamEvent, LessonSegment, BoardWriteEvent,
    NarrationSegment, MediaRequestEvent, MediaReadyEvent,
    create_event, clean_text_for_board, format_formula_for_board,
    TEACHING_EMOJIS
)


class LessonStreamer:
    def __init__(self, run_id: str, topic: str):
        self.run_id = run_id
        self.topic = topic
        self.sequence_id = 0
        self.is_running = False
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.media_tasks: Dict[str, asyncio.Task] = {}
        self.pending_media: Dict[str, MediaRequestEvent] = {}
        
    def next_sequence(self) -> int:
        self.sequence_id += 1
        return self.sequence_id
        
    async def emit_event(self, event_type: EventType, data: Dict[str, Any]):
        event = create_event(event_type, data, self.next_sequence())
        await self.event_queue.put(event)
        
    async def emit_lesson_start(self, title: str):
        await self.emit_event(EventType.LESSON_START, {
            "topic": self.topic,
            "title": title,
            "run_id": self.run_id,
            "timestamp": datetime.now().isoformat()
        })
        
    async def emit_board_clear(self, animation: str = "fade"):
        await self.emit_event(EventType.BOARD_CLEAR, {
            "animation": animation,
            "duration_ms": 500
        })
        
    async def emit_board_write(self, write_event: BoardWriteEvent):
        await self.emit_event(EventType.BOARD_WRITE, {
            "text": clean_text_for_board(write_event.text),
            "style": write_event.style.value,
            "color": write_event.color,
            "size": write_event.size,
            "char_delay_ms": write_event.char_delay_ms,
            "duration_ms": write_event.duration_ms,
            "sync_with_narration": write_event.sync_with_narration,
            "position": write_event.position.dict() if write_event.position else None
        })
        
    async def emit_narration_segment(self, segment: NarrationSegment):
        await self.emit_event(EventType.NARRATION_SEGMENT, {
            "text": segment.text,
            "duration_ms": segment.duration_ms,
            "speed": segment.speed,
            "pause_after_ms": segment.pause_after_ms,
            "emphasis": segment.emphasis
        })
        
    async def emit_media_request(self, request: MediaRequestEvent):
        request_id = str(uuid.uuid4())
        self.pending_media[request_id] = request
        await self.emit_event(EventType.MEDIA_REQUEST, {
            "request_id": request_id,
            "media_type": request.media_type.value,
            "prompt": request.prompt,
            "topic": request.topic,
            "display_on_board": request.display_on_board
        })
        return request_id
        
    async def emit_media_ready(self, media: MediaReadyEvent):
        await self.emit_event(EventType.MEDIA_READY, {
            "media_type": media.media_type.value,
            "title": media.title,
            "description": media.description,
            "image_base64": media.image_base64,
            "image_url": media.image_url,
            "display_on_board": media.display_on_board,
            "display_duration_ms": media.display_duration_ms
        })
        
    async def emit_pause(self, duration_ms: int):
        await self.emit_event(EventType.PAUSE, {
            "duration_ms": duration_ms
        })
        
    async def emit_lesson_end(self, summary: str = ""):
        await self.emit_event(EventType.LESSON_END, {
            "summary": summary,
            "total_segments": self.sequence_id
        })
        
    async def emit_error(self, error: str):
        await self.emit_event(EventType.ERROR, {
            "message": error
        })
        
    async def emit_status_update(self, status: str, progress: float = 0):
        await self.emit_event(EventType.STATUS_UPDATE, {
            "status": status,
            "progress": progress
        })
        
    async def get_events(self) -> AsyncGenerator[str, None]:
        self.is_running = True
        try:
            while self.is_running:
                try:
                    event = await asyncio.wait_for(self.event_queue.get(), timeout=30.0)
                    event_data = event.dict()
                    event_data['timestamp'] = event.timestamp.isoformat()
                    yield f"data: {json.dumps(event_data)}\n\n"
                    
                    if event.event_type == EventType.LESSON_END:
                        break
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'event_type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
        finally:
            self.is_running = False
            
    def stop(self):
        self.is_running = False


active_streamers: Dict[str, LessonStreamer] = {}


def create_streamer(run_id: str, topic: str) -> LessonStreamer:
    streamer = LessonStreamer(run_id, topic)
    active_streamers[run_id] = streamer
    return streamer


def get_streamer(run_id: str) -> Optional[LessonStreamer]:
    return active_streamers.get(run_id)


def remove_streamer(run_id: str):
    if run_id in active_streamers:
        active_streamers[run_id].stop()
        del active_streamers[run_id]
