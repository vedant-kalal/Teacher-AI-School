import React, { useState } from 'react';

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  disabled: boolean;
  onReset: () => void;
  showReset: boolean;
}

export default function TopicInput({ onSubmit, disabled, onReset, showReset }: TopicInputProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="compact-form">
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter topic..."
        disabled={disabled}
        className="compact-input"
      />
      <button 
        type="submit" 
        disabled={disabled || !topic.trim()}
        className="compact-btn primary"
      >
        {disabled ? 'Teaching...' : 'Start'}
      </button>
      {showReset && (
        <button 
          type="button" 
          onClick={onReset}
          className="compact-btn secondary"
        >
          New
        </button>
      )}

      <style>{`
        .compact-form {
          display: flex;
          gap: 8px;
          align-items: center;
          flex: 1;
        }

        .compact-input {
          flex: 1;
          max-width: 300px;
          padding: 8px 12px;
          font-size: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          outline: none;
        }

        .compact-input:focus {
          border-color: #667eea;
        }

        .compact-input::placeholder {
          color: #718096;
        }

        .compact-input:disabled {
          opacity: 0.6;
        }

        .compact-btn {
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
        }

        .compact-btn.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff;
        }

        .compact-btn.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .compact-btn.secondary {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .compact-btn.secondary:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>
    </form>
  );
}
