# Task Management Application with User Authentication

A full-stack application where users can log in and manage tasks. This application features user authentication, CRUD operations on tasks, and is fully Dockerized for easy deployment.

## Technologies Used

### Frontend
- React.js with Vite
- Redux Toolkit for state management
- React Router for navigation
- Axios for API requests
- Tailwind CSS for styling

### Backend
- Express.js with TypeScript for the API
- PostgreSQL database with Prisma ORM
- JWT for authentication
- Swagger for API documentation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Docker and Docker Compose

## Running with Docker (Recommended)

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

### Setting Up the Project Locally (Alternative)

For local development without Docker:

#### Backend Setup

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

#### Frontend Setup

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

## Application Features

1. **User Authentication**
   - Register a new account
   - Login with email and password
   - JWT-based authentication with refresh tokens
   - Protected routes for authenticated users

2. **Task Management**
   - Create new tasks with title, description, and status
   - View all tasks organized by status (To Do, In Progress, Done)
   - Update task details and status
   - Delete tasks

3. **Frontend UI**
   - Responsive design using Tailwind CSS
   - Intuitive user interface
   - Toast notifications for actions
   - Form validation

## Troubleshooting Docker Issues

1. **Connection issues with PostgreSQL**:
   - Check if the PostgreSQL container is running: `docker ps`
   - Verify the connection string in the environment variables
   - Check container logs: `docker logs taskmanagement-postgres`
   - PostgreSQL is running on port 5434 to avoid conflicts with local instances

2. **Backend or Frontend container fails to start**:
   - Check logs: `docker logs taskmanagement-backend` or `docker logs taskmanagement-frontend`
   - Make sure all environment variables are correctly set
   - Ensure PostgreSQL is fully initialized before the backend attempts to connect

3. **Database migrations not applying**:
   - The entrypoint script should automatically run migrations
   - If issues persist, you can manually trigger migrations:
     ```
     docker-compose exec backend npx prisma migrate deploy
     ```

4. **Frontend not connecting to backend**:
   - Make sure the API requests are being properly proxied
   - Check the network settings in docker-compose.yml
   - Verify the Nginx configuration in the frontend container

5. **Resetting the application**:
   - Remove all containers: `docker-compose down`
   - Remove the volume: `docker volume rm taskmanagement-postgres-data`
   - Start again: `docker-compose up -d`

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
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   │   └── slices/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Implementation Details

### Backend Implementation

The backend is built with Express.js and TypeScript, providing a robust and type-safe API. It uses Prisma ORM for database operations, making it easy to interact with the PostgreSQL database.

Key features of the backend:
- **User Authentication**: JWT-based authentication with access tokens and refresh tokens
- **CRUD Operations for Tasks**: Complete API for managing tasks
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **Security**: Password hashing, JWT token verification, and protected routes
- **Swagger Documentation**: Auto-generated API documentation
- **Dockerization**: Containerized backend service

### Frontend Implementation

The frontend is built with React and uses Vite for fast development. It includes Redux Toolkit for state management and React Router for navigation.

Key features of the frontend:
- **Redux State Management**: Centralized state management with Redux Toolkit
- **User Authentication**: Login, registration, and token management
- **Task Management Interface**: Create, read, update, and delete tasks
- **Responsive Design**: Mobile-friendly design with Tailwind CSS
- **Form Validation**: Validate user inputs and display appropriate error messages
- **Notifications**: Toast notifications for user feedback
- **Dockerization**: Containerized frontend service with Nginx

### Dockerization

The application is fully Dockerized and includes the following containers:
- **PostgreSQL**: Database container with persistent storage
- **Backend**: Express.js API container
- **Frontend**: React application served with Nginx

The Docker Compose configuration ensures proper networking between services and sets up the required environment variables.

## License

This project is licensed under the MIT License.
