import * as fs from "fs";
import * as path from "path";

export interface LessonData {
  topic: string;
  targetAudience?: string;
  lessonPlan?: any;
  boardContent?: any[];
  diagrams?: any[];
  images?: any[];
  simulations?: any[];
  videos?: any[];
  qualityReport?: any;
  fullNarration?: string;
}

const STORAGE_DIR = path.join(process.cwd(), "public", "lesson_data");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export function saveLessonData(sessionId: string, data: Partial<LessonData>): void {
  ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${sessionId}.json`);
  
  let existing: Partial<LessonData> = {};
  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {}
  }
  
  const merged = { ...existing, ...data };
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
}

export function loadLessonData(sessionId: string): LessonData | null {
  ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `${sessionId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return null;
  }
}

export function generateSessionId(): string {
  return `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
