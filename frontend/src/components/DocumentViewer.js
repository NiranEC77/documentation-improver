import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, Copy, Check } from 'lucide-react';

const DocumentViewer = ({ document, socket }) => {
  const [activeTab, setActiveTab] = useState('improved');
  const [copied, setCopied] = useState(false);

  if (!document) {
    return (
      <div className="content">
        <div className="content-header">
          <h1 className="content-title">Document Viewer</h1>
          <p className="content-subtitle">Select a document from the sidebar to view it.</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadDocument = (content, filename, type) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${type}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="content">
      <div className="content-header">
        <h1 className="content-title">{document.filename}</h1>
        <p className="content-subtitle">
          Status: <span className={`status-badge ${document.status}`}>{document.status}</span>
        </p>
      </div>

      {document.status === 'processing' && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${document.progress || 0}%` }}
            ></div>
          </div>
          <div className="progress-text">Processing document... {document.progress || 0}%</div>
        </div>
      )}

      {document.status === 'error' && (
        <div className="status-badge error" style={{ marginBottom: '24px' }}>
          Error: {document.error}
        </div>
      )}

      {document.status === 'completed' && (
        <div className="document-viewer">
          <div className="document-tabs">
            <button
              className={`document-tab ${activeTab === 'improved' ? 'active' : ''}`}
              onClick={() => setActiveTab('improved')}
            >
              Improved Document
            </button>
            <button
              className={`document-tab ${activeTab === 'original' ? 'active' : ''}`}
              onClick={() => setActiveTab('original')}
            >
              Original Document
            </button>
          </div>

          <div className="document-content">
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => copyToClipboard(activeTab === 'improved' ? document.improved_text : document.original_text)}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => downloadDocument(
                  activeTab === 'improved' ? document.improved_text : document.original_text,
                  document.filename,
                  activeTab
                )}
              >
                <Download size={16} />
                Download
              </button>
            </div>

            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {activeTab === 'improved' ? document.improved_text : document.original_text}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer; 