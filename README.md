# Task Management Application with User Authentication

A full-stack application where users can log in and manage tasks. This application features user authentication, CRUD operations on tasks, and is fully Dockerized for easy deployment.

## Features

- User authentication (register, login, JWT token)
- Task management (create, read, update, delete)
- Task status categories (To Do, In Progress, Done)
- Dockerized backend and frontend for easy deployment
- PostgreSQL database with Prisma ORM
- Unit tests for backend API endpoints

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Axios for API requests
- Tailwind CSS for styling
- Vite for fast development

### Backend
- Express.js with TypeScript
- PostgreSQL database
- Prisma ORM for database access
- JWT for authentication
- Swagger documentation for the API
- Jest for unit testing

## Running the Application

### Using Docker (Recommended)

1. Make sure Docker and Docker Compose are installed on your system.

2. Clone the repository and navigate to the project directory.

3. Start all services with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs

5. To stop the containers:
   ```bash
   docker-compose down
   ```

6. To view logs:
   ```bash
   # View all logs
   docker-compose logs

   # View backend logs
   docker-compose logs backend

   # View frontend logs
   docker-compose logs react-frontend

   # View database logs
   docker-compose logs postgres
   ```

### Local Development Setup

For developing without Docker:

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` to configure your database connection.

4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Running Tests

The backend includes unit tests for API controllers using Jest.

### Running the Tests

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the tests:
   ```bash
   npm test
   ```

3. To run tests in watch mode (automatically rerun on file changes):
   ```bash
   npm run test:watch
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user and get JWT token
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Tasks

- `GET /api/tasks` - Get all tasks (requires authentication)
- `GET /api/tasks/:id` - Get a specific task (requires authentication)
- `POST /api/tasks` - Create a new task (requires authentication)
- `PUT /api/tasks/:id` - Update a task (requires authentication)
- `DELETE /api/tasks/:id` - Delete a task (requires authentication)

For detailed API documentation, visit Swagger at http://localhost:3000/api-docs when the backend is running.

## Project Structure

```
user-auth/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── __tests__/        # Unit tests
│   │   └── index.ts
│   ├── .env
│   ├── Dockerfile
│   ├── jest.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   │   └── slices/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check the PostgreSQL container is running: `docker ps`
   - Verify the connection string in backend's `.env` file
   - For Docker setup, database host should be `postgres`

2. **Backend Not Starting**:
   - Check logs: `docker-compose logs backend`
   - Ensure PostgreSQL is fully initialized before backend starts
   - Verify all required environment variables are set

3. **Frontend Not Connecting to Backend**:
   - Check the API URL configuration in the frontend
   - Ensure the backend is running and accessible
   - Look for CORS errors in browser developer console

4. **Authentication Problems**:
   - JWT tokens might be expired; try logging in again
   - Check if your user account exists in the database
   - Ensure you're including the Authorization header with requests

5. **Tests Failing**:
   - Check if mocks are properly set up for dependencies
   - Verify test environment is properly configured
   - Check if any controllers have been modified

### Docker Commands

- Rebuild containers: `docker-compose up -d --build`
- View container status: `docker-compose ps`
- Reset database: `docker-compose down -v` (removes volumes)
- Access PostgreSQL: `docker-compose exec postgres psql -U postgres -d taskmanagement`
- Access backend shell: `docker-compose exec backend sh`
