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
   - `create_lesson_plan` - Creates structured lesson plans with learning objectives
   - `generate_board_content` - Creates blackboard-style educational content
   - `create_diagrams` - Generates concept maps and visual diagrams
   - `generate_images` - Produces educational image descriptions
   - `create_3d_simulation` - Creates interactive 3D simulation specs
   - `create_video` - Produces educational video storyboards
   - `review_quality` - Reviews content for educational quality (score 1-100)

3. **Mastra Gateway** (`src/mastra/index.ts`)
   - Proxies API requests to Python backend via pythonBridge.ts
   - Serves frontend UI at /ui
   - Maintains Inngest integration for cron triggers

4. **Frontend** (`web/src/`)
   - `App.tsx` - Main app with lesson state management and polling
   - `components/Blackboard.tsx` - Chalkboard-style lesson display
   - `components/TopicInput.tsx` - Topic input and quick suggestions
   - `components/LessonProgress.tsx` - Real-time step progress display

### Workflow Steps (9 total)
1. Initialize - Set up session
2. Creating Lesson Plan - Generate structured curriculum
3. Writing Board Content - Create blackboard-style text
4. Creating Diagrams - Generate concept maps
5. Generating Images - Create visual assets
6. Creating 3D Simulation - Design interactive simulations
7. Creating Video - Produce video storyboard
8. Quality Review - Educational content review (85+ score = approved)
9. Compiling Lesson - Assemble final lesson package

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
