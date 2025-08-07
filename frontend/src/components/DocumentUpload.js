import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const DocumentUpload = ({ onDocumentUploaded, socket, currentModel }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

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

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--gcp-gray-900)' }}>
          How it works
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-1)' }}>
            <FileText size={24} style={{ color: 'var(--gcp-blue)', marginBottom: '12px' }} />
            <h4 style={{ marginBottom: '8px', color: 'var(--gcp-gray-900)' }}>1. Upload Document</h4>
            <p style={{ color: 'var(--gcp-gray-600)', fontSize: '14px' }}>
              Upload your existing documentation in any supported format.
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