import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';
import Header from './components/Header';
import DocumentUpload from './components/DocumentUpload';
import DocumentViewer from './components/DocumentViewer';
import ModelManager from './components/ModelManager';
import Sidebar from './components/Sidebar';

function App() {
  const [socket, setSocket] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState('codellama:7b');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connected', (data) => {
      console.log('Connected to backend:', data.message);
    });

    newSocket.on('document_update', (data) => {
      console.log('[FRONTEND] Document update received:', data);
      updateDocumentStatus(data);
    });

    // Load models on startup
    fetchModels();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setModels(data.models || []);
      setCurrentModel(data.current_model || 'codellama:7b');
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const updateDocumentStatus = (updateData) => {
    console.log('[FRONTEND] Updating document status:', updateData);
    setDocuments(prevDocs => {
      const updatedDocs = prevDocs.map(doc => {
        if (doc.id === updateData.document_id) {
          const updatedDoc = {
            ...doc,
            status: updateData.status,
            progress: updateData.progress || doc.progress,
            improved_text: updateData.improved_text || doc.improved_text,
            error: updateData.error || doc.error
          };
          console.log('[FRONTEND] Updated document:', updatedDoc);
          return updatedDoc;
        }
        return doc;
      });
      return updatedDocs;
    });
  };

  const addDocument = (document) => {
    setDocuments(prevDocs => [document, ...prevDocs]);
    setCurrentDocument(document);
  };

  const selectDocument = (document) => {
    setCurrentDocument(document);
  };

  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-container">
          <Sidebar 
            documents={documents}
            onDocumentSelect={selectDocument}
            currentDocument={currentDocument}
          />
          <main className="content">
            <Routes>
              <Route 
                path="/" 
                element={
                  <DocumentUpload 
                    onDocumentUploaded={addDocument}
                    socket={socket}
                    currentModel={currentModel}
                  />
                } 
              />
              <Route 
                path="/document/:id" 
                element={
                  <DocumentViewer 
                    document={currentDocument}
                    socket={socket}
                  />
                } 
              />
              <Route 
                path="/models" 
                element={
                  <ModelManager 
                    models={models}
                    currentModel={currentModel}
                    onModelChange={setCurrentModel}
                    onModelsRefresh={fetchModels}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App; 