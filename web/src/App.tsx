import React, { useState, useCallback } from 'react';
import Blackboard from './components/Blackboard';
import TopicInput from './components/TopicInput';
import LessonProgress from './components/LessonProgress';
import MediaGallery from './components/MediaGallery';

interface LessonArtifact {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  data?: any;
}

interface LessonState {
  runId: string | null;
  topic: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStep: string;
  artifacts: LessonArtifact[];
  boardContent: any | null;
  diagrams: any[];
  images: any[];
  simulations: any[];
  videos: any[];
  lessonPlan: any | null;
  qualityReview: any | null;
  error: string | null;
}

const initialState: LessonState = {
  runId: null,
  topic: '',
  status: 'idle',
  currentStep: '',
  artifacts: [],
  boardContent: null,
  diagrams: [],
  images: [],
  simulations: [],
  videos: [],
  lessonPlan: null,
  qualityReview: null,
  error: null,
};

const API_BASE = '/api';

export default function App() {
  const [lesson, setLesson] = useState<LessonState>(initialState);

  const startLesson = useCallback(async (topic: string) => {
    setLesson({
      ...initialState,
      topic,
      status: 'running',
      currentStep: 'Initializing...',
    });

    try {
      const res = await fetch(`${API_BASE}/workflows/ai-teacher-workflow/start-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData: { topic } }),
      });

      if (!res.ok) {
        throw new Error('Failed to start lesson');
      }

      const data = await res.json();
      const runId = data.runId;

      setLesson(prev => ({ ...prev, runId }));
      pollForResults(runId);
    } catch (err: any) {
      setLesson(prev => ({
        ...prev,
        status: 'error',
        error: err.message || 'Failed to start lesson',
      }));
    }
  }, []);

  const pollForResults = useCallback(async (runId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/workflows/ai-teacher-workflow/${runId}`);
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const result = data.result;

        if (data.status === 'COMPLETED' && result) {
          clearInterval(pollInterval);
          
          const boardContentData = Array.isArray(result.boardContent) 
            ? result.boardContent[0] 
            : result.boardContent;
          
          setLesson(prev => ({
            ...prev,
            status: 'completed',
            currentStep: 'Lesson Complete!',
            boardContent: boardContentData || null,
            diagrams: Array.isArray(result.diagrams) ? result.diagrams : [],
            images: Array.isArray(result.images) ? result.images : [],
            simulations: Array.isArray(result.simulations) ? result.simulations : [],
            videos: Array.isArray(result.videos) ? result.videos : [],
            lessonPlan: result.lessonPlan || null,
            qualityReview: result.qualityReview || null,
          }));
        } else if (data.status === 'RUNNING') {
          const steps = data.steps || [];
          const currentStepInfo = steps.find((s: any) => s.status === 'running');
          const completedSteps = steps.filter((s: any) => s.status === 'completed');
          const stepName = currentStepInfo?.name || currentStepInfo?.stepId || `Step ${completedSteps.length + 1}`;
          
          setLesson(prev => ({
            ...prev,
            currentStep: stepName,
            artifacts: steps.map((s: any) => ({
              step: s.stepId,
              status: s.status,
              data: s.output,
            })),
          }));
        } else if (data.status === 'FAILED') {
          clearInterval(pollInterval);
          setLesson(prev => ({
            ...prev,
            status: 'error',
            error: 'Lesson generation failed',
          }));
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 300000);
  }, []);

  const resetLesson = useCallback(() => {
    setLesson(initialState);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>AI Teacher</h1>
        <p>Interactive Educational Lessons</p>
      </header>

      <main className="main-content">
        <TopicInput 
          onSubmit={startLesson} 
          disabled={lesson.status === 'running'} 
          onReset={resetLesson}
          showReset={lesson.status !== 'idle'}
        />

        {lesson.status !== 'idle' && (
          <LessonProgress 
            status={lesson.status}
            currentStep={lesson.currentStep}
            topic={lesson.topic}
          />
        )}

        <Blackboard 
          content={lesson.boardContent}
          lessonPlan={lesson.lessonPlan}
          status={lesson.status}
          topic={lesson.topic}
        />

        {(lesson.diagrams.length > 0 || lesson.images.length > 0) && (
          <MediaGallery 
            diagrams={lesson.diagrams}
            images={lesson.images}
            simulations={lesson.simulations}
            videos={lesson.videos}
          />
        )}
      </main>

      <style>{`
        .app {
          min-height: 100vh;
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header p {
          color: #a0aec0;
          margin-top: 8px;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
