import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const promptGeneratorTool = createTool({
  id: "prompt-generator-tool",
  description:
    "Generates specialized prompts for each teaching agent based on the lesson plan. Creates optimized prompts for writing, diagrams, images, 3D simulations, and videos to ensure high-quality output from each specialized agent.",
  inputSchema: z.object({
    stepType: z.enum(["board_writing", "diagram", "image", "simulation_3d", "video"]).describe("The type of content to generate a prompt for"),
    topic: z.string().describe("The main topic being taught"),
    stepContent: z.string().describe("The content/description for this specific step from the lesson plan"),
    context: z.string().optional().describe("Additional context about what has been taught so far"),
  }),
  outputSchema: z.object({
    prompt: z.string(),
    style: z.string(),
    additionalInstructions: z.array(z.string()),
    expectedOutput: z.string(),
  }),
  execute: async ({ context: ctx, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🎯 [PromptGeneratorTool] Generating prompt for:", { stepType: ctx.stepType, topic: ctx.topic });

    const promptTemplates: Record<string, string> = {
      board_writing: `Generate a detailed prompt for a handwriting simulation tool that writes on a blackboard like a real teacher. The content should be about "${ctx.topic}" and specifically cover: ${ctx.stepContent}. The writing should appear natural, with slight variations, and include proper formatting for educational content.`,
      diagram: `Generate a detailed prompt for creating an educational hand-drawn style diagram about "${ctx.topic}" covering: ${ctx.stepContent}. The diagram should look like it was drawn by a teacher on a whiteboard, with clear labels and arrows pointing to key parts.`,
      image: `Generate a detailed prompt for creating a realistic educational image about "${ctx.topic}" that illustrates: ${ctx.stepContent}. The image should be suitable for classroom use with clear visual elements that can be pointed to and explained.`,
      simulation_3d: `Generate a detailed prompt for creating an interactive 3D simulation/model about "${ctx.topic}" demonstrating: ${ctx.stepContent}. Include instructions for what parts should be interactive and what the simulation should demonstrate.`,
      video: `Generate a detailed prompt for creating an educational video about "${ctx.topic}" explaining: ${ctx.stepContent}. Include what visuals, animations, and narration should be included.`,
    };

    const systemPrompt = `You are an expert prompt engineer specializing in educational content creation. Your task is to create highly detailed, specific prompts that will generate exceptional educational materials.

For the request, generate:
1. A detailed, specific prompt optimized for the content type
2. A recommended style/approach
3. Additional instructions for quality output
4. Description of expected output

Return a JSON object with this structure:
{
  "prompt": "detailed prompt text",
  "style": "recommended style description",
  "additionalInstructions": ["instruction1", "instruction2"],
  "expectedOutput": "description of what the output should look like"
}`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: promptTemplates[ctx.stepType],
      temperature: 0.7,
    });

    logger?.info("✅ [PromptGeneratorTool] Prompt generated successfully");

    let parsed;
    try {
      const cleanedText = result.text.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      logger?.warn("⚠️ [PromptGeneratorTool] JSON parse failed, using fallback");
      parsed = null;
    }
    
    return {
      prompt: parsed?.prompt || result.text,
      style: parsed?.style || "educational, clear, engaging",
      additionalInstructions: parsed?.additionalInstructions || ["Focus on clarity", "Make it visually appealing", "Ensure accuracy"],
      expectedOutput: parsed?.expectedOutput || `High-quality ${ctx.stepType} content about ${ctx.topic}`,
    };
  },
});
