import { useState, useCallback, useRef, useEffect } from 'react';
import {
  EventType,
  LessonStreamEvent,
  BoardWriteEvent,
  NarrationSegment,
  MediaReadyEvent,
  BoardState,
  BoardLine,
  LessonState,
  BoardLayout,
  DEFAULT_LAYOUT,
  cleanTextForBoard,
  BoardWriteStyle,
  VideoReadyEvent,
  VoiceAudioEvent,
} from '../types/events';

interface UseLessonStreamOptions {
  onBoardWrite?: (event: BoardWriteEvent) => void;
  onNarration?: (segment: NarrationSegment) => void;
  onMediaReady?: (media: MediaReadyEvent) => void;
  onBoardClear?: () => void;
  onLessonEnd?: (summary: string) => void;
  onError?: (error: string) => void;
}

interface UseLessonStreamReturn {
  startLesson: (topic: string) => Promise<void>;
  stopLesson: () => void;
  pauseLesson: () => void;
  resumeLesson: () => void;
  lessonState: LessonState;
  boardState: BoardState;
  currentNarration: NarrationSegment | null;
  displayedText: string;
  isNarrating: boolean;
}

const API_BASE = '/api';

export function useLessonStream(options: UseLessonStreamOptions = {}): UseLessonStreamReturn {
  const [lessonState, setLessonState] = useState<LessonState>({
    isPlaying: false,
    isPaused: false,
    currentSegmentIndex: 0,
    topic: '',
    title: '',
    status: 'idle',
  });

  const [boardState, setBoardState] = useState<BoardState>({
    lines: [],
    currentMedia: null,
    mediaGallery: [],
    isClearing: false,
    layout: DEFAULT_LAYOUT,
    currentVideo: null,
    videos: [],
    currentVoice: null,
  });

  const [currentNarration, setCurrentNarration] = useState<NarrationSegment | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isNarrating, setIsNarrating] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const runIdRef = useRef<string | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const writeTimeoutRef = useRef<number | null>(null);
  const lineIdCounter = useRef(0);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (speechRef.current) {
      speechSynthesis.cancel();
      speechRef.current = null;
    }
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current);
      writeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const animateText = useCallback((text: string, charDelay: number, onComplete?: () => void) => {
    const cleanText = cleanTextForBoard(text);
    let index = 0;

    const animate = () => {
      if (index < cleanText.length) {
        setDisplayedText((prev) => prev + cleanText[index]);
        index++;
        writeTimeoutRef.current = window.setTimeout(animate, charDelay);
      } else if (onComplete) {
        onComplete();
      }
    };

    animate();
  }, []);

  const speakText = useCallback((text: string, speed: number = 1.0) => {
    if (!text) return;

    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed * 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google')) ||
                         voices.find((v) => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, []);

  const handleEvent = useCallback((event: LessonStreamEvent) => {
    const { event_type, data } = event;

    switch (event_type) {
      case EventType.LESSON_START:
        setLessonState((prev) => ({
          ...prev,
          status: 'running',
          title: data.title || prev.topic,
          isPlaying: true,
        }));
        break;

      case EventType.BOARD_WRITE: {
        const writeEvent: BoardWriteEvent = {
          text: data.text,
          style: data.style as BoardWriteStyle,
          color: data.color || 'white',
          size: data.size || 'medium',
          duration_ms: data.duration_ms || 0,
          char_delay_ms: data.char_delay_ms || 50,
          sync_with_narration: data.sync_with_narration ?? true,
          position: data.position,
        };

        lineIdCounter.current++;
        const newLine: BoardLine = {
          id: `line_${lineIdCounter.current}`,
          text: writeEvent.text,
          displayedText: '',
          style: writeEvent.style,
          color: writeEvent.color,
          size: writeEvent.size,
          isComplete: false,
        };

        setBoardState((prev) => ({
          ...prev,
          lines: [...prev.lines, newLine],
        }));

        animateText(writeEvent.text, writeEvent.char_delay_ms, () => {
          setBoardState((prev) => ({
            ...prev,
            lines: prev.lines.map((line) =>
              line.id === newLine.id ? { ...line, isComplete: true } : line
            ),
          }));
        });

        options.onBoardWrite?.(writeEvent);
        break;
      }

      case EventType.NARRATION_SEGMENT: {
        const narration: NarrationSegment = {
          text: data.text,
          duration_ms: data.duration_ms || 0,
          pause_after_ms: data.pause_after_ms || 200,
          emphasis: data.emphasis || false,
          speed: data.speed || 1.0,
        };

        setCurrentNarration(narration);
        setBoardState((prev) => {
          if (!prev.currentVoice) {
            speakText(narration.text, narration.speed);
          }
          return prev;
        });
        options.onNarration?.(narration);
        break;
      }

      case EventType.MEDIA_READY: {
        const media: MediaReadyEvent = {
          media_type: data.media_type,
          title: data.title,
          description: data.description || '',
          image_base64: data.image_base64,
          image_url: data.image_url,
          display_on_board: data.display_on_board ?? true,
          display_duration_ms: data.display_duration_ms || 5000,
        };

        if (media.display_on_board) {
          setBoardState((prev) => ({
            ...prev,
            currentMedia: media,
            mediaGallery: [...prev.mediaGallery.slice(-5), media],
          }));
        }

        options.onMediaReady?.(media);
        break;
      }

      case EventType.BOARD_CLEAR: {
        setBoardState((prev) => ({ ...prev, isClearing: true }));
        options.onBoardClear?.();
        
        setTimeout(() => {
          setBoardState((prev) => ({
            ...prev,
            lines: [],
            currentMedia: null,
            mediaGallery: [],
            isClearing: false,
          }));
          setDisplayedText('');
        }, data.duration_ms || 500);
        break;
      }

      case EventType.PAUSE:
        break;

      case EventType.LESSON_END:
        setLessonState((prev) => ({
          ...prev,
          status: 'completed',
          isPlaying: false,
        }));
        options.onLessonEnd?.(data.summary || '');
        break;

      case EventType.ERROR:
        setLessonState((prev) => ({
          ...prev,
          status: 'error',
          error: data.message,
          isPlaying: false,
        }));
        options.onError?.(data.message);
        break;

      case EventType.STATUS_UPDATE:
        setLessonState((prev) => ({
          ...prev,
          currentSegmentIndex: Math.floor(data.progress * 100),
        }));
        break;

      case EventType.LAYOUT_UPDATE: {
        const newLayout: BoardLayout = {
          text_size: data.text_size || 'large',
          text_width_percent: data.text_width_percent || 60,
          image_size: data.image_size || 'large',
          image_width_percent: data.image_width_percent || 40,
          image_position: data.image_position || 'right',
          image_height_percent: data.image_height_percent || 70,
          line_spacing: data.line_spacing || 'normal',
          board_padding: data.board_padding || 'normal',
          title_size: data.title_size || 'large',
        };
        setBoardState((prev) => ({ ...prev, layout: newLayout }));
        break;
      }

      case EventType.VIDEO_READY: {
        const video: VideoReadyEvent = {
          title: data.title || '',
          description: data.description || '',
          video_base64: data.video_base64,
          video_url: data.video_url,
          mime_type: data.mime_type || 'video/mp4',
          duration_seconds: data.duration_seconds || 8,
          loop: data.loop !== false,
          display_position: data.display_position || 'right',
        };
        setBoardState((prev) => ({
          ...prev,
          currentVideo: video,
          videos: [...prev.videos, video],
        }));
        break;
      }

      case EventType.VOICE_AUDIO: {
        const voice: VoiceAudioEvent = {
          audio_base64: data.audio_base64,
          text: data.text,
          duration_ms: data.duration_ms || 0,
          is_hinglish: data.is_hinglish || false,
        };
        
        if (voice.audio_base64 && voice.audio_base64.length > 100) {
          setBoardState((prev) => ({ ...prev, currentVoice: voice }));
          const audio = new Audio(`data:audio/mpeg;base64,${voice.audio_base64}`);
          audio.onplay = () => setIsNarrating(true);
          audio.onended = () => {
            setIsNarrating(false);
            setBoardState((prev) => ({ ...prev, currentVoice: null }));
          };
          audio.onerror = () => {
            setIsNarrating(false);
            setBoardState((prev) => ({ ...prev, currentVoice: null }));
            speakText(voice.text, 1.0);
          };
          audio.play().catch(() => {
            setBoardState((prev) => ({ ...prev, currentVoice: null }));
            speakText(voice.text, 1.0);
          });
        }
        break;
      }
    }
  }, [options, animateText, speakText]);

  const startLesson = useCallback(async (topic: string) => {
    cleanup();

    setLessonState({
      isPlaying: false,
      isPaused: false,
      currentSegmentIndex: 0,
      topic,
      title: topic,
      status: 'starting',
    });

    setBoardState({
      lines: [],
      currentMedia: null,
      mediaGallery: [],
      isClearing: false,
      layout: DEFAULT_LAYOUT,
      currentVideo: null,
      videos: [],
      currentVoice: null,
    });

    setDisplayedText('');
    setCurrentNarration(null);

    try {
      const response = await fetch(`${API_BASE}/stream/lesson/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData: { topic } }),
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming lesson');
      }

      const data = await response.json();
      const runId = data.runId;
      runIdRef.current = runId;

      const eventSource = new EventSource(`${API_BASE}/stream/lesson/${runId}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event_type && parsed.event_type !== 'heartbeat') {
            handleEvent(parsed as LessonStreamEvent);
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setLessonState((prev) => ({
          ...prev,
          status: 'error',
          error: 'Connection lost',
          isPlaying: false,
        }));
      };

    } catch (error: any) {
      setLessonState((prev) => ({
        ...prev,
        status: 'error',
        error: error.message || 'Failed to start lesson',
        isPlaying: false,
      }));
    }
  }, [cleanup, handleEvent]);

  const stopLesson = useCallback(() => {
    cleanup();
    
    if (runIdRef.current) {
      fetch(`${API_BASE}/stream/lesson/${runIdRef.current}`, {
        method: 'DELETE',
      }).catch(console.error);
    }

    setLessonState((prev) => ({
      ...prev,
      status: 'idle',
      isPlaying: false,
    }));
  }, [cleanup]);

  const pauseLesson = useCallback(() => {
    speechSynthesis.pause();
    setLessonState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeLesson = useCallback(() => {
    speechSynthesis.resume();
    setLessonState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  return {
    startLesson,
    stopLesson,
    pauseLesson,
    resumeLesson,
    lessonState,
    boardState,
    currentNarration,
    displayedText,
    isNarrating,
  };
}
