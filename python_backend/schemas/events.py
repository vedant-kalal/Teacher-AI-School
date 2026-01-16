"""
Streaming Event Schema for Real-time AI Teacher
Defines event types for synchronized lesson delivery
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class EventType(str, Enum):
    LESSON_START = "lesson_start"
    BOARD_CLEAR = "board_clear"
    BOARD_WRITE = "board_write"
    NARRATION_START = "narration_start"
    NARRATION_SEGMENT = "narration_segment"
    NARRATION_END = "narration_end"
    MEDIA_REQUEST = "media_request"
    MEDIA_READY = "media_ready"
    PAUSE = "pause"
    LESSON_END = "lesson_end"
    ERROR = "error"
    STATUS_UPDATE = "status_update"


class MediaType(str, Enum):
    DIAGRAM = "diagram"
    IMAGE = "image"
    VIDEO = "video"
    SIMULATION = "simulation"
    FORMULA = "formula"


class BoardWriteStyle(str, Enum):
    TITLE = "title"
    HEADING = "heading"
    TEXT = "text"
    FORMULA = "formula"
    BULLET = "bullet"
    HIGHLIGHT = "highlight"
    EMOJI = "emoji"


class BoardPosition(BaseModel):
    x: float = 0
    y: float = 0


class BoardWriteEvent(BaseModel):
    text: str
    style: BoardWriteStyle = BoardWriteStyle.TEXT
    position: Optional[BoardPosition] = None
    color: str = "white"
    size: str = "medium"
    duration_ms: int = 0
    char_delay_ms: int = 50
    sync_with_narration: bool = True


class NarrationSegment(BaseModel):
    text: str
    duration_ms: int = 0
    pause_after_ms: int = 200
    emphasis: bool = False
    speed: float = 1.0


class MediaRequestEvent(BaseModel):
    media_type: MediaType
    prompt: str
    topic: str
    context: str = ""
    display_on_board: bool = True
    priority: int = 1


class MediaReadyEvent(BaseModel):
    media_type: MediaType
    title: str
    description: str = ""
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    display_on_board: bool = True
    display_duration_ms: int = 5000


class LessonStreamEvent(BaseModel):
    event_type: EventType
    timestamp: datetime
    sequence_id: int
    data: Dict[str, Any]
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class LessonSegment(BaseModel):
    segment_id: str
    narration: NarrationSegment
    board_writes: List[BoardWriteEvent]
    media_requests: List[MediaRequestEvent] = []
    clear_board_before: bool = False
    pause_after_ms: int = 500


class LessonScript(BaseModel):
    topic: str
    title: str
    total_duration_ms: int = 0
    segments: List[LessonSegment]
    emojis_used: List[str] = []
    formulas: List[str] = []


def create_event(event_type: EventType, data: Dict[str, Any], sequence_id: int = 0) -> LessonStreamEvent:
    return LessonStreamEvent(
        event_type=event_type,
        timestamp=datetime.now(),
        sequence_id=sequence_id,
        data=data
    )


def create_board_write(
    text: str,
    style: BoardWriteStyle = BoardWriteStyle.TEXT,
    color: str = "white",
    char_delay_ms: int = 50
) -> BoardWriteEvent:
    return BoardWriteEvent(
        text=text,
        style=style,
        color=color,
        char_delay_ms=char_delay_ms,
        duration_ms=len(text) * char_delay_ms
    )


def create_narration(text: str, speed: float = 1.0) -> NarrationSegment:
    words = len(text.split())
    words_per_minute = 150 * speed
    duration_ms = int((words / words_per_minute) * 60 * 1000)
    
    return NarrationSegment(
        text=text,
        duration_ms=duration_ms,
        speed=speed
    )


def format_formula_for_board(formula: str) -> str:
    replacements = {
        '*': '×',
        '/': '÷',
        '**2': '²',
        '**3': '³',
        'sqrt': '√',
        'pi': 'π',
        'theta': 'θ',
        'alpha': 'α',
        'beta': 'β',
        'gamma': 'γ',
        'delta': 'Δ',
        'sigma': 'Σ',
        'omega': 'Ω',
        '->': '→',
        '<-': '←',
        '<=': '≤',
        '>=': '≥',
        '!=': '≠',
        'infinity': '∞',
        'degree': '°',
    }
    
    result = formula
    for old, new in replacements.items():
        result = result.replace(old, new)
    
    return result


def clean_text_for_board(text: str) -> str:
    text = text.replace('#', '')
    text = text.replace('**', '')
    text = text.replace('*', '')
    text = text.replace('_', '')
    text = text.replace('`', '')
    text = text.replace('```', '')
    text = text.replace('---', '—')
    text = text.replace('--', '–')
    
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        if line.strip().startswith('- '):
            line = '• ' + line.strip()[2:]
        elif line.strip().startswith('* '):
            line = '• ' + line.strip()[2:]
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


TEACHING_EMOJIS = {
    'attention': '👆',
    'important': '⭐',
    'note': '📝',
    'remember': '💡',
    'example': '📌',
    'question': '❓',
    'answer': '✅',
    'warning': '⚠️',
    'heart': '❤️',
    'brain': '🧠',
    'book': '📚',
    'science': '🔬',
    'math': '🔢',
    'earth': '🌍',
    'atom': '⚛️',
    'rocket': '🚀',
    'star': '⭐',
    'check': '✓',
    'arrow_right': '→',
    'arrow_down': '↓',
    'plus': '➕',
    'equals': '＝',
}
