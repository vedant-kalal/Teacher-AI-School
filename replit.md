# AI Teacher - Multi-Agent Educational Lesson System

## Overview
The AI Teacher is a multi-agent automation system for schools that delivers comprehensive educational lessons. The system orchestrates multiple specialized AI agents through a single orchestrating agent with 8 specialized tools to teach topics like a real teacher.

## Project Architecture

### Core Components

1. **Main Agent** (`src/mastra/agents/aiTeacherAgent.ts`)
   - Single orchestrating agent using GPT-5
   - Has access to all 8 specialized teaching tools
   - Follows comprehensive teaching methodology instructions

2. **Teaching Tools** (`src/mastra/tools/`)
   - `lessonPlannerTool.ts` - Creates structured lesson plans with learning objectives
   - `promptGeneratorTool.ts` - Generates optimized prompts for each teaching modality
   - `boardWritingTool.ts` - Simulates natural handwriting on blackboard
   - `diagramTool.ts` - Creates hand-drawn style educational diagrams
   - `imageGenerationTool.ts` - Produces realistic educational images
   - `simulation3DTool.ts` - Creates interactive 3D simulations
   - `videoCreationTool.ts` - Produces educational video storyboards
   - `qualityMonitorTool.ts` - Reviews content for educational quality

3. **Schema Validation Utilities** (`src/mastra/tools/utils/schemaValidation.ts`)
   - Deep normalization functions for all tool outputs
   - Ensures nested field validation with sensible defaults
   - Prevents workflow failures from malformed LLM responses

4. **Workflow** (`src/mastra/workflows/aiTeacherWorkflow.ts`)
   - 9 sequential steps: initialize → plan → board → diagrams → images → 3D simulations → video → quality review → compile
   - Uses Inngest for cron-triggered execution
   - Normalizes outputs at each step with concrete fallback artifacts

5. **Cron Trigger** (`src/mastra/triggers/cronTrigger.ts`)
   - Scheduled daily at 9 AM UTC
   - Uses Inngest for reliable scheduled execution

### Key Design Decisions

- **Single Agent, Multiple Tools**: Uses one orchestrating agent with 8 specialized tools rather than multiple separate agents
- **Schema Normalization**: All tool outputs are normalized with deep validation to ensure consistent data structures
- **Graceful Degradation**: Each step provides fallback artifacts even when tool calls fail
- **Quality Assurance**: Built-in quality monitor reviews all generated content

## Recent Changes (January 2026)

- Added schema validation utilities for deep nested field normalization
- Improved all tools with robust fallback handling and structured defaults
- Updated workflow steps to guarantee concrete output artifacts
- Enhanced quality monitor to receive actual content excerpts for review

## Running the Automation

The automation runs on a daily schedule (9 AM UTC). To test manually:

```bash
npx tsx tests/testCronAutomation.ts
```

## User Preferences

- Teaching style: Natural handwriting simulation, hand-drawn diagrams, realistic visuals
- Target audience: School students
- LLM: GPT-5 for agent, GPT-4O for tools, gpt-image-1 for images
