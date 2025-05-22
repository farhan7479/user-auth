import request from 'supertest';
import createTestApp from './test-app';
import TestDatabase from './test-database';
import { Application } from 'express';

const app: Application = createTestApp();

describe('🚀 End-to-End User Journey Tests', () => {
  beforeAll(async () => {
    await TestDatabase.connect();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.cleanup();
    await TestDatabase.disconnect();
  });

  describe('Complete User Journey: Register → Login → Create Tasks → Manage Tasks → Logout', () => {
    it('should complete full user journey successfully', async () => {
      // 📝 STEP 1: User Registration
      const userData = {
        email: 'journeyuser@example.com',
        password: 'securepassword123',
        name: 'Journey User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.email).toBe(userData.email);

      // 🔐 STEP 2: User Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const { accessToken, refreshToken, user } = loginResponse.body.data;
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(user.email).toBe(userData.email);

      // 👤 STEP 3: Get User Profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe(userData.email);

      // 📋 STEP 4: Create Multiple Tasks
      const tasks = [
        {
          title: 'Setup development environment',
          description: 'Install Node.js, VS Code, and Git',
          status: 'TODO'
        },
        {
          title: 'Learn React basics',
          description: 'Complete React tutorial and build a simple app',
          status: 'TODO'
        },
        {
          title: 'Build task management app',
          description: 'Create a full-stack task management application',
          status: 'IN_PROGRESS'
        }
      ];

      const createdTasks = [];
      for (const taskData of tasks) {
        const taskResponse = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(taskData)
          .expect(201);

        expect(taskResponse.body.success).toBe(true);
        expect(taskResponse.body.data.title).toBe(taskData.title);
        createdTasks.push(taskResponse.body.data);
      }

      // ✅ STEP 5: Get All Tasks
      const allTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(allTasksResponse.body.data).toHaveLength(3);
      
      // Verify all created tasks are returned
      const returnedTitles = allTasksResponse.body.data.map((task: any) => task.title);
      tasks.forEach(task => {
        expect(returnedTitles).toContain(task.title);
      });

      // 🔍 STEP 6: Get Specific Task
      const firstTaskId = createdTasks[0].id;
      const specificTaskResponse = await request(app)
        .get(`/api/tasks/${firstTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(specificTaskResponse.body.data.id).toBe(firstTaskId);
      expect(specificTaskResponse.body.data.title).toBe(tasks[0].title);

      // ✏️ STEP 7: Update Task Status
      const updateTaskResponse = await request(app)
        .put(`/api/tasks/${firstTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ 
          status: 'DONE',
          description: 'Completed: Development environment is ready!'
        })
        .expect(200);

      expect(updateTaskResponse.body.data.status).toBe('DONE');
      expect(updateTaskResponse.body.data.description).toBe('Completed: Development environment is ready!');

      // 🗑️ STEP 8: Delete Completed Task
      const deleteTaskResponse = await request(app)
        .delete(`/api/tasks/${firstTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(deleteTaskResponse.body.success).toBe(true);
      expect(deleteTaskResponse.body.message).toBe('Task deleted successfully');

      // Verify task was deleted
      await request(app)
        .get(`/api/tasks/${firstTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // 📊 STEP 9: Verify Final State
      const finalTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(finalTasksResponse.body.data).toHaveLength(2); // One task deleted

      // 🔄 STEP 10: Refresh Token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.data.accessToken).toBeTruthy();
      expect(refreshResponse.body.data.refreshToken).toBeTruthy();

      // New tokens should be different
      expect(refreshResponse.body.data.accessToken).not.toBe(accessToken);
      expect(refreshResponse.body.data.refreshToken).not.toBe(refreshToken);

      // 🔍 STEP 11: Use New Token
      const newAccessToken = refreshResponse.body.data.accessToken;
      const profileWithNewTokenResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(profileWithNewTokenResponse.body.data.email).toBe(userData.email);

      // 🏁 FINAL VERIFICATION: Check Database State
      const prisma = TestDatabase.getPrisma();
      
      // Verify user exists
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { tasks: true }
      });

      expect(userInDb).toBeTruthy();
      expect(userInDb!.email).toBe(userData.email);
      expect(userInDb!.tasks).toHaveLength(2); // 3 created - 1 deleted = 2

      // Verify remaining tasks
      const taskTitles = userInDb!.tasks.map((task: any) => task.title);
      expect(taskTitles).toContain('Learn React basics');
      expect(taskTitles).toContain('Build task management app');
      expect(taskTitles).not.toContain('Setup development environment'); // Deleted
    });
  });

  describe('Multi-User Scenario: User Isolation', () => {
    it('should maintain proper data isolation between users', async () => {
      // 👥 Create two users
      const user1Data = {
        email: 'user1@example.com',
        password: 'password123',
        name: 'User One'
      };

      const user2Data = {
        email: 'user2@example.com',
        password: 'password123',
        name: 'User Two'
      };

      // Register both users
      await request(app)
        .post('/api/auth/register')
        .send(user1Data)
        .expect(201);

      await request(app)
        .post('/api/auth/register')
        .send(user2Data)
        .expect(201);

      // Login both users
      const login1Response = await request(app)
        .post('/api/auth/login')
        .send({ email: user1Data.email, password: user1Data.password });

      const login2Response = await request(app)
        .post('/api/auth/login')
        .send({ email: user2Data.email, password: user2Data.password });

      const user1Token = login1Response.body.data.accessToken;
      const user2Token = login2Response.body.data.accessToken;

      // 📋 Each user creates tasks
      const user1TaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User 1 Private Task', description: 'Only user 1 should see this' })
        .expect(201);

      const user2TaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'User 2 Private Task', description: 'Only user 2 should see this' })
        .expect(201);

      const user1TaskId = user1TaskResponse.body.data.id;
      const user2TaskId = user2TaskResponse.body.data.id;

      // 🔒 Test data isolation: User 1 should only see their tasks
      const user1TasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(user1TasksResponse.body.data).toHaveLength(1);
      expect(user1TasksResponse.body.data[0].title).toBe('User 1 Private Task');

      // 🔒 Test data isolation: User 2 should only see their tasks
      const user2TasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2TasksResponse.body.data).toHaveLength(1);
      expect(user2TasksResponse.body.data[0].title).toBe('User 2 Private Task');

      // 🚫 Test access control: User 1 cannot access User 2's task
      await request(app)
        .get(`/api/tasks/${user2TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      // 🚫 Test access control: User 2 cannot access User 1's task
      await request(app)
        .get(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // 🚫 Test modification control: User 1 cannot update User 2's task
      await request(app)
        .put(`/api/tasks/${user2TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Hacked!' })
        .expect(403);

      // 🚫 Test deletion control: User 2 cannot delete User 1's task
      await request(app)
        .delete(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // ✅ Verify tasks remain unchanged
      const finalUser1TaskResponse = await request(app)
        .get(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const finalUser2TaskResponse = await request(app)
        .get(`/api/tasks/${user2TaskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(finalUser1TaskResponse.body.data.title).toBe('User 1 Private Task');
      expect(finalUser2TaskResponse.body.data.title).toBe('User 2 Private Task');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle authentication edge cases properly', async () => {
      // Register user
      const userData = {
        email: 'edgecase@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(200);

      const { accessToken } = loginResponse.body.data;

      // Create a task
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Task' })
        .expect(201);

      const taskId = taskResponse.body.data.id;

      // Test various authentication edge cases
      
      // 1. Malformed token
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // 2. Missing Bearer prefix
      await request(app)
        .get('/api/tasks')
        .set('Authorization', accessToken)
        .expect(401);

      // 3. Empty authorization header
      await request(app)
        .get('/api/tasks')
        .set('Authorization', '')
        .expect(401);

      // 4. No authorization header
      await request(app)
        .get('/api/tasks')
        .expect(401);

      // 5. Valid token should still work
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should handle task validation edge cases', async () => {
      // Register and login user
      const userData = {
        email: 'validation@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(userData);

      const { accessToken } = loginResponse.body.data;

      // Test task validation edge cases

      // 1. Empty title
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '' })
        .expect(400);

      // 2. Title with only whitespace
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '   ' })
        .expect(400);

      // 3. Missing title entirely
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'No title provided' })
        .expect(400);

      // 4. Valid minimal task should work
      const validResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Valid Task' })
        .expect(201);

      expect(validResponse.body.data.title).toBe('Valid Task');
      expect(validResponse.body.data.status).toBe('TODO'); // Default status
      expect(validResponse.body.data.description).toBeNull(); // Optional field
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple rapid requests efficiently', async () => {
      // Register user
      const userData = {
        email: 'performance@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(userData);

      const { accessToken } = loginResponse.body.data;

      // Create multiple tasks rapidly
      const taskPromises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: `Rapid Task ${i + 1}` })
      );

      const startTime = Date.now();
      const responses = await Promise.all(taskPromises);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should complete in reasonable time (adjust threshold as needed)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds

      // Verify all tasks were created
      const allTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(allTasksResponse.body.data).toHaveLength(10);

      console.log(`✅ Created 10 tasks in ${duration}ms`);
    });
  });
});
