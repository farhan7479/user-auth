import { TaskStatus as PrismaTaskStatus } from '@prisma/client';

// Use Prisma's generated TaskStatus enum
export type TaskStatus = PrismaTaskStatus;

// Request types
export interface CreateTaskRequestBody {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskRequestBody {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

// Response types
export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// For route parameters
export interface TaskIdParam {
  id: string;
}
