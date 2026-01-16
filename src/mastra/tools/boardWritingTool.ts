import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { normalizeBoardContent, normalizeRenderingInstructions } from "./utils/schemaValidation";

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const boardWritingTool = createTool({
  id: "board-writing-tool",
  description:
    "Simulates a teacher writing on a blackboard with natural handwriting. Creates text content that appears as if hand-written, with proper educational formatting, including formulas, definitions, and key points. Output includes structured content and rendering instructions for realistic display.",
  inputSchema: z.object({
    content: z.string().describe("The text content to write on the board"),
    style: z.enum(["neat", "casual", "emphasized"]).optional().describe("Writing style - neat for formal content, casual for notes, emphasized for important points"),
    includeFormulas: z.boolean().optional().describe("Whether to format mathematical or scientific formulas"),
    chalkColor: z.enum(["white", "yellow", "blue", "green", "pink"]).optional().describe("Chalk color for the writing"),
  }),
  outputSchema: z.object({
    boardContent: z.object({
      title: z.string(),
      sections: z.array(z.object({
        type: z.enum(["heading", "text", "formula", "bullet_points", "definition", "note"]),
        content: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        style: z.object({
          size: z.enum(["small", "medium", "large"]),
          emphasis: z.boolean(),
          underline: z.boolean(),
          color: z.string(),
        }),
      })),
    }),
    renderingInstructions: z.object({
      animationDelay: z.number(),
      strokeWidth: z.number(),
      backgroundColor: z.string(),
      writingSpeed: z.enum(["slow", "normal", "fast"]),
    }),
    narration: z.string(),
  }),
  execute: async ({ context: ctx, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("✏️ [BoardWritingTool] Creating board writing for content");

    const prompt = `You are a teacher preparing to write on a blackboard. Transform the following content into a structured blackboard layout that looks like natural teacher handwriting:

Content to write: ${ctx.content}

Style: ${ctx.style || "neat"}
Include formulas: ${ctx.includeFormulas || false}
Chalk color preference: ${ctx.chalkColor || "white"}

Create a structured layout with:
1. A clear title at the top
2. Organized sections (headings, text, formulas, bullet points, definitions, notes)
3. Proper positioning (x: 0-100, y: 0-100 representing % of board)
4. Appropriate styling for each element
5. A narration script explaining what is being written

Return a JSON object with this structure:
{
  "boardContent": {
    "title": "Main title",
    "sections": [
      {
        "type": "heading|text|formula|bullet_points|definition|note",
        "content": "the text content",
        "position": {"x": 10, "y": 5},
        "style": {"size": "small|medium|large", "emphasis": true/false, "underline": true/false, "color": "white"}
      }
    ]
  },
  "renderingInstructions": {
    "animationDelay": 50,
    "strokeWidth": 3,
    "backgroundColor": "#1a472a",
    "writingSpeed": "normal"
  },
  "narration": "As I write this on the board, let me explain..."
}`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.6,
    });

    logger?.info("✅ [BoardWritingTool] Board writing created successfully");

    let parsed;
    try {
      const cleanedText = result.text.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      logger?.warn("⚠️ [BoardWritingTool] JSON parse failed, using structured fallback");
      parsed = null;
    }
    
    const boardContent = normalizeBoardContent(parsed?.boardContent, ctx.content);
    const renderingInstructions = normalizeRenderingInstructions(parsed?.renderingInstructions);
    const narration = String(parsed?.narration || `Let me write this on the board: ${ctx.content}`);
    
    logger?.info("✅ [BoardWritingTool] Board content normalized with", { sectionCount: boardContent.sections.length });
    
    return { boardContent, renderingInstructions, narration };
  },
});
