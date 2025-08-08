import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Link } from 'lucide-react';

const DocumentUpload = ({ onDocumentUploaded, socket, currentModel }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'url'
  const [urlInput, setUrlInput] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadStatus({ type: 'uploading', message: 'Uploading document...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const document = {
          id: data.document_id,
          filename: data.filename,
          status: data.status,
          progress: 0,
          created_at: new Date().toISOString(),
        };

        onDocumentUploaded(document);
        setUploadStatus({ 
          type: 'success', 
          message: 'Document uploaded successfully! Processing with LLM...' 
        });

        // Clear status after 3 seconds
        setTimeout(() => {
          setUploadStatus(null);
        }, 3000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: `Upload failed: ${error.message}` 
      });
    } finally {
      setUploading(false);
    }
  }, [onDocumentUploaded]);

  const handleUrlIngestion = async () => {
    if (!urlInput.trim()) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Please enter a URL' 
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: 'uploading', message: 'Ingesting content from URL...' });

    try {
      const response = await fetch('/api/documents/ingest-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        const document = {
          id: data.document_id,
          filename: data.filename,
          status: data.status,
          progress: 0,
          created_at: new Date().toISOString(),
          source_url: data.source_url,
        };

        console.log('[FRONTEND] Document uploaded:', document);
        console.log('[FRONTEND] Document uploaded:', document);
        onDocumentUploaded(document);
        setUploadStatus({ 
          type: 'success', 
          message: 'URL content ingested successfully! Processing with LLM...' 
        });
        setUrlInput(''); // Clear input

        // Don't clear status - let it stay until processing is complete
        // The WebSocket will update the status when processing is done
      } else {
        throw new Error(data.error || 'URL ingestion failed');
      }
    } catch (error) {
      console.error('URL ingestion error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: `URL ingestion failed: ${error.message}` 
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/x-rst': ['.rst'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <div>
      <div className="content-header">
        <h1 className="content-title">Improve Your Documentation</h1>
        <p className="content-subtitle">
          Upload your documentation and transform it into clean, professional Google Cloud Platform-style documentation using local LLMs.
        </p>
      </div>

      {uploadStatus && (
        <div className={`status-badge ${uploadStatus.type}`} style={{ marginBottom: '24px' }}>
          {uploadStatus.type === 'success' && <CheckCircle size={16} />}
          {uploadStatus.type === 'error' && <AlertCircle size={16} />}
          {uploadStatus.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--gcp-gray-200)', 
        marginBottom: '24px' 
      }}>
        <button
          onClick={() => setActiveTab('file')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'file' ? 'var(--gcp-blue)' : 'transparent',
            color: activeTab === 'file' ? 'white' : 'var(--gcp-gray-600)',
            cursor: 'pointer',
            borderBottom: activeTab === 'file' ? '2px solid var(--gcp-blue)' : '2px solid transparent',
            fontWeight: activeTab === 'file' ? '600' : '400',
            transition: 'all 0.2s ease'
          }}
        >
          <Upload size={16} style={{ marginRight: '8px' }} />
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('url')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'url' ? 'var(--gcp-blue)' : 'transparent',
            color: activeTab === 'url' ? 'white' : 'var(--gcp-gray-600)',
            cursor: 'pointer',
            borderBottom: activeTab === 'url' ? '2px solid var(--gcp-blue)' : '2px solid transparent',
            fontWeight: activeTab === 'url' ? '600' : '400',
            transition: 'all 0.2s ease'
          }}
        >
          <Link size={16} style={{ marginRight: '8px' }} />
          Ingest URL
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div 
          {...getRootProps()} 
          className={`upload-area ${isDragActive ? 'dragover' : ''} ${uploading ? 'disabled' : ''}`}
        >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div>
            <div className="loading" style={{ margin: '0 auto 16px' }}></div>
            <p className="upload-text">Processing document...</p>
          </div>
        ) : (
          <div>
            <Upload className="upload-icon" />
            <p className="upload-text">
              {isDragActive 
                ? 'Drop your document here' 
                : 'Drag & drop your document here, or click to select'
              }
            </p>
            <p className="upload-hint">
              Supported formats: TXT, MD, RST, DOCX, PDF (max 16MB)
            </p>
            <p className="upload-hint" style={{ marginTop: '8px' }}>
              Current model: {currentModel}
            </p>
          </div>
        )}
        </div>
      )}

      {/* URL Ingestion Tab */}
      {activeTab === 'url' && (
        <div style={{ 
          border: '2px dashed var(--gcp-gray-300)', 
          borderRadius: '8px', 
          padding: '40px', 
          textAlign: 'center',
          background: uploading ? 'var(--gcp-gray-50)' : 'white',
          transition: 'all 0.2s ease'
        }}>
          <Link className="upload-icon" style={{ color: 'var(--gcp-blue)' }} />
          <p className="upload-text" style={{ marginBottom: '24px' }}>
            Enter a URL to ingest documentation content
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            maxWidth: '500px', 
            margin: '0 auto',
            alignItems: 'center'
          }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/documentation"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid var(--gcp-gray-300)',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlIngestion()}
              disabled={uploading}
            />
            <button
              onClick={handleUrlIngestion}
              disabled={uploading || !urlInput.trim()}
              style={{
                padding: '12px 24px',
                background: uploading || !urlInput.trim() ? 'var(--gcp-gray-300)' : 'var(--gcp-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: uploading || !urlInput.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              {uploading ? 'Ingesting...' : 'Ingest'}
            </button>
          </div>
          
          <p className="upload-hint" style={{ marginTop: '16px' }}>
            Supports any web page with text content
          </p>
          <p className="upload-hint" style={{ marginTop: '8px' }}>
            Current model: {currentModel}
          </p>
        </div>
      )}

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--gcp-gray-900)' }}>
          How it works
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-1)' }}>
            <FileText size={24} style={{ color: 'var(--gcp-blue)', marginBottom: '12px' }} />
            <h4 style={{ marginBottom: '8px', color: 'var(--gcp-gray-900)' }}>1. Upload or Ingest</h4>
            <p style={{ color: 'var(--gcp-gray-600)', fontSize: '14px' }}>
              Upload your existing documentation or ingest content directly from a URL.
            </p>
          </div>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-1)' }}>
            <div className="loading" style={{ marginBottom: '12px' }}></div>
            <h4 style={{ marginBottom: '8px', color: 'var(--gcp-gray-900)' }}>2. AI Processing</h4>
            <p style={{ color: 'var(--gcp-gray-600)', fontSize: '14px' }}>
              Our local LLM analyzes and improves your documentation using GCP style guidelines.
            </p>
          </div>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-1)' }}>
            <CheckCircle size={24} style={{ color: 'var(--gcp-green)', marginBottom: '12px' }} />
            <h4 style={{ marginBottom: '8px', color: 'var(--gcp-gray-900)' }}>3. Get Results</h4>
            <p style={{ color: 'var(--gcp-gray-600)', fontSize: '14px' }}>
              Download your improved, GCP-style documentation ready for use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 