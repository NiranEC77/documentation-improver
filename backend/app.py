from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import uuid
import json
import requests
from werkzeug.utils import secure_filename
import threading
import time
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS
CORS(app, origins=["http://localhost:3000", "http://frontend:3000"])

# SocketIO for real-time updates
socketio = SocketIO(app, cors_allowed_origins="*")

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configuration
LLM_SERVICE_URL = os.environ.get('LLM_SERVICE_URL', 'http://documentation-improver-llm-service:11434')
MODEL_NAME = os.environ.get('MODEL_NAME', 'codellama:7b')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '4096'))

# In-memory storage for document processing status
document_status = {}

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'txt', 'md', 'rst', 'docx', 'pdf'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path):
    """Extract text from various file formats"""
    file_extension = file_path.rsplit('.', 1)[1].lower()
    
    if file_extension == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif file_extension == 'md':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif file_extension == 'rst':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        # For other formats, return placeholder
        return f"Document content from {file_extension} file"

def extract_text_from_url(url):
    """Extract text content from a URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Try to extract text content (basic implementation)
        # For better results, you might want to use libraries like beautifulsoup4
        content = response.text
        
        # Basic HTML tag removal (simple approach)
        import re
        # Remove HTML tags
        content = re.sub(r'<[^>]+>', '', content)
        # Remove extra whitespace
        content = re.sub(r'\s+', ' ', content)
        # Remove special characters
        content = re.sub(r'[^\w\s\-.,!?;:()]', '', content)
        
        return content.strip()
    except Exception as e:
        raise Exception(f"Failed to extract content from URL: {str(e)}")

def create_gcp_style_prompt(original_text):
    """Create a prompt to transform text into GCP-style documentation"""
    return f"""Transform the following documentation into Google Cloud Platform (GCP) style documentation. 

GCP Documentation Style Guidelines:
1. Use clear, concise language
2. Structure with proper headings and subheadings
3. Include code examples with syntax highlighting
4. Add step-by-step instructions where appropriate
5. Use consistent formatting and spacing
6. Include relevant links and references
7. Make it scannable with bullet points and numbered lists
8. Use professional, technical tone
9. Include prerequisites and requirements sections
10. Add troubleshooting sections when relevant

Original Documentation:
{original_text}

Please transform this into clean, professional GCP-style documentation:"""

def improve_document_with_llm(text, document_id):
    """Improve document using LLM service"""
    try:
        print(f"[LLM PROCESSING] Starting LLM processing for document {document_id}")
        print(f"[LLM PROCESSING] Using model: {MODEL_NAME}")
        print(f"[LLM PROCESSING] Text length: {len(text)} characters")
        
        # Create the prompt
        prompt = create_gcp_style_prompt(text)
        print(f"[LLM PROCESSING] Prompt created, length: {len(prompt)} characters")
        
        # Prepare the request for Ollama
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
                "num_predict": MAX_TOKENS
            }
        }
        
        print(f"[LLM PROCESSING] Sending request to LLM service: {LLM_SERVICE_URL}")
        
        # Update status
        document_status[document_id]['status'] = 'processing'
        document_status[document_id]['progress'] = 10
        socketio.emit('document_update', {
            'document_id': document_id,
            'status': 'processing',
            'progress': 10
        })
        
        # Call LLM service
        print(f"[LLM PROCESSING] Making request to LLM service...")
        response = requests.post(
            f"{LLM_SERVICE_URL}/api/generate",
            json=payload,
            timeout=300  # 5 minutes timeout
        )
        
        print(f"[LLM PROCESSING] LLM service response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            improved_text = result.get('response', '')
            print(f"[LLM PROCESSING] LLM response received, length: {len(improved_text)} characters")
            print(f"[LLM PROCESSING] First 200 characters of response: {improved_text[:200]}...")
            
            # Update status
            document_status[document_id]['status'] = 'completed'
            document_status[document_id]['progress'] = 100
            document_status[document_id]['improved_text'] = improved_text
            document_status[document_id]['completed_at'] = datetime.now().isoformat()
            
            socketio.emit('document_update', {
                'document_id': document_id,
                'status': 'completed',
                'progress': 100,
                'improved_text': improved_text
            })
            
            return improved_text
        else:
            raise Exception(f"LLM service error: {response.status_code}")
            
    except Exception as e:
        document_status[document_id]['status'] = 'error'
        document_status[document_id]['error'] = str(e)
        socketio.emit('document_update', {
            'document_id': document_id,
            'status': 'error',
            'error': str(e)
        })
        raise e

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'llm_service_url': LLM_SERVICE_URL,
        'model_name': MODEL_NAME
    })

@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    """Upload a document for processing"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{document_id}_{filename}")
        file.save(file_path)
        
        # Extract text from file
        original_text = extract_text_from_file(file_path)
        
        # Initialize document status
        document_status[document_id] = {
            'id': document_id,
            'filename': filename,
            'original_text': original_text,
            'status': 'uploaded',
            'progress': 0,
            'created_at': datetime.now().isoformat(),
            'improved_text': None,
            'error': None
        }
        
        # Start processing in background
        def process_document():
            try:
                improve_document_with_llm(original_text, document_id)
            except Exception as e:
                print(f"Error processing document {document_id}: {e}")
        
        thread = threading.Thread(target=process_document)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'document_id': document_id,
            'filename': filename,
            'status': 'uploaded',
            'message': 'Document uploaded and processing started'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/ingest-url', methods=['POST'])
def ingest_url():
    """Ingest document from URL"""
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'URL not provided'}), 400
        
        url = data['url'].strip()
        if not url:
            return jsonify({'error': 'URL cannot be empty'}), 400
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL format. Must start with http:// or https://'}), 400
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        print(f"[URL INGESTION] Starting ingestion for URL: {url}")
        print(f"[URL INGESTION] Document ID: {document_id}")
        
        # Extract text from URL
        try:
            print(f"[URL INGESTION] Extracting content from URL...")
            original_text = extract_text_from_url(url)
            print(f"[URL INGESTION] Content extracted successfully. Length: {len(original_text)} characters")
            print(f"[URL INGESTION] First 200 characters: {original_text[:200]}...")
        except Exception as e:
            print(f"[URL INGESTION] ERROR: Failed to extract content: {str(e)}")
            return jsonify({'error': f'Failed to extract content from URL: {str(e)}'}), 400
        
        # Initialize document status
        document_status[document_id] = {
            'id': document_id,
            'filename': f"url_document_{document_id[:8]}.txt",
            'original_text': original_text,
            'status': 'uploaded',
            'progress': 0,
            'created_at': datetime.now().isoformat(),
            'improved_text': None,
            'error': None,
            'source_url': url
        }
        
        # Start processing in background
        def process_document():
            try:
                improve_document_with_llm(original_text, document_id)
            except Exception as e:
                print(f"Error processing document {document_id}: {e}")
        
        thread = threading.Thread(target=process_document)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'document_id': document_id,
            'filename': f"url_document_{document_id[:8]}.txt",
            'status': 'uploaded',
            'message': 'URL content ingested and processing started',
            'source_url': url
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/<document_id>', methods=['GET'])
def get_document_status(document_id):
    """Get document processing status"""
    if document_id not in document_status:
        return jsonify({'error': 'Document not found'}), 404
    
    return jsonify(document_status[document_id])

@app.route('/api/documents/<document_id>/result', methods=['GET'])
def get_document_result(document_id):
    """Get improved document result"""
    if document_id not in document_status:
        return jsonify({'error': 'Document not found'}), 404
    
    doc = document_status[document_id]
    if doc['status'] != 'completed':
        return jsonify({'error': 'Document processing not completed'}), 400
    
    return jsonify({
        'document_id': document_id,
        'original_text': doc['original_text'],
        'improved_text': doc['improved_text'],
        'filename': doc['filename'],
        'completed_at': doc['completed_at']
    })

@app.route('/api/models', methods=['GET'])
def list_models():
    """List available LLM models"""
    try:
        print(f"[MODELS] Fetching models from: {LLM_SERVICE_URL}/api/tags")
        response = requests.get(f"{LLM_SERVICE_URL}/api/tags", timeout=10)
        print(f"[MODELS] Response status: {response.status_code}")
        
        if response.status_code == 200:
            models = response.json()
            print(f"[MODELS] Response data: {models}")
            model_list = models.get('models', [])
            print(f"[MODELS] Found {len(model_list)} models: {[m.get('name', 'unknown') for m in model_list]}")
            
            return jsonify({
                'models': model_list,
                'current_model': MODEL_NAME
            })
        else:
            print(f"[MODELS] Error response: {response.text}")
            return jsonify({'error': f'Failed to fetch models: {response.status_code}'}), 500
    except Exception as e:
        print(f"[MODELS] Exception: {str(e)}")
        return jsonify({'error': f'Failed to connect to LLM service: {str(e)}'}), 500

@app.route('/api/models/load', methods=['POST'])
def load_model():
    """Load a specific model"""
    try:
        data = request.get_json()
        model_name = data.get('model_name', MODEL_NAME)
        
        print(f"[MODEL LOAD] Loading model: {model_name}")
        
        payload = {
            "name": model_name
        }
        
        print(f"[MODEL LOAD] Sending request to: {LLM_SERVICE_URL}/api/pull")
        response = requests.post(f"{LLM_SERVICE_URL}/api/pull", json=payload, timeout=300)
        
        print(f"[MODEL LOAD] Response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"[MODEL LOAD] Model {model_name} loaded successfully")
            return jsonify({
                'message': f'Model {model_name} loaded successfully',
                'model_name': model_name
            })
        else:
            print(f"[MODEL LOAD] Error response: {response.text}")
            return jsonify({'error': f'Failed to load model: {response.status_code}'}), 500
            
    except Exception as e:
        print(f"[MODEL LOAD] Exception: {str(e)}")
        return jsonify({'error': f'Failed to load model: {str(e)}'}), 500

@app.route('/api/models/auto-load', methods=['POST'])
def auto_load_model():
    """Automatically load the default model if no models are available"""
    try:
        print(f"[AUTO LOAD] Checking for available models...")
        
        # First check what models are available
        response = requests.get(f"{LLM_SERVICE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json()
            model_list = models.get('models', [])
            
            if model_list:
                print(f"[AUTO LOAD] Found {len(model_list)} models, no need to load")
                return jsonify({
                    'message': f'Found {len(model_list)} models already available',
                    'models': model_list
                })
        
        # No models found, load the default model
        print(f"[AUTO LOAD] No models found, loading default model: {MODEL_NAME}")
        
        payload = {
            "name": MODEL_NAME
        }
        
        response = requests.post(f"{LLM_SERVICE_URL}/api/pull", json=payload, timeout=300)
        
        if response.status_code == 200:
            print(f"[AUTO LOAD] Default model loaded successfully")
            return jsonify({
                'message': f'Default model {MODEL_NAME} loaded successfully',
                'model_name': MODEL_NAME
            })
        else:
            print(f"[AUTO LOAD] Error loading model: {response.text}")
            return jsonify({'error': f'Failed to load default model: {response.status_code}'}), 500
            
    except Exception as e:
        print(f"[AUTO LOAD] Exception: {str(e)}")
        return jsonify({'error': f'Failed to auto-load model: {str(e)}'}), 500

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    print('Client connected')
    emit('connected', {'message': 'Connected to document improvement service'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True) # Trigger new build with production fixes
