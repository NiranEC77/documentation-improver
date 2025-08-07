FROM ollama/ollama:latest

# Set environment variables
ENV OLLAMA_HOST=0.0.0.0
ENV OLLAMA_ORIGINS=*



# Expose port
EXPOSE 11434

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:11434/api/tags || exit 1

# Start Ollama
CMD ["ollama", "serve"] 