export enum EventType {
  LESSON_START = 'lesson_start',
  BOARD_CLEAR = 'board_clear',
  BOARD_WRITE = 'board_write',
  NARRATION_START = 'narration_start',
  NARRATION_SEGMENT = 'narration_segment',
  NARRATION_END = 'narration_end',
  MEDIA_REQUEST = 'media_request',
  MEDIA_READY = 'media_ready',
  PAUSE = 'pause',
  LESSON_END = 'lesson_end',
  ERROR = 'error',
  STATUS_UPDATE = 'status_update',
  LAYOUT_UPDATE = 'layout_update',
  VOICE_AUDIO = 'voice_audio',
  VIDEO_READY = 'video_ready',
}

export enum MediaType {
  DIAGRAM = 'diagram',
  IMAGE = 'image',
  VIDEO = 'video',
  SIMULATION = 'simulation',
  FORMULA = 'formula',
}

export enum BoardWriteStyle {
  TITLE = 'title',
  HEADING = 'heading',
  TEXT = 'text',
  FORMULA = 'formula',
  BULLET = 'bullet',
  HIGHLIGHT = 'highlight',
  EMOJI = 'emoji',
}

export interface BoardPosition {
  x: number;
  y: number;
}

export interface BoardWriteEvent {
  text: string;
  style: BoardWriteStyle;
  position?: BoardPosition;
  color: string;
  size: string;
  duration_ms: number;
  char_delay_ms: number;
  sync_with_narration: boolean;
}

export interface NarrationSegment {
  text: string;
  duration_ms: number;
  pause_after_ms: number;
  emphasis: boolean;
  speed: number;
}

export interface MediaRequestEvent {
  media_type: MediaType;
  prompt: string;
  topic: string;
  context: string;
  display_on_board: boolean;
  priority: number;
}

export interface MediaReadyEvent {
  media_type: MediaType;
  title: string;
  description: string;
  image_base64?: string;
  image_url?: string;
  display_on_board: boolean;
  display_duration_ms: number;
}

export interface LessonStreamEvent {
  event_type: EventType;
  timestamp: string;
  sequence_id: number;
  data: Record<string, any>;
}

export interface LessonSegment {
  segment_id: string;
  narration: NarrationSegment;
  board_writes: BoardWriteEvent[];
  media_requests: MediaRequestEvent[];
  clear_board_before: boolean;
  pause_after_ms: number;
}

export interface LessonScript {
  topic: string;
  title: string;
  total_duration_ms: number;
  segments: LessonSegment[];
  emojis_used: string[];
  formulas: string[];
}

export interface BoardLayout {
  text_size: 'small' | 'medium' | 'large';
  text_width_percent: number;
  image_size: 'small' | 'medium' | 'large' | 'none';
  image_width_percent: number;
  image_position: 'right' | 'left' | 'top' | 'bottom' | 'none';
  image_height_percent: number;
  line_spacing: 'compact' | 'normal' | 'relaxed';
  board_padding: 'minimal' | 'normal' | 'spacious';
  title_size: 'normal' | 'large' | 'huge';
}

export const DEFAULT_LAYOUT: BoardLayout = {
  text_size: 'large',
  text_width_percent: 60,
  image_size: 'large',
  image_width_percent: 40,
  image_position: 'right',
  image_height_percent: 70,
  line_spacing: 'normal',
  board_padding: 'normal',
  title_size: 'large',
};

export interface VideoReadyEvent {
  title: string;
  description: string;
  video_base64?: string;
  video_url?: string;
  mime_type: string;
  duration_seconds: number;
  loop: boolean;
  display_position: string;
  video_type?: string;
}

export interface VoiceAudioEvent {
  audio_base64: string;
  text: string;
  duration_ms: number;
  is_hinglish: boolean;
}

export interface BoardState {
  lines: BoardLine[];
  currentMedia: MediaReadyEvent | null;
  mediaGallery: MediaReadyEvent[];
  isClearing: boolean;
  layout: BoardLayout;
  currentVideo: VideoReadyEvent | null;
  videos: VideoReadyEvent[];
  currentVoice: VoiceAudioEvent | null;
}

export interface BoardLine {
  id: string;
  text: string;
  displayedText: string;
  style: BoardWriteStyle;
  color: string;
  size: string;
  isComplete: boolean;
}

export interface LessonState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSegmentIndex: number;
  topic: string;
  title: string;
  status: 'idle' | 'starting' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
}

export const TEACHING_EMOJIS: Record<string, string> = {
  attention: '👆',
  important: '⭐',
  note: '📝',
  remember: '💡',
  example: '📌',
  question: '❓',
  answer: '✅',
  warning: '⚠️',
  heart: '❤️',
  brain: '🧠',
  book: '📚',
  science: '🔬',
  math: '🔢',
  earth: '🌍',
  atom: '⚛️',
  rocket: '🚀',
  star: '⭐',
  check: '✓',
  arrow_right: '→',
  arrow_down: '↓',
  plus: '➕',
  equals: '＝',
};

export function formatFormula(formula: string): string {
  const replacements: Record<string, string> = {
    '*': '×',
    '/': '÷',
    '**2': '²',
    '**3': '³',
    'sqrt': '√',
    'pi': 'π',
    'theta': 'θ',
    'alpha': 'α',
    'beta': 'β',
    'gamma': 'γ',
    'delta': 'Δ',
    'sigma': 'Σ',
    'omega': 'Ω',
    '->': '→',
    '<-': '←',
    '<=': '≤',
    '>=': '≥',
    '!=': '≠',
    'infinity': '∞',
    'degree': '°',
  };

  let result = formula;
  for (const [old, newVal] of Object.entries(replacements)) {
    result = result.split(old).join(newVal);
  }
  return result;
}

export function cleanTextForBoard(text: string): string {
  let cleaned = text
    .replace(/#/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/`/g, '')
    .replace(/```/g, '')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

  const lines = cleaned.split('\n');
  const cleanedLines = lines.map((line) => {
    if (line.trim().startsWith('- ')) {
      return '• ' + line.trim().substring(2);
    }
    if (line.trim().startsWith('* ')) {
      return '• ' + line.trim().substring(2);
    }
    return line;
  });

  return cleanedLines.join('\n');
}
