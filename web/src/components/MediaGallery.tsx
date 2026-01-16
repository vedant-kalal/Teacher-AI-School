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
    const hasImage = diagram.image_base64 || diagram.imageBase64;
    const imageBase64 = diagram.image_base64 || diagram.imageBase64;
    
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">{diagram.title || `Diagram ${idx + 1}`}</h4>
        <p className="card-description">{diagram.description}</p>
        
        {hasImage && (
          <div className="generated-image-container">
            <img 
              src={`data:image/png;base64,${imageBase64}`} 
              alt={diagram.title}
              className="generated-image"
            />
            <span className="ai-badge">AI Generated</span>
          </div>
        )}
        
        {!hasImage && diagram.elements && (
          <div className="elements-list">
            <h5>Elements:</h5>
            {typeof diagram.elements === 'string' ? (
              <p className="elements-text">{diagram.elements}</p>
            ) : Array.isArray(diagram.elements) && diagram.elements.length > 0 ? (
              <ul>
                {diagram.elements.map((el: any, i: number) => (
                  <li key={i}>
                    <strong>{el.label}</strong>: {el.description}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {diagram.generated && (
          <div className="status-badge success">Image Generated</div>
        )}
      </div>
    );
  };

  const renderImage = (image: any, idx: number) => {
    const hasImage = image.image_base64 || image.imageBase64;
    const imageBase64 = image.image_base64 || image.imageBase64;
    
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">{image.topic || `Educational Image ${idx + 1}`}</h4>
        <p className="card-description">{image.description}</p>
        
        {hasImage && (
          <div className="generated-image-container">
            <img 
              src={`data:image/png;base64,${imageBase64}`} 
              alt={image.alt_text || `Educational image ${idx + 1}`}
              className="generated-image"
            />
            <span className="ai-badge">AI Generated</span>
          </div>
        )}

        {image.generated && (
          <div className="status-badge success">Image Generated</div>
        )}
      </div>
    );
  };

  const renderSimulation = (sim: any, idx: number) => {
    const scene = sim.scene || {};
    const objects = scene.objects || [];
    
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">{sim.title || `3D Model ${idx + 1}`}</h4>
        
        {sim.learning_goal && (
          <p className="card-description">{sim.learning_goal}</p>
        )}

        {objects.length > 0 && (
          <div className="elements-list">
            <h5>3D Objects:</h5>
            <div className="objects-grid">
              {objects.map((obj: any, i: number) => (
                <div key={i} className="object-chip" style={{ borderLeftColor: obj.color || '#667eea' }}>
                  <strong>{obj.name}</strong>
                  <span className="object-type">{obj.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sim.interactions && Array.isArray(sim.interactions) && (
          <div className="elements-list">
            <h5>Interactions:</h5>
            <div className="interaction-badges">
              {sim.interactions.map((int: string, i: number) => (
                <span key={i} className="interaction-badge">{int}</span>
              ))}
            </div>
          </div>
        )}

        {scene.animations && (
          <div className="animation-note">
            Animation: {scene.animations}
          </div>
        )}
      </div>
    );
  };

  const renderVideo = (video: any, idx: number) => {
    return (
      <div key={idx} className="media-card">
        <h4 className="card-title">{video.title || `Video ${idx + 1}`}</h4>
        <p className="card-description">Duration: {video.duration} | Style: {video.style}</p>

        {video.scenes && (
          <div className="elements-list">
            <h5>Storyboard:</h5>
            {typeof video.scenes === 'string' ? (
              <p className="elements-text storyboard">{video.scenes}</p>
            ) : Array.isArray(video.scenes) && video.scenes.length > 0 ? (
              <ol className="scenes-list">
                {video.scenes.map((scene: any, i: number) => (
                  <li key={i}>
                    <strong>{scene.duration || `Scene ${i + 1}`}</strong>: {scene.visualDescription || scene.description}
                    {scene.narration && (
                      <p className="scene-narration">"{scene.narration}"</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : null}
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
          : <p className="no-content">No diagrams generated for this topic</p>;
      case 'images':
        return images.length > 0 
          ? images.map(renderImage)
          : <p className="no-content">No images generated for this topic</p>;
      case 'simulations':
        return simulations.length > 0 
          ? simulations.map(renderSimulation)
          : <p className="no-content">No 3D simulations needed for this topic</p>;
      case 'videos':
        return videos.length > 0 
          ? videos.map(renderVideo)
          : <p className="no-content">No videos needed for this topic</p>;
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

        .generated-image-container {
          position: relative;
          margin-bottom: 16px;
        }

        .generated-image {
          width: 100%;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .ai-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-top: 12px;
        }

        .status-badge.success {
          background: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
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

        .elements-text {
          color: #cbd5e0;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .storyboard {
          white-space: pre-wrap;
        }

        .objects-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .object-chip {
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 8px;
          border-left: 3px solid;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .object-chip strong {
          color: #fff;
          font-size: 0.85rem;
        }

        .object-type {
          color: #a0aec0;
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .interaction-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .interaction-badge {
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .animation-note {
          margin-top: 12px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          color: #a0aec0;
          font-size: 0.85rem;
          font-style: italic;
        }

        .scenes-list {
          color: #cbd5e0;
          font-size: 0.9rem;
        }

        .scene-narration {
          color: #a0aec0;
          font-style: italic;
          margin-top: 4px;
          font-size: 0.85rem;
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
