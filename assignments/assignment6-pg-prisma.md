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

**Prologue:**
Right now you are using `memoryStore.js` to store users and a list of tasks for each. For this assignment, you want to eliminate all use of `memoryStore.js`, and read and write from the database instead. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

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

**Note:** We'll use the built-in Node.js `crypto` module for password hashing with scrypt (from lesson 4), so no additional package installation is needed.

#### b. Configure Database Connection
Create a `.env` file in your project root with your PostgreSQL connection:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/yourdatabase
PORT=3000
```

**Note:** The PostgreSQL URL format may vary depending on your operating system. For detailed information about different URL formats for Windows, Mac, and Linux, see Assignment 0.

#### c. Create Database Tables
Create a file called `schema.sql` with the following tables:

```sql
-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  hashedPassword VARCHAR(255) NOT NULL,
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
- Implement user registration with database INSERT and password hashing
- Implement user login with database SELECT and password verification
- Store user ID globally after successful registration and login
- Handle database errors appropriately
- Maintain existing validation logic

**Expected Operations:**
- `POST /api/users/register` - Create new user in database with hashed password, store user_id globally
- `POST /api/users/login` - Authenticate user from database, store user_id globally
- `POST /api/users/logoff` - Handle user logout (no database changes needed)

**Password Hashing Implementation:**
```javascript
// Hash password during registration (using scrypt from lesson 4)
const crypto = require('crypto');
const hashedPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');

// Store user_id globally after successful registration
global.user_id = newUser.id;
```

**Password Verification Implementation:**
```javascript
// Compare hashed password during login
const crypto = require('crypto');
const hashedInputPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');
const isValidPassword = hashedInputPassword === user.password;

// Store user_id globally after successful login
global.user_id = user.id;
```

**Important Security Note:**
The global user_id storage approach used here is **NOT secure** for production applications. It means that once someone logs in, anyone else can access the logged-in user's tasks because there's only one global value. This is used here to match the behavior from lesson 4, but in a real application, you would use proper session management, JWT tokens, or other secure authentication methods.

#### b. Update Task Controller
Modify your existing task controller to use database queries:

**Requirements:**
- Replace memory store with database pool
- Implement CRUD operations using SQL queries
- Use global user_id for all task operations (no query parameters needed)
- Use parameterized queries to prevent SQL injection
- Handle database errors appropriately

**Expected Operations:**
- `GET /api/tasks` - Get all tasks for the logged-in user (uses global.user_id)
- `POST /api/tasks` - Create new task for the logged-in user (uses global.user_id)
- `PATCH /api/tasks/:id` - Update existing task (uses global.user_id)
- `DELETE /api/tasks/:id` - Delete task (uses global.user_id)

**Note:** The user_id is retrieved from the global variable set during login, not from query parameters. This matches the behavior from lesson 4 where the user_id was stored globally after login.

### 4. Database Operations Implementation

#### a. User Management
Implement the following database operations:

**User Registration:**
```sql
INSERT INTO users (email, name, hashedPassword) VALUES ($1, $2, $3) RETURNING id, email, name
```

**User Login:**
```sql
SELECT * FROM users WHERE email = $1
-- Then compare hashed passwords in JavaScript
```

#### b. Task Management
Implement the following database operations using global user_id:

**Get User Tasks:**
```sql
SELECT * FROM tasks WHERE user_id = $1
-- Where $1 is global.user_id
```

**Create Task:**
```sql
INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING *
-- Where $3 is global.user_id
```

**Update Task:**
```sql
UPDATE tasks SET title = $1, is_completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *
-- Where $4 is global.user_id
```

**Delete Task:**
```sql
DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *
-- Where $2 is global.user_id
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
- User registration and login (with password hashing)
- Global user_id storage after login/registration
- Task creation, reading, updating, and deletion (using global user_id)
- User ownership validation
- Error handling scenarios
- Health check endpoint

**Note:** After login, the user_id is stored globally, so task operations don't require passing user_id as a query parameter. This matches the behavior from lesson 4.

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
2. **User Operations**: Test registration and login with password hashing
3. **Global User ID**: Verify user_id is stored globally after login/registration
4. **Task Operations**: Test all CRUD operations using global user_id (no query parameters)
5. **Error Handling**: Test invalid inputs and database errors
6. **Security**: Verify user ownership validation and password hashing

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


# Assignment 6b: Prisma ORM Integration

## Learning Objectives
- Transform your PostgreSQL application from raw SQL to Prisma ORM
- Implement type-safe database operations using Prisma Client
- Understand the benefits of ORM over raw SQL queries
- Set up and configure Prisma in an existing project
- Implement advanced Prisma features like relationships and transactions

## Assignment Overview
In this assignment, you will transform your existing PostgreSQL application (from Assignment 6a) to use Prisma ORM instead of raw SQL queries. You'll gain better type safety, autocomplete, and maintainability while keeping the same functionality.

**Prologue:**
Right now you are using raw SQL queries with the `pg` library to interact with your PostgreSQL database. For this assignment, you want to replace all raw SQL queries with Prisma ORM methods, while maintaining the same functionality including password hashing and global user_id storage. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

## Prerequisites
- Completed Assignment 6a with a working PostgreSQL application
- Basic understanding of database concepts and SQL
- Node.js and npm installed

---

## Assignment Tasks

### 1. Prisma Setup and Configuration

#### a. Install Prisma Dependencies
Install the necessary packages for Prisma integration:
```bash
npm install prisma @prisma/client
npx prisma init
```

**Requirements:**
- Install both `prisma` and `@prisma/client` packages
- Initialize Prisma in your project
- Verify the `prisma/` directory is created

#### b. Configure Database Connection
Ensure your `.env` file has the correct Prisma database URL:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/yourdatabase?schema=public"
PORT=3000
```

**Note:** The PostgreSQL URL format may vary depending on your operating system. For detailed information about different URL formats for Windows, Mac, and Linux, see Assignment 0.

**Requirements:**
- Use the same database from Assignment 6a
- Include the `?schema=public` parameter for Prisma
- Verify the connection string is correct

#### c. Create Prisma Schema
Replace the content of `prisma/schema.prisma` with a schema that matches your existing tables:

```prisma
// This is your Prisma schema file
// Learn more at https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  hashedPassword  String
  tasks     Task[]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}

model Task {
  id          Int      @id @default(autoincrement())
  title       String
  isCompleted Boolean  @default(false) @map("is_completed")
  userId      Int      @map("user_id")
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("tasks")
}
```

**Requirements:**
- Map to your existing database structure
- Include proper field mappings (`@map` attributes)
- Define relationships between User and Task models
- Use table mappings (`@@map`) for existing table names

#### d. Database Introspection and Client Generation
Since you already have tables from Assignment 6a, introspect your database:
```bash
npx prisma db pull
npx prisma generate
```

**Requirements:**
- Use introspection to verify your schema matches your database
- Generate the Prisma Client for use in your application
- Ensure no data loss during the process

### 2. Create Prisma Database Connection

#### a. Create Database Client File
Create `prisma/db.js` in your project root:

```js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = prisma;
```

**Requirements:**
- Create a single Prisma instance
- Export the client for use in other files
- Handle the client properly in your application

### 3. Transform Your Controllers

#### a. Update User Controller
Modify `controllers/userController.js` to use Prisma instead of raw SQL:

**Requirements:**
- Replace `pool` import with Prisma client
- Transform SQL queries to Prisma Client methods
- Implement password hashing with scrypt (from lesson 4)
- Store user_id globally after successful registration and login
- Maintain all existing validation logic
- Handle Prisma errors appropriately

**Expected Transformations:**
- **User Registration**: Replace INSERT query with `prisma.user.create()` + password hashing + global user_id storage
- **User Login**: Replace SELECT query with `prisma.user.findUnique()` + password verification + global user_id storage
- **User Lookup**: Replace SELECT query with `prisma.user.findUnique()`

**Password Hashing Implementation (Prisma):**
```javascript
// Hash password during registration (using scrypt from lesson 4)
const crypto = require('crypto');
const hashedPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');

const newUser = await prisma.user.create({
  data: { email, name, hashedPassword: hashedPassword },
  select: { id: true, email: true, name: true }
});

// Store user_id globally after successful registration
global.user_id = newUser.id;
```

**Password Verification Implementation (Prisma):**
```javascript
// Compare hashed password during login
const crypto = require('crypto');
const hashedInputPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');
const isValidPassword = hashedInputPassword === user.password;

// Store user_id globally after successful login
global.user_id = user.id;
```

**Code Examples:**
```js
// Before (Raw SQL):
const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// After (Prisma):
const existingUser = await prisma.user.findUnique({
  where: { email }
});
```

#### b. Update Task Controller
Modify `controllers/taskController.js` to use Prisma:

**Requirements:**
- Replace `pool` import with Prisma client
- Transform all SQL queries to Prisma Client methods
- Use global user_id for all task operations (no query parameters needed)
- Maintain user ownership validation
- Handle Prisma errors appropriately

**Expected Transformations:**
- **Get Tasks**: Replace SELECT with `prisma.task.findMany({ where: { userId: global.user_id } })`
- **Get Single Task**: Replace SELECT with `prisma.task.findFirst({ where: { id, userId: global.user_id } })`
- **Create Task**: Replace INSERT with `prisma.task.create({ data: { title, userId: global.user_id } })`
- **Update Task**: Replace UPDATE with `prisma.task.update({ where: { id, userId: global.user_id } })`
- **Delete Task**: Replace DELETE with `prisma.task.delete({ where: { id, userId: global.user_id } })`

**Note:** The user_id is retrieved from the global variable set during login, not from query parameters. This matches the behavior from lesson 4 where the user_id was stored globally after login.

**Code Examples:**
```js
// Before (Raw SQL):
const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [global.user_id]);
const tasks = result.rows;

// After (Prisma):
const tasks = await prisma.task.findMany({
  where: { userId: global.user_id }
});
```

### 4. Implement Advanced Prisma Features

#### a. Relationship Queries
Implement queries that fetch related data:

**Requirements:**
- Fetch user with their tasks using `include`
- Fetch tasks with user information using `include`
- Demonstrate understanding of Prisma relationships

**Example Implementation:**
```js
// Get user with all their tasks
const userWithTasks = await prisma.user.findUnique({
  where: { id: global.user_id },
  include: {
    tasks: true
  }
});
```

#### b. Advanced Filtering and Sorting
Implement complex queries using Prisma's query options:

**Requirements:**
- Filter tasks by multiple conditions
- Sort results by different fields
- Implement pagination using `take` and `skip`

**Example Implementation:**
```js
// Get completed tasks for a user, sorted by creation date
const completedTasks = await prisma.task.findMany({
  where: {
    userId: global.user_id,
    isCompleted: true
  },
  orderBy: {
    createdAt: 'desc'
  }
});
```

### 5. Error Handling and Validation

#### a. Prisma Error Handling
Implement proper error handling for Prisma operations:

**Requirements:**
- Handle common Prisma error codes (P2002, P2025, P2003)
- Provide meaningful error messages to users
- Log errors for debugging purposes

**Error Codes to Handle:**
- **P2002**: Unique constraint violation (duplicate email)
- **P2025**: Record not found
- **P2003**: Foreign key constraint violation

**Example Implementation:**
```js
try {
  const user = await prisma.user.create({
    data: { email, name, password }
  });
  res.json(user);
} catch (error) {
  if (error.code === 'P2002') {
    return res.status(400).json({ 
      error: "User with this email already exists" 
    });
  }
  // Handle other errors...
}
```

#### b. Input Validation
Maintain and enhance your existing validation:

**Requirements:**
- Keep all existing Joi validation schemas
- Validate inputs before Prisma operations
- Ensure user ownership before allowing modifications

### 6. Testing Your Prisma Integration

#### a. Database Testing
Test your Prisma operations:

**Requirements:**
- Verify Prisma Client is generated correctly
- Test all CRUD operations with Prisma
- Verify relationships work as expected
- Test error scenarios and edge cases

#### b. API Testing
Test your endpoints using Postman or curl:

**Required Tests:**
- All user operations (register, login) with password hashing
- Global user_id storage after login/registration
- All task operations (create, read, update, delete) using global user_id
- Relationship queries (user with tasks, tasks with user)
- Error handling scenarios
- Advanced filtering and sorting

**Note:** After login, the user_id is stored globally, so task operations don't require passing user_id as a query parameter. This matches the behavior from lesson 4.

---

## Implementation Guidelines

### File Structure
Your project should maintain this structure:
```
project/
├── controllers/
│   ├── userController.js (transformed for Prisma)
│   └── taskController.js (transformed for Prisma)
├── routes/
│   ├── userRoutes.js (no changes needed)
│   └── taskRoutes.js (no changes needed)
├── prisma/
│   ├── schema.prisma (NEW - Prisma schema)
│   └── db.js (NEW - Prisma client)
├── app.js (no changes needed)
├── .env (updated with Prisma DATABASE_URL)
└── package.json
```

### Code Quality Requirements
- Use async/await consistently
- Implement proper Prisma error handling
- Use Prisma Client methods instead of raw SQL
- Maintain existing validation and security
- Follow consistent naming conventions

### Testing Requirements
Test all endpoints with Postman or curl:
1. **Prisma Setup**: Verify client generation and connection
2. **User Operations**: Test all user endpoints with Prisma
3. **Task Operations**: Test all task endpoints with Prisma
4. **Relationships**: Test user-task relationships
5. **Error Handling**: Test Prisma error scenarios

---

## Submission Requirements

### Code Submission
- All modified files with Prisma integration
- Working Prisma schema and client
- Complete CRUD operations using Prisma
- Proper error handling for Prisma operations
- Advanced Prisma features implemented

### Testing Documentation
- Postman collection or curl commands for testing
- Test results showing all endpoints working with Prisma
- Verification of Prisma Client generation
- Any issues encountered and solutions

---

## Submission Instructions

### 1️⃣ Add, Commit, and Push Your Changes
Within your `node-homework` folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment6b` branch.

```bash
git add .
git commit -m "Complete Assignment 6b: Prisma ORM Integration"
git push origin assignment6b
```

### 2️⃣ Create a Pull Request
1. Log on to your GitHub account
2. Open your `node-homework` repository
3. Select your `assignment6b` branch. It should be one or several commits ahead of your main branch
4. Create a pull request with a descriptive title like "Assignment 6b: Prisma ORM Integration"

### 3️⃣ Submit Your GitHub Link
Your browser now has the link to your pull request. Copy that link, to be included in your homework submission form.

**Important:** Make sure your pull request includes:
- All the modified files with Prisma integration
- Working Prisma schema and database connection
- Complete CRUD operations using Prisma Client
- Proper error handling and validation
- All endpoints tested and working with Postman or curl
- Successful transition from raw SQL to Prisma ORM

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

## Getting Help

- Review the lesson materials thoroughly
- Check your Prisma schema and database connection
- Use Prisma Studio to visualize your database
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts

**Remember:** This assignment builds on Assignment 6a. Make sure you have a working PostgreSQL application before adding Prisma ORM!

