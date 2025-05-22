#!/bin/bash

echo "🧪 Running Integration Tests..."

# Set environment variables
export NODE_ENV=test
export DATABASE_URL="postgresql://testuser:testpass@localhost:5436/test_taskmanagement?schema=public"
export JWT_SECRET="test-jwt-secret-key-for-integration-testing"
export JWT_REFRESH_SECRET="test-refresh-token-secret-for-integration-testing"
export JWT_EXPIRES_IN="1h"
export JWT_REFRESH_EXPIRES_IN="7d"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run tests
echo "🚀 Running tests..."
npx jest src/__tests__/integration/auth.integration.test.ts --testTimeout=60000 --verbose

echo "✅ Done!"
