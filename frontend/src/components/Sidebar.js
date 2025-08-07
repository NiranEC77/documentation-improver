import React from 'react';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Sidebar = ({ documents, onDocumentSelect, currentDocument }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Clock size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">Documents</div>
        {documents.length === 0 ? (
          <div style={{ padding: '12px 24px', color: 'var(--gcp-gray-500)', fontSize: '14px' }}>
            No documents uploaded yet
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`document-item ${currentDocument?.id === doc.id ? 'active' : ''}`}
              onClick={() => onDocumentSelect(doc)}
            >
              <div className="document-name">{doc.filename}</div>
              <div className={`document-status ${doc.status}`}>
                {getStatusIcon(doc.status)} {doc.status}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 