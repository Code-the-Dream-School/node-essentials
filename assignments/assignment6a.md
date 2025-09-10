# Assignment 6a: PostgreSQL and Node.js Integration

## Learning Objectives
- Connect your Node.js application to a PostgreSQL database
- Replace in-memory storage with persistent database storage
- Implement proper database connections and error handling
- Use the `pg` library for database operations
- Understand database relationships and foreign keys
- Test your API endpoints with real database persistence

## Assignment Overview
In this assignment, you will modify your existing Express application to use PostgreSQL instead of in-memory storage. You'll transform your working Express app that stores data in memory to one that persists data in a real database.

## Prerequisites
- Completed previous lessons with a working Express application
- Basic understanding of Node.js and Express
- PostgreSQL installed and running on your system

---

## Assignment Tasks

### 1. Database Setup and Connection

#### a. Install Required Packages
Install the necessary packages for PostgreSQL integration:
```bash
npm install pg dotenv
```

#### b. Configure Database Connection
Create a `.env` file in your project root with your PostgreSQL connection:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/yourdatabase
PORT=3000
```

#### c. Create Database Tables
Create a file called `schema.sql` with the following tables:

```sql
-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table to store user tasks with foreign key relationship
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Requirements:**
- Run the SQL to create your tables
- Ensure the foreign key relationship is properly established
- Verify tables are created in your database

### 2. Database Connection Implementation

#### a. Create Database Connection File
Create `db.js` in your project root:

```js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

**Requirements:**
- Use environment variables for database configuration
- Implement connection pooling for efficiency
- Handle SSL configuration for deployment

#### b. Test Database Connection
Add a health check endpoint to verify database connectivity:

```js
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});
```

### 3. Modify Controllers for Database Operations

#### a. Update User Controller
Modify your existing user controller to use database queries instead of in-memory storage:

**Requirements:**
- Replace memory store with database pool
- Implement user registration with database INSERT
- Implement user login with database SELECT
- Handle database errors appropriately
- Maintain existing validation logic

**Expected Operations:**
- `POST /api/users/register` - Create new user in database
- `POST /api/users/login` - Authenticate user from database
- `POST /api/users/logoff` - Handle user logout (no database changes needed)

#### b. Update Task Controller
Modify your existing task controller to use database queries:

**Requirements:**
- Replace memory store with database pool
- Implement CRUD operations using SQL queries
- Add user ownership to all task operations
- Use parameterized queries to prevent SQL injection
- Handle database errors appropriately

**Expected Operations:**
- `GET /api/tasks?user_id=X` - Get all tasks for a specific user
- `POST /api/tasks?user_id=X` - Create new task for a specific user
- `PATCH /api/tasks/:id?user_id=X` - Update existing task
- `DELETE /api/tasks/:id?user_id=X` - Delete task

### 4. Database Operations Implementation

#### a. User Management
Implement the following database operations:

**User Registration:**
```sql
INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name
```

**User Login:**
```sql
SELECT * FROM users WHERE email = $1 AND password = $2
```

#### b. Task Management
Implement the following database operations:

**Get User Tasks:**
```sql
SELECT * FROM tasks WHERE user_id = $1
```

**Create Task:**
```sql
INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING *
```

**Update Task:**
```sql
UPDATE tasks SET title = $1, is_completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *
```

**Delete Task:**
```sql
DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *
```

### 5. Security and Validation

#### a. Input Validation
Maintain your existing validation schemas and add database-specific validation:

**Requirements:**
- Validate all inputs before database operations
- Use parameterized queries for all database operations
- Implement proper error handling for database failures
- Validate user ownership before allowing task modifications

#### b. Error Handling
Implement comprehensive error handling:

**Requirements:**
- Handle database connection errors
- Handle SQL query errors
- Provide meaningful error messages
- Implement proper HTTP status codes
- Log errors for debugging

### 6. Testing Your Implementation

#### a. Database Testing
Test your database operations:

**Requirements:**
- Verify tables are created correctly
- Test all CRUD operations
- Verify foreign key relationships work
- Test error scenarios (invalid user_id, etc.)

#### b. API Testing
Test your endpoints using Postman or curl:

**Required Tests:**
- User registration and login
- Task creation, reading, updating, and deletion
- User ownership validation
- Error handling scenarios
- Health check endpoint

---

## Implementation Guidelines

### File Structure
Your project should maintain this structure:
```
project/
├── controllers/
│   ├── userController.js (modified for database)
│   └── taskController.js (modified for database)
├── routes/
│   ├── userRoutes.js (no changes needed)
│   └── taskRoutes.js (no changes needed)
├── db.js (NEW - database connection)
├── schema.sql (NEW - database schema)
├── app.js (modified for health check)
├── .env (updated with database connection)
└── package.json
```

### Code Quality Requirements
- Use async/await consistently
- Implement proper error handling
- Use parameterized queries for security
- Follow consistent naming conventions
- Use environment variables for configuration

### Testing Requirements
Test all endpoints with Postman or curl:
1. **Database Setup**: Verify tables are created
2. **User Operations**: Test registration and login
3. **Task Operations**: Test all CRUD operations
4. **Error Handling**: Test invalid inputs and database errors
5. **Security**: Verify user ownership validation

---

## Submission Requirements

### Code Submission
- All modified files with database integration
- Working database connection and tables
- Complete CRUD operations for users and tasks
- Proper error handling and validation
- Environment configuration file

### Testing Documentation
- Postman collection or curl commands for testing
- Test results showing all endpoints working
- Database connection verification
- Any issues encountered and solutions

---

## Submission Instructions

### 1️⃣ Add, Commit, and Push Your Changes
Within your `node-homework` folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment6a` branch.

```bash
git add .
git commit -m "Complete Assignment 6a: PostgreSQL and Node.js Integration"
git push origin assignment6a
```

### 2️⃣ Create a Pull Request
1. Log on to your GitHub account
2. Open your `node-homework` repository
3. Select your `assignment6a` branch. It should be one or several commits ahead of your main branch
4. Create a pull request with a descriptive title like "Assignment 6a: PostgreSQL Integration"

### 3️⃣ Submit Your GitHub Link
Your browser now has the link to your pull request. Copy that link, to be included in your homework submission form.

**Important:** Make sure your pull request includes:
- All the modified files with database integration
- Working database connection and table creation
- Complete CRUD operations for users and tasks
- Proper error handling and validation
- All endpoints tested and working with Postman or curl

---

## Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Package](https://node-postgres.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Postman API Testing](https://www.postgresql.org/docs/)

---

## Getting Help

- Review the lesson materials thoroughly
- Check your database connection and credentials
- Use `console.log` statements for debugging
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts

**Remember:** This assignment builds on your Node.js fundamentals. Make sure you have a solid understanding of Express and basic database concepts before proceeding!
