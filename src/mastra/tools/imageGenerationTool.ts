import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export const imageGenerationTool = createTool({
  id: "image-generation-tool",
  description:
    "Generates educational images for teaching purposes. Creates realistic or illustrative images that can be used to explain concepts, show real-world examples, or create visual aids. Perfect for showing actual photographs, realistic illustrations, or detailed visual examples.",
  inputSchema: z.object({
    description: z.string().describe("Detailed description of the image to generate"),
    imageType: z.enum(["photograph", "illustration", "diagram", "infographic", "3d_render"]).describe("Type of image to generate"),
    educationalContext: z.string().describe("How this image will be used in teaching (e.g., 'to show the structure of a cell')"),
    annotationPoints: z.array(z.string()).optional().describe("Key points in the image that the teacher should point to and explain"),
  }),
  outputSchema: z.object({
    imageBase64: z.string(),
    annotatedPoints: z.array(z.object({
      label: z.string(),
      description: z.string(),
      approximateLocation: z.string(),
    })),
    teacherScript: z.string(),
  }),
  execute: async ({ context: ctx, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🖼️ [ImageGenerationTool] Generating educational image:", { description: ctx.description });

    const imagePrompt = `Create a ${ctx.imageType} for educational purposes: ${ctx.description}. 
    
This image is for: ${ctx.educationalContext}. 

Requirements:
- Clear, high-quality, and suitable for classroom display
- ${ctx.imageType === "photograph" ? "Photorealistic and detailed" : ""}
- ${ctx.imageType === "illustration" ? "Clean, professional illustration style" : ""}
- ${ctx.imageType === "3d_render" ? "3D rendered with good lighting and clear visibility" : ""}
- Educational and informative
- Good contrast and visibility for projection
${ctx.annotationPoints ? `Key features to show clearly: ${ctx.annotationPoints.join(", ")}` : ""}`;

    let imageBase64 = "";
    try {
      const response = await openaiClient.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x1024",
      });

      imageBase64 = response.data?.[0]?.b64_json || "";
      logger?.info("✅ [ImageGenerationTool] Image generated successfully");
    } catch (error) {
      logger?.error("❌ [ImageGenerationTool] Failed to generate image:", { error });
      throw new Error("Failed to generate educational image");
    }

    const annotatedPoints = (ctx.annotationPoints || []).map((point, index) => ({
      label: point,
      description: `Key feature: ${point}`,
      approximateLocation: ["top-left", "top-right", "center", "bottom-left", "bottom-right"][index % 5],
    }));

    const teacherScript = `Now, let me show you this image to help understand ${ctx.educationalContext}. 
${annotatedPoints.map((p) => `Look at the ${p.approximateLocation} area - this shows ${p.label}. ${p.description}`).join(" ")}
This visual representation helps us understand the concept more clearly.`;

    return {
      imageBase64,
      annotatedPoints,
      teacherScript,
    };
  },
});
