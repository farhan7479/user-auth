import dotenv from 'dotenv';

// Load test environment variables before any other imports
dotenv.config({ path: '.env.test' });

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://testuser:testpass@localhost:5436/test_taskmanagement?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-token-secret-for-integration-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Increase timeout for integration tests
jest.setTimeout(60000);

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Global cleanup
  await new Promise(resolve => setTimeout(resolve, 1000)); // Give time for cleanup
});
