FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files only
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --production

# Copy backend code
COPY backend/ .

# Expose backend port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start backend server
CMD ["npm", "start"]
