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
        <span className="logo">🎓 AI Teacher</span>
        <TopicInput 
          onSubmit={handleStartLesson} 
          disabled={lessonState.status === 'running' || lessonState.status === 'starting'} 
          onReset={handleReset}
          showReset={lessonState.status !== 'idle'}
        />
        {isNarrating && <span className="speaking-indicator">🔊</span>}
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
          background: #0f0f1a;
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 8px 12px;
          background: rgba(30, 30, 50, 0.95);
          border-bottom: 1px solid rgba(100, 100, 150, 0.3);
          flex-shrink: 0;
        }

        .logo {
          font-size: 1.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
        }

        .speaking-indicator {
          font-size: 1.2rem;
          animation: pulse 1.5s infinite;
          margin-left: auto;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        .board-area {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
