import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { 
  CreateTaskRequestBody, 
  UpdateTaskRequestBody, 
  TaskResponse, 
  TaskIdParam 
} from '../types/task.types';
import { ApiSuccessResponse } from '../types/auth.types';

/**
 * Get all tasks for the authenticated user
 */
export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiSuccessResponse<TaskResponse[]> = {
      success: true,
      data: tasks
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific task by ID
 */
export const getTaskById = async (req: AuthRequest<TaskIdParam>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    // Ensure user can only access their own tasks
    if (task.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to access this task');
    }

    const response: ApiSuccessResponse<TaskResponse> = {
      success: true,
      data: task
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 */
export const createTask = async (req: AuthRequest<{}, {}, CreateTaskRequestBody>, res: Response, next: NextFunction) => {
  try {
    const { title, description, status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!title) {
      throw new ApiError(400, 'Title is required');
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        userId,
      },
    });

    const response: ApiSuccessResponse<TaskResponse> = {
      success: true,
      message: 'Task created successfully',
      data: task
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing task
 */
export const updateTask = async (req: AuthRequest<TaskIdParam, {}, UpdateTaskRequestBody>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }

    if (existingTask.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to update this task');
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        status: status !== undefined ? status : existingTask.status,
      },
    });

    const response: ApiSuccessResponse<TaskResponse> = {
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: AuthRequest<TaskIdParam>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new ApiError(404, 'Task not found');
    }

    if (existingTask.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this task');
    }

    // Delete task
    await prisma.task.delete({
      where: { id },
    });

    const response: ApiSuccessResponse<null> = {
      success: true,
      message: 'Task deleted successfully',
      data: null
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
