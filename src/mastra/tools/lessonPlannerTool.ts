import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const lessonPlannerTool = createTool({
  id: "lesson-planner-tool",
  description:
    "Plans the entire lesson flow for teaching a topic. Creates a structured teaching plan with steps like: introduction, basics explanation, writing on board, diagrams, images, 3D simulations, and conclusion. Use this first to organize how the lesson will be delivered.",
  inputSchema: z.object({
    topic: z.string().describe("The topic to teach (e.g., 'Photosynthesis', 'Newton's Laws', 'Human Heart')"),
    targetAudience: z.string().optional().describe("Target audience level (e.g., 'high school', 'middle school', 'college')"),
    duration: z.string().optional().describe("Approximate lesson duration (e.g., '30 minutes', '1 hour')"),
  }),
  outputSchema: z.object({
    lessonPlan: z.object({
      topic: z.string(),
      overview: z.string(),
      learningObjectives: z.array(z.string()),
      teachingSteps: z.array(z.object({
        stepNumber: z.number(),
        type: z.enum(["introduction", "explanation", "board_writing", "diagram", "image", "simulation_3d", "video", "interactive", "conclusion"]),
        title: z.string(),
        description: z.string(),
        duration: z.string(),
        content: z.string(),
      })),
      keyPoints: z.array(z.string()),
      summary: z.string(),
    }),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📚 [LessonPlannerTool] Creating lesson plan for:", { topic: context.topic });

    const prompt = `Create a brief lesson outline for "${context.topic}" (${context.targetAudience || "high school"}). Return JSON:
{"topic":"${context.topic}","overview":"1-2 sentences","learningObjectives":["obj1","obj2","obj3"],"teachingSteps":[{"stepNumber":1,"type":"introduction","title":"","description":"","duration":"5min","content":""}],"keyPoints":["p1","p2"],"summary":"1 sentence"}`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.5,
      maxTokens: 500,
    });

    logger?.info("✅ [LessonPlannerTool] Lesson plan created successfully");

    let lessonPlan;
    try {
      const cleanedText = result.text.replace(/```json\n?|\n?```/g, "").trim();
      lessonPlan = JSON.parse(cleanedText);
      
      if (!lessonPlan.topic) lessonPlan.topic = context.topic;
      if (!lessonPlan.overview) lessonPlan.overview = `Lesson about ${context.topic}`;
      if (!Array.isArray(lessonPlan.learningObjectives)) lessonPlan.learningObjectives = ["Understand " + context.topic];
      if (!Array.isArray(lessonPlan.teachingSteps)) {
        lessonPlan.teachingSteps = [{
          stepNumber: 1,
          type: "explanation",
          title: "Main Explanation",
          description: "Full topic explanation",
          duration: context.duration || "45 minutes",
          content: result.text,
        }];
      }
      if (!Array.isArray(lessonPlan.keyPoints)) lessonPlan.keyPoints = ["Key concepts of " + context.topic];
      if (!lessonPlan.summary) lessonPlan.summary = `Lesson about ${context.topic}`;
      
    } catch (e) {
      logger?.warn("⚠️ [LessonPlannerTool] JSON parse failed, creating structured fallback");
      lessonPlan = {
        topic: context.topic,
        overview: result.text.substring(0, 500),
        learningObjectives: ["Understand " + context.topic, "Apply concepts of " + context.topic],
        teachingSteps: [
          { stepNumber: 1, type: "introduction", title: "Introduction", description: "Hook and overview", duration: "5 minutes", content: `Welcome to the lesson on ${context.topic}` },
          { stepNumber: 2, type: "explanation", title: "Core Concepts", description: "Main explanation", duration: "15 minutes", content: result.text.substring(0, 1000) },
          { stepNumber: 3, type: "board_writing", title: "Key Points", description: "Writing key formulas/definitions", duration: "10 minutes", content: `Key concepts of ${context.topic}` },
          { stepNumber: 4, type: "diagram", title: "Visual Diagram", description: "Diagram illustration", duration: "5 minutes", content: `Diagram of ${context.topic}` },
          { stepNumber: 5, type: "image", title: "Real Examples", description: "Visual examples", duration: "5 minutes", content: `Images showing ${context.topic}` },
          { stepNumber: 6, type: "simulation_3d", title: "3D Model", description: "Interactive simulation", duration: "5 minutes", content: `3D simulation of ${context.topic}` },
          { stepNumber: 7, type: "conclusion", title: "Summary", description: "Key takeaways", duration: "5 minutes", content: `Summary of ${context.topic}` },
        ],
        keyPoints: ["Key concept 1", "Key concept 2", "Key concept 3"],
        summary: `Comprehensive lesson on ${context.topic}`,
      };
    }
    
    return { lessonPlan };
  },
});
