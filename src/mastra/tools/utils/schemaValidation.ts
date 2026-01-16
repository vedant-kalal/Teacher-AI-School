export function normalizeDiagramElement(elem: any): {
  id: string;
  label: string;
  description: string;
  position: { x: number; y: number };
  connections: string[];
} {
  return {
    id: String(elem?.id || `element-${Math.random().toString(36).slice(2, 8)}`),
    label: String(elem?.label || "Element"),
    description: String(elem?.description || ""),
    position: {
      x: typeof elem?.position?.x === "number" ? elem.position.x : 50,
      y: typeof elem?.position?.y === "number" ? elem.position.y : 50,
    },
    connections: Array.isArray(elem?.connections) ? elem.connections.map(String) : [],
  };
}

export function normalizeDiagramAnnotation(ann: any): {
  text: string;
  targetElement: string;
  pointerDirection: "top" | "bottom" | "left" | "right";
} {
  const validDirections = ["top", "bottom", "left", "right"];
  return {
    text: String(ann?.text || ""),
    targetElement: String(ann?.targetElement || "main"),
    pointerDirection: validDirections.includes(ann?.pointerDirection) ? ann.pointerDirection : "top",
  };
}

export function normalizeDiagramData(data: any, subject: string): {
  title: string;
  description: string;
  elements: ReturnType<typeof normalizeDiagramElement>[];
  annotations: ReturnType<typeof normalizeDiagramAnnotation>[];
} {
  const elements = Array.isArray(data?.elements) 
    ? data.elements.map(normalizeDiagramElement) 
    : [normalizeDiagramElement({ id: "main", label: subject, description: "Main concept" })];
    
  const annotations = Array.isArray(data?.annotations)
    ? data.annotations.map(normalizeDiagramAnnotation)
    : [{ text: `Key aspect of ${subject}`, targetElement: "main", pointerDirection: "top" as const }];

  return {
    title: String(data?.title || subject),
    description: String(data?.description || `Diagram illustrating ${subject}`),
    elements,
    annotations,
  };
}

export function normalizePosition3D(pos: any): { x: number; y: number; z: number } {
  return {
    x: typeof pos?.x === "number" ? pos.x : 0,
    y: typeof pos?.y === "number" ? pos.y : 0,
    z: typeof pos?.z === "number" ? pos.z : 0,
  };
}

export function normalizeSimulationObject(obj: any): {
  name: string;
  type: string;
  properties: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    color: string;
    material: string;
  };
  interactive: boolean;
  interactionType?: string;
} {
  return {
    name: String(obj?.name || "object"),
    type: String(obj?.type || "mesh"),
    properties: {
      position: normalizePosition3D(obj?.properties?.position),
      rotation: normalizePosition3D(obj?.properties?.rotation),
      scale: {
        x: typeof obj?.properties?.scale?.x === "number" ? obj.properties.scale.x : 1,
        y: typeof obj?.properties?.scale?.y === "number" ? obj.properties.scale.y : 1,
        z: typeof obj?.properties?.scale?.z === "number" ? obj.properties.scale.z : 1,
      },
      color: String(obj?.properties?.color || "#3498db"),
      material: String(obj?.properties?.material || "matte"),
    },
    interactive: Boolean(obj?.interactive),
    interactionType: obj?.interactionType ? String(obj.interactionType) : undefined,
  };
}

export function normalizeSimulationScene(scene: any): {
  objects: ReturnType<typeof normalizeSimulationObject>[];
  lighting: {
    ambient: string;
    directional: { direction: string; intensity: number }[];
  };
  camera: {
    position: { x: number; y: number; z: number };
    lookAt: { x: number; y: number; z: number };
  };
} {
  const objects = Array.isArray(scene?.objects)
    ? scene.objects.map(normalizeSimulationObject)
    : [normalizeSimulationObject({ name: "main", type: "mesh", interactive: true })];

  const directional = Array.isArray(scene?.lighting?.directional)
    ? scene.lighting.directional.map((d: any) => ({
        direction: String(d?.direction || "top"),
        intensity: typeof d?.intensity === "number" ? d.intensity : 0.8,
      }))
    : [{ direction: "top", intensity: 0.8 }];

  return {
    objects,
    lighting: {
      ambient: String(scene?.lighting?.ambient || "#ffffff"),
      directional,
    },
    camera: {
      position: scene?.camera?.position 
        ? normalizePosition3D(scene.camera.position)
        : { x: 0, y: 5, z: 10 },
      lookAt: scene?.camera?.lookAt 
        ? normalizePosition3D(scene.camera.lookAt)
        : { x: 0, y: 0, z: 0 },
    },
  };
}

export function normalizeSimulation(sim: any, subject: string): {
  title: string;
  description: string;
  scene: ReturnType<typeof normalizeSimulationScene>;
  animations: { name: string; targetObject: string; property: string; duration: number; loop: boolean }[];
  interactions: { trigger: string; action: string; target: string }[];
} {
  const animations = Array.isArray(sim?.animations)
    ? sim.animations.map((a: any) => ({
        name: String(a?.name || "animation"),
        targetObject: String(a?.targetObject || "main"),
        property: String(a?.property || "rotation.y"),
        duration: typeof a?.duration === "number" ? a.duration : 5,
        loop: Boolean(a?.loop),
      }))
    : [];

  const interactions = Array.isArray(sim?.interactions)
    ? sim.interactions.map((i: any) => ({
        trigger: String(i?.trigger || "click"),
        action: String(i?.action || "highlight"),
        target: String(i?.target || "main"),
      }))
    : [];

  return {
    title: String(sim?.title || subject),
    description: String(sim?.description || `3D simulation of ${subject}`),
    scene: normalizeSimulationScene(sim?.scene),
    animations,
    interactions,
  };
}

export function normalizeBoardSection(section: any, defaultContent: string): {
  type: "heading" | "text" | "formula" | "bullet_points" | "definition" | "note";
  content: string;
  position: { x: number; y: number };
  style: { size: "small" | "medium" | "large"; emphasis: boolean; underline: boolean; color: string };
} {
  const validTypes = ["heading", "text", "formula", "bullet_points", "definition", "note"];
  return {
    type: validTypes.includes(section?.type) ? section.type : "text",
    content: String(section?.content || defaultContent),
    position: {
      x: typeof section?.position?.x === "number" ? section.position.x : 10,
      y: typeof section?.position?.y === "number" ? section.position.y : 10,
    },
    style: {
      size: ["small", "medium", "large"].includes(section?.style?.size) ? section.style.size : "medium",
      emphasis: Boolean(section?.style?.emphasis),
      underline: Boolean(section?.style?.underline),
      color: String(section?.style?.color || "white"),
    },
  };
}

export function normalizeBoardContent(content: any, defaultContent: string): {
  title: string;
  sections: ReturnType<typeof normalizeBoardSection>[];
} {
  const sections = Array.isArray(content?.sections)
    ? content.sections.map((s: any) => normalizeBoardSection(s, defaultContent))
    : [normalizeBoardSection({ type: "text", content: defaultContent }, defaultContent)];

  return {
    title: String(content?.title || "Lesson Notes"),
    sections,
  };
}

export function normalizeRenderingInstructions(instr: any): {
  animationDelay: number;
  strokeWidth: number;
  backgroundColor: string;
  writingSpeed: "slow" | "normal" | "fast";
} {
  const validSpeeds = ["slow", "normal", "fast"];
  return {
    animationDelay: typeof instr?.animationDelay === "number" ? instr.animationDelay : 50,
    strokeWidth: typeof instr?.strokeWidth === "number" ? instr.strokeWidth : 3,
    backgroundColor: String(instr?.backgroundColor || "#1a472a"),
    writingSpeed: validSpeeds.includes(instr?.writingSpeed) ? instr.writingSpeed : "normal",
  };
}

export function normalizeVideoScene(scene: any, topic: string): {
  sceneNumber: number;
  duration: string;
  visualDescription: string;
  narration: string;
  animation: string;
  keyElements: string[];
} {
  return {
    sceneNumber: typeof scene?.sceneNumber === "number" ? scene.sceneNumber : 1,
    duration: String(scene?.duration || "30 seconds"),
    visualDescription: String(scene?.visualDescription || `Educational content about ${topic}`),
    narration: String(scene?.narration || `Explaining ${topic}`),
    animation: String(scene?.animation || "Fade transition"),
    keyElements: Array.isArray(scene?.keyElements) ? scene.keyElements.map(String) : [topic],
  };
}

export function normalizeVideoStoryboard(storyboard: any, topic: string, style: string): {
  title: string;
  duration: string;
  style: string;
  scenes: ReturnType<typeof normalizeVideoScene>[];
  soundtrack: { style: string; mood: string };
} {
  const scenes = Array.isArray(storyboard?.scenes)
    ? storyboard.scenes.map((s: any) => normalizeVideoScene(s, topic))
    : [normalizeVideoScene({}, topic)];

  return {
    title: String(storyboard?.title || topic),
    duration: String(storyboard?.duration || "2:00"),
    style: String(storyboard?.style || style),
    scenes,
    soundtrack: {
      style: String(storyboard?.soundtrack?.style || "ambient"),
      mood: String(storyboard?.soundtrack?.mood || "inspiring"),
    },
  };
}
