import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import OpenAI from "openai";
import { normalizeSimulation } from "./utils/schemaValidation";

const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const simulation3DTool = createTool({
  id: "simulation-3d-tool",
  description:
    "Creates 3D simulation content for interactive learning. Generates detailed 3D scene descriptions, interactive elements, and demonstration sequences. Produces both a conceptual 3D model structure and a preview image. Perfect for physics simulations, molecular structures, anatomical models, and mechanical systems.",
  inputSchema: z.object({
    subject: z.string().describe("What to simulate in 3D (e.g., 'solar system orbits', 'DNA double helix', 'engine pistons')"),
    simulationType: z.enum(["static_model", "animated", "interactive", "physics_simulation"]).describe("Type of 3D content"),
    interactiveElements: z.array(z.string()).optional().describe("Parts that users can interact with or manipulate"),
    demonstrationSequence: z.string().optional().describe("What the simulation should demonstrate step by step"),
  }),
  outputSchema: z.object({
    simulation: z.object({
      title: z.string(),
      description: z.string(),
      scene: z.object({
        objects: z.array(z.object({
          name: z.string(),
          type: z.string(),
          properties: z.object({
            position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
            rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
            scale: z.object({ x: z.number(), y: z.number(), z: z.number() }),
            color: z.string(),
            material: z.string(),
          }),
          interactive: z.boolean(),
          interactionType: z.string().optional(),
        })),
        lighting: z.object({
          ambient: z.string(),
          directional: z.array(z.object({ direction: z.string(), intensity: z.number() })),
        }),
        camera: z.object({
          position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
          lookAt: z.object({ x: z.number(), y: z.number(), z: z.number() }),
        }),
      }),
      animations: z.array(z.object({
        name: z.string(),
        targetObject: z.string(),
        property: z.string(),
        duration: z.number(),
        loop: z.boolean(),
      })),
      interactions: z.array(z.object({
        trigger: z.string(),
        action: z.string(),
        target: z.string(),
      })),
    }),
    previewImageBase64: z.string().optional(),
    teacherGuide: z.string(),
  }),
  execute: async ({ context: ctx, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🎮 [Simulation3DTool] Creating 3D simulation for:", { subject: ctx.subject });

    const structurePrompt = `Create a detailed 3D simulation specification for "${ctx.subject}" as a ${ctx.simulationType}.

${ctx.interactiveElements ? `Interactive elements: ${ctx.interactiveElements.join(", ")}` : ""}
${ctx.demonstrationSequence ? `Demonstration sequence: ${ctx.demonstrationSequence}` : ""}

Return a JSON object with complete 3D scene data:
{
  "simulation": {
    "title": "Simulation title",
    "description": "What this simulation demonstrates",
    "scene": {
      "objects": [
        {
          "name": "object1",
          "type": "sphere|cube|cylinder|mesh|custom",
          "properties": {
            "position": {"x": 0, "y": 0, "z": 0},
            "rotation": {"x": 0, "y": 0, "z": 0},
            "scale": {"x": 1, "y": 1, "z": 1},
            "color": "#ff0000",
            "material": "metallic|glass|matte|organic"
          },
          "interactive": true,
          "interactionType": "rotate|zoom|click|drag"
        }
      ],
      "lighting": {
        "ambient": "#ffffff",
        "directional": [{"direction": "top-right", "intensity": 0.8}]
      },
      "camera": {
        "position": {"x": 0, "y": 5, "z": 10},
        "lookAt": {"x": 0, "y": 0, "z": 0}
      }
    },
    "animations": [
      {
        "name": "rotation",
        "targetObject": "object1",
        "property": "rotation.y",
        "duration": 5,
        "loop": true
      }
    ],
    "interactions": [
      {
        "trigger": "click on object1",
        "action": "highlight and show info",
        "target": "object1"
      }
    ]
  },
  "teacherGuide": "Detailed script for teacher to explain while using the simulation..."
}`;

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: structurePrompt,
      temperature: 0.6,
    });

    let rawSimulation;
    let teacherGuide;
    try {
      const cleanedText = result.text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      rawSimulation = parsed.simulation || parsed;
      teacherGuide = parsed.teacherGuide || `Let's explore this 3D model of ${ctx.subject}...`;
    } catch (e) {
      logger?.warn("⚠️ [Simulation3DTool] Failed to parse structure, using structured fallback");
      rawSimulation = null;
      teacherGuide = `Let's explore this 3D model of ${ctx.subject}. You can rotate it to see different angles and click on parts to learn more.`;
    }
    
    const simulation = normalizeSimulation(rawSimulation, ctx.subject);
    logger?.info("✅ [Simulation3DTool] Simulation data normalized with", { objectCount: simulation.scene.objects.length });

    let previewImageBase64;
    try {
      const imagePrompt = `Create a 3D rendered preview image of ${ctx.subject}. 
      Professional 3D render style, good lighting, educational visualization.
      Show the complete ${ctx.simulationType === "animated" ? "dynamic" : "static"} 3D model.
      Clean background, studio lighting, suitable for educational presentation.`;

      const imageResponse = await openaiClient.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x1024",
      });

      previewImageBase64 = imageResponse.data?.[0]?.b64_json;
      logger?.info("✅ [Simulation3DTool] Preview image generated");
    } catch (imgError) {
      logger?.warn("⚠️ [Simulation3DTool] Preview image generation failed");
    }

    return {
      simulation,
      previewImageBase64,
      teacherGuide,
    };
  },
});
