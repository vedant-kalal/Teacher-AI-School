import { useState, useEffect, useRef, useCallback } from 'react';
import { BoardState, BoardLine, BoardWriteStyle, cleanTextForBoard, DEFAULT_LAYOUT } from '../types/events';

interface StreamingBlackboardProps {
  boardState: BoardState;
  isNarrating: boolean;
  lessonStatus: 'idle' | 'starting' | 'running' | 'paused' | 'completed' | 'error';
  topic: string;
  title: string;
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
  const [currentlyWritingId, setCurrentlyWritingId] = useState<string | null>(null);
  const animatedLinesRef = useRef<Set<string>>(new Set());
  const textSideRef = useRef<HTMLDivElement>(null);

  const rawLayout = boardState.layout || DEFAULT_LAYOUT;
  const layout = {
    text_size: rawLayout.text_size || 'large',
    text_width_percent: Math.min(70, Math.max(50, rawLayout.text_width_percent || 60)),
    image_size: rawLayout.image_size || 'large',
    image_width_percent: Math.min(50, Math.max(30, rawLayout.image_width_percent || 40)),
    image_position: rawLayout.image_position || 'right',
    image_height_percent: Math.min(90, Math.max(40, rawLayout.image_height_percent || 70)),
    line_spacing: rawLayout.line_spacing || 'normal',
    board_padding: rawLayout.board_padding || 'normal',
    title_size: rawLayout.title_size || 'large',
  };

  useEffect(() => {
    if (textSideRef.current) {
      textSideRef.current.scrollTop = textSideRef.current.scrollHeight;
    }
  }, [animatedLines]);

  useEffect(() => {
    if (boardState.isClearing) {
      setClearAnimation(true);
      setTimeout(() => {
        setClearAnimation(false);
        setAnimatedLines(new Map());
        animatedLinesRef.current.clear();
        setCurrentlyWritingId(null);
      }, 600);
    }
  }, [boardState.isClearing]);

  // Also clear animation refs when lines array is emptied
  useEffect(() => {
    if (boardState.lines.length === 0 && animatedLinesRef.current.size > 0) {
      setAnimatedLines(new Map());
      animatedLinesRef.current.clear();
      setCurrentlyWritingId(null);
    }
  }, [boardState.lines.length]);

  const animateLine = useCallback((line: BoardLine) => {
    const cleanText = cleanTextForBoard(line.text);
    let index = 0;
    const charDelay = 30;

    setCurrentlyWritingId(line.id);

    const animate = () => {
      if (index <= cleanText.length) {
        setAnimatedLines((prev) => new Map(prev).set(line.id, cleanText.substring(0, index)));
        index++;
        if (index <= cleanText.length) {
          setTimeout(animate, charDelay);
        } else {
          setCurrentlyWritingId(null);
        }
      }
    };
    animate();
  }, []);

  useEffect(() => {
    boardState.lines.forEach((line) => {
      if (!animatedLinesRef.current.has(line.id)) {
        animatedLinesRef.current.add(line.id);
        animateLine(line);
      }
    });
  }, [boardState.lines, animateLine]);

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

  const getTextSizeRem = (size: string): string => {
    switch (size) {
      case 'small': return '1.1rem';
      case 'medium': return '1.4rem';
      case 'large': return '1.8rem';
      default: return '1.4rem';
    }
  };

  const getTitleSizeRem = (size: string): string => {
    switch (size) {
      case 'normal': return '1.6rem';
      case 'large': return '2rem';
      case 'huge': return '2.5rem';
      default: return '2rem';
    }
  };

  const getLineSpacingRem = (spacing: string): string => {
    switch (spacing) {
      case 'compact': return '0.3rem';
      case 'normal': return '0.6rem';
      case 'relaxed': return '1rem';
      default: return '0.6rem';
    }
  };

  const getPaddingRem = (padding: string): string => {
    switch (padding) {
      case 'minimal': return '10px';
      case 'normal': return '20px';
      case 'spacious': return '35px';
      default: return '20px';
    }
  };

  const isWriting = currentlyWritingId !== null;

  return (
    <div className="board-container">
      <div className="board-frame">
        <div className="board" style={{ padding: getPaddingRem(layout.board_padding) }}>
          {lessonStatus === 'idle' && (
            <div className="center-msg chalk-font">
              <p style={{ fontSize: '2rem' }}>Welcome to AI Teacher</p>
              <p style={{ fontSize: '1.5rem' }}>Enter a topic above to begin your lesson.</p>
            </div>
          )}

          {lessonStatus === 'starting' && (
            <div className="center-msg chalk-font">
              <span style={{ fontSize: '1.8rem' }}>Preparing lesson on {topic}...</span>
              <div className="dots"><span></span><span></span><span></span></div>
            </div>
          )}

          {lessonStatus === 'error' && (
            <div className="center-msg chalk-font error">
              <p style={{ fontSize: '1.8rem' }}>Something went wrong. Please try again.</p>
            </div>
          )}

          {(lessonStatus === 'running' || lessonStatus === 'completed' || lessonStatus === 'paused') && (
            <div className={`content ${clearAnimation ? 'clearing' : ''}`}>
              {(isWriting || isNarrating) && (
                <div className="speaking">Speaking...</div>
              )}
              
              {title && (
                <div 
                  className="main-title chalk-font"
                  style={{ fontSize: getTitleSizeRem(layout.title_size) }}
                >
                  {title}
                </div>
              )}

              <div 
                className="layout"
                style={{
                  flexDirection: layout.image_position === 'left' ? 'row-reverse' : 
                                 layout.image_position === 'top' ? 'column-reverse' :
                                 layout.image_position === 'bottom' ? 'column' : 'row',
                }}
              >
                <div 
                  className="text-side"
                  ref={textSideRef}
                  style={{ 
                    flex: layout.image_position === 'none' ? '1' : `0 0 ${layout.text_width_percent}%`,
                    gap: getLineSpacingRem(layout.line_spacing),
                  }}
                >
                  {boardState.lines.map((line) => {
                    const displayText = animatedLines.get(line.id) || '';
                    const fullText = cleanTextForBoard(line.text);
                    const isComplete = displayText.length >= fullText.length;
                    const isCurrentlyWriting = currentlyWritingId === line.id;
                    return (
                      <div
                        key={line.id}
                        className={`line ${getStyleClasses(line.style)} chalk-font ${isCurrentlyWriting ? 'writing' : ''}`}
                        style={{ 
                          color: line.color === 'yellow' ? '#ffd700' : '#fff',
                          fontSize: line.style === BoardWriteStyle.TITLE ? getTitleSizeRem(layout.title_size) :
                                   line.style === BoardWriteStyle.HEADING ? `calc(${getTextSizeRem(layout.text_size)} * 1.15)` :
                                   getTextSizeRem(layout.text_size),
                        }}
                      >
                        {displayText}
                        {!isComplete && <span className="caret">|</span>}
                      </div>
                    );
                  })}

                  {lessonStatus === 'completed' && (
                    <div className="done chalk-font" style={{ fontSize: getTextSizeRem(layout.text_size) }}>
                      Lesson Complete!
                    </div>
                  )}
                </div>

                {boardState.mediaGallery.length > 0 && layout.image_position !== 'none' && (
                  <div 
                    className="image-side"
                    style={{ 
                      flex: `0 0 ${layout.image_width_percent}%`,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div className="image-gallery">
                      {[...boardState.mediaGallery].reverse().slice(0, 6).map((media, idx) => (
                        (media.image_base64 || media.image_url) && (
                          <div 
                            key={`${media.title}-${idx}`} 
                            className={`gallery-item ${idx === 0 ? 'current' : ''}`}
                          >
                            <img
                              src={
                                media.image_base64
                                  ? `data:image/png;base64,${media.image_base64}`
                                  : media.image_url
                              }
                              alt={media.title}
                            />
                            <div className="img-label chalk-font">{media.title}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
          font-family: 'Patrick Hand', 'Caveat', 'Comic Sans MS', cursive;
          text-shadow: 0 0 4px rgba(255,255,255,0.25);
          letter-spacing: 0.5px;
        }

        .center-msg {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          gap: 16px;
        }
        .center-msg p { margin: 8px 0; }
        .center-msg.error { color: #ff6b6b; }

        .dots {
          display: flex;
          gap: 8px;
        }
        .dots span {
          width: 12px;
          height: 12px;
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
          padding-bottom: 20px;
        }

        .content.clearing {
          animation: fadeOut 0.5s ease-out forwards;
        }
        @keyframes fadeOut {
          to { opacity: 0; filter: blur(4px); }
        }

        .speaking {
          position: absolute;
          top: 12px;
          right: 16px;
          background: rgba(102,126,234,0.5);
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 0.9rem;
          animation: pulse 1.5s infinite;
          z-index: 10;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .main-title {
          text-align: center;
          border-bottom: 2px solid rgba(255,255,255,0.35);
          padding-bottom: 12px;
          margin-bottom: 16px;
          flex-shrink: 0;
          color: #ffd700;
        }

        .layout {
          flex: 1;
          display: flex;
          gap: 10px;
          overflow: hidden;
        }

        .text-side {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 10px;
        }

        .text-side::-webkit-scrollbar {
          width: 6px;
        }
        .text-side::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .text-side::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }

        .line {
          line-height: 1.4;
          white-space: pre-wrap;
          word-wrap: break-word;
          transition: opacity 0.2s;
        }

        .line.writing {
          opacity: 1;
        }

        .line-title { color: #ffd700 !important; font-weight: 600; }
        .line-heading { color: #87ceeb !important; margin-top: 8px; }
        .line-normal { }
        .line-formula { 
          font-family: 'Times New Roman', serif;
          background: rgba(0,0,0,0.25);
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-block;
          margin: 4px 0;
        }
        .line-bullet { padding-left: 16px; }
        .line-highlight {
          color: #ffd700 !important;
          background: rgba(255,215,0,0.12);
          border-left: 4px solid #ffd700;
          padding: 4px 12px;
          margin: 4px 0;
        }

        .caret {
          animation: blink 0.7s infinite;
          color: #ffd700;
          font-weight: bold;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .done {
          margin-top: auto;
          padding: 14px;
          background: rgba(76,175,80,0.25);
          border: 2px solid rgba(76,175,80,0.5);
          border-radius: 8px;
          text-align: center;
          color: #81c784;
        }

        .image-side {
          display: flex;
          justify-content: flex-start;
          flex-shrink: 0;
          overflow-y: auto;
          overflow-x: hidden;
          height: 100%;
        }

        .image-side::-webkit-scrollbar {
          width: 6px;
        }
        .image-side::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .image-side::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }

        .image-gallery {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 10px;
          width: 100%;
        }

        .gallery-item {
          background: rgba(0,0,0,0.3);
          padding: 8px;
          border-radius: 10px;
          border: 2px solid rgba(255,255,255,0.2);
          animation: fadeIn 0.4s ease-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0.85;
          transition: opacity 0.3s, transform 0.3s, border-color 0.3s;
        }

        .gallery-item.current {
          opacity: 1;
          border-color: #ffd700;
          transform: scale(1.03);
          box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
        }

        .gallery-item img {
          width: 100%;
          height: 220px;
          border-radius: 8px;
          object-fit: cover;
          background: rgba(0,0,0,0.2);
        }

        .gallery-item .img-label {
          font-size: 1rem;
          margin-top: 10px;
          color: #fff;
          text-align: center;
          max-width: 100%;
          line-height: 1.3;
          word-wrap: break-word;
          white-space: normal;
        }

        .gallery-item.current .img-label {
          color: #ffd700;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
