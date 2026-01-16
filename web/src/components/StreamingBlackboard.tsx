import { useState, useEffect } from 'react';
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

const MAX_VISIBLE_LINES = 12;

export default function StreamingBlackboard({
  boardState,
  isNarrating,
  lessonStatus,
  topic,
  title,
}: StreamingBlackboardProps) {
  const [animatedLines, setAnimatedLines] = useState<Map<string, string>>(new Map());
  const [clearAnimation, setClearAnimation] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<BoardLine[]>([]);

  useEffect(() => {
    if (boardState.isClearing) {
      setClearAnimation(true);
      const timer = setTimeout(() => {
        setClearAnimation(false);
        setAnimatedLines(new Map());
        setDisplayedLines([]);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [boardState.isClearing]);

  useEffect(() => {
    const lines = boardState.lines.slice(-MAX_VISIBLE_LINES);
    setDisplayedLines(lines);
    
    lines.forEach((line) => {
      if (!animatedLines.has(line.id)) {
        animateLine(line);
      }
    });
  }, [boardState.lines]);

  const animateLine = (line: BoardLine) => {
    const cleanText = cleanTextForBoard(line.text);
    let index = 0;
    const charDelay = 30;

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

  return (
    <div className="blackboard-wrapper">
      <div className="blackboard-frame">
        <div className="blackboard">
          <div className="chalk-tray">
            <div className="chalk white"></div>
            <div className="chalk yellow"></div>
            <div className="chalk blue"></div>
          </div>
          
          {lessonStatus === 'idle' && (
            <div className="center-message handwriting">
              <p>📚 Welcome to AI Teacher!</p>
              <p>Enter a topic above to begin.</p>
            </div>
          )}

          {lessonStatus === 'starting' && (
            <div className="center-message">
              <span className="handwriting">🎓 Preparing lesson on {topic}...</span>
              <div className="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          {lessonStatus === 'error' && (
            <div className="center-message handwriting error">
              <p>❌ Something went wrong.</p>
              <p>Please try again.</p>
            </div>
          )}

          {(lessonStatus === 'running' || lessonStatus === 'completed' || lessonStatus === 'paused') && (
            <div className={`board-content ${clearAnimation ? 'clearing' : ''}`}>
              {isNarrating && (
                <div className="speaking-badge">
                  <span>🔊 Speaking...</span>
                </div>
              )}

              {title && (
                <div className="board-title handwriting">{title}</div>
              )}

              <div className="board-body">
                <div className="text-column">
                  {displayedLines.map((line) => {
                    const displayText = animatedLines.get(line.id) || '';
                    const isComplete = displayText.length >= cleanTextForBoard(line.text).length;

                    return (
                      <div
                        key={line.id}
                        className={`board-line ${getStyleClasses(line.style)} handwriting`}
                        style={{ color: line.color === 'yellow' ? '#ffd700' : '#fff' }}
                      >
                        {displayText}
                        {!isComplete && <span className="cursor">|</span>}
                      </div>
                    );
                  })}

                  {lessonStatus === 'completed' && (
                    <div className="complete-badge handwriting">✅ Lesson Complete!</div>
                  )}
                </div>

                {boardState.currentMedia && (boardState.currentMedia.image_base64 || boardState.currentMedia.image_url) && (
                  <div className="image-column">
                    <div className="media-box">
                      <img
                        src={
                          boardState.currentMedia.image_base64
                            ? `data:image/png;base64,${boardState.currentMedia.image_base64}`
                            : boardState.currentMedia.image_url
                        }
                        alt={boardState.currentMedia.title}
                      />
                      <div className="media-label handwriting">{boardState.currentMedia.title}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .blackboard-wrapper {
          width: 100%;
          height: 100%;
        }

        .blackboard-frame {
          background: linear-gradient(135deg, #5c4033 0%, #4a3228 50%, #5c4033 100%);
          padding: 18px;
          border-radius: 12px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
          height: 100%;
          width: 100%;
        }

        .blackboard {
          background: linear-gradient(145deg, #1a472a 0%, #0d2818 40%, #153d24 70%, #1a472a 100%);
          width: 100%;
          height: 100%;
          border-radius: 6px;
          padding: 20px 30px 30px 30px;
          position: relative;
          box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .blackboard::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.04;
          pointer-events: none;
        }

        .chalk-tray {
          position: absolute;
          bottom: 0;
          left: 30px;
          right: 30px;
          height: 16px;
          background: linear-gradient(to bottom, #6b5344, #5c4033);
          border-radius: 3px 3px 0 0;
          display: flex;
          gap: 12px;
          padding: 3px 15px;
          align-items: center;
        }

        .chalk {
          width: 35px;
          height: 8px;
          border-radius: 2px;
        }
        .chalk.white { background: linear-gradient(to bottom, #fff, #e0e0e0); }
        .chalk.yellow { background: linear-gradient(to bottom, #ffd700, #daa520); }
        .chalk.blue { background: linear-gradient(to bottom, #87ceeb, #6bb3d9); }

        .handwriting {
          font-family: 'Caveat', 'Segoe Script', cursive;
          text-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
        }

        .center-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: #fff;
          font-size: 2rem;
          gap: 20px;
        }
        .center-message p { margin: 10px 0; }
        .center-message.error { color: #ff6b6b; }

        .loading-dots {
          display: flex;
          gap: 10px;
        }
        .loading-dots span {
          width: 14px;
          height: 14px;
          background: rgba(255,255,255,0.8);
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
          flex: 1;
          display: flex;
          flex-direction: column;
          color: #fff;
          overflow: hidden;
        }

        .board-content.clearing {
          animation: magicalClear 0.5s ease-out forwards;
        }
        @keyframes magicalClear {
          0% { opacity: 1; filter: blur(0); }
          100% { opacity: 0; filter: blur(4px); transform: translateY(-10px); }
        }

        .speaking-badge {
          position: absolute;
          top: 15px;
          right: 20px;
          background: rgba(102, 126, 234, 0.4);
          padding: 6px 14px;
          border-radius: 14px;
          font-size: 0.9rem;
          animation: pulse 1.5s infinite;
          z-index: 10;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .board-title {
          font-size: 2.2rem;
          text-align: center;
          border-bottom: 3px solid rgba(255,255,255,0.3);
          padding-bottom: 12px;
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .board-body {
          flex: 1;
          display: flex;
          gap: 30px;
          overflow: hidden;
        }

        .text-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
        }

        .board-line {
          font-size: 1.4rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .board-title-text { font-size: 1.8rem; color: #ffd700 !important; }
        .board-heading-text { font-size: 1.6rem; color: #87ceeb !important; margin-top: 8px; }
        .board-normal-text { font-size: 1.4rem; }
        .board-formula-text { 
          font-family: 'Times New Roman', serif;
          background: rgba(0,0,0,0.2);
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-block;
        }
        .board-bullet-text { padding-left: 16px; }
        .board-highlight-text {
          color: #ffd700 !important;
          background: rgba(255,215,0,0.1);
          border-left: 4px solid #ffd700;
          padding-left: 12px;
        }

        .cursor {
          animation: blink 0.7s infinite;
          color: #ffd700;
          font-weight: bold;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .complete-badge {
          margin-top: auto;
          padding: 14px;
          background: rgba(76, 175, 80, 0.2);
          border: 2px solid rgba(76, 175, 80, 0.4);
          border-radius: 10px;
          text-align: center;
          color: #81c784;
          font-size: 1.5rem;
        }

        .image-column {
          width: 350px;
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .media-box {
          background: rgba(255,255,255,0.08);
          padding: 12px;
          border-radius: 12px;
          border: 2px solid rgba(255,255,255,0.15);
          animation: fadeIn 0.5s ease-out;
          max-width: 100%;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .media-box img {
          max-width: 320px;
          max-height: 350px;
          border-radius: 8px;
          display: block;
        }

        .media-label {
          margin-top: 10px;
          font-size: 1.1rem;
          color: #ffd700;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
