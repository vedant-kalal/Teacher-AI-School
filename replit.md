# AI Teacher - Python/LangGraph Educational Lesson System

## Overview
The AI Teacher is an educational lesson generation system running entirely in Python using LangGraph for workflow orchestration. It generates comprehensive lessons with multiple content types (lesson plans, blackboard content, diagrams, images, 3D simulations, videos) using AI.

## Project Architecture

### Current Architecture (Python/LangGraph - January 2026)

The application now uses a Python backend with LangGraph for lesson generation, with Mastra acting as a gateway/proxy.

**Backend Stack:**
- **Python FastAPI** (port 8001) - Main lesson generation backend
- **LangGraph** - Workflow orchestration for multi-step lesson generation
- **OpenAI GPT-4o-mini** - All AI tool calls for fast generation
- **Mastra** (port 5000) - Gateway that proxies requests to Python backend

**Frontend:**
- **React/Vite** - Blackboard UI served at /ui
- Displays lesson progress and final content in a classroom chalkboard style

### Core Components

1. **Python Backend** (`python_backend/`)
   - `main.py` - FastAPI server with workflow API endpoints
   - `workflows/lesson_workflow.py` - LangGraph workflow for lesson generation
   - `agents/ai_teacher.py` - Teacher agent using LangGraph
   - `tools/lesson_tools.py` - 7 specialized teaching tools

2. **Teaching Tools** (`python_backend/tools/lesson_tools.py`)
   - `content_planner` - Analyzes topics to decide which media types are needed (diagrams, images, 3D, video)
   - `lesson_planner` - Creates structured lesson plans with learning objectives
   - `board_writer` - Creates blackboard-style educational content with narration script for TTS
   - `diagram_creator` - Generates **actual AI images** of concept maps using OpenAI gpt-image-1
   - `image_generator` - Produces **actual AI-generated** educational images using OpenAI gpt-image-1
   - `simulation_3d_creator` - Creates interactive 3D simulation specs (JSON for Three.js)
   - `video_storyboard` - Produces educational video storyboards
   - `quality_reviewer` - Reviews content for educational quality (score 1-100)

3. **Mastra Gateway** (`src/mastra/index.ts`)
   - Proxies API requests to Python backend via pythonBridge.ts
   - Serves frontend UI at /ui
   - Maintains Inngest integration for cron triggers

4. **Frontend** (`web/src/`)
   - `App.tsx` - Main app with lesson state management and polling
   - `components/Blackboard.tsx` - Chalkboard-style lesson display with:
     - **Streaming text** - Words appear one at a time like a teacher writing
     - **Text-to-speech** - "Listen to Teacher" button using browser Web Speech API
     - **AI-generated images** - Actual diagrams/images displayed on blackboard
   - `components/TopicInput.tsx` - Topic input and quick suggestions
   - `components/LessonProgress.tsx` - Real-time step progress display
   - `components/MediaGallery.tsx` - Displays AI-generated images, diagrams, 3D specs, and video storyboards

### Workflow Steps (10 total with smart skipping)
1. Initialize - Set up session
2. **Planning Content Types** - AI analyzes topic to decide which media are needed
3. Creating Lesson Plan - Generate structured curriculum
4. Writing Board Content - Create blackboard-style text + narration script
5. Creating Diagrams - **Generate actual AI images** (skipped if not needed)
6. Generating Images - **Generate actual AI images** (skipped if not needed)
7. Creating 3D Simulation - Design interactive simulations (skipped if not needed)
8. Creating Video - Produce video storyboard (skipped if not needed)
9. Quality Review - Educational content review (85+ score = approved)
10. Compiling Lesson - Assemble final lesson package

**Smart Content Planning:** The content planner analyzes the topic and decides which media types (diagrams, images, 3D models, videos) are appropriate. For example, "World War II" may skip 3D models but include diagrams and images, while "The Solar System" includes 3D models.

### Startup Process
1. `inngest.sh` script starts Python server (port 8001) in background
2. Inngest CLI starts for cron job management
3. Mastra dev server starts (port 5000), waits for Python readiness
4. Python health check confirms backend is ready

## API Endpoints

**Start Lesson Generation:**
```
POST /api/workflows/ai-teacher-workflow/start-async
Body: {"inputData": {"topic": "Your Topic"}}
Response: {"runId": "uuid", "status": "RUNNING"}
```

**Poll Lesson Status:**
```
GET /api/workflows/ai-teacher-workflow/{runId}
Response: {"status": "RUNNING|COMPLETED", "steps": [...], "result": {...}}
```

**Frontend UI:**
```
GET /ui - Interactive blackboard interface
```

## Testing

Test the Python workflow via curl:
```bash
curl -X POST http://localhost:5000/api/workflows/ai-teacher-workflow/start-async \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"topic": "The Solar System"}}'
```

## User Preferences

- Teaching style: Natural chalkboard simulation, hand-drawn diagrams
- Target audience: High school students
- LLM: GPT-4o-mini for fast tool responses
