

interface LessonProgressProps {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStep: string;
  topic: string;
}

export default function LessonProgress({ status, currentStep }: LessonProgressProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return '#667eea';
      case 'completed': return '#48bb78';
      case 'error': return '#fc8181';
      default: return '#718096';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'Generating lesson...';
      case 'completed': return 'Lesson complete!';
      case 'error': return 'Error occurred';
      default: return '';
    }
  };

  return (
    <div className="lesson-progress">
      <div className="progress-header">
        <div className="status-indicator" style={{ background: getStatusColor() }} />
        <span className="status-text">{getStatusText()}</span>
        {status === 'running' && (
          <span className="current-step">{currentStep}</span>
        )}
      </div>
      
      {status === 'running' && (
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-bar-fill" />
          </div>
        </div>
      )}

      <style>{`
        .lesson-progress {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px 20px;
          backdrop-filter: blur(10px);
        }

        .progress-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: ${status === 'running' ? 'pulse 2s infinite' : 'none'};
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        .status-text {
          font-weight: 600;
          color: #fff;
        }

        .current-step {
          color: #a0aec0;
          font-size: 0.9rem;
          margin-left: auto;
        }

        .progress-bar-container {
          margin-top: 12px;
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          width: 30%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
          animation: indeterminate 1.5s infinite linear;
        }

        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
