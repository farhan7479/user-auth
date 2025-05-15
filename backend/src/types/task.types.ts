

// Define our own TaskStatus enum to match Prisma's
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

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
