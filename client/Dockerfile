# Frontend Multi-stage Production Dockerfile with NGINX
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vite static assets
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy built static assets to NGINX root
COPY --from=build /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
