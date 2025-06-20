# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/cache/apk/*

# Install Expo CLI globally
RUN npm install -g @expo/cli

# Copy package files
COPY react-native-app/package*.json ./

# Install dependencies
RUN npm install

# Copy React Native app code
COPY react-native-app/ ./

# Create necessary directories
RUN mkdir -p /app/.cache

# Set permissions
RUN chown -R node:node /app
USER node

# Expose ports for Expo
EXPOSE 8081 19000 19001 19002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/status || exit 1

# Start Expo development server
CMD ["npx", "expo", "start", "--host", "0.0.0.0", "--port", "8081"] 