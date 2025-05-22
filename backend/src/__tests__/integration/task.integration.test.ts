import request from 'supertest';
import bcrypt from 'bcrypt';
import createTestApp from './test-app';
import TestDatabase from './test-database';
import { Application } from 'express';

const app: Application = createTestApp();

describe('📝 Task Integration Tests (Real Database)', () => {
  let userToken: string;
  let userId: string;
  let secondUserToken: string;
  let secondUserId: string;

  beforeAll(async () => {
    // Connect to test database
    await TestDatabase.connect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await TestDatabase.cleanup();

    // Create test users and get tokens
    const user1Data = {
      email: 'taskuser1@example.com',
      password: 'password123',
      name: 'Task User 1'
    };

    const user2Data = {
      email: 'taskuser2@example.com',
      password: 'password123',
      name: 'Task User 2'
    };

    // Register and login first user
    await request(app)
      .post('/api/auth/register')
      .send(user1Data);

    const login1Response = await request(app)
      .post('/api/auth/login')
      .send({ email: user1Data.email, password: user1Data.password });

    userToken = login1Response.body.data.accessToken;
    userId = login1Response.body.data.user.id;

    // Register and login second user
    await request(app)
      .post('/api/auth/register')
      .send(user2Data);

    const login2Response = await request(app)
      .post('/api/auth/login')
      .send({ email: user2Data.email, password: user2Data.password });

    secondUserToken = login2Response.body.data.accessToken;
    secondUserId = login2Response.body.data.user.id;
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await TestDatabase.cleanup();
    await TestDatabase.disconnect();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'This is a test task created via integration test',
        status: 'TODO'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(201);

      // Check API response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.status).toBe(taskData.status);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.id).toBeTruthy();
      expect(response.body.data.createdAt).toBeTruthy();
      expect(response.body.data.updatedAt).toBeTruthy();

      // Verify task was actually created in database
      const prisma = TestDatabase.getPrisma();
      const taskInDb = await prisma.task.findUnique({
        where: { id: response.body.data.id }
      });

      expect(taskInDb).toBeTruthy();
      expect(taskInDb!.title).toBe(taskData.title);
      expect(taskInDb!.description).toBe(taskData.description);
      expect(taskInDb!.status).toBe(taskData.status);
      expect(taskInDb!.userId).toBe(userId);
    });

    it('should create task with default status when not provided', async () => {
      const taskData = {
        title: 'Task without status'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.data.status).toBe('TODO');

      // Verify in database
      const prisma = TestDatabase.getPrisma();
      const taskInDb = await prisma.task.findUnique({
        where: { id: response.body.data.id }
      });
      expect(taskInDb!.status).toBe('TODO');
    });

    it('should return 400 when title is missing', async () => {
      const taskData = {
        description: 'Task without title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Title is required');

      // Verify no task was created
      const prisma = TestDatabase.getPrisma();
      const tasks = await prisma.task.findMany();
      expect(tasks).toHaveLength(0);
    });

    it('should return 401 without authentication token', async () => {
      const taskData = {
        title: 'Unauthorized task'
      };

      await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create some test tasks for different users
      const prisma = TestDatabase.getPrisma();
      
      // Tasks for first user
      await prisma.task.createMany({
        data: [
          {
            title: 'User 1 Task 1',
            description: 'First task for user 1',
            status: 'TODO',
            userId: userId
          },
          {
            title: 'User 1 Task 2',
            description: 'Second task for user 1',
            status: 'IN_PROGRESS',
            userId: userId
          }
        ]
      });

      // Tasks for second user
      await prisma.task.createMany({
        data: [
          {
            title: 'User 2 Task 1',
            description: 'First task for user 2',
            status: 'DONE',
            userId: secondUserId
          }
        ]
      });
    });

    it('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Should only get tasks for the authenticated user
      response.body.data.forEach((task: any) => {
        expect(task.userId).toBe(userId);
      });

      // Verify task details
      const taskTitles = response.body.data.map((task: any) => task.title);
      expect(taskTitles).toContain('User 1 Task 1');
      expect(taskTitles).toContain('User 1 Task 2');
      expect(taskTitles).not.toContain('User 2 Task 1');
    });

    it('should return empty array when user has no tasks', async () => {
      // Clean all tasks
      await TestDatabase.getPrisma().task.deleteMany({});

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });

    it('should return tasks in descending order by creation date', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const tasks = response.body.data;
      expect(tasks).toHaveLength(2);

      // Verify tasks are ordered by createdAt descending
      const createdDates = tasks.map((task: any) => new Date(task.createdAt));
      expect(createdDates[0] >= createdDates[1]).toBe(true);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let taskId: string;
    let otherUserTaskId: string;

    beforeEach(async () => {
      // Create tasks for testing
      const prisma = TestDatabase.getPrisma();
      
      const task1 = await prisma.task.create({
        data: {
          title: 'Get Task by ID',
          description: 'Test task for getting by ID',
          status: 'TODO',
          userId: userId
        }
      });
      taskId = task1.id;

      const task2 = await prisma.task.create({
        data: {
          title: 'Other User Task',
          description: 'Task belonging to another user',
          status: 'TODO',
          userId: secondUserId
        }
      });
      otherUserTaskId = task2.id;
    });

    it('should get task by ID for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Get Task by ID');
      expect(response.body.data.userId).toBe(userId);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = 'non-existent-task-id';

      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Task not found');
    });

    it('should return 403 when trying to access another user\'s task', async () => {
      const response = await request(app)
        .get(`/api/tasks/${otherUserTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this task');
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(401);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId: string;
    let otherUserTaskId: string;

    beforeEach(async () => {
      const prisma = TestDatabase.getPrisma();
      
      const task1 = await prisma.task.create({
        data: {
          title: 'Original Title',
          description: 'Original description',
          status: 'TODO',
          userId: userId
        }
      });
      taskId = task1.id;

      const task2 = await prisma.task.create({
        data: {
          title: 'Other User Task',
          status: 'TODO',
          userId: secondUserId
        }
      });
      otherUserTaskId = task2.id;
    });

    it('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        status: 'IN_PROGRESS'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task updated successfully');
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);

      // Verify in database
      const prisma = TestDatabase.getPrisma();
      const updatedTask = await prisma.task.findUnique({
        where: { id: taskId }
      });

      expect(updatedTask!.title).toBe(updateData.title);
      expect(updatedTask!.description).toBe(updateData.description);
      expect(updatedTask!.status).toBe(updateData.status);
    });

    it('should update only provided fields (partial update)', async () => {
      const updateData = {
        status: 'DONE'
        // Only updating status, not title or description
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.title).toBe('Original Title'); // Should remain unchanged
      expect(response.body.data.description).toBe('Original description'); // Should remain unchanged
      expect(response.body.data.status).toBe('DONE'); // Should be updated

      // Verify in database
      const prisma = TestDatabase.getPrisma();
      const updatedTask = await prisma.task.findUnique({
        where: { id: taskId }
      });

      expect(updatedTask!.title).toBe('Original Title');
      expect(updatedTask!.description).toBe('Original description');
      expect(updatedTask!.status).toBe('DONE');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = 'non-existent-task-id';

      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Task not found');
    });

    it('should return 403 when trying to update another user\'s task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${otherUserTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Hacked!' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to update this task');

      // Verify task was not updated
      const prisma = TestDatabase.getPrisma();
      const task = await prisma.task.findUnique({
        where: { id: otherUserTaskId }
      });
      expect(task!.title).toBe('Other User Task'); // Should remain unchanged
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ title: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string;
    let otherUserTaskId: string;

    beforeEach(async () => {
      const prisma = TestDatabase.getPrisma();
      
      const task1 = await prisma.task.create({
        data: {
          title: 'Task to Delete',
          status: 'TODO',
          userId: userId
        }
      });
      taskId = task1.id;

      const task2 = await prisma.task.create({
        data: {
          title: 'Other User Task',
          status: 'TODO',
          userId: secondUserId
        }
      });
      otherUserTaskId = task2.id;
    });

    it('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
      expect(response.body.data).toBeNull();

      // Verify task was deleted from database
      const prisma = TestDatabase.getPrisma();
      const deletedTask = await prisma.task.findUnique({
        where: { id: taskId }
      });
      expect(deletedTask).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = 'non-existent-task-id';

      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Task not found');
    });

    it('should return 403 when trying to delete another user\'s task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${otherUserTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to delete this task');

      // Verify task was not deleted
      const prisma = TestDatabase.getPrisma();
      const task = await prisma.task.findUnique({
        where: { id: otherUserTaskId }
      });
      expect(task).toBeTruthy();
    });

    it('should return 401 without authentication token', async () => {
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(401);
    });
  });

  describe('🧪 Database Integrity Tests', () => {
    it('should enforce foreign key constraint (task belongs to user)', async () => {
      // This test verifies that tasks cannot exist without a valid user
      const prisma = TestDatabase.getPrisma();

      // Try to create a task with non-existent userId (should fail)
      await expect(
        prisma.task.create({
          data: {
            title: 'Orphan Task',
            userId: 'non-existent-user-id'
          }
        })
      ).rejects.toThrow();
    });

    it('should delete user tasks when user is deleted (cascade)', async () => {
      // Create tasks for user
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Task 1' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Task 2' });

      const prisma = TestDatabase.getPrisma();

      // Verify tasks exist
      const tasksBefore = await prisma.task.findMany({
        where: { userId: userId }
      });
      expect(tasksBefore).toHaveLength(2);

      // Delete user (should cascade delete tasks)
      await prisma.user.delete({
        where: { id: userId }
      });

      // Verify tasks were also deleted
      const tasksAfter = await prisma.task.findMany({
        where: { userId: userId }
      });
      expect(tasksAfter).toHaveLength(0);
    });

    it('should handle concurrent task operations', async () => {
      // Create a task
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Concurrent Task' });

      const taskId = taskResponse.body.data.id;

      // Attempt concurrent updates
      const updatePromises = [
        request(app)
          .put(`/api/tasks/${taskId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ status: 'IN_PROGRESS' }),
        request(app)
          .put(`/api/tasks/${taskId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ status: 'DONE' }),
        request(app)
          .put(`/api/tasks/${taskId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: 'Updated Title' })
      ];

      const responses = await Promise.allSettled(updatePromises);

      // All updates should succeed (Prisma handles concurrency)
      responses.forEach(response => {
        if (response.status === 'fulfilled') {
          expect(response.value.status).toBe(200);
        }
      });

      // Verify task still exists and has valid state
      const prisma = TestDatabase.getPrisma();
      const finalTask = await prisma.task.findUnique({
        where: { id: taskId }
      });
      expect(finalTask).toBeTruthy();
    });
  });
});
