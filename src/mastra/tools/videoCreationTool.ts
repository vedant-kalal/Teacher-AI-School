import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import OpenAI from "openai";
import { normalizeVideoStoryboard } from "./utils/schemaValidation";

const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const videoCreationTool = createTool({
  id: "video-creation-tool",
  description:
    "Creates educational video content with detailed storyboards, narration scripts, and visual sequences. Generates a complete video plan with scene-by-scene breakdowns and produces thumbnail/keyframe images. Perfect for animated explanations, demonstrations, and educational presentations.",
  inputSchema: z.object({
    topic: z.string().describe("Topic the video should explain"),
    duration: z.string().optional().describe("Approximate video duration (e.g., '2 minutes', '30 seconds')"),
    style: z.enum(["animated_explainer", "demonstration", "documentary", "whiteboard_animation"]).describe("Video style"),
    keyPoints: z.array(z.string()).optional().describe("Key points to cover in the video"),
  }),
  outputSchema: z.object({
    videoStoryboard: z.object({
      title: z.string(),
      duration: z.string(),
      style: z.string(),
      scenes: z.array(z.object({
        sceneNumber: z.number(),
        duration: z.string(),
        visualDescription: z.string(),
        narration: z.string(),
        animation: z.string(),
        keyElements: z.array(z.string()),
      })),
      soundtrack: z.object({
        style: z.string(),
        mood: z.string(),
      }),
    }),
    thumbnailBase64: z.string().optional(),
    fullNarrationScript: z.string(),
  }),
  execute: async ({ context: ctx, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🎬 [VideoCreationTool] Creating video content for:", { topic: ctx.topic });

    const storyboardPrompt = `Create a detailed educational video storyboard for "${ctx.topic}".

Duration: ${ctx.duration || "2 minutes"}
Style: ${ctx.style}
${ctx.keyPoints ? `Key points to cover: ${ctx.keyPoints.join(", ")}` : ""}

Return a JSON object with complete video planning:
{
  "videoStoryboard": {
    "title": "Video title",
    "duration": "2:00",
    "style": "${ctx.style}",
    "scenes": [
      {
        "sceneNumber": 1,
        "duration": "15 seconds",
        "visualDescription": "What appears on screen",
        "narration": "Voice-over text for this scene",
        "animation": "Description of any animations or transitions",
        "keyElements": ["element1", "element2"]
      }
    ],
    "soundtrack": {
      "style": "background music style",
      "mood": "upbeat|calm|dramatic|inspiring"
    }
  },
  "fullNarrationScript": "Complete narration script combining all scenes..."
}`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: storyboardPrompt,
      temperature: 0.7,
    });

    let rawStoryboard;
    let fullNarrationScript;
    try {
      const cleanedText = result.text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      rawStoryboard = parsed.videoStoryboard || parsed;
      fullNarrationScript = String(parsed.fullNarrationScript || result.text.substring(0, 1000));
    } catch (e) {
      logger?.warn("⚠️ [VideoCreationTool] Failed to parse storyboard, using structured fallback");
      rawStoryboard = null;
      fullNarrationScript = `Welcome to this educational video about ${ctx.topic}. Today we will explore the key concepts and see how they apply in real life.`;
    }
    
    const videoStoryboard = normalizeVideoStoryboard(rawStoryboard, ctx.topic, ctx.style);
    logger?.info("✅ [VideoCreationTool] Video storyboard normalized with", { sceneCount: videoStoryboard.scenes.length });

    let thumbnailBase64;
    try {
      const thumbnailPrompt = `Create a video thumbnail image for an educational video about "${ctx.topic}".
      Style: ${ctx.style}
      Professional, eye-catching, educational, with clear visual representation of the topic.
      Include visual elements that suggest this is about ${ctx.topic}.
      Clean, modern design suitable for video platforms.`;

      const imageResponse = await openaiClient.images.generate({
        model: "gpt-image-1",
        prompt: thumbnailPrompt,
        size: "1024x1024",
      });

      thumbnailBase64 = imageResponse.data?.[0]?.b64_json;
      logger?.info("✅ [VideoCreationTool] Thumbnail generated");
    } catch (imgError) {
      logger?.warn("⚠️ [VideoCreationTool] Thumbnail generation failed");
    }

    return {
      videoStoryboard,
      thumbnailBase64,
      fullNarrationScript,
    };
  },
});
