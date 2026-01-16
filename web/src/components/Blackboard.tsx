import React from 'react';

interface BlackboardProps {
  content: any | null;
  lessonPlan: any | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  topic: string;
}

export default function Blackboard({ content, lessonPlan, status, topic }: BlackboardProps) {
  const renderBoardContent = () => {
    if (status === 'idle') {
      return (
        <div className="idle-message handwriting">
          <p>Welcome to AI Teacher!</p>
          <p>Enter a topic above to begin your lesson.</p>
        </div>
      );
    }

    if (status === 'running') {
      return (
        <div className="loading-message">
          <div className="chalk-animation">
            <span className="handwriting">Teaching about {topic}...</span>
          </div>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="error-message handwriting">
          <p>Oops! Something went wrong.</p>
          <p>Please try again.</p>
        </div>
      );
    }

    if (content) {
      const title = content.title || content.boardContent?.title || topic;
      const sections = content.sections || content.boardContent?.sections || [];
      
      return (
        <div className="board-content">
          {title && <h2 className="board-title handwriting">{title}</h2>}
          {sections.length > 0 ? sections.map((section: any, idx: number) => (
            <div 
              key={idx} 
              className={`board-section section-${section.type} handwriting`}
              style={{
                fontSize: section.style?.size === 'large' ? '2rem' : 
                         section.style?.size === 'small' ? '1.2rem' : '1.5rem',
                textDecoration: section.style?.underline ? 'underline' : 'none',
                fontWeight: section.style?.emphasis ? 'bold' : 'normal',
              }}
            >
              {section.type === 'bullet_points' && typeof section.content === 'string' ? (
                <ul>
                  {section.content.split('\n').map((item: string, i: number) => (
                    <li key={i}>{item.replace(/^[-*]\s*/, '')}</li>
                  ))}
                </ul>
              ) : section.type === 'formula' ? (
                <div className="formula">{section.content}</div>
              ) : section.type === 'heading' || section.type === 'header' ? (
                <h3 className="section-heading">{section.content}</h3>
              ) : (
                <p>{section.content}</p>
              )}
            </div>
          )) : (
            <p className="handwriting" style={{ fontSize: '1.3rem', lineHeight: '1.8' }}>
              {content.chalk_color && '✏️ '}{typeof content === 'string' ? content : 'Lesson content loaded!'}
            </p>
          )}
        </div>
      );
    }

    if (lessonPlan) {
      return (
        <div className="board-content">
          <h2 className="board-title handwriting">{lessonPlan.topic || topic}</h2>
          {lessonPlan.overview && (
            <p className="board-overview handwriting">{lessonPlan.overview}</p>
          )}
          {lessonPlan.learningObjectives && (
            <div className="learning-objectives">
              <h3 className="handwriting section-heading">Learning Objectives:</h3>
              <ul className="handwriting">
                {lessonPlan.learningObjectives.map((obj: string, idx: number) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
          {lessonPlan.keyPoints && (
            <div className="key-points">
              <h3 className="handwriting section-heading">Key Points:</h3>
              <ul className="handwriting">
                {lessonPlan.keyPoints.map((point: string, idx: number) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="idle-message handwriting">
        <p>Lesson completed!</p>
        <p>View the content below.</p>
      </div>
    );
  };

  return (
    <div className="blackboard-container">
      <div className="blackboard-frame">
        <div className="blackboard">
          <div className="chalk-tray"></div>
          {renderBoardContent()}
        </div>
      </div>

      <style>{`
        .blackboard-container {
          perspective: 1000px;
        }

        .blackboard-frame {
          background: #5c4033;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.5),
            inset 0 2px 0 rgba(255, 255, 255, 0.1),
            inset 0 -2px 0 rgba(0, 0, 0, 0.3);
        }

        .blackboard {
          background: linear-gradient(135deg, #1a472a 0%, #0d2818 50%, #1a472a 100%);
          min-height: 400px;
          border-radius: 4px;
          padding: 40px;
          position: relative;
          box-shadow: 
            inset 0 0 50px rgba(0, 0, 0, 0.3),
            inset 0 0 10px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .blackboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        .chalk-tray {
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 15px;
          background: linear-gradient(to bottom, #5c4033, #4a3228);
          border-radius: 2px 2px 0 0;
        }

        .idle-message, .loading-message, .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          text-align: center;
          color: rgba(255, 255, 255, 0.9);
        }

        .idle-message p, .error-message p {
          font-size: 2rem;
          margin: 10px 0;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
        }

        .loading-message {
          gap: 20px;
        }

        .chalk-animation span {
          font-size: 2rem;
          color: #fff;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
        }

        .loading-dots {
          display: flex;
          gap: 8px;
        }

        .loading-dots span {
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .board-content {
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 0 0 3px rgba(255, 255, 255, 0.2);
        }

        .board-title {
          font-size: 2.5rem;
          margin-bottom: 24px;
          text-align: center;
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
          padding-bottom: 16px;
        }

        .board-overview {
          font-size: 1.3rem;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .section-heading {
          font-size: 1.8rem;
          margin: 24px 0 12px;
          color: #ffd700;
          text-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
        }

        .board-section {
          margin: 16px 0;
          line-height: 1.6;
        }

        .board-section ul {
          list-style: none;
          padding-left: 20px;
        }

        .board-section li {
          position: relative;
          margin: 8px 0;
        }

        .board-section li::before {
          content: '>';
          position: absolute;
          left: -20px;
          color: #ffd700;
        }

        .formula {
          background: rgba(0, 0, 0, 0.2);
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 1.4rem;
          text-align: center;
          margin: 16px 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .learning-objectives, .key-points {
          margin: 20px 0;
        }

        .error-message {
          color: #ff6b6b;
        }
      `}</style>
    </div>
  );
}
