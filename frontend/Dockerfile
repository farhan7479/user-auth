# Use a Node.js base image
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build a minimal index.html for testing
RUN echo '<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>Task App</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>' > index.html

# Use Nginx to serve the application
FROM nginx:alpine

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a simple HTML file to verify the container works
RUN echo '<!DOCTYPE html><html><head><title>Task Management</title></head><body><h1>Task Management App</h1><p>The application is running.</p></body></html>' > /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
