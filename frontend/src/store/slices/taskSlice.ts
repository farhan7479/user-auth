import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';  // Use default axios for now
import { RootState } from '..';

// Types
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export interface UpdateTaskData {
  id: string;
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

// Initial state
const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Axios instance with the correct baseURL
const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Helper function to set authorization header
const setAuthHeader = (token: string) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Async thunks
export const getTasks = createAsyncThunk(
  'tasks/getTasks',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return thunkAPI.rejectWithValue('Not authenticated');
      }
      
      console.log('Fetching tasks...');
      const response = await api.get('/tasks', setAuthHeader(token));
      console.log('Tasks response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      const message = error.response?.data?.message || error.message || 'Failed to fetch tasks';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskData, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return thunkAPI.rejectWithValue('Not authenticated');
      }
      
      console.log('Creating task:', taskData);
      const response = await api.post('/tasks', taskData, setAuthHeader(token));
      console.log('Create task response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating task:', error);
      const message = error.response?.data?.message || error.message || 'Failed to create task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (taskData: UpdateTaskData, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return thunkAPI.rejectWithValue('Not authenticated');
      }
      
      const { id, ...data } = taskData;
      console.log('Updating task:', id, data);
      const response = await api.put(`/tasks/${id}`, data, setAuthHeader(token));
      console.log('Update task response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating task:', error);
      const message = error.response?.data?.message || error.message || 'Failed to update task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return thunkAPI.rejectWithValue('Not authenticated');
      }
      
      console.log('Deleting task:', id);
      await api.delete(`/tasks/${id}`, setAuthHeader(token));
      return id;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      const message = error.response?.data?.message || error.message || 'Failed to delete task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Task slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    resetTaskState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get tasks
      .addCase(getTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.tasks = action.payload.data;
      })
      .addCase(getTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.tasks.push(action.payload.data);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedTask = action.payload.data;
        const index = state.tasks.findIndex((task) => task.id === updatedTask.id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
  },
});

export const { resetTaskState } = taskSlice.actions;
export default taskSlice.reducer;
