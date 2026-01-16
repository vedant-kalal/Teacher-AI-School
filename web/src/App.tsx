import { useCallback } from 'react';
import StreamingBlackboard from './components/StreamingBlackboard';
import TopicInput from './components/TopicInput';
import LessonProgress from './components/LessonProgress';
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

  const getProgressStatus = () => {
    switch (lessonState.status) {
      case 'idle': return 'idle';
      case 'starting': return 'running';
      case 'running': return 'running';
      case 'paused': return 'running';
      case 'completed': return 'completed';
      case 'error': return 'error';
      default: return 'idle';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 AI Teacher</h1>
        <p>Real-time Interactive Educational Lessons with Synchronized AI</p>
      </header>

      <main className="main-content">
        <TopicInput 
          onSubmit={handleStartLesson} 
          disabled={lessonState.status === 'running' || lessonState.status === 'starting'} 
          onReset={handleReset}
          showReset={lessonState.status !== 'idle'}
        />

        {lessonState.status !== 'idle' && (
          <LessonProgress 
            status={getProgressStatus()}
            currentStep={
              lessonState.status === 'starting' 
                ? 'Preparing lesson...' 
                : lessonState.status === 'running'
                ? `Teaching (${lessonState.currentSegmentIndex}% complete)`
                : lessonState.status === 'completed'
                ? 'Lesson Complete!'
                : 'Error occurred'
            }
            topic={lessonState.topic}
          />
        )}

        <StreamingBlackboard 
          boardState={boardState}
          isNarrating={isNarrating}
          lessonStatus={lessonState.status}
          topic={lessonState.topic}
          title={lessonState.title}
        />

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
      </main>

      <style>{`
        .app {
          min-height: 100vh;
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 2.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .header p {
          color: #a0aec0;
          font-size: 1.1rem;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .narration-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 16px 24px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.3);
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
