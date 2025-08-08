import React from 'react';
import { Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const ProcessingStatus = ({ document, onClose }) => {
  if (!document) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Loader size={20} className="loading" />;
      case 'completed':
        return <CheckCircle size={20} style={{ color: 'var(--gcp-green)' }} />;
      case 'error':
        return <AlertCircle size={20} style={{ color: 'var(--gcp-red)' }} />;
      default:
        return <Clock size={20} style={{ color: 'var(--gcp-blue)' }} />;
    }
  };

  const getStatusMessage = (status, progress) => {
    switch (status) {
      case 'uploaded':
        return 'Document uploaded, starting LLM processing...';
      case 'processing':
        return `Processing with LLM... ${progress || 0}%`;
      case 'completed':
        return 'Processing completed! Document is ready to view.';
      case 'error':
        return 'Processing failed. Please try again.';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="processing-status" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      border: '1px solid var(--gcp-gray-200)',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: 'var(--shadow-2)',
      zIndex: 1000,
      minWidth: '300px',
      maxWidth: '400px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getStatusIcon(document.status)}
          <span style={{ fontWeight: '600', color: 'var(--gcp-gray-900)' }}>
            {document.filename}
          </span>
        </div>
        {document.status === 'completed' && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--gcp-gray-500)',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      <div style={{ color: 'var(--gcp-gray-600)', fontSize: '14px', marginBottom: '8px' }}>
        {getStatusMessage(document.status, document.progress)}
      </div>
      
      {document.status === 'processing' && (
        <div style={{ marginTop: '8px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'var(--gcp-gray-200)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${document.progress || 0}%`,
              height: '100%',
              background: 'var(--gcp-blue)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
      
      {document.status === 'completed' && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          background: 'var(--gcp-green-50)', 
          borderRadius: '4px',
          border: '1px solid var(--gcp-green-200)'
        }}>
          <span style={{ color: 'var(--gcp-green-700)', fontSize: '12px' }}>
            ✅ Document ready! Click to view the improved content.
          </span>
        </div>
      )}
      
      {document.status === 'error' && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          background: 'var(--gcp-red-50)', 
          borderRadius: '4px',
          border: '1px solid var(--gcp-red-200)'
        }}>
          <span style={{ color: 'var(--gcp-red-700)', fontSize: '12px' }}>
            ❌ {document.error || 'Processing failed'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;
