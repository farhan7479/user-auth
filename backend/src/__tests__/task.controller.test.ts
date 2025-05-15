import { Request, Response } from 'express';
import * as taskController from '../controllers/task.controller';
import prisma from '../utils/prisma';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { TaskIdParam, CreateTaskRequestBody, UpdateTaskRequestBody } from '../types/task.types';

// Mock dependencies
jest.mock('../utils/prisma', () => ({
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Task Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      params: {},
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await taskController.getTasks(
        mockRequest as AuthRequest<{}, {}, {}>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });

    it('should return tasks for the authenticated user', async () => {
      // Arrange
      const mockTasks = [
        { id: '1', title: 'Task 1', userId: 'user-123' },
        { id: '2', title: 'Task 2', userId: 'user-123' },
      ];
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      // Act
      await taskController.getTasks(
        mockRequest as AuthRequest<{}, {}, {}>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTasks,
      });
    });
  });

  describe('getTaskById', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { id: 'task-123' };

      // Act
      await taskController.getTaskById(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });

    it('should return 404 if task is not found', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      await taskController.getTaskById(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-123' },
      });
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
    });

    it('should return 403 if task belongs to another user', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 'task-123',
        userId: 'another-user',
      });

      // Act
      await taskController.getTaskById(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
    });

    it('should return task if it belongs to the user', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        userId: 'user-123',
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      // Act
      await taskController.getTaskById(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTask,
      });
    });
  });

  describe('createTask', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = { title: 'New Task' };

      // Act
      await taskController.createTask(
        mockRequest as AuthRequest<{}, {}, CreateTaskRequestBody>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });

    it('should return 400 if title is missing', async () => {
      // Arrange
      mockRequest.body = { title: '' } as CreateTaskRequestBody;

      // Act
      await taskController.createTask(
        mockRequest as AuthRequest<{}, {}, CreateTaskRequestBody>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
    });

    it('should create a task and return 201', async () => {
      // Arrange
      mockRequest.body = {
        title: 'New Task',
        description: 'Task description',
        status: 'TODO',
      } as CreateTaskRequestBody;
      
      const createdTask = {
        id: 'task-123',
        title: 'New Task',
        description: 'Task description',
        status: 'TODO',
        userId: 'user-123',
      };
      (prisma.task.create as jest.Mock).mockResolvedValue(createdTask);

      // Act
      await taskController.createTask(
        mockRequest as AuthRequest<{}, {}, CreateTaskRequestBody>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'New Task',
          description: 'Task description',
          status: 'TODO',
          userId: 'user-123',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task created successfully',
        data: createdTask,
      });
    });
  });

  describe('updateTask', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { id: 'task-123' };
      mockRequest.body = { title: 'Updated Task' };

      // Act
      await taskController.updateTask(
        mockRequest as AuthRequest<TaskIdParam, {}, UpdateTaskRequestBody>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });

    it('should return 404 if task is not found', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      mockRequest.body = { title: 'Updated Task' };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      await taskController.updateTask(
        mockRequest as AuthRequest<TaskIdParam, {}, UpdateTaskRequestBody>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
    });

    it('should return 403 if task belongs to another user', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      mockRequest.body = { title: 'Updated Task' };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 'task-123',
        userId: 'another-user',
      });

      // Act
      await taskController.updateTask(
        mockRequest as AuthRequest<TaskIdParam, {}, UpdateTaskRequestBody>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
    });

    it('should update task and return 200', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      mockRequest.body = { title: 'Updated Task', status: 'IN_PROGRESS' } as UpdateTaskRequestBody;
      const existingTask = {
        id: 'task-123',
        title: 'Old Title',
        description: 'Description',
        status: 'TODO',
        userId: 'user-123',
      };
      const updatedTask = {
        ...existingTask,
        title: 'Updated Task',
        status: 'IN_PROGRESS',
      };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(existingTask);
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      // Act
      await taskController.updateTask(
        mockRequest as AuthRequest<TaskIdParam, {}, UpdateTaskRequestBody>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          title: 'Updated Task',
          status: 'IN_PROGRESS',
          description: 'Description',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask,
      });
    });
  });

  describe('deleteTask', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { id: 'task-123' };

      // Act
      await taskController.deleteTask(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });

    it('should return 404 if task is not found', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      await taskController.deleteTask(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
    });

    it('should return 403 if task belongs to another user', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 'task-123',
        userId: 'another-user',
      });

      // Act
      await taskController.deleteTask(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
    });

    it('should delete task and return 200', async () => {
      // Arrange
      mockRequest.params = { id: 'task-123' };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 'task-123',
        userId: 'user-123',
      });

      // Act
      await taskController.deleteTask(
        mockRequest as AuthRequest<TaskIdParam>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-123' },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task deleted successfully',
        data: null,
      });
    });
  });
});