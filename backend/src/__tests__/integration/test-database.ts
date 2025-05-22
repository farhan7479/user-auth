import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create a separate Prisma client for testing
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export class TestDatabase {
  static async connect() {
    try {
      await testPrisma.$connect();
      console.log('✅ Connected to test database');
    } catch (error) {
      console.error('❌ Failed to connect to test database:', error);
      throw error;
    }
  }

  static async disconnect() {
    try {
      await testPrisma.$disconnect();
      console.log('✅ Disconnected from test database');
    } catch (error) {
      console.error('❌ Failed to disconnect from test database:', error);
      throw error;
    }
  }

  static async cleanup() {
    try {
      // Delete all records in reverse order due to foreign key constraints
      await testPrisma.task.deleteMany({});
      await testPrisma.user.deleteMany({});
      console.log('✅ Test database cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error);
      throw error;
    }
  }

  static async reset() {
    try {
      await this.cleanup();
      console.log('✅ Test database reset complete');
    } catch (error) {
      console.error('❌ Failed to reset test database:', error);
      throw error;
    }
  }

  static getPrisma() {
    return testPrisma;
  }

  // Helper method to create test users
  static async createTestUser(userData = {}) {
    const defaultUser = {
      email: 'test@example.com',
      password: '$2b$10$YourHashedPasswordHere', // Pre-hashed for testing
      name: 'Test User',
      ...userData,
    };

    return await testPrisma.user.create({
      data: defaultUser,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  // Helper method to create test tasks
  static async createTestTask(userId: string, taskData = {}) {
    const defaultTask = {
      title: 'Test Task',
      description: 'Test task description',
      status: 'TODO' as const,
      userId,
      ...taskData,
    };

    return await testPrisma.task.create({
      data: defaultTask,
    });
  }
}

export default TestDatabase;
