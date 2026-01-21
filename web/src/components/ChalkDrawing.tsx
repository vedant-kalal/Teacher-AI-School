import { useState, useEffect, useRef } from 'react';

interface DrawingStep {
  step_id: number;
  type: 'path' | 'label' | 'text' | 'circle' | 'rect' | 'arrow' | 'line' | 'ellipse' | 'group';
  d?: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  radius?: number;
  label?: string;
  text?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  lineToX?: number;
  lineToY?: number;
  description?: string;
  delay_ms: number;
  draw_duration_ms: number;
  paths?: DrawingStep[];
}

interface LabelPosition {
  label: string;
  angle: number;
  index: number;
}

interface ChalkDrawingProps {
  title: string;
  drawingType: string;
  isGeneratedImage?: boolean;
  imageBase64?: string;
  mimeType?: string;
  keyParts?: string[];
  labelPositions?: LabelPosition[];
  steps?: DrawingStep[];
  totalDuration?: number;
  explanation: string;
  isActive: boolean;
}

export default function ChalkDrawing({
  title,
  drawingType,
  isGeneratedImage,
  imageBase64,
  mimeType,
  keyParts,
  labelPositions,
  steps = [],
  totalDuration,
  explanation,
  isActive,
}: ChalkDrawingProps) {
  const [showImage, setShowImage] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [drawnSteps, setDrawnSteps] = useState<number[]>([]);
  const [animatingSteps, setAnimatingSteps] = useState<Set<number>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<Map<number, SVGPathElement>>(new Map());
  
  void drawingType;
  void totalDuration;
  
  useEffect(() => {
    if (!isActive) return;
    
    if (isGeneratedImage && imageBase64) {
      setShowImage(false);
      setShowLabels(false);
      
      const showImageTimer = setTimeout(() => {
        setShowImage(true);
      }, 300);
      
      const showLabelsTimer = setTimeout(() => {
        setShowLabels(true);
      }, 1500);
      
      return () => {
        clearTimeout(showImageTimer);
        clearTimeout(showLabelsTimer);
      };
    } else if (steps && steps.length > 0) {
      setCurrentStepIndex(-1);
      setDrawnSteps([]);
      setAnimatingSteps(new Set());
      pathRefs.current.clear();
      
      let timeouts: NodeJS.Timeout[] = [];
      
      steps.forEach((step, idx) => {
        const startTimeout = setTimeout(() => {
          setCurrentStepIndex(idx);
          setAnimatingSteps(prev => new Set(prev).add(step.step_id));
          setDrawnSteps(prev => [...prev, step.step_id]);
          
          const pathEl = pathRefs.current.get(step.step_id);
          if (pathEl && step.type === 'path') {
            const length = pathEl.getTotalLength();
            pathEl.style.strokeDasharray = `${length}`;
            pathEl.style.strokeDashoffset = `${length}`;
            pathEl.style.animation = `chalk-path-draw ${step.draw_duration_ms}ms ease-out forwards`;
          }
        }, step.delay_ms);
        
        const endTimeout = setTimeout(() => {
          setAnimatingSteps(prev => {
            const next = new Set(prev);
            next.delete(step.step_id);
            return next;
          });
        }, step.delay_ms + step.draw_duration_ms);
        
        timeouts.push(startTimeout, endTimeout);
      });
      
      return () => {
        timeouts.forEach(t => clearTimeout(t));
      };
    }
  }, [isActive, isGeneratedImage, imageBase64, steps]);

  if (isGeneratedImage && imageBase64) {
    const imgSrc = `data:${mimeType || 'image/png'};base64,${imageBase64}`;
    
    return (
      <div className="chalk-drawing-container generated-image">
        <div className="drawing-title chalk-font">{title}</div>
        
        <div className={`chalk-image-wrapper ${showImage ? 'visible' : ''}`}>
          <img 
            src={imgSrc} 
            alt={title}
            className="chalk-generated-image"
          />
          
          {showLabels && keyParts && keyParts.length > 0 && (
            <div className="chalk-labels-overlay">
              {keyParts.slice(0, 6).map((part, idx) => (
                <div 
                  key={idx} 
                  className={`chalk-label-item label-${idx}`}
                  style={{ animationDelay: `${idx * 200}ms` }}
                >
                  <span className="label-arrow">→</span>
                  <span className="label-text">{part}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {explanation && (
          <div className="drawing-explanation chalk-font">{explanation}</div>
        )}
        
        <style>{`
          .chalk-drawing-container.generated-image {
            background: rgba(20, 40, 30, 0.7);
            border-radius: 16px;
            padding: 20px;
            margin: 16px 0;
            border: 3px solid rgba(255, 255, 255, 0.25);
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
          }
          
          .chalk-image-wrapper {
            position: relative;
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 0.8s ease-out, transform 0.8s ease-out;
            border-radius: 12px;
            overflow: hidden;
          }
          
          .chalk-image-wrapper.visible {
            opacity: 1;
            transform: scale(1);
          }
          
          .chalk-generated-image {
            width: 100%;
            height: auto;
            max-height: 400px;
            object-fit: contain;
            border-radius: 8px;
            filter: brightness(1.05) contrast(1.1);
          }
          
          .chalk-labels-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
          }
          
          .chalk-label-item {
            position: absolute;
            background: rgba(0, 0, 0, 0.75);
            color: #ffd54f;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-family: 'Patrick Hand', cursive;
            opacity: 0;
            animation: label-fade-in 0.5s ease-out forwards;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
          }
          
          .label-arrow {
            color: #ff9999;
            font-weight: bold;
          }
          
          .label-0 { top: 10%; right: 5%; }
          .label-1 { top: 25%; left: 5%; }
          .label-2 { top: 40%; right: 5%; }
          .label-3 { top: 55%; left: 5%; }
          .label-4 { top: 70%; right: 5%; }
          .label-5 { top: 85%; left: 5%; }
          
          @keyframes label-fade-in {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    );
  }

  const renderStep = (step: DrawingStep, isDrawing: boolean) => {
    const strokeColor = step.stroke || '#ffffff';
    const fillColor = step.fill || 'none';
    const strokeWidth = step.strokeWidth || 2;
    const animClass = isDrawing ? 'chalk-animating' : 'chalk-drawn';
    
    switch (step.type) {
      case 'path':
        return (
          <g key={step.step_id} className={`chalk-step ${animClass}`}>
            <path
              ref={(el) => { if (el) pathRefs.current.set(step.step_id, el); }}
              d={step.d || ''}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chalk-path"
              style={{ filter: 'url(#chalk-glow)' }}
            />
          </g>
        );
      
      case 'label':
        const labelX = step.x || 0;
        const labelY = step.y || 0;
        return (
          <g key={step.step_id} className={`chalk-step ${animClass}`}>
            {step.lineToX !== undefined && step.lineToY !== undefined && (
              <line
                x1={labelX}
                y1={labelY}
                x2={step.lineToX}
                y2={step.lineToY}
                stroke={strokeColor}
                strokeWidth={1}
                strokeDasharray="4,4"
                className="label-line"
                style={{ filter: 'url(#chalk-glow)' }}
              />
            )}
            <text
              x={labelX}
              y={labelY}
              fill={strokeColor}
              fontSize="14"
              fontFamily="'Patrick Hand', 'Comic Sans MS', cursive"
              className="chalk-label"
              style={{ filter: 'url(#chalk-glow)' }}
            >
              {step.text || step.label || ''}
            </text>
          </g>
        );
      
      case 'text':
        return (
          <text
            key={step.step_id}
            x={step.x || 0}
            y={step.y || 0}
            fill={strokeColor}
            fontSize="14"
            fontFamily="'Patrick Hand', 'Comic Sans MS', cursive"
            className={`chalk-step chalk-text ${animClass}`}
            style={{ filter: 'url(#chalk-glow)' }}
          >
            {step.text || step.label || ''}
          </text>
        );
      
      case 'circle':
        return (
          <g key={step.step_id} className={`chalk-step ${animClass}`}>
            <circle
              cx={step.x || 0}
              cy={step.y || 0}
              r={step.radius || 30}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="chalk-circle"
              style={{ filter: 'url(#chalk-glow)' }}
            />
            {step.label && (
              <text
                x={step.x}
                y={(step.y || 0) + 5}
                textAnchor="middle"
                fill={strokeColor}
                fontSize="12"
                fontFamily="'Patrick Hand', cursive"
              >
                {step.label}
              </text>
            )}
          </g>
        );
      
      case 'rect':
        return (
          <g key={step.step_id} className={`chalk-step ${animClass}`}>
            <rect
              x={step.x || 0}
              y={step.y || 0}
              width={step.width || 100}
              height={step.height || 50}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rx={4}
              ry={4}
              className="chalk-rect"
              style={{ filter: 'url(#chalk-glow)' }}
            />
            {step.label && (
              <text
                x={(step.x || 0) + (step.width || 100) / 2}
                y={(step.y || 0) + (step.height || 50) / 2 + 5}
                textAnchor="middle"
                fill={strokeColor}
                fontSize="12"
                fontFamily="'Patrick Hand', cursive"
              >
                {step.label}
              </text>
            )}
          </g>
        );
      
      case 'arrow':
      case 'line':
        const x1 = step.x1 ?? step.x ?? 0;
        const y1 = step.y1 ?? step.y ?? 0;
        const x2 = step.x2 ?? (step.x || 0) + 50;
        const y2 = step.y2 ?? step.y ?? 0;
        return (
          <g key={step.step_id} className={`chalk-step ${animClass}`}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              markerEnd={step.type === 'arrow' ? 'url(#chalk-arrow)' : undefined}
              className="chalk-line"
              style={{ filter: 'url(#chalk-glow)' }}
            />
          </g>
        );
      
      case 'ellipse':
        return (
          <g key={step.step_id} className={`chalk-step ${animClass}`}>
            <ellipse
              cx={step.x || 0}
              cy={step.y || 0}
              rx={step.width || 50}
              ry={step.height || 30}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="chalk-ellipse"
              style={{ filter: 'url(#chalk-glow)' }}
            />
            {step.label && (
              <text
                x={step.x}
                y={(step.y || 0) + 5}
                textAnchor="middle"
                fill={strokeColor}
                fontSize="12"
                fontFamily="'Patrick Hand', cursive"
              >
                {step.label}
              </text>
            )}
          </g>
        );
      
      case 'group':
        return (
          <g key={step.step_id} className={`chalk-step ${animClass}`}>
            {step.paths?.map((subPath, i) => renderStep({ ...subPath, step_id: step.step_id * 1000 + i }, false))}
          </g>
        );
      
      default:
        return null;
    }
  };

  if (!isActive && drawnSteps.length === 0) return null;
  if (!steps || steps.length === 0) return null;

  return (
    <div className="chalk-drawing-container svg-drawing">
      <div className="drawing-title chalk-font">{title}</div>
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        className="chalk-canvas"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="chalk-arrow"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#ffffff" opacity="0.9" />
          </marker>
          
          <filter id="chalk-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {steps.map((step, idx) => {
          if (!drawnSteps.includes(step.step_id)) return null;
          const isCurrentlyAnimating = animatingSteps.has(step.step_id);
          return renderStep(step, isCurrentlyAnimating);
        })}
      </svg>
      {explanation && (
        <div className="drawing-explanation chalk-font">{explanation}</div>
      )}
      
      <style>{`
        .chalk-drawing-container.svg-drawing {
          background: rgba(20, 40, 30, 0.6);
          border-radius: 16px;
          padding: 20px;
          margin: 16px 0;
          border: 3px solid rgba(255, 255, 255, 0.2);
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .drawing-title {
          text-align: center;
          color: #ffd54f;
          font-size: 1.4rem;
          margin-bottom: 16px;
          font-weight: 600;
          text-shadow: 0 0 8px rgba(255, 213, 79, 0.4);
          letter-spacing: 1px;
        }
        
        .chalk-canvas {
          width: 100%;
          height: auto;
          min-height: 250px;
          max-height: 400px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 8px;
        }
        
        .chalk-step {
          opacity: 0;
        }
        
        .chalk-step.chalk-animating,
        .chalk-step.chalk-drawn {
          opacity: 1;
          animation: chalk-fade-in 0.3s ease-out forwards;
        }
        
        .chalk-path {
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        .chalk-label, .chalk-text {
          text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
        }
        
        .label-line {
          opacity: 0.7;
        }
        
        .drawing-explanation {
          text-align: center;
          color: rgba(255, 255, 255, 0.85);
          font-size: 1.05rem;
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 8px;
          line-height: 1.5;
        }
        
        @keyframes chalk-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes chalk-path-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
