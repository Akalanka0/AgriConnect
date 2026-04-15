# Use official Node.js Alpine image for a smaller footprint
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 5005

# Start the backend server
CMD ["node", "server.js"]
