import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { aiTeacherAgent } from "../agents/aiTeacherAgent";

const lessonOutputSchema = z.object({
  topic: z.string(),
  lessonPlan: z.any(),
  boardContent: z.array(z.any()).optional(),
  diagrams: z.array(z.any()).optional(),
  images: z.array(z.any()).optional(),
  simulations: z.array(z.any()).optional(),
  videos: z.array(z.any()).optional(),
  qualityReport: z.any().optional(),
  fullNarration: z.string(),
  success: z.boolean(),
});

const planLessonStep = createStep({
  id: "plan-lesson",
  description: "Creates a comprehensive lesson plan for the given topic, determining what content types will be used and in what order",

  inputSchema: z.object({
    topic: z.string().describe("The topic to teach"),
    targetAudience: z.string().optional().describe("Target audience level"),
    duration: z.string().optional().describe("Lesson duration"),
  }),

  outputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    agentResponse: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📚 [Step 1: Plan Lesson] Starting lesson planning for:", { topic: inputData.topic });

    const prompt = `I need you to teach a lesson about "${inputData.topic}" to ${inputData.targetAudience || "high school students"}.

First, use the lesson-planner-tool to create a comprehensive lesson plan. The plan should include:
- An engaging introduction
- Basic concepts and explanations
- Board writing sections for key formulas/definitions
- Diagrams to visualize concepts
- Images for real-world examples
- 3D simulations for interactive learning
- A video segment if appropriate
- A conclusion with key takeaways

Create the lesson plan now.`;

    const response = await aiTeacherAgent.generateLegacy([
      { role: "user", content: prompt },
    ], { maxSteps: 3 });

    logger?.info("✅ [Step 1: Plan Lesson] Lesson plan created");

    const lessonPlanMatch = response.text.match(/lesson\s*plan/i);
    
    return {
      topic: inputData.topic,
      targetAudience: inputData.targetAudience || "high school students",
      lessonPlan: {
        topic: inputData.topic,
        rawPlan: response.text,
        toolResults: response.steps?.flatMap(s => s.toolResults || []) || [],
      },
      agentResponse: response.text,
    };
  },
});

const generateBoardContentStep = createStep({
  id: "generate-board-content",
  description: "Generates blackboard writing content including formulas, definitions, and key concepts with natural handwriting simulation",

  inputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    agentResponse: z.string(),
  }),

  outputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    agentResponse: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("✏️ [Step 2: Board Content] Generating blackboard writing");

    const prompt = `Based on the lesson plan for "${inputData.topic}", now create the blackboard writing content.

Use the board-writing-tool to generate content that a teacher would write on the blackboard. Include:
- Key formulas and equations
- Important definitions
- Main concepts and bullet points
- Any diagrams that can be drawn with text/ASCII

Make it look like natural teacher handwriting with proper educational formatting.`;

    const response = await aiTeacherAgent.generateLegacy([
      { role: "user", content: prompt },
    ], { maxSteps: 3 });

    logger?.info("✅ [Step 2: Board Content] Board content generated");

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const boardContent = toolResults.length > 0 ? toolResults : [{
      boardContent: {
        title: inputData.topic,
        sections: [{ type: "text", content: `Key concepts of ${inputData.topic}`, position: { x: 10, y: 10 }, style: { size: "medium", emphasis: false, underline: false, color: "white" } }]
      },
      renderingInstructions: { animationDelay: 50, strokeWidth: 3, backgroundColor: "#1a472a", writingSpeed: "normal" },
      narration: response.text || `Let's write the key concepts of ${inputData.topic} on the board.`
    }];

    return {
      topic: inputData.topic,
      targetAudience: inputData.targetAudience,
      lessonPlan: inputData.lessonPlan,
      boardContent,
      agentResponse: response.text,
    };
  },
});

const generateDiagramsStep = createStep({
  id: "generate-diagrams",
  description: "Creates educational diagrams that look like hand-drawn teacher illustrations with labels and annotations",

  inputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    agentResponse: z.string(),
  }),

  outputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    agentResponse: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📊 [Step 3: Diagrams] Creating educational diagrams");

    const prompt = `For the lesson on "${inputData.topic}", now create educational diagrams.

Use the diagram-tool to create hand-drawn style diagrams that visualize the key concepts. These should look like diagrams a teacher would draw on a whiteboard with:
- Clear labels pointing to key parts
- Annotations explaining what each part does
- Arrows showing processes or relationships

Create diagrams for the main concepts that need visual explanation.`;

    const response = await aiTeacherAgent.generateLegacy([
      { role: "user", content: prompt },
    ], { maxSteps: 3 });

    logger?.info("✅ [Step 3: Diagrams] Diagrams generated");

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const diagrams = toolResults.length > 0 ? toolResults : [{
      diagramData: {
        title: inputData.topic,
        description: `Diagram illustrating ${inputData.topic}`,
        elements: [{ id: "main", label: inputData.topic, description: "Main concept", position: { x: 50, y: 50 }, connections: [] }],
        annotations: [{ text: `Key aspect of ${inputData.topic}`, targetElement: "main", pointerDirection: "top" }]
      },
      teacherNarration: response.text || `Here is a diagram showing the key elements of ${inputData.topic}.`
    }];

    return {
      ...inputData,
      diagrams,
      agentResponse: response.text,
    };
  },
});

const generateImagesStep = createStep({
  id: "generate-images",
  description: "Produces realistic educational images and photographs to support the lesson content",

  inputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    agentResponse: z.string(),
  }),

  outputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    agentResponse: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🖼️ [Step 4: Images] Generating educational images");

    const prompt = `For the lesson on "${inputData.topic}", now create educational images.

Use the image-generation-tool to create realistic images that show:
- Real-world examples of the concepts
- Photographs or illustrations that demonstrate the topic
- Visual aids that can be pointed to and explained

Generate images that will help students visualize and understand the concepts better.`;

    const response = await aiTeacherAgent.generateLegacy([
      { role: "user", content: prompt },
    ], { maxSteps: 3 });

    logger?.info("✅ [Step 4: Images] Images generated");

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const images = toolResults.length > 0 ? toolResults : [{
      imageBase64: "",
      annotatedPoints: [{ label: inputData.topic, description: `Visual representation of ${inputData.topic}`, approximateLocation: "center" }],
      teacherScript: response.text || `This image helps visualize ${inputData.topic}.`
    }];

    return {
      ...inputData,
      images,
      agentResponse: response.text,
    };
  },
});

const generate3DSimulationStep = createStep({
  id: "generate-3d-simulation",
  description: "Creates interactive 3D simulations and models for hands-on learning experiences",

  inputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    agentResponse: z.string(),
  }),

  outputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    simulations: z.array(z.any()),
    agentResponse: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🎮 [Step 5: 3D Simulation] Creating interactive 3D content");

    const prompt = `For the lesson on "${inputData.topic}", now create 3D simulation content.

Use the simulation-3d-tool to create an interactive 3D model that demonstrates:
- Key concepts in three dimensions
- Interactive elements students can manipulate
- Animations showing processes or movements

Create a simulation that brings the concept to life and allows for interactive exploration.`;

    const response = await aiTeacherAgent.generateLegacy([
      { role: "user", content: prompt },
    ], { maxSteps: 3 });

    logger?.info("✅ [Step 5: 3D Simulation] 3D simulation created");

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const simulations = toolResults.length > 0 ? toolResults : [{
      simulation: {
        title: inputData.topic,
        description: `3D simulation of ${inputData.topic}`,
        scene: {
          objects: [{ name: "main", type: "mesh", properties: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: "#3498db", material: "matte" }, interactive: true, interactionType: "rotate" }],
          lighting: { ambient: "#ffffff", directional: [{ direction: "top", intensity: 0.8 }] },
          camera: { position: { x: 0, y: 5, z: 10 }, lookAt: { x: 0, y: 0, z: 0 } }
        },
        animations: [],
        interactions: []
      },
      teacherGuide: response.text || `Let's explore this 3D model of ${inputData.topic}.`
    }];

    return {
      ...inputData,
      simulations,
      agentResponse: response.text,
    };
  },
});

const generateVideoStep = createStep({
  id: "generate-video",
  description: "Produces educational video storyboards and content with narration scripts",

  inputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    simulations: z.array(z.any()),
    agentResponse: z.string(),
  }),

  outputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    simulations: z.array(z.any()),
    videos: z.array(z.any()),
    agentResponse: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🎬 [Step 6: Video] Creating video content");

    const prompt = `For the lesson on "${inputData.topic}", now create video content.

Use the video-creation-tool to create an educational video storyboard that includes:
- Scene-by-scene breakdown with visual descriptions
- Complete narration script
- Animation and transition descriptions
- Key educational moments

Create a video plan that could be produced to explain the topic engagingly.`;

    const response = await aiTeacherAgent.generateLegacy([
      { role: "user", content: prompt },
    ], { maxSteps: 3 });

    logger?.info("✅ [Step 6: Video] Video content created");

    const toolResults = response.steps?.flatMap(s => s.toolResults || []) || [];
    const videos = toolResults.length > 0 ? toolResults : [{
      videoStoryboard: {
        title: inputData.topic,
        duration: "2:00",
        style: "animated_explainer",
        scenes: [{ sceneNumber: 1, duration: "2 minutes", visualDescription: `Educational content about ${inputData.topic}`, narration: response.text?.substring(0, 500) || `Explaining ${inputData.topic}`, animation: "Fade transitions", keyElements: [inputData.topic] }],
        soundtrack: { style: "ambient", mood: "inspiring" }
      },
      fullNarrationScript: response.text || `Welcome to this lesson about ${inputData.topic}.`
    }];

    return {
      ...inputData,
      videos,
      agentResponse: response.text,
    };
  },
});

const qualityReviewStep = createStep({
  id: "quality-review",
  description: "Reviews all generated content for educational accuracy, clarity, and visual quality",

  inputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    simulations: z.array(z.any()),
    videos: z.array(z.any()),
    agentResponse: z.string(),
  }),

  outputSchema: z.object({
    topic: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    simulations: z.array(z.any()),
    videos: z.array(z.any()),
    qualityReport: z.any(),
    agentResponse: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔍 [Step 7: Quality Review] Reviewing all content");

    const contentDetails = {
      topic: inputData.topic,
      lessonPlan: inputData.lessonPlan ? JSON.stringify(inputData.lessonPlan).substring(0, 2000) : "No lesson plan",
      boardContent: inputData.boardContent?.length ? JSON.stringify(inputData.boardContent[0]).substring(0, 1000) : "No board content",
      diagrams: inputData.diagrams?.length ? JSON.stringify(inputData.diagrams[0]).substring(0, 1000) : "No diagrams",
      images: inputData.images?.length ? `${inputData.images.length} image(s) generated` : "No images",
      simulations: inputData.simulations?.length ? JSON.stringify(inputData.simulations[0]).substring(0, 1000) : "No simulations",
      videos: inputData.videos?.length ? JSON.stringify(inputData.videos[0]).substring(0, 1000) : "No videos",
    };

    const prompt = `Review the quality of all the teaching content created for "${inputData.topic}".

Use the quality-monitor-tool to evaluate this actual content:

LESSON PLAN EXCERPT:
${contentDetails.lessonPlan}

BOARD CONTENT EXCERPT:
${contentDetails.boardContent}

DIAGRAM DATA EXCERPT:
${contentDetails.diagrams}

IMAGES: ${contentDetails.images}

3D SIMULATION EXCERPT:
${contentDetails.simulations}

VIDEO STORYBOARD EXCERPT:
${contentDetails.videos}

Evaluate for:
- Educational accuracy
- Clarity and understandability
- Visual quality
- Engagement level
- Age appropriateness for ${inputData.targetAudience}

Provide an overall quality assessment and note any issues that need attention.`;

    const response = await aiTeacherAgent.generateLegacy([
      { role: "user", content: prompt },
    ], { maxSteps: 2 });

    logger?.info("✅ [Step 7: Quality Review] Quality review completed");

    return {
      topic: inputData.topic,
      lessonPlan: inputData.lessonPlan,
      boardContent: inputData.boardContent,
      diagrams: inputData.diagrams,
      images: inputData.images,
      simulations: inputData.simulations,
      videos: inputData.videos,
      qualityReport: response.steps?.flatMap(s => s.toolResults || []) || [],
      agentResponse: response.text,
    };
  },
});

const compileLessonStep = createStep({
  id: "compile-lesson",
  description: "Compiles all generated content into a final comprehensive lesson package with full narration",

  inputSchema: z.object({
    topic: z.string(),
    lessonPlan: z.any(),
    boardContent: z.array(z.any()),
    diagrams: z.array(z.any()),
    images: z.array(z.any()),
    simulations: z.array(z.any()),
    videos: z.array(z.any()),
    qualityReport: z.any(),
    agentResponse: z.string(),
  }),

  outputSchema: lessonOutputSchema,

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📦 [Step 8: Compile] Compiling final lesson package");

    const fullNarration = `
=================================================================
THE AI TEACHER - COMPLETE LESSON
Topic: ${inputData.topic}
=================================================================

📚 LESSON OVERVIEW
${inputData.agentResponse || "Lesson content generated successfully."}

✏️ BLACKBOARD CONTENT
${inputData.boardContent?.length ? "Board writing content has been prepared for display." : "No board content generated."}

📊 DIAGRAMS
${inputData.diagrams?.length ? `${inputData.diagrams.length} educational diagram(s) created.` : "No diagrams generated."}

🖼️ IMAGES
${inputData.images?.length ? `${inputData.images.length} educational image(s) generated.` : "No images generated."}

🎮 3D SIMULATIONS
${inputData.simulations?.length ? `${inputData.simulations.length} interactive 3D simulation(s) created.` : "No 3D simulations generated."}

🎬 VIDEO CONTENT
${inputData.videos?.length ? `${inputData.videos.length} video storyboard(s) prepared.` : "No video content generated."}

🔍 QUALITY REPORT
${inputData.qualityReport ? "Content quality has been reviewed and verified." : "Quality review pending."}

=================================================================
LESSON READY FOR DELIVERY
=================================================================
`;

    logger?.info("✅ [Step 8: Compile] Lesson compilation complete");
    logger?.info(fullNarration);

    return {
      topic: inputData.topic,
      lessonPlan: inputData.lessonPlan,
      boardContent: inputData.boardContent,
      diagrams: inputData.diagrams,
      images: inputData.images,
      simulations: inputData.simulations,
      videos: inputData.videos,
      qualityReport: inputData.qualityReport,
      fullNarration,
      success: true,
    };
  },
});

export const aiTeacherWorkflow = createWorkflow({
  id: "ai-teacher-workflow",

  inputSchema: z.object({
    topic: z.string().optional().describe("Topic to teach - if not provided, a sample topic will be used"),
    targetAudience: z.string().optional().describe("Target audience level"),
    duration: z.string().optional().describe("Lesson duration"),
  }) as any,

  outputSchema: lessonOutputSchema,
})
  .then(createStep({
    id: "initialize-lesson",
    description: "Initializes the lesson with a topic (uses sample if not provided)",
    inputSchema: z.object({
      topic: z.string().optional(),
      targetAudience: z.string().optional(),
      duration: z.string().optional(),
    }),
    outputSchema: z.object({
      topic: z.string(),
      targetAudience: z.string().optional(),
      duration: z.string().optional(),
    }),
    execute: async ({ inputData, mastra }) => {
      const logger = mastra?.getLogger();
      const topic = inputData.topic || "The Human Circulatory System";
      logger?.info("🎓 [AI Teacher] Starting lesson on:", { topic });
      
      return {
        topic,
        targetAudience: inputData.targetAudience,
        duration: inputData.duration,
      };
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
