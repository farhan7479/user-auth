# Use Node.js LTS as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install essential tools
RUN apk add --no-cache bash curl openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client with correct binary targets
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Add a healthcheck to ensure the app is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start command with a small delay to ensure PostgreSQL is ready
CMD /bin/sh -c "sleep 5 && npx prisma migrate deploy && npm start"
