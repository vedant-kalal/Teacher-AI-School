import { useState, useEffect, useRef } from 'react';

interface BlackboardProps {
  content: any | null;
  lessonPlan: any | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  topic: string;
  diagrams?: any[];
  images?: any[];
  onNarrationComplete?: () => void;
}

export default function Blackboard({ content, lessonPlan, status, topic, diagrams, images, onNarrationComplete }: BlackboardProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isNarrating, setIsNarrating] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const textRef = useRef('');
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      setIsNarrating(false);
    };
  }, []);

  useEffect(() => {
    if (status === 'completed' && content) {
      speechSynthesis.cancel();
      setIsNarrating(false);
      
      const sections = content.sections || [];
      const fullText = sections
        .filter((s: any) => s.type === 'content')
        .map((s: any) => s.content)
        .join('\n\n');
      
      textRef.current = fullText;
      setDisplayedText('');
      setShowImages(false);
      
      animateText(fullText);
    }
  }, [status, content]);

  const animateText = (text: string) => {
    let index = 0;
    const words = text.split(' ');
    
    const interval = setInterval(() => {
      if (index < words.length) {
        setDisplayedText(words.slice(0, index + 1).join(' '));
        index++;
      } else {
        clearInterval(interval);
        setShowImages(true);
      }
    }, 60);

    return () => clearInterval(interval);
  };

  const startNarration = () => {
    if (!content?.narration || isNarrating) return;

    setIsNarrating(true);
    const utterance = new SpeechSynthesisUtterance(content.narration);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) 
                      || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsNarrating(false);
      onNarrationComplete?.();
    };

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const stopNarration = () => {
    speechSynthesis.cancel();
    setIsNarrating(false);
  };

  const getGeneratedImage = () => {
    const diagram = diagrams?.[0];
    const image = images?.[0];
    
    if (diagram?.image_base64 || diagram?.imageBase64) {
      return { 
        base64: diagram.image_base64 || diagram.imageBase64, 
        title: diagram.title || 'Diagram',
        url: diagram.image_url || diagram.imageUrl
      };
    }
    if (image?.image_base64 || image?.imageBase64) {
      return { 
        base64: image.image_base64 || image.imageBase64, 
        title: 'Educational Image',
        url: image.image_url || image.imageUrl
      };
    }
    if (diagram?.image_url || diagram?.imageUrl) {
      return { url: diagram.image_url || diagram.imageUrl, title: diagram.title || 'Diagram' };
    }
    if (image?.image_url || image?.imageUrl) {
      return { url: image.image_url || image.imageUrl, title: 'Educational Image' };
    }
    return null;
  };

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
      const title = content.title || topic;
      const generatedImage = getGeneratedImage();
      
      return (
        <div className="board-content">
          <h2 className="board-title handwriting">{title}</h2>
          
          {content.narration && (
            <div className="narration-controls">
              {isNarrating ? (
                <button onClick={stopNarration} className="speak-btn stop">
                  🔊 Stop Narration
                </button>
              ) : (
                <button onClick={startNarration} className="speak-btn">
                  🔊 Listen to Teacher
                </button>
              )}
            </div>
          )}
          
          <div className="streaming-content handwriting">
            {displayedText}
            {displayedText.length < textRef.current.length && (
              <span className="cursor">|</span>
            )}
          </div>

          {showImages && generatedImage && (
            <div className="board-image-container">
              <img 
                src={generatedImage.base64 
                  ? `data:image/png;base64,${generatedImage.base64}` 
                  : generatedImage.url}
                alt={generatedImage.title}
                className="board-generated-image"
              />
              <p className="image-caption handwriting">{generatedImage.title}</p>
            </div>
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

        .narration-controls {
          text-align: center;
          margin-bottom: 20px;
        }

        .speak-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 10px 24px;
          border-radius: 24px;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .speak-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .speak-btn.stop {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        }

        .streaming-content {
          font-size: 1.3rem;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .cursor {
          animation: blink 0.7s infinite;
          font-weight: bold;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .board-image-container {
          margin-top: 30px;
          text-align: center;
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .board-generated-image {
          max-width: 100%;
          max-height: 400px;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
          border: 3px solid rgba(255, 255, 255, 0.2);
        }

        .image-caption {
          margin-top: 12px;
          font-size: 1.2rem;
          color: #ffd700;
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

        .learning-objectives ul, .key-points ul {
          list-style: none;
          padding-left: 20px;
        }

        .learning-objectives li, .key-points li {
          position: relative;
          margin: 8px 0;
        }

        .learning-objectives li::before, .key-points li::before {
          content: '>';
          position: absolute;
          left: -20px;
          color: #ffd700;
        }

        .error-message {
          color: #ff6b6b;
        }
      `}</style>
    </div>
  );
}
