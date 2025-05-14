#!/bin/bash

# Development utility script for the task management app

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Task Management Development Utility${NC}"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start the application with Docker Compose"
    echo "  stop        Stop the running containers"
    echo "  restart     Restart the application"
    echo "  logs        Show logs for all or a specific service"
    echo "  db-reset    Reset the database (deletes all data)"
    echo "  migrate     Run database migrations"
    echo "  shell       Open a shell in the backend container"
    echo "  db-shell    Open a PostgreSQL shell"
    echo "  help        Show this help message"
    echo ""
}

# Start the application
start() {
    echo -e "${GREEN}Starting the application...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Application started!${NC}"
    echo -e "Backend API: http://localhost:3000"
    echo -e "API Documentation: http://localhost:3000/api-docs"
}

# Stop the application
stop() {
    echo -e "${YELLOW}Stopping the application...${NC}"
    docker-compose down
    echo -e "${GREEN}Application stopped!${NC}"
}

# Restart the application
restart() {
    echo -e "${YELLOW}Restarting the application...${NC}"
    docker-compose down
    docker-compose up -d
    echo -e "${GREEN}Application restarted!${NC}"
}

# Show container logs
logs() {
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Reset the database
db_reset() {
    echo -e "${RED}WARNING: This will delete all data in the database.${NC}"
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping containers...${NC}"
        docker-compose down
        
        echo -e "${YELLOW}Removing database volume...${NC}"
        docker volume rm user-auth_postgres-data
        
        echo -e "${YELLOW}Restarting application...${NC}"
        docker-compose up -d
        
        echo -e "${GREEN}Database has been reset!${NC}"
    else
        echo -e "${YELLOW}Database reset cancelled.${NC}"
    fi
}

# Run database migrations
migrate() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker-compose exec backend npx prisma migrate deploy
    echo -e "${GREEN}Migrations completed!${NC}"
}

# Open a shell in the backend container
shell() {
    echo -e "${YELLOW}Opening shell in backend container...${NC}"
    docker-compose exec backend /bin/sh
}

# Open a PostgreSQL shell
db_shell() {
    echo -e "${YELLOW}Opening PostgreSQL shell...${NC}"
    docker-compose exec postgres psql -U postgres -d taskmanagement
}

# Main execution
case "$1" in
    "start")
        start
        ;;
    "stop")
        stop
        ;;
    "restart")
        restart
        ;;
    "logs")
        logs "$2"
        ;;
    "db-reset")
        db_reset
        ;;
    "migrate")
        migrate
        ;;
    "shell")
        shell
        ;;
    "db-shell")
        db_shell
        ;;
    "help" | *)
        show_usage
        ;;
esac
