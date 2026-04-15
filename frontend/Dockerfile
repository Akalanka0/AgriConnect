# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies based on package-lock.json
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Pass build-time variables (they can be overridden via docker build --build-arg)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the Vite application for production
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine
# Copy built files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite default Nginx configuration with our SPA friendly one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the host
EXPOSE 80

# Run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
