# Lesson 6a: PostgreSQL and Node.js Integration

## Learning Objectives
By the end of this lesson, you will be able to:
- Understand why databases are essential for web applications
- Explain the key concepts of PostgreSQL and relational databases
- Connect a Node.js application to PostgreSQL using the `pg` library
- Implement database operations (CRUD) in your Express controllers
- Understand database security concepts like parameterized queries
- Handle database connections and errors properly

## Overview
In this lesson, you will learn how to integrate PostgreSQL with your Node.js Express application. You'll move from storing data in memory (which gets lost when the server restarts) to using a persistent database that keeps your data safe and accessible.

**Prologue:**
Right now you are using `memoryStore.js` to store users and a list of tasks for each. For this lesson, you want to eliminate all use of `memoryStore.js`, and read and write from the database instead. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

**Prerequisites:** This lesson builds on the work you completed in **Week 4**, where you built a working Express application with in-memory storage. Make sure you have a functional Express app with user and task management before proceeding.

**Why This Matters:**
- **Data Persistence**: Your data survives server restarts and crashes
- **Scalability**: Can handle multiple users and larger datasets
- **Security**: Better data isolation and user ownership
- **Professional Development**: Real-world applications use databases, not memory storage

---

## 1. Understanding Databases vs. In-Memory Storage

### The Problem with In-Memory Storage
When you store data in JavaScript arrays or objects, that data exists only while your server is running. When you restart your server, all the data disappears.

**Example of the Problem:**
```javascript
// This data gets lost every time you restart your server
let users = [
  { id: 1, name: "John", email: "john@example.com" },
  { id: 2, name: "Jane", email: "jane@example.com" }
];

// If your server crashes or restarts, this array becomes empty again
```

### Why Databases Solve This Problem
Databases store data on disk (or in the cloud), so your data persists even when your application stops running.

**Benefits of Database Storage:**
- **Persistence**: Data survives server restarts
- **Concurrent Access**: Multiple users can access data simultaneously
- **Data Integrity**: Built-in rules ensure data consistency
- **Backup & Recovery**: Easy to backup and restore data
- **Scalability**: Can handle millions of records efficiently

---

## 2. Introduction to PostgreSQL

### What is PostgreSQL?
PostgreSQL (often called "Postgres") is a powerful, open-source relational database management system. It's one of the most popular databases for web applications.

**Key Features:**
- **Open Source**: Free to use and modify
- **ACID Compliant**: Ensures data reliability and consistency
- **Extensible**: Can add custom functions and data types
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Production Ready**: Used by companies like Instagram, Reddit, and Netflix

### Relational Database Concepts
PostgreSQL is a **relational database**, which means data is organized in tables with relationships between them.

**Basic Concepts:**
- **Table**: A collection of related data (like a spreadsheet)
- **Row**: A single record in a table
- **Column**: A specific piece of information (like name, email, age)
- **Primary Key**: A unique identifier for each row
- **Foreign Key**: A reference to another table's primary key

**Example Table Structure:**
```
users table:
| id | name  | email           | created_at |
|----|-------|-----------------|------------|
| 1  | John  | john@email.com  | 2024-01-15 |
| 2  | Jane  | jane@email.com  | 2024-01-15 |

tasks table:
| id | title        | user_id | is_completed | created_at |
|----|--------------|---------|--------------|------------|
| 1  | Buy milk     | 1       | false        | 2024-01-15 |
| 2  | Walk dog     | 1       | true         | 2024-01-15 |
| 3  | Read book    | 2       | false        | 2024-01-15 |
```

**The Relationship:**
- Each task belongs to a user (via `user_id`)
- `user_id` in tasks table references `id` in users table
- This creates a **one-to-many relationship**: one user can have many tasks

---

## 3. Setting Up PostgreSQL

### Prerequisites
Before starting this lesson, make sure you have:
- PostgreSQL installed on your system
- A basic understanding of SQL commands
- Your existing Express application from previous lessons

### Checking PostgreSQL Installation
Open your terminal and run:
```bash
psql --version
```

If you see a version number (like `psql (PostgreSQL 15.0)`), PostgreSQL is installed. If not, follow the [official installation guide](https://www.postgresql.org/download/) for your operating system.

### Creating Your Database
1. **Start PostgreSQL service** (if not already running)
2. **Create a new database:**
   ```bash
   createdb your_app_name
   ```
3. **Verify the database exists:**
   ```bash
   psql -l
   ```

---

## 4. Database Connection String

### Understanding Connection Strings
A connection string tells your application how to connect to your database. It includes all the necessary information: username, password, host, port, and database name.

**Format:**
```
postgresql://username:password@host:port/database_name
```

**Components Explained:**
- **username**: Your PostgreSQL username (usually `postgres`)
- **password**: Your PostgreSQL password
- **host**: Where the database is running (`localhost` for local development)
- **port**: Database port number (default is `5432`)
- **database_name**: The specific database you want to connect to

### Setting Up Environment Variables
Create or update your `.env` file:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/your_app_name
PORT=3000
```

**Note:** The PostgreSQL URL format may vary depending on your operating system. For detailed information about different URL formats for Windows, Mac, and Linux, see Assignment 0.

**Security Note:** Never commit your `.env` file to version control. It contains sensitive information like passwords. Make sure to add `.env` to your `.gitignore` file to prevent accidentally committing it to GitHub.

---

## 5. Database Schema Design

### What is a Schema?
A database schema defines the structure of your database: what tables exist, what columns they have, and how they relate to each other.

### Designing Your Tables
Based on your existing Express app, you'll need two main tables:

**Users Table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  hashedPassword VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tasks Table:**
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Understanding the Schema
- **`SERIAL PRIMARY KEY`**: Creates an auto-incrementing unique identifier
- **`VARCHAR(255)`**: Variable-length string with maximum 255 characters
- **`NOT NULL`**: Field cannot be empty
- **`UNIQUE`**: No two users can have the same email
- **`REFERENCES users(id)`**: Creates a foreign key relationship
- **`DEFAULT CURRENT_TIMESTAMP`**: Automatically sets the current time

**Important:** After creating your schema, make sure to run `psql -f schema.sql` to create the tables in your database before testing your application.

---

## 6. Node.js Database Integration

### Installing Required Packages
```bash
npm install pg dotenv
```

**Package Explanation:**
- **`pg`**: PostgreSQL client for Node.js
- **`dotenv`**: Loads environment variables from `.env` file
- **`scrypt`**: Built-in Node.js crypto module for password hashing (from lesson 4)

### Creating Database Connection
Create a `db.js` file in your project root:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

**Understanding the Code:**
- **`Pool`**: Manages multiple database connections efficiently
- **`connectionString`**: Uses your DATABASE_URL from environment variables
- **`ssl`**: Required for some hosting platforms (like Heroku). For local development, you can remove this line as most local PostgreSQL setups don't require SSL.
- **`module.exports`**: Makes the pool available to other files

### Why Use Connection Pooling?
Instead of creating a new connection for each database operation, a pool maintains several connections and reuses them. This is more efficient and faster than creating connections on demand.

**Important:** When stopping your application, use `await pool.end()` to close all connections cleanly and prevent connection leaks.

---

## 7. Database Operations in Controllers

### Replacing Memory Storage with Database Queries
You'll need to modify your existing controllers to use database operations instead of in-memory arrays.

### User Controller Updates

**Before (Memory Storage):**
```javascript
// Old way - storing in memory
const existingUser = storedUsers.find(user => user.email === email);
if (existingUser) {
  return res.status(400).json({ error: "User already exists" });
}
storedUsers.push({ id: nextId++, email, name, password });
```

**After (Database Storage):**
```javascript
// New way - using database
const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
if (existingUser.rows.length > 0) {
  return res.status(400).json({ error: "User already exists" });
}

// Hash the password before storing (using scrypt from lesson 4)
const crypto = require('crypto');
const hashedPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');

const result = await pool.query(
  'INSERT INTO users (email, name, hashedPassword) VALUES ($1, $2, $3) RETURNING id, email, name',
  [email, name, hashedPassword]
);

// Store the user ID globally for session management (not secure for production)
global.user_id = result.rows[0].id;
```

### Login Controller Implementation

**Login with Password Verification:**
```javascript
// Login endpoint
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const user = result.rows[0];
    
    // Compare hashed password
    const crypto = require('crypto');
    const hashedInputPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');
    const isValidPassword = hashedInputPassword === user.password;
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Store user ID globally for session management (not secure for production)
    global.user_id = user.id;
    
    res.json({ 
      message: "Login successful", 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

**Important Security Note:**
The global user_id storage approach used here is **NOT secure** for production applications. It means that once someone logs in, anyone else can access the logged-in user's tasks because there's only one global value. This is used here to match the behavior from lesson 4, but in a real application, you would use proper session management, JWT tokens, or other secure authentication methods.

**Middleware Update:** Unlike lesson 4 where you created a simple auth middleware that checked `getLoggedOnUser()`, lesson 6 uses the same global user_id approach but with database operations. The auth middleware pattern from lesson 4 can still be applied here to centralize authentication checks before database queries.

### Logoff Controller Implementation

**Logoff with Session Clearing:**
```javascript
// Logoff endpoint
exports.logoff = async (req, res) => {
  try {
    // Clear the global user ID for session management
    global.user_id = null;
    
    res.status(200).json({ message: "Logoff successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Auth Middleware Implementation

**Create `/middleware/auth.js`:**
```javascript
const { StatusCodes } = require("http-status-codes");

module.exports = (req, res, next) => {
  if (!global.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized" });
  }
  next();
};
```

**Update `app.js` to use middleware:**
```javascript
const authMiddleware = require('./middleware/auth');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
```

### Task Controller Updates

**Before (Memory Storage):**
```javascript
// Old way - filtering in memory
const userTasks = storedTasks.filter(task => task.user_id === global.user_id);
```

**After (Database Storage):**
```javascript
// New way - using database with global user_id
const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [global.user_id]);
const userTasks = result.rows;
```

**Note:** The user_id is retrieved from the global variable set during login, not from query parameters. This matches the behavior from lesson 4 where the user_id was stored globally after login.

---

## 8. Security Concepts

### SQL Injection Prevention
**What is SQL Injection?**
SQL injection is a security vulnerability where malicious users can execute unauthorized SQL commands through your application.

**Example of Vulnerable Code:**
```javascript
// DANGEROUS - vulnerable to SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**Example of Safe Code:**
```javascript
// SAFE - uses parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
```

**Why Parameterized Queries are Safe:**
- Values are treated as data, not as SQL code
- Special characters are automatically escaped
- Prevents malicious SQL from being executed

### User Ownership Validation
Always verify that users can only access their own data:

```javascript
// Ensure user can only access their own tasks
const result = await pool.query(
  'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
  [taskId, userId]
);

if (result.rows.length === 0) {
  return res.status(404).json({ error: "Task not found or access denied" });
}
```

---

## 9. Error Handling

### Database Error Types
Different types of errors can occur when working with databases:

**Connection Errors:**
```javascript
try {
  await pool.query('SELECT 1');
} catch (err) {
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection refused');
  }
}
```

**Query Errors:**
```javascript
try {
  const result = await pool.query('SELECT * FROM non_existent_table');
} catch (err) {
  if (err.code === '42P01') {
    console.error('Table does not exist');
  }
}
```

### Implementing Proper Error Handling
```javascript
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      status: 'error', 
      db: 'not connected', 
      error: err.message 
    });
  }
});
```

---

## 10. Testing Your Database Integration

### Health Check Endpoint
Add this endpoint to verify your database connection:

```javascript
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      db: 'not connected', 
      error: err.message 
    });
  }
});
```

### Testing Steps
1. **Start your PostgreSQL database**
2. **Start your Node.js server**
3. **Test the health endpoint**: `GET /health`
4. **Test user registration**: `POST /api/users/register` (this sets global.user_id)
5. **Test user login**: `POST /api/users/login` (this sets global.user_id)
6. **Test task creation**: `POST /api/tasks` (uses global.user_id, no query parameter needed)
7. **Test task retrieval**: `GET /api/tasks` (uses global.user_id, no query parameter needed)

**Note:** After login, the user_id is stored globally, so task operations don't require passing user_id as a query parameter. This matches the behavior from lesson 4.

### Example Postman Requests and Responses

**Health Check Endpoint:**
```
GET /health
Response: 200 OK
{
  "status": "ok",
  "db": "connected"
}
```

**User Registration:**
```
POST /api/users/register
Content-Type: application/json

{
  "email": "john@example.com",
  "name": "John Doe",
  "password": "password123"
}

Response: 201 Created
{
  "id": 1,
  "email": "john@example.com",
  "name": "John Doe"
}
```

---

## 11. Key Benefits of Database Integration

### Data Persistence
- Your data survives server restarts
- Data is safely stored on disk
- Automatic backups can be configured

### Scalability
- Can handle thousands of users
- Efficient querying with indexes
- Better memory management

### Security
- User data isolation
- SQL injection prevention
- Access control and permissions

### Professional Development
- Real-world applications use databases
- Industry standard practices
- Better job market preparation

---

## 12. Common Challenges and Solutions

### Challenge: Database Connection Fails
**Symptoms:** `ECONNREFUSED` error
**Solutions:**
- Check if PostgreSQL is running
- Verify connection string in `.env`
- Check firewall settings
- Ensure correct port number

### Challenge: Tables Don't Exist
**Symptoms:** `42P01` error (undefined table)
**Solutions:**
- Run your schema SQL file
- Check table names in your queries
- Verify database name in connection string

### Challenge: Permission Denied
**Symptoms:** `42501` error (insufficient privilege)
**Solutions:**
- Check database user permissions
- Verify username and password
- Ensure user has access to the database

---

## Summary

In this lesson, you've learned:
- **Why databases are essential** for web applications
- **How PostgreSQL works** as a relational database
- **How to connect Node.js** to PostgreSQL using the `pg` library
- **How to implement database operations** in your controllers
- **Security best practices** like parameterized queries
- **Proper error handling** for database operations

### Next Steps
1. **Complete the assignment** following this lesson
2. **Test your database connection** and API endpoints
3. **Continue to Lesson 6b** to learn about Prisma ORM

---

## Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Package](https://node-postgres.com/)
- [Express.js Documentation](https://expressjs.com/)
- [SQL Tutorial](https://www.w3schools.com/sql/)
- [Database Design Basics](https://www.postgresql.org/docs/current/tutorial.html)

---

## Getting Help

- Review the lesson materials thoroughly
- Check your database connection and credentials
- Use `console.log` statements for debugging
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts

**Remember:** This lesson builds on your Node.js fundamentals. Make sure you have a solid understanding of Express and basic database concepts before proceeding!


# Lesson 6b: Introduction to Prisma ORM

## Learning Objectives
By the end of this lesson, you will be able to:
- Understand what an ORM is and why it's beneficial for development
- Explain the key concepts and benefits of Prisma ORM
- Set up Prisma in an existing PostgreSQL project
- Transform raw SQL queries to Prisma Client methods
- Understand the relationship between Prisma schema and database structure
- Compare ORM vs. raw SQL approaches for database operations

## Overview
In this lesson, you'll learn about **Prisma ORM** - a modern, type-safe way to interact with databases in Node.js. You'll transform your existing PostgreSQL application from using raw SQL queries to using Prisma's intuitive API, gaining better type safety, autocomplete, and maintainability.

**Prerequisites:** This lesson builds on **Assignment 6a**, where you successfully integrated PostgreSQL with your Express application. Make sure you have completed Assignment 6a with a working database connection before proceeding.

**Why This Matters:**
- **Developer Experience**: Better autocomplete and error detection
- **Type Safety**: Catch errors at compile time, not runtime
- **Maintainability**: Easier to refactor and modify database operations
- **Modern Development**: Industry standard for Node.js applications

---

## 1. Understanding ORMs (Object-Relational Mapping)

### What is an ORM?
An **ORM (Object-Relational Mapping)** is a programming technique that lets you interact with your database using your programming language's syntax instead of writing raw SQL.

**The Problem ORMs Solve:**
- **Language Mismatch**: SQL is a different language than JavaScript
- **Type Safety**: Raw SQL doesn't provide compile-time error checking
- **Maintenance**: SQL strings scattered throughout code are hard to maintain
- **Security**: Manual SQL construction can lead to vulnerabilities

### How ORMs Work
Instead of writing:
```sql
SELECT * FROM users WHERE email = 'john@example.com'
```

You write:
```javascript
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' }
});
```

**Benefits:**
- **Type Safety**: Prisma knows the structure of your data
- **Autocomplete**: Your editor suggests available fields and methods
- **Error Prevention**: Invalid queries are caught before runtime
- **Consistency**: Same API pattern for all database operations

---

## 2. Introduction to Prisma

### What is Prisma?
Prisma is a modern, open-source ORM for Node.js and TypeScript. It consists of three main tools:

1. **Prisma Schema**: A declarative way to define your database structure
2. **Prisma Client**: An auto-generated, type-safe database client
3. **Prisma Migrate**: Database migration and schema management

### Key Features of Prisma
- **Type Safety**: Full TypeScript support with auto-generated types
- **Auto-completion**: Intelligent suggestions in your editor
- **Database Agnostic**: Works with PostgreSQL, MySQL, SQLite, and more
- **Schema Introspection**: Can read existing databases and generate schemas
- **Relationships**: Easy handling of database relationships
- **Performance**: Optimized queries and connection pooling

### Prisma vs. Raw SQL
| Aspect | Raw SQL | Prisma ORM |
|--------|---------|------------|
| **Type Safety** | None | Full TypeScript support |
| **Autocomplete** | No | Yes, with Prisma extension |
| **Error Detection** | Runtime only | Compile time + runtime |
| **Maintainability** | Harder | Easier |
| **Learning Curve** | Lower for SQL users | Slightly higher |
| **Performance** | Can be optimized | Good, with optimizations |

---

## 3. Prisma Architecture and Concepts

### The Prisma Workflow
```
1. Define Schema → 2. Generate Client → 3. Use in Code → 4. Database Operations
```

**Step 1: Schema Definition**
- Define your database structure in `schema.prisma`
- Specify models, fields, relationships, and database connection

**Step 2: Client Generation**
- Prisma reads your schema and generates a TypeScript client
- Provides type-safe methods for all database operations

**Step 3: Code Integration**
- Import and use the generated client in your application
- Enjoy autocomplete and type checking

**Step 4: Database Operations**
- Prisma translates your method calls to optimized SQL
- Handles connections, transactions, and error handling

### Core Concepts

**Models**
Models represent your database tables as JavaScript classes:
```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String
  tasks Task[]
}
```

**Fields**
Fields represent columns in your database:
- **Scalar Fields**: `String`, `Int`, `Boolean`, `DateTime`
- **Relation Fields**: `User[]`, `Task` (for relationships)

**Attributes**
Attributes provide metadata about fields:
- **`@id`**: Marks a field as the primary key
- **`@unique`**: Ensures field values are unique
- **`@default`**: Sets default values
- **`@map`**: Maps Prisma field names to database column names

**Relations**
Relations define how models connect to each other:
- **One-to-Many**: One user can have many tasks
- **Many-to-One**: Many tasks can belong to one user
- **One-to-One**: One user has one profile

---

## 4. Setting Up Prisma in Your Project

### Prerequisites
Before starting this lesson, ensure you have:
- Completed Lesson 6a with a working PostgreSQL application
- Node.js and npm installed
- PostgreSQL running with your existing database
- Your Express application from Lesson 6a

### Installation Steps

**1. Install Prisma Dependencies**
```bash
npm install prisma @prisma/client
```

**2. Initialize Prisma**
```bash
npx prisma init
```

This creates:
- `prisma/` directory with configuration files
- `prisma/schema.prisma` - Your database schema definition
- `.env` file (if it doesn't exist)

**3. Configure Database Connection**
Update your `.env` file to include the Prisma-specific DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/yourdatabase?schema=public"
```

**Note:** The `?schema=public` parameter tells Prisma which database schema to use. The PostgreSQL URL format may vary depending on your operating system. For detailed information about different URL formats for Windows, Mac, and Linux, see Assignment 0.

---

## 5. Understanding the Prisma Schema

### Schema File Structure
The `prisma/schema.prisma` file has three main sections:

**1. Data Source**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
- **provider**: Specifies which database you're using
- **url**: Points to your environment variable

**2. Generator**
```prisma
generator client {
  provider = "prisma-client-js"
}
```
- **provider**: Specifies the client type (JavaScript/TypeScript)
- **output**: Where to generate the client (optional)

**3. Models**
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  hashedPassword  String
  tasks     Task[]
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("users")
}
```

### Schema Mapping Concepts

**Field Mapping**
```prisma
createdAt DateTime @default(now()) @map("created_at")
```
- **Prisma Field**: `createdAt` (camelCase, JavaScript convention)
- **Database Column**: `created_at` (snake_case, SQL convention)

**Table Mapping**
```prisma
@@map("users")
```
- **Prisma Model**: `User` (PascalCase, JavaScript convention)
- **Database Table**: `users` (lowercase, SQL convention)

**Relationship Mapping**
```prisma
model Task {
  userId Int  @map("user_id")
  user   User @relation(fields: [userId], references: [id])
}
```
- **Prisma Field**: `userId` (camelCase)
- **Database Column**: `user_id` (snake_case)
- **Relation**: Links to the `User` model via the `id` field

---

## 6. Database Introspection and Schema Generation

### What is Introspection?
Introspection is the process of reading your existing database structure and automatically generating a Prisma schema that matches it.

### Using Prisma Introspection
```bash
npx prisma db pull
```

**What This Does:**
- Connects to your existing PostgreSQL database
- Reads all tables, columns, and relationships
- Generates a `schema.prisma` file that matches your current database
- Preserves all existing data

**Benefits of Introspection:**
- **No Data Loss**: Your existing data remains intact
- **Accurate Mapping**: Automatically detects table structures
- **Time Saving**: No need to manually write the schema
- **Error Prevention**: Eliminates manual mapping mistakes

### After Introspection
Once introspection is complete, you can:
1. **Review the generated schema** to understand the mapping
2. **Customize the schema** if needed (add validations, change field names)
3. **Generate the Prisma Client** for use in your application

---

## 7. Generating and Using the Prisma Client

### Client Generation
```bash
npx prisma generate
```

**What Happens:**
- Prisma reads your `schema.prisma` file
- Generates TypeScript types and JavaScript methods
- Creates a client in `node_modules/.prisma/client`
- Provides type-safe database operations

**Important:** You must run `npx prisma generate` every time you modify your Prisma schema file. The generated client needs to be updated to reflect any changes to your models, fields, or relationships.

### Using the Generated Client

**1. Create Client Instance**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

**2. Basic Operations**
```javascript
// Create a user
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    password: 'hashedPassword' // This would be the scrypt hash in practice
  }
});

// Find a user
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' }
});

// Update a user
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'John Smith' }
});

// Delete a user
await prisma.user.delete({
  where: { id: 1 }
});
```

### Understanding Prisma Query Structure

**Query Components:**
- **`where`**: Conditions for finding records
- **`data`**: Data for creating or updating records
- **`select`**: Fields to return (optional)
- **`include`**: Related data to fetch (optional)

**Important Note on Where Clauses:**
When using `update()` or `delete()` operations, the `where` clause must contain exactly one unique identifier (like `id` or `email`). If you need to update or delete multiple records based on multiple conditions, use `updateMany()` or `deleteMany()` instead. The error "Argument `where` of type TaskWhereUniqueInput needs exactly one argument..." occurs when you try to use multiple conditions in a `where` clause for single-record operations.

**Example with All Components:**
```javascript
const userWithTasks = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    name: true,
    email: true,
    tasks: {
      select: {
        id: true,
        title: true,
        isCompleted: true
      }
    }
  }
});
```

---

## 8. Transforming Your Controllers

### The Transformation Process
You'll be replacing raw SQL queries with Prisma Client methods. This involves:

1. **Replacing imports**: `pool` → `prisma`
2. **Converting SQL queries**: Raw SQL → Prisma methods
3. **Updating data handling**: `result.rows` → direct objects
4. **Maintaining security**: User ownership validation

### User Controller Transformation

**Before (Raw SQL):**
```javascript
const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
if (existingUser.rows.length > 0) {
  return res.status(400).json({ error: "User already exists" });
}

const result = await pool.query(
  'INSERT INTO users (email, name, hashedPassword) VALUES ($1, $2, $3) RETURNING id, email, name',
  [email, name, password]
);
const newUser = result.rows[0];
```

**After (Prisma):**
```javascript
const existingUser = await prisma.user.findUnique({
  where: { email }
});
if (existingUser) {
  return res.status(400).json({ error: "User already exists" });
}

// Hash the password before storing (using scrypt from lesson 4)
const crypto = require('crypto');
const hashedPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');

const newUser = await prisma.user.create({
  data: { email, name, hashedPassword: hashedPassword },
  select: { id: true, email: true, name: true }
});

// Store the user ID globally for session management (not secure for production)
global.user_id = newUser.id;
```

**Key Changes:**
- **`pool.query()`** → **`prisma.user.findUnique()`**
- **SQL strings** → **JavaScript objects**
- **`result.rows[0]`** → **direct object**
- **`RETURNING` clause** → **`select` option**
- **Password hashing** → **scrypt integration**
- **Global user_id** → **stored after registration**

### Prisma Login Controller Implementation

**Login with Password Verification (Prisma):**
```javascript
// Login endpoint using Prisma
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email using Prisma
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Compare hashed password
    const crypto = require('crypto');
    const hashedInputPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');
    const isValidPassword = hashedInputPassword === user.password;
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Store user ID globally for session management (not secure for production)
    global.user_id = user.id;
    
    res.json({ 
      message: "Login successful", 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

**Important Security Note:**
The global user_id storage approach used here is **NOT secure** for production applications. It means that once someone logs in, anyone else can access the logged-in user's tasks because there's only one global value. This is used here to match the behavior from lesson 4, but in a real application, you would use proper session management, JWT tokens, or other secure authentication methods.

### Task Controller Transformation

**Before (Raw SQL):**
```javascript
const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [user_id]);
const tasks = result.rows;
```

**After (Prisma):**
```javascript
const tasks = await prisma.task.findMany({
  where: { userId: global.user_id }
});
```

**Note:** The user_id is retrieved from the global variable set during login, not from query parameters. This matches the behavior from lesson 4 where the user_id was stored globally after login.

**Key Changes:**
- **`pool.query()`** → **`prisma.task.findMany()`**
- **SQL WHERE clause** → **`where` object**
- **`global.user_id`** → **uses global variable instead of query parameters**
- **No need for `result.rows`**: Prisma returns the data directly
- **No `parseInt()` needed**: Prisma handles type conversion automatically

---

## 9. Advanced Prisma Features

### Relationship Queries
Prisma makes it easy to fetch related data:

**Fetching User with Tasks:**
```javascript
const userWithTasks = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    tasks: true
  }
});
```

**Fetching Tasks with User Info:**
```javascript
const tasksWithUser = await prisma.task.findMany({
  where: { userId: global.user_id },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
});
```

### Filtering and Sorting
```javascript
// Filter by multiple conditions
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

### Pagination
```javascript
const tasks = await prisma.task.findMany({
  where: { userId: global.user_id },
  take: 10,        // Limit to 10 results
  skip: 20,        // Skip first 20 results
  orderBy: {
    createdAt: 'desc'
  }
});
```

---

## 10. Error Handling with Prisma

### Prisma Error Types
Prisma provides specific error codes for different scenarios:

**Common Error Codes:**
- **`P2002`**: Unique constraint violation (duplicate email) → Return 400 Bad Request
- **`P2025`**: Record not found → Return 404 Not Found
- **`P2003`**: Foreign key constraint violation → Return 400 Bad Request
- **`P2014`**: Invalid relation → Return 400 Bad Request

### Implementing Error Handling
```javascript
try {
  const user = await prisma.user.create({
    data: { email, name, password } // password should be hashed with scrypt
  });
  res.json(user);
} catch (error) {
  if (error.code === 'P2002') {
    return res.status(400).json({ 
      error: "User with this email already exists" 
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ 
      error: "Record not found" 
    });
  }
  
  if (error.code === 'P2003') {
    return res.status(400).json({ 
      error: "Invalid reference - related record does not exist" 
    });
  }
  
  console.error('Prisma error:', error);
  res.status(500).json({ 
    error: "Internal server error" 
  });
}
```

### Validation and Error Prevention
```javascript
// Check if user exists before updating
const existingUser = await prisma.user.findUnique({
  where: { id: parseInt(userId) }
});

if (!existingUser) {
  return res.status(404).json({ error: "User not found" });
}

// Safe to update
const updatedUser = await prisma.user.update({
  where: { id: parseInt(userId) },
  data: { name: newName }
});
```

---

## 11. Performance and Best Practices

### Connection Management
```javascript
// Create a single Prisma instance
const prisma = new PrismaClient();

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Important:** Always call `await prisma.$disconnect()` when shutting down your application or in tests to close database connections cleanly and prevent connection leaks.

### Query Optimization
**Select Only Needed Fields:**
```javascript
// Instead of fetching all fields
const user = await prisma.user.findUnique({ where: { id: 1 } });

// Select only what you need
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    name: true,
    email: true
    // password is excluded
  }
});
```

**Use Appropriate Methods:**
```javascript
// For single records
const user = await prisma.user.findUnique({ where: { email } });

// For multiple records
const users = await prisma.user.findMany({ where: { active: true } });

// For existence checks
const exists = await prisma.user.findFirst({ where: { email } });
```

### Transaction Support
```javascript
// Multiple operations in a single transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email, name, password } // password should be hashed with scrypt
  });
  
  const task = await tx.task.create({
    data: {
      title: "Welcome task",
      userId: user.id
    }
  });
  
  return { user, task };
});
```

---

## 12. Testing and Debugging

### Prisma Studio
Prisma provides a visual database browser:
```bash
npx prisma studio
```

**Features:**
- Browse your database tables
- View and edit data
- Test queries
- Understand relationships

### Debugging Queries
Enable query logging to see the SQL Prisma generates:
```javascript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Output Example:**
```
prisma:query SELECT "public"."users"."id", "public"."users"."email", "public"."users"."name" FROM "public"."users" WHERE "public"."users"."id" = $1 LIMIT $2 OFFSET $3
```

### Testing Your API
1. **Start your server** with Prisma integration
2. **Test all endpoints** to ensure they work with Prisma
3. **Verify data persistence** in your database
4. **Check error handling** with invalid inputs

---

## Summary

In this lesson, you've learned:
- **What ORMs are** and why they're beneficial for development
- **How Prisma works** as a modern ORM for Node.js
- **How to set up Prisma** in an existing PostgreSQL project
- **How to transform raw SQL** to Prisma Client methods
- **Advanced Prisma features** like relationships and transactions
- **Best practices** for performance and error handling

### Key Benefits of Prisma
- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Better autocomplete and error messages
- **Maintainability**: Easier to refactor and modify
- **Performance**: Optimized queries and connection management
- **Relationships**: Simple handling of complex database relationships

### Next Steps
1. **Complete the assignment** following this lesson
2. **Test your Prisma integration** thoroughly
3. **Continue to Lesson 7** to learn advanced Prisma features
4. **Explore Prisma documentation** for more advanced usage

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [TypeScript with Prisma](https://www.prisma.io/docs/guides/other/tutorials/use-prisma-with-typescript)

---

## Getting Help

- Use Prisma Studio to visualize your database
- Enable query logging to debug issues
- Check the Prisma error codes for specific problems
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts

**Remember:** This lesson builds on Lesson 6a. Make sure you have a working PostgreSQL application before adding Prisma ORM!
