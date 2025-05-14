# Task Management Application with User Authentication

A full-stack application where users can log in and manage tasks. This application features user authentication, CRUD operations on tasks, and is fully Dockerized for easy deployment.

## Technologies Used

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Axios for API requests
- Tailwind CSS for styling
- Vite for fast development

### Backend
- Express.js with TypeScript for the API
- PostgreSQL database with Prisma ORM
- JWT for authentication
- Swagger for API documentation

## Running with Docker

The entire application can be run using Docker Compose:

1. Make sure Docker and Docker Compose are installed on your system.

2. Build and start all services:
   ```
   docker-compose up -d
   ```

3. The application will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs
   - PostgreSQL: localhost:5434 (if you need to connect externally)

4. To stop the containers:
   ```
   docker-compose down
   ```

## Application Features

### Authentication
- User registration and login
- JWT-based authentication with refresh tokens
- Secure password hashing
- Protected routes

### Task Management
- Create, read, update, and delete tasks
- Filter tasks by status (Todo, In Progress, Done)
- Responsive and intuitive UI

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile (requires authentication)

### Tasks

- `GET /api/tasks` - Get all tasks (requires authentication)
- `GET /api/tasks/:id` - Get a specific task (requires authentication)
- `POST /api/tasks` - Create a new task (requires authentication)
- `PUT /api/tasks/:id` - Update a task (requires authentication)
- `DELETE /api/tasks/:id` - Delete a task (requires authentication)

For detailed API documentation, visit the Swagger docs at http://localhost:3000/api-docs when the backend is running.

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
│   │   └── index.ts
│   ├── .env
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── App.tsx
│   ├── .env
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```
