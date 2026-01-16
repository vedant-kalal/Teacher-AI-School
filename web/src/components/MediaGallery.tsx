import React, { useState } from 'react';

interface MediaGalleryProps {
  diagrams: any[];
  images: any[];
  simulations: any[];
  videos: any[];
}

export default function MediaGallery({ diagrams, images, simulations, videos }: MediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<'diagrams' | 'images' | 'simulations' | 'videos'>('diagrams');

  const tabs = [
    { id: 'diagrams', label: 'Diagrams', count: diagrams.length },
    { id: 'images', label: 'Images', count: images.length },
    { id: 'simulations', label: '3D Models', count: simulations.length },
    { id: 'videos', label: 'Videos', count: videos.length },
  ];

  const renderDiagram = (diagram: any, idx: number) => {
    const data = diagram.diagramData || diagram;
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">{data.title || `Diagram ${idx + 1}`}</h4>
        <p className="card-description">{data.description}</p>
        
        {diagram.imageBase64 && (
          <img 
            src={`data:image/png;base64,${diagram.imageBase64}`} 
            alt={data.title}
            className="diagram-image"
          />
        )}
        
        {data.elements?.length > 0 && (
          <div className="elements-list">
            <h5>Elements:</h5>
            <ul>
              {data.elements.map((el: any, i: number) => (
                <li key={i}>
                  <strong>{el.label}</strong>: {el.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {diagram.teacherNarration && (
          <div className="narration">
            <p>{diagram.teacherNarration}</p>
          </div>
        )}
      </div>
    );
  };

  const renderImage = (image: any, idx: number) => {
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">Educational Image {idx + 1}</h4>
        
        {image.imageBase64 && (
          <img 
            src={`data:image/png;base64,${image.imageBase64}`} 
            alt={`Educational image ${idx + 1}`}
            className="diagram-image"
          />
        )}

        {image.annotatedPoints?.length > 0 && (
          <div className="elements-list">
            <h5>Key Points:</h5>
            <ul>
              {image.annotatedPoints.map((point: any, i: number) => (
                <li key={i}>
                  <strong>{point.label}</strong>: {point.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {image.teacherScript && (
          <div className="narration">
            <p>{image.teacherScript}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSimulation = (sim: any, idx: number) => {
    const data = sim.simulation || sim;
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">{data.title || `3D Model ${idx + 1}`}</h4>
        <p className="card-description">{data.description}</p>

        {sim.previewImageBase64 && (
          <img 
            src={`data:image/png;base64,${sim.previewImageBase64}`} 
            alt={data.title}
            className="diagram-image"
          />
        )}

        {data.scene?.objects?.length > 0 && (
          <div className="elements-list">
            <h5>3D Objects:</h5>
            <ul>
              {data.scene.objects.map((obj: any, i: number) => (
                <li key={i}>
                  <strong>{obj.name}</strong> ({obj.type})
                  {obj.interactive && <span className="badge">Interactive</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sim.teacherGuide && (
          <div className="narration">
            <p>{sim.teacherGuide}</p>
          </div>
        )}
      </div>
    );
  };

  const renderVideo = (video: any, idx: number) => {
    const storyboard = video.videoStoryboard || video;
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">{storyboard.title || `Video ${idx + 1}`}</h4>
        <p className="card-description">Duration: {storyboard.duration} | Style: {storyboard.style}</p>

        {video.thumbnailBase64 && (
          <img 
            src={`data:image/png;base64,${video.thumbnailBase64}`} 
            alt={storyboard.title}
            className="diagram-image"
          />
        )}

        {storyboard.scenes?.length > 0 && (
          <div className="elements-list">
            <h5>Scenes:</h5>
            <ol>
              {storyboard.scenes.map((scene: any, i: number) => (
                <li key={i}>
                  <strong>{scene.duration}</strong>: {scene.visualDescription}
                  <p className="scene-narration">"{scene.narration}"</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {video.fullNarrationScript && (
          <div className="narration">
            <h5>Full Script:</h5>
            <p>{video.fullNarrationScript}</p>
          </div>
        )}
      </div>
    );
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case 'diagrams':
        return diagrams.length > 0 
          ? diagrams.map(renderDiagram)
          : <p className="no-content">No diagrams generated</p>;
      case 'images':
        return images.length > 0 
          ? images.map(renderImage)
          : <p className="no-content">No images generated</p>;
      case 'simulations':
        return simulations.length > 0 
          ? simulations.map(renderSimulation)
          : <p className="no-content">No 3D simulations generated</p>;
      case 'videos':
        return videos.length > 0 
          ? videos.map(renderVideo)
          : <p className="no-content">No videos generated</p>;
      default:
        return null;
    }
  };

  return (
    <div className="media-gallery">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
            {tab.count > 0 && <span className="count">{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="gallery-content">
        {getActiveContent()}
      </div>

      <style>{`
        .media-gallery {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 16px;
        }

        .tab {
          padding: 16px 24px;
          font-size: 0.95rem;
          font-weight: 500;
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab:hover {
          color: #fff;
        }

        .tab.active {
          color: #fff;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .count {
          background: rgba(102, 126, 234, 0.3);
          color: #667eea;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.8rem;
        }

        .gallery-content {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .media-card {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-title {
          font-size: 1.2rem;
          margin-bottom: 8px;
          color: #fff;
        }

        .card-description {
          color: #a0aec0;
          font-size: 0.9rem;
          margin-bottom: 16px;
        }

        .diagram-image {
          width: 100%;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .elements-list {
          margin-top: 16px;
        }

        .elements-list h5 {
          color: #667eea;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .elements-list ul, .elements-list ol {
          padding-left: 20px;
          color: #cbd5e0;
          font-size: 0.9rem;
        }

        .elements-list li {
          margin: 8px 0;
        }

        .badge {
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          margin-left: 8px;
        }

        .narration {
          margin-top: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid #667eea;
        }

        .narration h5 {
          color: #667eea;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .narration p {
          color: #cbd5e0;
          font-size: 0.9rem;
          line-height: 1.6;
          font-style: italic;
        }

        .scene-narration {
          color: #a0aec0 !important;
          font-style: italic !important;
          margin-top: 4px;
          font-size: 0.85rem !important;
        }

        .no-content {
          color: #718096;
          text-align: center;
          padding: 40px;
          grid-column: 1 / -1;
        }
      `}</style>
    </div>
  );
}
