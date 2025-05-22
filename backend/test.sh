#!/bin/bash

# 🧪 Test Runner Script for Task Management Backend
# This script helps you run different types of tests easily

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=================================="
    echo -e "🧪 $1"
    echo -e "==================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not running"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_success "Docker is available"
}

check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "Dependencies not installed. Installing..."
        npm install
    fi
    print_success "Dependencies are ready"
}

run_unit_tests() {
    print_header "Running Unit Tests (Fast)"
    npm run test:unit
    print_success "Unit tests completed"
}

run_integration_tests() {
    print_header "Running Integration Tests (Real Database)"
    check_docker
    
    print_warning "Starting test database..."
    npm run test:db:up
    
    print_warning "Waiting for database to be ready..."
    sleep 10
    
    print_warning "Running database migrations..."
    npx prisma migrate deploy
    
    print_warning "Running integration tests..."
    npm run test:integration
    
    print_warning "Cleaning up test database..."
    npm run test:db:down
    
    print_success "Integration tests completed"
}

run_all_tests() {
    print_header "Running All Tests (Unit + Integration)"
    run_unit_tests
    echo ""
    run_integration_tests
    print_success "All tests completed successfully!"
}

show_coverage() {
    print_header "Generating Test Coverage Report"
    npm run test:coverage
    print_success "Coverage report generated in ./coverage/ directory"
    
    if command -v open &> /dev/null; then
        print_warning "Opening coverage report in browser..."
        open coverage/lcov-report/index.html
    elif command -v xdg-open &> /dev/null; then
        print_warning "Opening coverage report in browser..."
        xdg-open coverage/lcov-report/index.html
    else
        print_warning "Open coverage/lcov-report/index.html in your browser to view the report"
    fi
}

watch_unit_tests() {
    print_header "Running Unit Tests in Watch Mode"
    npm run test:unit:watch
}

watch_integration_tests() {
    print_header "Running Integration Tests in Watch Mode"
    check_docker
    
    print_warning "Starting test database..."
    npm run test:db:up
    
    print_warning "Waiting for database to be ready..."
    sleep 10
    
    print_warning "Running database migrations..."
    npx prisma migrate deploy
    
    print_warning "Starting integration tests in watch mode..."
    print_warning "Press Ctrl+C twice to stop (first stops tests, second stops database)"
    
    # Trap to cleanup database when script is interrupted
    trap 'echo ""; print_warning "Stopping test database..."; npm run test:db:down; exit' INT
    
    npm run test:integration:watch
}

reset_test_db() {
    print_header "Resetting Test Database"
    check_docker
    npm run test:db:reset
    print_success "Test database reset completed"
}

show_help() {
    echo -e "${BLUE}🧪 Task Management Backend Test Runner${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  unit                Run unit tests (fast, mocked)"
    echo "  integration         Run integration tests (slow, real database)"
    echo "  all                 Run all tests (unit + integration)"
    echo "  coverage            Generate and open test coverage report"
    echo "  watch-unit          Run unit tests in watch mode"
    echo "  watch-integration   Run integration tests in watch mode"
    echo "  reset-db            Reset test database"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit                    # Quick feedback during development"
    echo "  $0 integration             # Test with real database"
    echo "  $0 all                     # Full test suite before commit"
    echo "  $0 coverage                # Check test coverage"
    echo "  $0 watch-unit              # Continuous testing during development"
    echo ""
    echo "Requirements:"
    echo "  - Node.js and npm installed"
    echo "  - Docker installed and running (for integration tests)"
    echo ""
    echo -e "${YELLOW}💡 Tip: Start with 'unit' tests for fast feedback, then run 'integration' tests for confidence${NC}"
}

# Main script logic
case ${1:-help} in
    unit)
        check_dependencies
        run_unit_tests
        ;;
    integration)
        check_dependencies
        run_integration_tests
        ;;
    all)
        check_dependencies
        run_all_tests
        ;;
    coverage)
        check_dependencies
        show_coverage
        ;;
    watch-unit)
        check_dependencies
        watch_unit_tests
        ;;
    watch-integration)
        check_dependencies
        watch_integration_tests
        ;;
    reset-db)
        reset_test_db
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
