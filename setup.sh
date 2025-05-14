#!/bin/sh

# Make dev.sh executable
chmod +x dev.sh

# Information message
echo "Starting Docker setup for Task Management Application"
echo "---------------------------------------------------"
echo "Building and starting containers..."

# Start Docker Compose
docker-compose up -d

# Check if containers are running
echo "Checking if containers are running..."
docker-compose ps

echo "---------------------------------------------------"
echo "Setup complete! Your application should be available at:"
echo "Backend API: http://localhost:3000"
echo "API Documentation: http://localhost:3000/api-docs"
echo ""
echo "You can use ./dev.sh for common development tasks"
echo "---------------------------------------------------"
