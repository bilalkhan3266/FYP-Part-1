FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
RUN cd backend && npm ci --only=production && cd ..

# Install frontend dependencies
RUN cd frontend && npm ci && cd ..

# Copy project files
COPY . .

# Build frontend
RUN cd frontend && npm run build && cd ..

# Expose ports
EXPOSE 5000 3000

# Set environment
ENV NODE_ENV=production

# Start backend server
WORKDIR /app/backend
CMD ["npm", "start"]
