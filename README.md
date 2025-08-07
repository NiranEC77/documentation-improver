# Documentation Improver

A web application that transforms existing documentation into clean, professional Google GCP-style documentation using local LLMs.

## 🎯 Features

- **Documentation Enhancement**: Improve clarity, structure, and readability
- **GCP Style**: Transform docs to match Google Cloud Platform documentation style
- **Local LLM**: Run entirely on local infrastructure with privacy
- **Kubernetes Ready**: Complete containerized deployment
- **Real-time Processing**: Live document improvement with progress tracking

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   LLM Service   │
│   (React)       │◄──►│   (Flask)       │◄──►│   (Ollama)      │
│                 │    │                 │    │                 │
│ - GCP Style UI  │    │ - Document API  │    │ - Local LLM     │
│ - Real-time     │    │ - LLM Client    │    │ - Model Mgmt    │
│ - Progress      │    │ - File Upload   │    │ - Inference     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Kubernetes cluster (minikube, kind, or cloud)
- Ollama (for local LLM)

### Local Development
```bash
# Clone the repository
git clone https://github.com/NiranEC77/documentation-improver.git
cd documentation-improver

# Start with Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3000
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Access the application
kubectl port-forward svc/frontend-service 3000:3000
```

## 📁 Project Structure

```
documentation-improver/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── styles/          # GCP-style CSS
│   │   └── services/        # API services
├── backend/                  # Flask API
│   ├── app.py              # Main application
│   ├── services/           # Business logic
│   └── models/             # Data models
├── llm-service/             # LLM integration
│   ├── ollama/             # Ollama configuration
│   └── models/             # LLM models
├── k8s/                     # Kubernetes manifests
│   ├── frontend-deployment.yaml
│   ├── backend-deployment.yaml
│   └── llm-deployment.yaml
└── docs/                    # Documentation
```

## 🎨 GCP Documentation Style

The application transforms documentation to match Google Cloud Platform's style:

- **Clean Typography**: Clear hierarchy with proper spacing
- **Code Blocks**: Syntax-highlighted with copy functionality
- **Navigation**: Sidebar navigation with search
- **Responsive**: Mobile-friendly design
- **Accessibility**: WCAG compliant

## 🤖 LLM Integration

### Supported Models
- **CodeLlama**: For technical documentation
- **Mistral**: For general content improvement
- **Llama2**: For comprehensive text processing

### Processing Pipeline
1. **Document Analysis**: Extract structure and content
2. **Style Transformation**: Apply GCP documentation patterns
3. **Content Enhancement**: Improve clarity and conciseness
4. **Format Optimization**: Structure for better readability

## 🔧 Configuration

### Environment Variables
```bash
# Backend
LLM_SERVICE_URL=http://llm-service:11434
MODEL_NAME=codellama:7b
MAX_TOKENS=4096

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

### LLM Configuration
```yaml
# ollama-config.yaml
models:
  - name: codellama:7b
    parameters:
      temperature: 0.1
      top_p: 0.9
      max_tokens: 4096
```

## 📊 API Endpoints

### Document Processing
- `POST /api/documents/upload` - Upload document
- `POST /api/documents/improve` - Improve document
- `GET /api/documents/{id}` - Get document status
- `GET /api/documents/{id}/result` - Get improved document

### LLM Management
- `GET /api/models` - List available models
- `POST /api/models/load` - Load model
- `DELETE /api/models/{name}` - Unload model

## 🚀 Deployment

### Docker Compose
```bash
docker-compose up -d
```

### Kubernetes
```bash
# Deploy all services
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=documentation-improver

# Access the application
kubectl port-forward svc/frontend-service 3000:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: `/docs` folder 