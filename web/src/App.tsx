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
      <header className="header">
        <h1>🎓 AI Teacher</h1>
        <TopicInput 
          onSubmit={handleStartLesson} 
          disabled={lessonState.status === 'running' || lessonState.status === 'starting'} 
          onReset={handleReset}
          showReset={lessonState.status !== 'idle'}
        />
      </header>

      <main className="main-content">
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
          <div className="narration-icon">🔊</div>
          <div className="narration-text">Teacher is speaking...</div>
          <div className="narration-wave">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100vh;
          width: 100vw;
          overflow: hidden !important;
          position: fixed;
          top: 0;
          left: 0;
        }

        .app {
          height: 100vh;
          width: 100vw;
          overflow: hidden !important;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          position: fixed;
          top: 0;
          left: 0;
          padding: 10px 20px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-shrink: 0;
          padding: 10px 0;
        }

        .header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          white-space: nowrap;
        }

        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden !important;
          min-height: 0;
        }

        .narration-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 12px 24px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.3);
          flex-shrink: 0;
          margin-top: 10px;
        }

        .narration-icon {
          font-size: 1.5rem;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .narration-text {
          color: #fff;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .narration-wave {
          display: flex;
          gap: 4px;
          align-items: center;
          height: 24px;
        }

        .narration-wave span {
          width: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
          animation: wave 1s ease-in-out infinite;
        }

        .narration-wave span:nth-child(1) { height: 8px; animation-delay: 0s; }
        .narration-wave span:nth-child(2) { height: 16px; animation-delay: 0.1s; }
        .narration-wave span:nth-child(3) { height: 24px; animation-delay: 0.2s; }
        .narration-wave span:nth-child(4) { height: 16px; animation-delay: 0.3s; }
        .narration-wave span:nth-child(5) { height: 8px; animation-delay: 0.4s; }

        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
      `}</style>
    </div>
  );
}
