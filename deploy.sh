#!/bin/bash

# Documentation Improver Deployment Script
# This script deploys the application to Kubernetes

set -e

echo "🚀 Deploying Documentation Improver to Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if we're connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster. Please connect to a cluster first."
    exit 1
fi

echo "📋 Creating namespace..."
kubectl create namespace documentation-improver --dry-run=client -o yaml | kubectl apply -f -

echo "🔧 Applying Kubernetes manifests..."
kubectl apply -f k8s/ -n documentation-improver

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/documentation-improver-frontend -n documentation-improver
kubectl wait --for=condition=available --timeout=300s deployment/documentation-improver-backend -n documentation-improver
kubectl wait --for=condition=available --timeout=600s deployment/documentation-improver-llm -n documentation-improver

echo "📊 Checking deployment status..."
kubectl get pods -n documentation-improver

echo "🌐 Getting service URLs..."
echo "Frontend Service:"
kubectl get service documentation-improver-frontend-service -n documentation-improver

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔗 To access the application:"
echo "   kubectl port-forward svc/documentation-improver-frontend-service 3000:3000 -n documentation-improver"
echo ""
echo "📝 To check logs:"
echo "   kubectl logs -f deployment/documentation-improver-backend -n documentation-improver"
echo "   kubectl logs -f deployment/documentation-improver-llm -n documentation-improver"
echo ""
echo "🔧 To load a model:"
echo "   kubectl exec -it deployment/documentation-improver-llm -n documentation-improver -- ollama pull codellama:7b" 