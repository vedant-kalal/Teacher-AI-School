import { useState, useEffect } from 'react';
import { BoardState, BoardLine, BoardWriteStyle, cleanTextForBoard } from '../types/events';

interface StreamingBlackboardProps {
  boardState: BoardState;
  isNarrating: boolean;
  lessonStatus: 'idle' | 'starting' | 'running' | 'paused' | 'completed' | 'error';
  topic: string;
  title: string;
}

const LINES_PER_PAGE = 10;

export default function StreamingBlackboard({
  boardState,
  isNarrating,
  lessonStatus,
  topic,
  title,
}: StreamingBlackboardProps) {
  const [animatedLines, setAnimatedLines] = useState<Map<string, string>>(new Map());
  const [clearAnimation, setClearAnimation] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(boardState.lines.length / LINES_PER_PAGE));
  
  useEffect(() => {
    setCurrentPage(totalPages - 1);
  }, [boardState.lines.length]);

  useEffect(() => {
    if (boardState.isClearing) {
      setClearAnimation(true);
      const timer = setTimeout(() => {
        setClearAnimation(false);
        setAnimatedLines(new Map());
        setCurrentPage(0);
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
  }, [boardState.lines]);

  const animateLine = (line: BoardLine) => {
    const cleanText = cleanTextForBoard(line.text);
    let index = 0;
    const charDelay = 25;

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
      case BoardWriteStyle.TITLE: return 'line-title';
      case BoardWriteStyle.HEADING: return 'line-heading';
      case BoardWriteStyle.FORMULA: return 'line-formula';
      case BoardWriteStyle.BULLET: return 'line-bullet';
      case BoardWriteStyle.HIGHLIGHT: return 'line-highlight';
      default: return 'line-normal';
    }
  };

  const startIdx = currentPage * LINES_PER_PAGE;
  const endIdx = startIdx + LINES_PER_PAGE;
  const visibleLines = boardState.lines.slice(startIdx, endIdx);

  const goToPrevPage = () => setCurrentPage(p => Math.max(0, p - 1));
  const goToNextPage = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div className="board-container">
      <div className="board-frame">
        <div className="board">
          {lessonStatus === 'idle' && (
            <div className="center-msg chalk-font">
              <p>📚 Welcome to AI Teacher!</p>
              <p>Enter a topic above to begin.</p>
            </div>
          )}

          {lessonStatus === 'starting' && (
            <div className="center-msg chalk-font">
              <span>🎓 Preparing lesson on {topic}...</span>
              <div className="dots"><span></span><span></span><span></span></div>
            </div>
          )}

          {lessonStatus === 'error' && (
            <div className="center-msg chalk-font error">
              <p>❌ Something went wrong. Please try again.</p>
            </div>
          )}

          {(lessonStatus === 'running' || lessonStatus === 'completed' || lessonStatus === 'paused') && (
            <div className={`content ${clearAnimation ? 'clearing' : ''}`}>
              {isNarrating && <div className="speaking">🔊 Speaking...</div>}
              
              {title && <div className="main-title chalk-font">{title}</div>}

              <div className="layout">
                <div className="text-side">
                  {visibleLines.map((line) => {
                    const displayText = animatedLines.get(line.id) || '';
                    const isComplete = displayText.length >= cleanTextForBoard(line.text).length;
                    return (
                      <div
                        key={line.id}
                        className={`line ${getStyleClasses(line.style)} chalk-font`}
                        style={{ color: line.color === 'yellow' ? '#ffd700' : '#fff' }}
                      >
                        {displayText}
                        {!isComplete && <span className="caret">|</span>}
                      </div>
                    );
                  })}

                  {lessonStatus === 'completed' && currentPage === totalPages - 1 && (
                    <div className="done chalk-font">✅ Lesson Complete!</div>
                  )}
                </div>

                <div className="image-side">
                  {boardState.currentMedia && (boardState.currentMedia.image_base64 || boardState.currentMedia.image_url) && (
                    <div className="img-box">
                      <img
                        src={
                          boardState.currentMedia.image_base64
                            ? `data:image/png;base64,${boardState.currentMedia.image_base64}`
                            : boardState.currentMedia.image_url
                        }
                        alt={boardState.currentMedia.title}
                      />
                      <div className="img-label chalk-font">{boardState.currentMedia.title}</div>
                    </div>
                  )}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={goToPrevPage} disabled={currentPage === 0}>← Prev</button>
                  <span className="page-info">Page {currentPage + 1} / {totalPages}</span>
                  <button onClick={goToNextPage} disabled={currentPage === totalPages - 1}>Next →</button>
                </div>
              )}
            </div>
          )}

          <div className="tray">
            <div className="chalk-piece white"></div>
            <div className="chalk-piece yellow"></div>
            <div className="chalk-piece blue"></div>
          </div>
        </div>
      </div>

      <style>{`
        .board-container {
          width: 100%;
          height: 100%;
        }

        .board-frame {
          background: linear-gradient(135deg, #5c4033, #4a3228, #5c4033);
          padding: 12px;
          border-radius: 8px;
          height: 100%;
          width: 100%;
        }

        .board {
          background: linear-gradient(145deg, #1a472a, #0d2818, #153d24, #1a472a);
          width: 100%;
          height: 100%;
          border-radius: 4px;
          padding: 15px 20px 25px 20px;
          position: relative;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tray {
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 12px;
          background: linear-gradient(to bottom, #6b5344, #5c4033);
          border-radius: 2px 2px 0 0;
          display: flex;
          gap: 8px;
          padding: 2px 10px;
          align-items: center;
        }

        .chalk-piece {
          width: 30px;
          height: 6px;
          border-radius: 2px;
        }
        .chalk-piece.white { background: linear-gradient(#fff, #e0e0e0); }
        .chalk-piece.yellow { background: linear-gradient(#ffd700, #daa520); }
        .chalk-piece.blue { background: linear-gradient(#87ceeb, #6bb3d9); }

        .chalk-font {
          font-family: 'Caveat', 'Segoe Script', cursive;
          text-shadow: 0 0 3px rgba(255,255,255,0.2);
        }

        .center-msg {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 1.5rem;
          gap: 12px;
        }
        .center-msg p { margin: 6px 0; }
        .center-msg.error { color: #ff6b6b; }

        .dots {
          display: flex;
          gap: 6px;
        }
        .dots span {
          width: 10px;
          height: 10px;
          background: rgba(255,255,255,0.8);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dots span:nth-child(1) { animation-delay: -0.32s; }
        .dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          color: #fff;
          overflow: hidden;
        }

        .content.clearing {
          animation: fadeOut 0.5s ease-out forwards;
        }
        @keyframes fadeOut {
          to { opacity: 0; filter: blur(4px); }
        }

        .speaking {
          position: absolute;
          top: 8px;
          right: 12px;
          background: rgba(102,126,234,0.4);
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .main-title {
          font-size: 1.4rem;
          text-align: center;
          border-bottom: 2px solid rgba(255,255,255,0.3);
          padding-bottom: 8px;
          margin-bottom: 10px;
          flex-shrink: 0;
        }

        .layout {
          flex: 1;
          display: flex;
          gap: 15px;
          overflow: hidden;
        }

        .text-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .line {
          font-size: 1rem;
          line-height: 1.35;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .line-title { font-size: 1.2rem; color: #ffd700 !important; }
        .line-heading { font-size: 1.1rem; color: #87ceeb !important; margin-top: 4px; }
        .line-normal { font-size: 1rem; }
        .line-formula { 
          font-family: 'Times New Roman', serif;
          background: rgba(0,0,0,0.2);
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .line-bullet { padding-left: 12px; }
        .line-highlight {
          color: #ffd700 !important;
          background: rgba(255,215,0,0.1);
          border-left: 3px solid #ffd700;
          padding-left: 8px;
        }

        .caret {
          animation: blink 0.7s infinite;
          color: #ffd700;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .done {
          margin-top: auto;
          padding: 10px;
          background: rgba(76,175,80,0.2);
          border: 1px solid rgba(76,175,80,0.4);
          border-radius: 6px;
          text-align: center;
          color: #81c784;
          font-size: 1.1rem;
        }

        .image-side {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .img-box {
          background: rgba(255,255,255,0.08);
          padding: 8px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .img-box img {
          max-width: 260px;
          max-height: 280px;
          border-radius: 6px;
          display: block;
        }

        .img-label {
          margin-top: 6px;
          font-size: 0.85rem;
          color: #ffd700;
          text-align: center;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 8px;
          flex-shrink: 0;
        }

        .pagination button {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background 0.2s;
        }
        .pagination button:hover:not(:disabled) {
          background: rgba(255,255,255,0.25);
        }
        .pagination button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </div>
  );
}
