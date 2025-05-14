# Use Node.js as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 5173
EXPOSE 5173

# Start the Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
