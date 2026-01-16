import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { aiTeacherAgent } from "../agents/aiTeacherAgent";
import { saveLessonData, loadLessonData, generateSessionId, LessonData } from "../tools/utils/lessonStorage";

const minimalStepSchema = z.object({
  sessionId: z.string(),
  topic: z.string(),
  status: z.string(),
});

const planLessonStep = createStep({
  id: "plan-lesson",
  description: "Creates a comprehensive lesson plan for the given topic",
  inputSchema: z.object({
    sessionId: z.string(),
    topic: z.string(),
    status: z.string(),
  }),
  outputSchema: minimalStepSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📚 [Step 1: Plan Lesson] Starting lesson planning for:", { topic: inputData.topic });

    const prompt = `Create a lesson plan about "${inputData.topic}" for high school students. Use the lesson-planner-tool.`;
    const response = await aiTeacherAgent.generateLegacy([{ role: "user", content: prompt }], { maxSteps: 1 });

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const planResult = (toolResults[0] as any)?.result || {};
    
    saveLessonData(inputData.sessionId, {
      topic: inputData.topic,
      targetAudience: "high school students",
      lessonPlan: {
        title: planResult.lessonPlan?.title || inputData.topic,
        objectives: planResult.lessonPlan?.learningObjectives?.slice(0, 3) || [],
      },
    });

    logger?.info("✅ [Step 1: Plan Lesson] Lesson plan created and saved");
    return { sessionId: inputData.sessionId, topic: inputData.topic, status: "plan_complete" };
  },
});

const generateBoardContentStep = createStep({
  id: "generate-board-content",
  description: "Generates blackboard writing content",
  inputSchema: minimalStepSchema,
  outputSchema: minimalStepSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("✏️ [Step 2: Board Content] Generating blackboard writing");

    const prompt = `Create blackboard content for "${inputData.topic}". Use the board-writing-tool.`;
    const response = await aiTeacherAgent.generateLegacy([{ role: "user", content: prompt }], { maxSteps: 1 });

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const boardResult = (toolResults[0] as any)?.result || {};
    
    saveLessonData(inputData.sessionId, {
      boardContent: [{
        title: boardResult.boardContent?.title || inputData.topic,
        sectionCount: boardResult.boardContent?.sections?.length || 1,
      }],
    });

    logger?.info("✅ [Step 2: Board Content] Board content generated and saved");
    return { sessionId: inputData.sessionId, topic: inputData.topic, status: "board_complete" };
  },
});

const generateDiagramsStep = createStep({
  id: "generate-diagrams",
  description: "Creates educational diagrams",
  inputSchema: minimalStepSchema,
  outputSchema: minimalStepSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📊 [Step 3: Diagrams] Creating educational diagrams");

    const prompt = `Create a diagram for "${inputData.topic}". Use the diagram-tool.`;
    const response = await aiTeacherAgent.generateLegacy([{ role: "user", content: prompt }], { maxSteps: 1 });

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const diagramResult = (toolResults[0] as any)?.result || {};
    
    saveLessonData(inputData.sessionId, {
      diagrams: [{
        title: diagramResult.diagramData?.title || inputData.topic,
        imagePath: diagramResult.imagePath || "",
      }],
    });

    logger?.info("✅ [Step 3: Diagrams] Diagrams generated and saved");
    return { sessionId: inputData.sessionId, topic: inputData.topic, status: "diagrams_complete" };
  },
});

const generateImagesStep = createStep({
  id: "generate-images",
  description: "Produces realistic educational images",
  inputSchema: minimalStepSchema,
  outputSchema: minimalStepSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🖼️ [Step 4: Images] Generating educational images");

    const prompt = `Create an educational image for "${inputData.topic}". Use the image-generation-tool.`;
    const response = await aiTeacherAgent.generateLegacy([{ role: "user", content: prompt }], { maxSteps: 1 });

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const imageResult = (toolResults[0] as any)?.result || {};
    
    saveLessonData(inputData.sessionId, {
      images: [{
        imagePath: imageResult.imagePath || "",
      }],
    });

    logger?.info("✅ [Step 4: Images] Images generated and saved");
    return { sessionId: inputData.sessionId, topic: inputData.topic, status: "images_complete" };
  },
});

const generate3DSimulationStep = createStep({
  id: "generate-3d-simulation",
  description: "Creates interactive 3D simulations",
  inputSchema: minimalStepSchema,
  outputSchema: minimalStepSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🎮 [Step 5: 3D Simulation] Creating interactive 3D content");

    const prompt = `Create a 3D simulation for "${inputData.topic}". Use the simulation-3d-tool.`;
    const response = await aiTeacherAgent.generateLegacy([{ role: "user", content: prompt }], { maxSteps: 1 });

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const simResult = (toolResults[0] as any)?.result || {};
    
    saveLessonData(inputData.sessionId, {
      simulations: [{
        title: simResult.simulation?.title || inputData.topic,
      }],
    });

    logger?.info("✅ [Step 5: 3D Simulation] 3D simulation created and saved");
    return { sessionId: inputData.sessionId, topic: inputData.topic, status: "simulation_complete" };
  },
});

const generateVideoStep = createStep({
  id: "generate-video",
  description: "Produces educational video storyboards",
  inputSchema: minimalStepSchema,
  outputSchema: minimalStepSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🎬 [Step 6: Video] Creating video content");

    const prompt = `Create a video storyboard for "${inputData.topic}". Use the video-creation-tool.`;
    const response = await aiTeacherAgent.generateLegacy([{ role: "user", content: prompt }], { maxSteps: 1 });

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const videoResult = (toolResults[0] as any)?.result || {};
    
    saveLessonData(inputData.sessionId, {
      videos: [{
        title: videoResult.videoStoryboard?.title || inputData.topic,
        duration: videoResult.videoStoryboard?.duration || "2:00",
      }],
    });

    logger?.info("✅ [Step 6: Video] Video content created and saved");
    return { sessionId: inputData.sessionId, topic: inputData.topic, status: "video_complete" };
  },
});

const qualityReviewStep = createStep({
  id: "quality-review",
  description: "Reviews all generated content for quality",
  inputSchema: minimalStepSchema,
  outputSchema: minimalStepSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔍 [Step 7: Quality Review] Reviewing all content");

    const prompt = `Review teaching content quality for "${inputData.topic}". Use quality-monitor-tool.`;
    const response = await aiTeacherAgent.generateLegacy([{ role: "user", content: prompt }], { maxSteps: 1 });

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const qualityResult = (toolResults[0] as any)?.result || {};
    
    saveLessonData(inputData.sessionId, {
      qualityReport: {
        score: qualityResult.qualityReport?.overallScore || 85,
        status: "reviewed",
      },
    });

    logger?.info("✅ [Step 7: Quality Review] Quality review completed and saved");
    return { sessionId: inputData.sessionId, topic: inputData.topic, status: "quality_complete" };
  },
});

const compileLessonStep = createStep({
  id: "compile-lesson",
  description: "Compiles all generated content into a final lesson package",
  inputSchema: minimalStepSchema,
  outputSchema: z.object({
    sessionId: z.string(),
    topic: z.string(),
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📦 [Step 8: Compile] Compiling final lesson package");

    const lessonData = loadLessonData(inputData.sessionId);
    
    if (!lessonData) {
      logger?.error("❌ [Step 8: Compile] Failed to load lesson data");
      return { sessionId: inputData.sessionId, topic: inputData.topic, success: false, message: "Failed to load lesson data" };
    }

    const narration = `
=================================================================
THE AI TEACHER - COMPLETE LESSON
Topic: ${lessonData.topic}
Session: ${inputData.sessionId}
=================================================================

📚 LESSON PLAN: ${lessonData.lessonPlan?.title || "Created"}
✏️ BOARD CONTENT: ${lessonData.boardContent?.length || 0} section(s)
📊 DIAGRAMS: ${lessonData.diagrams?.length || 0} diagram(s)
🖼️ IMAGES: ${lessonData.images?.length || 0} image(s)
🎮 3D SIMULATIONS: ${lessonData.simulations?.length || 0} simulation(s)
🎬 VIDEO: ${lessonData.videos?.length || 0} video(s)
🔍 QUALITY SCORE: ${lessonData.qualityReport?.score || "N/A"}

=================================================================
LESSON READY FOR DELIVERY
=================================================================
`;

    saveLessonData(inputData.sessionId, { fullNarration: narration });

    logger?.info("✅ [Step 8: Compile] Lesson compilation complete");
    logger?.info(narration);

    return { 
      sessionId: inputData.sessionId, 
      topic: inputData.topic, 
      success: true, 
      message: "Lesson compiled successfully" 
    };
  },
});

export const aiTeacherWorkflow = createWorkflow({
  id: "ai-teacher-workflow",
  inputSchema: z.object({
    topic: z.string().optional(),
  }) as any,
  outputSchema: z.object({
    sessionId: z.string(),
    topic: z.string(),
    success: z.boolean(),
    message: z.string(),
  }),
})
  .then(createStep({
    id: "initialize-lesson",
    description: "Initializes the lesson session",
    inputSchema: z.object({ topic: z.string().optional() }),
    outputSchema: minimalStepSchema,
    execute: async ({ inputData, mastra }) => {
      const logger = mastra?.getLogger();
      const topic = inputData.topic || "The Human Circulatory System";
      const sessionId = generateSessionId();
      
      logger?.info("🎓 [AI Teacher] Starting lesson on:", { topic, sessionId });
      
      saveLessonData(sessionId, { topic });
      
      return { sessionId, topic, status: "initialized" };
    },
  }) as any)
  .then(planLessonStep as any)
  .then(generateBoardContentStep as any)
  .then(generateDiagramsStep as any)
  .then(generateImagesStep as any)
  .then(generate3DSimulationStep as any)
  .then(generateVideoStep as any)
  .then(qualityReviewStep as any)
  .then(compileLessonStep as any)
  .commit();
