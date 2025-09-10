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

**Security Note:** Never commit your `.env` file to version control. It contains sensitive information like passwords.

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
  password VARCHAR(255) NOT NULL,
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

---

## 6. Node.js Database Integration

### Installing Required Packages
```bash
npm install pg dotenv
```

**Package Explanation:**
- **`pg`**: PostgreSQL client for Node.js
- **`dotenv`**: Loads environment variables from `.env` file

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
- **`ssl`**: Required for some hosting platforms (like Heroku)
- **`module.exports`**: Makes the pool available to other files

### Why Use Connection Pooling?
Instead of creating a new connection for each database operation, a pool maintains several connections and reuses them. This is more efficient and faster than creating connections on demand.

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

const result = await pool.query(
  'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name',
  [email, name, password]
);
```

### Task Controller Updates

**Before (Memory Storage):**
```javascript
// Old way - filtering in memory
const userTasks = storedTasks.filter(task => task.user_id === parseInt(user_id));
```

**After (Database Storage):**
```javascript
// New way - using database
const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [user_id]);
const userTasks = result.rows;
```

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
4. **Test user registration**: `POST /api/users/register`
5. **Test user login**: `POST /api/users/login`
6. **Test task creation**: `POST /api/tasks?user_id=1`
7. **Test task retrieval**: `GET /api/tasks?user_id=1`

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
