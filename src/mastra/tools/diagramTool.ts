import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import OpenAI from "openai";
import { normalizeDiagramData } from "./utils/schemaValidation";
import * as fs from "fs";
import * as path from "path";

const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const diagramTool = createTool({
  id: "diagram-tool",
  description:
    "Creates educational diagrams that look like hand-drawn teacher illustrations on a whiteboard. Generates both the diagram structure with labeled parts and an actual image using AI image generation. Perfect for scientific diagrams, flowcharts, anatomical drawings, and concept maps.",
  inputSchema: z.object({
    subject: z.string().describe("What the diagram should illustrate (e.g., 'human heart blood flow', 'photosynthesis process')"),
    diagramType: z.enum(["anatomical", "flowchart", "process", "comparison", "cycle", "hierarchy", "concept_map"]).describe("Type of diagram to create"),
    labels: z.array(z.string()).optional().describe("Specific parts/labels to include in the diagram"),
    style: z.enum(["hand_drawn", "technical", "simplified"]).optional().describe("Visual style of the diagram"),
  }),
  outputSchema: z.object({
    diagramData: z.object({
      title: z.string(),
      description: z.string(),
      elements: z.array(z.object({
        id: z.string(),
        label: z.string(),
        description: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
        connections: z.array(z.string()),
      })),
      annotations: z.array(z.object({
        text: z.string(),
        targetElement: z.string(),
        pointerDirection: z.enum(["top", "bottom", "left", "right"]),
      })),
    }),
    imagePath: z.string().optional(),
    teacherNarration: z.string(),
  }),
  execute: async ({ context: ctx, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📊 [DiagramTool] Creating diagram for:", { subject: ctx.subject, type: ctx.diagramType });

    const structurePrompt = `Create a detailed educational diagram structure for "${ctx.subject}" as a ${ctx.diagramType} diagram.

${ctx.labels ? `Include these specific labels/parts: ${ctx.labels.join(", ")}` : ""}
Style: ${ctx.style || "hand_drawn"}

Return a JSON object with:
{
  "diagramData": {
    "title": "Diagram title",
    "description": "Brief description of what this diagram shows",
    "elements": [
      {
        "id": "element1",
        "label": "Part Name",
        "description": "What this part does",
        "position": {"x": 50, "y": 50},
        "connections": ["element2"]
      }
    ],
    "annotations": [
      {
        "text": "Annotation explaining something",
        "targetElement": "element1",
        "pointerDirection": "top|bottom|left|right"
      }
    ]
  },
  "teacherNarration": "Detailed explanation script for the teacher to narrate while showing this diagram..."
}`;

    const structureResult = await generateText({
      model: openai("gpt-4o"),
      prompt: structurePrompt,
      temperature: 0.6,
    });

    let rawDiagramData;
    let teacherNarration;
    try {
      const cleanedText = structureResult.text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      rawDiagramData = parsed.diagramData || parsed;
      teacherNarration = parsed.teacherNarration || `Let me explain this diagram of ${ctx.subject}...`;
    } catch (e) {
      logger?.warn("⚠️ [DiagramTool] Failed to parse structure, using structured fallback");
      rawDiagramData = null;
      teacherNarration = `Let me show you this diagram of ${ctx.subject}. Here we can see the key components and how they relate to each other.`;
    }
    
    const diagramData = normalizeDiagramData(rawDiagramData, ctx.subject);
    logger?.info("✅ [DiagramTool] Diagram data normalized with", { elementCount: diagramData.elements.length });

    let imagePath = "";
    try {
      const imagePrompt = `Create an educational ${ctx.style || "hand-drawn"} style diagram of ${ctx.subject}. 
      This should look like a teacher drew it on a whiteboard with markers.
      ${ctx.diagramType === "anatomical" ? "Include detailed anatomical labels and structures." : ""}
      ${ctx.diagramType === "flowchart" ? "Use arrows to show flow and process steps." : ""}
      ${ctx.diagramType === "process" ? "Show step-by-step progression with clear stages." : ""}
      Clear labels pointing to key parts. Educational, clean, and easy to understand.
      White or light background suitable for classroom projection.`;

      const imageResponse = await openaiClient.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x1024",
      });

      const imageBase64 = imageResponse.data?.[0]?.b64_json || "";
      if (imageBase64) {
        const timestamp = Date.now();
        const sanitizedSubject = ctx.subject.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
        const filename = `diagram_${sanitizedSubject}_${timestamp}.png`;
        const outputDir = path.join(process.cwd(), "public", "generated_images");
        
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, Buffer.from(imageBase64, "base64"));
        imagePath = `/generated_images/${filename}`;
        logger?.info("✅ [DiagramTool] Diagram image saved to:", { imagePath });
      }
      logger?.info("✅ [DiagramTool] Diagram image generated successfully");
    } catch (imgError) {
      logger?.error("❌ [DiagramTool] Image generation failed:", { error: imgError });
    }

    return {
      diagramData,
      imagePath: imagePath || undefined,
      teacherNarration,
    };
  },
});
