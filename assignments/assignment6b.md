# Assignment 6b: Prisma ORM Integration

## Learning Objectives
- Transform your PostgreSQL application from raw SQL to Prisma ORM
- Implement type-safe database operations using Prisma Client
- Understand the benefits of ORM over raw SQL queries
- Set up and configure Prisma in an existing project
- Implement advanced Prisma features like relationships and transactions

## Assignment Overview
In this assignment, you will transform your existing PostgreSQL application (from Assignment 6a) to use Prisma ORM instead of raw SQL queries. You'll gain better type safety, autocomplete, and maintainability while keeping the same functionality.

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
  password  String
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
- Maintain all existing validation logic
- Handle Prisma errors appropriately

**Expected Transformations:**
- **User Registration**: Replace INSERT query with `prisma.user.create()`
- **User Login**: Replace SELECT query with `prisma.user.findFirst()`
- **User Lookup**: Replace SELECT query with `prisma.user.findUnique()`

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
- Maintain user ownership validation
- Handle Prisma errors appropriately

**Expected Transformations:**
- **Get Tasks**: Replace SELECT with `prisma.task.findMany()`
- **Get Single Task**: Replace SELECT with `prisma.task.findFirst()`
- **Create Task**: Replace INSERT with `prisma.task.create()`
- **Update Task**: Replace UPDATE with `prisma.task.update()`
- **Delete Task**: Replace DELETE with `prisma.task.delete()`

**Code Examples:**
```js
// Before (Raw SQL):
const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [user_id]);
const tasks = result.rows;

// After (Prisma):
const tasks = await prisma.task.findMany({
  where: { userId: parseInt(user_id) }
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
  where: { id: userId },
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
    userId: parseInt(user_id),
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
- All user operations (register, login)
- All task operations (create, read, update, delete)
- Relationship queries (user with tasks, tasks with user)
- Error handling scenarios
- Advanced filtering and sorting

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

