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

    const prompt = `You are an expert educational curriculum designer. Create a detailed, structured lesson plan for teaching "${context.topic}" to ${context.targetAudience || "high school students"} in approximately ${context.duration || "45 minutes"}.

The lesson plan should include various teaching modalities to engage students:
1. Introduction - Hook the students, explain why this topic matters
2. Basic concepts - Explain fundamental ideas
3. Board writing - Key formulas, definitions, or notes written on a blackboard
4. Diagrams - Educational diagrams to visualize concepts
5. Images - Real-world images or illustrations
6. 3D Simulations - Interactive 3D models to demonstrate concepts
7. Video - Optional video explanations or demonstrations
8. Conclusion - Summary and key takeaways

Return a JSON object with this exact structure:
{
  "topic": "string",
  "overview": "string",
  "learningObjectives": ["objective1", "objective2", ...],
  "teachingSteps": [
    {
      "stepNumber": 1,
      "type": "introduction|explanation|board_writing|diagram|image|simulation_3d|video|interactive|conclusion",
      "title": "string",
      "description": "string",
      "duration": "string",
      "content": "detailed content for this step"
    }
  ],
  "keyPoints": ["point1", "point2", ...],
  "summary": "string"
}`;

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
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
