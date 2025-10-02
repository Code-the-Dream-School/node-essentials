# Week 4 Assignment - User Authentication and Task Management

This assignment implements a RESTful API with user authentication and task management using Express.js and in-memory storage.

## Features

- **User Authentication**: Register, login, and logoff functionality
- **Task Management**: CRUD operations for tasks with user ownership
- **Input Validation**: Joi schemas for user and task validation
- **Memory Storage**: In-memory storage for users and tasks

## Project Structure

```
week4/
├── app.js                 # Main Express application
├── controllers/
│   ├── userController.js  # User authentication logic
│   └── taskController.js  # Task CRUD operations
├── routes/
│   ├── userRoutes.js      # User authentication routes
│   └── taskRoutes.js      # Task management routes
├── validation/
│   ├── userSchema.js      # User validation schema
│   └── taskSchema.js      # Task validation schemas
├── util/
│   └── memoryStore.js     # In-memory storage utilities
└── package.json           # Dependencies and scripts
```

## API Endpoints

### User Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `POST /api/users/logoff` - Logoff user

### Task Management
- `GET /api/tasks` - Get all tasks for logged-in user
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Setup and Running

1. Install dependencies:
   ```bash
   cd week4
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Validation Rules

### User Registration
- Name: 3-30 characters, required
- Email: Valid email format, required
- Password: Minimum 8 characters with uppercase, lowercase, number, and special character

### Task Creation
- Title: Required string
- isCompleted: Optional boolean (defaults to false)

### Task Updates
- Title: Optional string
- isCompleted: Optional boolean

## Testing

The project includes comprehensive tests that verify:
- User registration and authentication
- Task CRUD operations with user ownership
- Input validation for users and tasks
- Authorization (users can only access their own tasks)

Run the tests to ensure all functionality works as expected. 