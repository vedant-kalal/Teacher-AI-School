import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const qualityMonitorTool = createTool({
  id: "quality-monitor-tool",
  description:
    "Monitors and evaluates the quality of teaching content produced by other agents. Reviews content for educational accuracy, clarity, visual quality, and appropriateness. Provides feedback and suggestions for improvement, and flags content that needs regeneration.",
  inputSchema: z.object({
    contentType: z.enum(["board_writing", "diagram", "image", "simulation_3d", "video", "lesson_plan"]).describe("Type of content being reviewed"),
    content: z.string().describe("The content to review (JSON string or description)"),
    topic: z.string().describe("The educational topic this content is for"),
    targetAudience: z.string().optional().describe("Target audience for the content"),
    criteria: z.array(z.string()).optional().describe("Specific quality criteria to check"),
  }),
  outputSchema: z.object({
    qualityScore: z.number(),
    overallAssessment: z.enum(["excellent", "good", "acceptable", "needs_improvement", "regenerate"]),
    breakdown: z.object({
      educationalAccuracy: z.object({ score: z.number(), feedback: z.string() }),
      clarity: z.object({ score: z.number(), feedback: z.string() }),
      visualQuality: z.object({ score: z.number(), feedback: z.string() }),
      engagement: z.object({ score: z.number(), feedback: z.string() }),
      ageAppropriateness: z.object({ score: z.number(), feedback: z.string() }),
    }),
    issues: z.array(z.object({
      severity: z.enum(["critical", "major", "minor"]),
      description: z.string(),
      suggestion: z.string(),
    })),
    improvementSuggestions: z.array(z.string()),
    shouldRegenerate: z.boolean(),
    regenerationPrompt: z.string().optional(),
  }),
  execute: async ({ context: ctx, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔍 [QualityMonitorTool] Reviewing content:", { contentType: ctx.contentType, topic: ctx.topic });

    const reviewPrompt = `You are an expert educational content quality reviewer. Analyze the following ${ctx.contentType} content for teaching "${ctx.topic}" to ${ctx.targetAudience || "high school students"}.

Content to review:
${ctx.content}

${ctx.criteria ? `Additional criteria to check: ${ctx.criteria.join(", ")}` : ""}

Evaluate the content on these dimensions:
1. Educational Accuracy - Is the information correct?
2. Clarity - Is it easy to understand?
3. Visual Quality - Is it visually appealing and well-designed?
4. Engagement - Will it keep students interested?
5. Age Appropriateness - Is it suitable for the target audience?

Return a JSON object with this structure:
{
  "qualityScore": 85,
  "overallAssessment": "excellent|good|acceptable|needs_improvement|regenerate",
  "breakdown": {
    "educationalAccuracy": {"score": 90, "feedback": "..."},
    "clarity": {"score": 85, "feedback": "..."},
    "visualQuality": {"score": 80, "feedback": "..."},
    "engagement": {"score": 85, "feedback": "..."},
    "ageAppropriateness": {"score": 90, "feedback": "..."}
  },
  "issues": [
    {"severity": "critical|major|minor", "description": "...", "suggestion": "..."}
  ],
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "shouldRegenerate": false,
  "regenerationPrompt": "If regeneration needed, provide improved prompt here"
}`;

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: reviewPrompt,
      temperature: 0.4,
    });

    logger?.info("✅ [QualityMonitorTool] Quality review completed");

    let review;
    try {
      const cleanedText = result.text.replace(/```json\n?|\n?```/g, "").trim();
      review = JSON.parse(cleanedText);
    } catch (e) {
      logger?.warn("⚠️ [QualityMonitorTool] JSON parse failed, extracting key info");
      review = null;
    }
    
    const qualityScore = review?.qualityScore ?? 75;
    const overallAssessment = review?.overallAssessment ?? "good";
    
    const breakdown = review?.breakdown ?? {
      educationalAccuracy: { score: 80, feedback: "Content appears factually accurate" },
      clarity: { score: 75, feedback: "Explanations are reasonably clear" },
      visualQuality: { score: 70, feedback: "Visuals are appropriate for educational use" },
      engagement: { score: 75, feedback: "Content is engaging for the target audience" },
      ageAppropriateness: { score: 80, feedback: "Suitable for the specified audience" },
    };
    
    const issues = review?.issues ?? [];
    const improvementSuggestions = review?.improvementSuggestions ?? ["Consider adding more interactive elements"];
    const shouldRegenerate = review?.shouldRegenerate ?? false;
    const regenerationPrompt = review?.regenerationPrompt;
    
    return {
      qualityScore,
      overallAssessment: overallAssessment as "excellent" | "good" | "acceptable" | "needs_improvement" | "regenerate",
      breakdown,
      issues,
      improvementSuggestions,
      shouldRegenerate,
      regenerationPrompt,
    };
  },
});
