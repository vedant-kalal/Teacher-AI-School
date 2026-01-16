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
        <p className="subtitle">Real-time Interactive Lessons</p>
      </header>

      <div className="controls">
        <TopicInput 
          onSubmit={handleStartLesson} 
          disabled={lessonState.status === 'running' || lessonState.status === 'starting'} 
          onReset={handleReset}
          showReset={lessonState.status !== 'idle'}
        />
      </div>

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
          <span className="narration-icon">🔊</span>
          <span>Teacher is speaking...</span>
          <div className="wave">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
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
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 15px 30px;
          overflow: hidden;
        }

        .header {
          text-align: center;
          flex-shrink: 0;
          margin-bottom: 10px;
        }

        .header h1 {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: #a0aec0;
          font-size: 0.95rem;
          margin-top: 4px;
        }

        .controls {
          flex-shrink: 0;
          margin-bottom: 15px;
        }

        .main-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
          overflow: hidden;
        }

        .narration-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 10px 20px;
          background: rgba(102, 126, 234, 0.15);
          border-radius: 10px;
          border: 1px solid rgba(102, 126, 234, 0.3);
          margin-top: 10px;
          flex-shrink: 0;
          color: #fff;
          font-size: 1rem;
        }

        .narration-icon {
          font-size: 1.3rem;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .wave {
          display: flex;
          gap: 3px;
          align-items: center;
        }

        .wave span {
          width: 3px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 2px;
          animation: waveAnim 1s ease-in-out infinite;
        }

        .wave span:nth-child(1) { height: 6px; animation-delay: 0s; }
        .wave span:nth-child(2) { height: 12px; animation-delay: 0.1s; }
        .wave span:nth-child(3) { height: 18px; animation-delay: 0.2s; }
        .wave span:nth-child(4) { height: 12px; animation-delay: 0.3s; }
        .wave span:nth-child(5) { height: 6px; animation-delay: 0.4s; }

        @keyframes waveAnim {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
      `}</style>
    </div>
  );
}
