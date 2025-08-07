FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with timeout and cache
RUN npm install --timeout=300000 --no-audit --no-fund

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"] 