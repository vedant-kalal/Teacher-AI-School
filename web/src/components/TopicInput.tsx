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

  const suggestedTopics = [
    'The Human Circulatory System',
    'Photosynthesis',
    'The Solar System',
    'World War II',
    'Basic Algebra',
    'The Water Cycle',
  ];

  return (
    <div className="topic-input-container">
      <form onSubmit={handleSubmit} className="topic-form">
        <div className="input-wrapper">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic to learn about..."
            disabled={disabled}
            className="topic-input"
          />
          <button 
            type="submit" 
            disabled={disabled || !topic.trim()}
            className="submit-btn"
          >
            {disabled ? 'Teaching...' : 'Start Lesson'}
          </button>
          {showReset && (
            <button 
              type="button" 
              onClick={onReset}
              className="reset-btn"
            >
              New Lesson
            </button>
          )}
        </div>
      </form>

      {!disabled && (
        <div className="suggestions">
          <span className="suggestions-label">Try:</span>
          {suggestedTopics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="suggestion-chip"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .topic-input-container {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .topic-form {
          display: flex;
          gap: 12px;
        }

        .input-wrapper {
          display: flex;
          gap: 12px;
          width: 100%;
          flex-wrap: wrap;
        }

        .topic-input {
          flex: 1;
          min-width: 300px;
          padding: 16px 20px;
          font-size: 1.1rem;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .topic-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .topic-input::placeholder {
          color: #718096;
        }

        .topic-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .submit-btn {
          padding: 16px 32px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reset-btn {
          padding: 16px 24px;
          font-size: 1rem;
          font-weight: 500;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          background: transparent;
          color: #fff;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          white-space: nowrap;
        }

        .reset-btn:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
          align-items: center;
        }

        .suggestions-label {
          color: #718096;
          font-size: 0.9rem;
          margin-right: 4px;
        }

        .suggestion-chip {
          padding: 8px 16px;
          font-size: 0.85rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          color: #a0aec0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-chip:hover {
          background: rgba(102, 126, 234, 0.2);
          border-color: #667eea;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
