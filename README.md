# Task Management Application with User Authentication

A full-stack application where users can log in and manage tasks. This application features user authentication, CRUD operations on tasks, and is fully Dockerized for easy deployment.

## Technologies Used

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- React Router for navigation
- Axios for API requests
- Tailwind CSS for styling
- Containerized with Docker & Nginx

### Backend
- Express.js with TypeScript for the API
- PostgreSQL database with Prisma ORM
- JWT for authentication
- Swagger for API documentation
- Containerized with Docker

## Getting Started

### Running with Docker (Recommended)

The entire application can be run using Docker Compose:

1. Make sure Docker and Docker Compose are installed on your system.

2. Clone the repository and navigate to the project directory.

3. Run the following command to build and start all services:
   ```
   docker-compose up -d
   ```

4. The application will be available at:
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs
   - PostgreSQL: localhost:5434 (if you need to connect externally)

5. To stop the containers:
   ```
   docker-compose down
   ```

6. To completely reset (including database data):
   ```
   docker-compose down -v
   docker-compose up -d
   ```

### Local Development

#### Backend Development

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskmanagement?schema=public
   JWT_SECRET=your-secret-key-for-jwt-tokens
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. Set up the database:
   ```
   npx prisma migrate dev --name init
   ```

5. Start the backend:
   ```
   npm run dev
   ```

#### Frontend Development

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```

4. The frontend will be available at http://localhost:5173

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

## Dockerization

The application is fully containerized using Docker:

1. **Frontend Container**:
   - Multi-stage build for optimized production image
   - Nginx for serving static files and API proxying
   - Configuration for Single Page Application routing

2. **Backend Container**:
   - Node.js application with TypeScript
   - Automatic database migrations at startup
   - Health checks to ensure availability

3. **PostgreSQL Container**:
   - Persistent volume for data storage
   - Health checks to verify database availability

## Project Structure

```
task-management/
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
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```
