# AI Teacher - Python/LangGraph Educational Lesson System

## Overview
The AI Teacher is an educational lesson generation system running entirely in Python using LangGraph for workflow orchestration. It generates comprehensive lessons with multiple content types (lesson plans, blackboard content, diagrams, images, 3D simulations, videos) using AI with intelligent multi-agent visual planning.

## Project Architecture

### Current Architecture (Python/LangGraph - January 2026)

The application uses a Python backend with LangGraph for lesson generation, with Mastra acting as a gateway/proxy. The system features an intelligent multi-agent architecture for synchronized visual content generation.

**Backend Stack:**
- **Python FastAPI** (port 8001) - Main lesson generation backend
- **LangGraph** - Workflow orchestration for multi-step lesson generation
- **OpenAI GPT-4o/GPT-4o-mini** - AI tool calls for generation
- **Mastra** (port 5000) - Gateway that proxies requests to Python backend

**Frontend:**
- **React/Vite** - Blackboard UI served at /ui
- Displays lesson progress and final content in a classroom chalkboard style

### Multi-Agent System (`python_backend/agents/teaching_agents.py`)

1. **ScriptPlannerAgent** - Creates comprehensive lesson scripts with 10-14 segments
2. **ScriptAnalyzerAgent** - Pre-analyzes FULL script to plan all visuals (images, diagrams, 3D models, videos)
3. **VisualCoordinatorAgent** - Decides optimal timing for each visual based on narration script
4. **VisualGeneratorAgent** - Creates enhanced prompts with full script context for accurate generation
5. **NarrationAgent** - Expands narration text for natural teacher speaking style
6. **BoardWriterAgent** - Formats text for clean blackboard display (no markdown, proper symbols)
7. **DeciderAgent** - Controls lesson pacing and board clearing decisions
8. **BoardLayoutAgent** - Intelligent layout controller that decides board structure per segment
9. **ImageSourceAgent** - Decides whether to use real internet image or AI-generated
10. **UniqueContentAgent** - Ensures no teaching phase is repeated, validates unique content
11. **ImageAnalyzerAgent** - Analyzes image content to help explain what students should notice

### Visual Generation Flow

1. **Script Planning** - ScriptPlannerAgent creates full lesson with all segments
2. **Visual Analysis** - ScriptAnalyzerAgent receives complete script, plans 4-8 strategic visuals
3. **Pre-Generation** - VisualGeneratorAgent enhances prompts, images generated in parallel
4. **Coordinated Display** - VisualCoordinatorAgent decides when to show each visual during narration
5. **Synchronized Delivery** - Visuals appear at optimal moments while teacher explains

### Core Components

1. **Python Backend** (`python_backend/`)
   - `main.py` - FastAPI server with workflow API endpoints
   - `workflows/streaming_workflow.py` - Real-time streaming lesson delivery
   - `streaming/lesson_streamer.py` - SSE event streaming service
   - `agents/teaching_agents.py` - Multi-agent teaching system
   - `schemas/events.py` - Event types for streaming

2. **Streaming Workflow Steps**
   1. Planning lesson script - Create structured curriculum
   2. Analyzing script for visuals - AI plans all visual content upfront
   3. Pre-generating visuals - Start image generation in parallel
   4. Teaching segments - Synchronized board writing + narration
   5. Visual coordination - Display images at optimal moments
   6. Lesson completion - Summary and remaining visuals

3. **Mastra Gateway** (`src/mastra/index.ts`)
   - Proxies API requests to Python backend via pythonBridge.ts
   - SSE streaming routes for real-time lesson delivery
   - Serves frontend UI at /ui
   - Maintains Inngest integration for cron triggers

4. **Frontend** (`web/src/`)
   - `App.tsx` - Main app with lesson state management
   - `hooks/useLessonStream.ts` - SSE event consumption
   - `components/StreamingBlackboard.tsx` - Real-time lesson display with:
     - **Synchronized board writing** - Text appears while teacher speaks
     - **Text-to-speech** - Browser Web Speech API for narration
     - **AI-generated images** - Displayed at coordinated moments
   - `components/TopicInput.tsx` - Topic input and quick suggestions

### API Endpoints

**Start Streaming Lesson:**
```
POST /api/stream/lesson/start
Body: {"inputData": {"topic": "Your Topic"}}
Response: {"runId": "uuid", "status": "STARTED", "streamUrl": "/api/stream/lesson/{runId}"}
```

**Stream Lesson Events (SSE):**
```
GET /api/stream/lesson/{runId}
Response: Server-Sent Events with lesson content
```

**Frontend UI:**
```
GET /ui - Interactive blackboard interface
```

### Event Types

- `lesson_start` - Lesson begins with title
- `status_update` - Progress updates
- `board_write` - Text to write on blackboard
- `board_clear` - Clear board animation
- `narration_segment` - Text for speech synthesis
- `media_ready` - Image/diagram ready to display
- `layout_update` - **NEW** Dynamic layout configuration from BoardLayoutAgent
- `pause` - Pause between segments
- `lesson_end` - Lesson complete with summary

## Testing

Test the streaming lesson via curl:
```bash
curl -X POST http://localhost:5000/api/stream/lesson/start \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"topic": "The Solar System"}}'
```

## User Preferences

- Teaching style: Explain like teaching a 10-12 year old student, from basics, with simple language
- Visual planning: Intelligent pre-analysis of script for optimal visual timing
- Target audience: Young students (10-12 years old) learning from scratch
- LLM: GPT-4o for visual planning, GPT-4o-mini for fast responses
- Content: NO emojis, detailed explanations, complex terms explained simply
- Blackboard: Full-screen, edge-to-edge board with dynamic layout per segment
- Layout: Text gets 60% of board width, images get 40% for visibility
- Images: Large scrollable gallery on right side showing multiple images (up to 6), each image is big and readable
- Board content: Must include definitions, descriptions, examples like a real teacher writes on a blackboard
- Scrolling: Auto-scroll to new content as it appears, image section also scrollable
- Narration: Speaking indicator shows during board writing, synced with text animation, explains each visual
