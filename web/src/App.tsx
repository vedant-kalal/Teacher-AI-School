import { useCallback } from 'react';
import StreamingBlackboard from './components/StreamingBlackboard';
import TopicInput from './components/TopicInput';
import { useLessonStream } from './hooks/useLessonStream';

export default function App() {
  const {
    startLesson,
    stopLesson,
    lessonState,
    boardState,
    isNarrating,
  } = useLessonStream({
    onLessonEnd: (summary) => {
      console.log('Lesson completed:', summary);
    },
    onError: (error) => {
      console.error('Lesson error:', error);
    },
  });

  const handleStartLesson = useCallback(async (topic: string) => {
    await startLesson(topic);
  }, [startLesson]);

  const handleReset = useCallback(() => {
    stopLesson();
  }, [stopLesson]);

  return (
    <div className="app">
      <div className="top-bar">
        <h1>🎓 AI Teacher</h1>
        <div className="controls">
          <TopicInput 
            onSubmit={handleStartLesson} 
            disabled={lessonState.status === 'running' || lessonState.status === 'starting'} 
            onReset={handleReset}
            showReset={lessonState.status !== 'idle'}
          />
        </div>
      </div>

      <main className="board-area">
        <StreamingBlackboard 
          boardState={boardState}
          isNarrating={isNarrating}
          lessonStatus={lessonState.status}
          topic={lessonState.topic}
          title={lessonState.title}
        />
      </main>

      {isNarrating && (
        <div className="narration-bar">
          <span className="narration-icon">🔊</span>
          <span>Teacher is speaking...</span>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root {
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        .app {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 10px 15px;
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-shrink: 0;
          padding-bottom: 10px;
        }

        .top-bar h1 {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
        }

        .controls {
          flex: 1;
        }

        .board-area {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .narration-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(102, 126, 234, 0.15);
          border-radius: 8px;
          border: 1px solid rgba(102, 126, 234, 0.3);
          margin-top: 8px;
          flex-shrink: 0;
          color: #fff;
          font-size: 0.95rem;
        }

        .narration-icon {
          font-size: 1.2rem;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
