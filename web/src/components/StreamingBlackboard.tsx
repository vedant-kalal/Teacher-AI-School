import { useState, useEffect, useRef } from 'react';
import { BoardState, BoardLine, BoardWriteStyle, cleanTextForBoard } from '../types/events';

interface StreamingBlackboardProps {
  boardState: BoardState;
  isNarrating: boolean;
  lessonStatus: 'idle' | 'starting' | 'running' | 'paused' | 'completed' | 'error';
  topic: string;
  title: string;
  onStartNarration?: () => void;
  onStopNarration?: () => void;
}

export default function StreamingBlackboard({
  boardState,
  isNarrating,
  lessonStatus,
  topic,
  title,
}: StreamingBlackboardProps) {
  const [animatedLines, setAnimatedLines] = useState<Map<string, string>>(new Map());
  const [clearAnimation, setClearAnimation] = useState(false);
  const textAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boardState.isClearing) {
      setClearAnimation(true);
      const timer = setTimeout(() => {
        setClearAnimation(false);
        setAnimatedLines(new Map());
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [boardState.isClearing]);

  useEffect(() => {
    boardState.lines.forEach((line) => {
      if (!animatedLines.has(line.id)) {
        animateLine(line);
      }
    });
    
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [boardState.lines]);

  const animateLine = (line: BoardLine) => {
    const cleanText = cleanTextForBoard(line.text);
    let index = 0;
    const charDelay = 35;

    const animate = () => {
      if (index <= cleanText.length) {
        setAnimatedLines((prev) => new Map(prev).set(line.id, cleanText.substring(0, index)));
        index++;
        if (index <= cleanText.length) {
          setTimeout(animate, charDelay);
        }
      }
    };

    animate();
  };

  const getStyleClasses = (style: BoardWriteStyle): string => {
    switch (style) {
      case BoardWriteStyle.TITLE:
        return 'board-title-text';
      case BoardWriteStyle.HEADING:
        return 'board-heading-text';
      case BoardWriteStyle.FORMULA:
        return 'board-formula-text';
      case BoardWriteStyle.BULLET:
        return 'board-bullet-text';
      case BoardWriteStyle.HIGHLIGHT:
        return 'board-highlight-text';
      default:
        return 'board-normal-text';
    }
  };

  const renderBoardContent = () => {
    if (lessonStatus === 'idle') {
      return (
        <div className="idle-message handwriting">
          <p>📚 Welcome to AI Teacher!</p>
          <p>Enter a topic above to begin your lesson.</p>
        </div>
      );
    }

    if (lessonStatus === 'starting') {
      return (
        <div className="loading-message">
          <div className="chalk-animation">
            <span className="handwriting">🎓 Preparing lesson on {topic}...</span>
          </div>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }

    if (lessonStatus === 'error') {
      return (
        <div className="error-message handwriting">
          <p>❌ Oops! Something went wrong.</p>
          <p>Please try again.</p>
        </div>
      );
    }

    return (
      <div className={`board-content ${clearAnimation ? 'clearing' : ''}`}>
        {title && (
          <h2 className="board-main-title handwriting">{title}</h2>
        )}

        {isNarrating && (
          <div className="narration-indicator">
            <span className="speaking-icon">🔊</span>
            <span className="speaking-text">Speaking...</span>
          </div>
        )}

        <div className="board-layout">
          <div className="board-text-area" ref={textAreaRef}>
            <div className="board-lines">
              {boardState.lines.map((line) => {
                const displayText = animatedLines.get(line.id) || '';
                const isComplete = displayText.length >= cleanTextForBoard(line.text).length;

                return (
                  <div
                    key={line.id}
                    className={`board-line ${getStyleClasses(line.style)} handwriting`}
                    style={{ color: line.color === 'yellow' ? '#ffd700' : 'rgba(255, 255, 255, 0.95)' }}
                  >
                    {displayText.split('\n').map((textLine, idx) => (
                      <div key={idx} className="text-line">
                        {textLine}
                        {idx === displayText.split('\n').length - 1 && !isComplete && (
                          <span className="cursor">|</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {lessonStatus === 'completed' && (
              <div className="lesson-complete handwriting">
                <p>✅ Lesson Complete!</p>
              </div>
            )}
          </div>

          {boardState.currentMedia && (
            <div className="board-media-area">
              <div className="media-frame">
                {(boardState.currentMedia.image_base64 || boardState.currentMedia.image_url) && (
                  <img
                    src={
                      boardState.currentMedia.image_base64
                        ? `data:image/png;base64,${boardState.currentMedia.image_base64}`
                        : boardState.currentMedia.image_url
                    }
                    alt={boardState.currentMedia.title}
                    className="board-media-image"
                  />
                )}
                <p className="media-caption handwriting">{boardState.currentMedia.title}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="streaming-blackboard-container">
      <div className="blackboard-frame">
        <div className="blackboard">
          <div className="chalk-tray">
            <div className="chalk white"></div>
            <div className="chalk yellow"></div>
            <div className="chalk blue"></div>
          </div>
          {renderBoardContent()}
        </div>
      </div>

      <style>{`
        .streaming-blackboard-container {
          width: 100%;
          height: 100%;
          min-height: 500px;
        }

        .blackboard-frame {
          background: linear-gradient(135deg, #5c4033 0%, #4a3228 50%, #5c4033 100%);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 
            0 15px 40px rgba(0, 0, 0, 0.5),
            inset 0 2px 0 rgba(255, 255, 255, 0.15),
            inset 0 -2px 0 rgba(0, 0, 0, 0.3);
          height: 100%;
          min-height: 500px;
        }

        .blackboard {
          background: linear-gradient(145deg, #1a472a 0%, #0d2818 40%, #153d24 70%, #1a472a 100%);
          width: 100%;
          height: 100%;
          min-height: 460px;
          border-radius: 6px;
          padding: 25px 35px 40px 35px;
          position: relative;
          box-shadow: 
            inset 0 0 60px rgba(0, 0, 0, 0.4),
            inset 0 0 15px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
        }

        .blackboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.04;
          pointer-events: none;
        }

        .chalk-tray {
          position: absolute;
          bottom: 0;
          left: 30px;
          right: 30px;
          height: 18px;
          background: linear-gradient(to bottom, #6b5344, #5c4033);
          border-radius: 3px 3px 0 0;
          display: flex;
          gap: 12px;
          padding: 4px 15px;
          align-items: center;
          z-index: 10;
        }

        .chalk {
          width: 40px;
          height: 10px;
          border-radius: 2px;
        }

        .chalk.white {
          background: linear-gradient(to bottom, #fff, #e0e0e0);
        }

        .chalk.yellow {
          background: linear-gradient(to bottom, #ffd700, #daa520);
        }

        .chalk.blue {
          background: linear-gradient(to bottom, #87ceeb, #6bb3d9);
        }

        .handwriting {
          font-family: 'Caveat', 'Segoe Script', 'Bradley Hand', cursive;
          text-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
        }

        .board-content {
          color: rgba(255, 255, 255, 0.95);
          transition: opacity 0.4s ease-out, transform 0.4s ease-out;
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 0;
        }

        .board-content.clearing {
          animation: magicalClear 0.5s ease-out forwards;
        }

        @keyframes magicalClear {
          0% { 
            opacity: 1; 
            transform: scale(1);
            filter: blur(0);
          }
          50% { 
            opacity: 0.6; 
            transform: scale(0.98);
            filter: blur(2px);
          }
          100% { 
            opacity: 0; 
            transform: scale(0.95) translateY(-10px);
            filter: blur(4px);
          }
        }

        .board-main-title {
          font-size: 2rem;
          text-align: center;
          margin-bottom: 16px;
          border-bottom: 3px solid rgba(255, 255, 255, 0.3);
          padding-bottom: 12px;
          color: #fff;
          flex-shrink: 0;
        }

        .narration-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(102, 126, 234, 0.3);
          padding: 6px 14px;
          border-radius: 20px;
          animation: pulse 1.5s infinite;
          z-index: 5;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .speaking-icon {
          font-size: 1rem;
        }

        .speaking-text {
          font-size: 0.85rem;
          color: #fff;
        }

        .board-layout {
          flex: 1;
          display: flex;
          gap: 20px;
          min-height: 0;
          overflow: hidden;
        }

        .board-text-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.3) transparent;
        }

        .board-text-area::-webkit-scrollbar {
          width: 6px;
        }

        .board-text-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .board-text-area::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }

        .board-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .board-line {
          line-height: 1.4;
        }

        .text-line {
          min-height: 1.2em;
        }

        .board-title-text {
          font-size: 1.8rem;
          color: #ffd700 !important;
          margin-bottom: 6px;
        }

        .board-heading-text {
          font-size: 1.4rem;
          color: #87ceeb !important;
          margin-top: 8px;
          margin-bottom: 4px;
        }

        .board-normal-text {
          font-size: 1.2rem;
        }

        .board-formula-text {
          font-size: 1.3rem;
          font-family: 'Times New Roman', serif;
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 14px;
          border-radius: 8px;
          display: inline-block;
          margin: 4px 0;
          letter-spacing: 1px;
        }

        .board-bullet-text {
          font-size: 1.1rem;
          padding-left: 16px;
        }

        .board-highlight-text {
          font-size: 1.2rem;
          color: #ffd700 !important;
          padding: 4px 12px;
          background: rgba(255, 215, 0, 0.1);
          border-left: 4px solid #ffd700;
          border-radius: 4px;
        }

        .cursor {
          animation: blink 0.7s infinite;
          font-weight: bold;
          color: #ffd700;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .board-media-area {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          position: sticky;
          top: 0;
          align-self: flex-start;
        }

        .media-frame {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          animation: fadeInMedia 0.6s ease-out;
        }

        @keyframes fadeInMedia {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateX(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateX(0); 
          }
        }

        .board-media-image {
          width: 100%;
          max-height: 250px;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }

        .media-caption {
          margin-top: 10px;
          font-size: 1rem;
          color: #ffd700;
          text-align: center;
        }

        .idle-message, .loading-message, .error-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: rgba(255, 255, 255, 0.9);
        }

        .idle-message p, .error-message p {
          font-size: 1.8rem;
          margin: 10px 0;
        }

        .loading-message {
          gap: 24px;
        }

        .chalk-animation span {
          font-size: 1.8rem;
          color: #fff;
        }

        .loading-dots {
          display: flex;
          gap: 10px;
        }

        .loading-dots span {
          width: 14px;
          height: 14px;
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

        .lesson-complete {
          margin-top: 20px;
          text-align: center;
          padding: 16px;
          background: rgba(76, 175, 80, 0.2);
          border-radius: 12px;
          border: 2px solid rgba(76, 175, 80, 0.4);
        }

        .lesson-complete p {
          font-size: 1.5rem;
          color: #81c784;
          margin: 0;
        }

        .error-message {
          color: #ff6b6b;
        }
      `}</style>
    </div>
  );
}
