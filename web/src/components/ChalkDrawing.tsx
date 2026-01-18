import { useState, useEffect, useRef } from 'react';

interface DrawingStep {
  step_id: number;
  type: 'rect' | 'circle' | 'ellipse' | 'arrow' | 'line' | 'text' | 'curved_arrow';
  x: number;
  y: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  radius?: number;
  label?: string;
  text?: string;
  delay_ms: number;
  draw_duration_ms: number;
}

interface ChalkDrawingProps {
  title: string;
  drawingType: string;
  steps: DrawingStep[];
  totalDuration: number;
  explanation: string;
  isActive: boolean;
}

export default function ChalkDrawing({
  title,
  drawingType,
  steps,
  totalDuration,
  explanation,
  isActive,
}: ChalkDrawingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [drawnSteps, setDrawnSteps] = useState<number[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  
  void drawingType;
  void totalDuration;
  
  useEffect(() => {
    if (!isActive || steps.length === 0) return;
    
    setCurrentStepIndex(-1);
    setDrawnSteps([]);
    
    let timeouts: NodeJS.Timeout[] = [];
    
    steps.forEach((step, idx) => {
      const timeout = setTimeout(() => {
        setCurrentStepIndex(idx);
        setDrawnSteps(prev => [...prev, step.step_id]);
      }, step.delay_ms);
      timeouts.push(timeout);
    });
    
    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [isActive, steps]);

  const renderStep = (step: DrawingStep, isDrawing: boolean) => {
    const animationClass = isDrawing ? 'drawing' : 'drawn';
    const strokeColor = '#ffffff';
    const strokeWidth = 3;
    
    switch (step.type) {
      case 'rect':
        return (
          <g key={step.step_id} className={`chalk-step ${animationClass}`}>
            <rect
              x={step.x}
              y={step.y}
              width={step.width || 100}
              height={step.height || 50}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isDrawing ? "5,5" : "none"}
              className="chalk-stroke"
            />
            {step.label && (
              <text
                x={step.x + (step.width || 100) / 2}
                y={step.y + (step.height || 50) / 2 + 5}
                textAnchor="middle"
                fill={strokeColor}
                className="chalk-text"
                fontSize="14"
              >
                {step.label}
              </text>
            )}
          </g>
        );
      
      case 'circle':
        return (
          <g key={step.step_id} className={`chalk-step ${animationClass}`}>
            <circle
              cx={step.x}
              cy={step.y}
              r={step.radius || 30}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="chalk-stroke"
            />
            {step.label && (
              <text
                x={step.x}
                y={step.y + 5}
                textAnchor="middle"
                fill={strokeColor}
                className="chalk-text"
                fontSize="12"
              >
                {step.label}
              </text>
            )}
          </g>
        );
      
      case 'arrow':
      case 'line':
        const x1 = step.x1 ?? step.x;
        const y1 = step.y1 ?? step.y;
        const x2 = step.x2 ?? step.x + 50;
        const y2 = step.y2 ?? step.y;
        
        return (
          <g key={step.step_id} className={`chalk-step ${animationClass}`}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="chalk-stroke"
              markerEnd={step.type === 'arrow' ? 'url(#arrowhead)' : undefined}
            />
          </g>
        );
      
      case 'text':
        return (
          <text
            key={step.step_id}
            x={step.x}
            y={step.y}
            fill={strokeColor}
            className={`chalk-step chalk-text ${animationClass}`}
            fontSize="14"
          >
            {step.text || step.label || ''}
          </text>
        );
      
      case 'ellipse':
        return (
          <g key={step.step_id} className={`chalk-step ${animationClass}`}>
            <ellipse
              cx={step.x}
              cy={step.y}
              rx={step.width || 50}
              ry={step.height || 30}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="chalk-stroke"
            />
            {step.label && (
              <text
                x={step.x}
                y={step.y + 5}
                textAnchor="middle"
                fill={strokeColor}
                className="chalk-text"
                fontSize="12"
              >
                {step.label}
              </text>
            )}
          </g>
        );
      
      default:
        return null;
    }
  };

  if (!isActive && drawnSteps.length === 0) return null;

  return (
    <div className="chalk-drawing-container">
      <div className="drawing-title chalk-font">{title}</div>
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        className="chalk-canvas"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
          </marker>
          <filter id="chalk-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>
        
        {steps.map((step, idx) => {
          if (!drawnSteps.includes(step.step_id)) return null;
          const isCurrentlyDrawing = currentStepIndex === idx;
          return renderStep(step, isCurrentlyDrawing);
        })}
      </svg>
      {explanation && (
        <div className="drawing-explanation chalk-font">{explanation}</div>
      )}
      
      <style>{`
        .chalk-drawing-container {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
          border: 2px solid rgba(255, 255, 255, 0.15);
        }
        
        .drawing-title {
          text-align: center;
          color: #ffd700;
          font-size: 1.3rem;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .chalk-canvas {
          width: 100%;
          height: auto;
          min-height: 200px;
          max-height: 350px;
        }
        
        .chalk-step {
          opacity: 0;
          animation: chalk-appear 0.5s ease-out forwards;
        }
        
        .chalk-step.drawing {
          animation: chalk-draw 0.8s ease-out forwards;
        }
        
        .chalk-step.drawn {
          opacity: 1;
        }
        
        .chalk-stroke {
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: url(#chalk-texture);
        }
        
        .chalk-text {
          font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
          text-shadow: 0 0 3px rgba(255, 255, 255, 0.3);
        }
        
        .drawing-explanation {
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          margin-top: 12px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }
        
        @keyframes chalk-appear {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes chalk-draw {
          0% {
            opacity: 0;
            stroke-dashoffset: 1000;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            opacity: 1;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
