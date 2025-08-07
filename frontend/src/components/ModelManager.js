import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const ModelManager = ({ models, currentModel, onModelChange, onModelsRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [loadingModel, setLoadingModel] = useState(null);

  const loadModel = async (modelName) => {
    setLoadingModel(modelName);
    try {
      const response = await fetch('/api/models/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      });

      if (response.ok) {
        onModelChange(modelName);
        alert(`Model ${modelName} loaded successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to load model: ${error.error}`);
      }
    } catch (error) {
      alert(`Error loading model: ${error.message}`);
    } finally {
      setLoadingModel(null);
    }
  };

  const refreshModels = async () => {
    setLoading(true);
    try {
      await onModelsRefresh();
    } catch (error) {
      console.error('Error refreshing models:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="content-header">
        <h1 className="content-title">LLM Model Management</h1>
        <p className="content-subtitle">
          Manage your local LLM models for document improvement.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          className="btn btn-secondary"
          onClick={refreshModels}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'loading' : ''} />
          Refresh Models
        </button>
      </div>

      <div className="model-grid">
        {models.map((model) => (
          <div
            key={model.name}
            className={`model-card ${currentModel === model.name ? 'active' : ''}`}
          >
            <div className="model-name">{model.name}</div>
            <div className="model-size">
              Size: {model.size ? `${(model.size / 1024 / 1024 / 1024).toFixed(1)} GB` : 'Unknown'}
            </div>
            <div className="model-actions">
              {currentModel === model.name ? (
                <span className="status-badge completed">
                  <CheckCircle size={16} />
                  Active
                </span>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => loadModel(model.name)}
                  disabled={loadingModel === model.name}
                >
                  {loadingModel === model.name ? (
                    <div className="loading" style={{ width: '16px', height: '16px' }}></div>
                  ) : (
                    <Download size={16} />
                  )}
                  {loadingModel === model.name ? 'Loading...' : 'Load Model'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {models.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gcp-gray-500)' }}>
          <AlertCircle size={48} style={{ marginBottom: '16px' }} />
          <h3>No models found</h3>
          <p>No LLM models are currently available. Please check your Ollama installation.</p>
        </div>
      )}

      <div style={{ marginTop: '32px', background: 'white', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-1)' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--gcp-gray-900)' }}>
          Recommended Models
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <h4 style={{ marginBottom: '8px', color: 'var(--gcp-gray-900)' }}>CodeLlama 7B</h4>
            <p style={{ color: 'var(--gcp-gray-600)', fontSize: '14px' }}>
              Best for technical documentation and code-heavy content.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '8px', color: 'var(--gcp-gray-900)' }}>Mistral 7B</h4>
            <p style={{ color: 'var(--gcp-gray-600)', fontSize: '14px' }}>
              Good balance of performance and speed for general documentation.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '8px', color: 'var(--gcp-gray-900)' }}>Llama2 7B</h4>
            <p style={{ color: 'var(--gcp-gray-600)', fontSize: '14px' }}>
              Reliable model for comprehensive text processing and improvement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelManager; 