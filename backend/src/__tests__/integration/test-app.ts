import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../../routes/auth.routes';
import taskRoutes from '../../routes/task.routes';
import { errorHandler } from '../../middleware/error.middleware';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create test app (similar to main app but for testing)
const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);

  // Base route for health check
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Test API is running',
      environment: process.env.NODE_ENV,
      database: process.env.DATABASE_URL?.includes('test') ? 'test' : 'unknown'
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

export default createTestApp;
