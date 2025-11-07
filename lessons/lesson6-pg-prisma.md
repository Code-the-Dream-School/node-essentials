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
Right now you are using `memoryStore.js` to store users and a list of tasks for each. For this lesson, you want to eliminate all use of `memoryStore.js`, and to read and write from the database instead. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

**Prerequisites:** This lesson builds on the work you completed in **Week 4**, where you built a working Express application with in-memory storage. Make sure you have a functional Express app with user and task management before proceeding.

**Why This Matters:**
- **Data Persistence**: Your data survives server restarts and crashes
- **Scalability**: Can handle multiple users and larger datasets
- **Security**: Better data isolation and user ownership
- **Professional Development**: Real-world applications use databases, not memory storage

---

## 1. Understanding Databases vs. In-Memory Storage

### The Problem with In-Memory Storage
When you store data in JavaScript arrays or objects, that data exists only while your server is running. When you restart your server, all the data disappears.  Also, your server only has so much memory, much less than a production application would typically need to store.

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

## 3. Database Connection String

### Understanding Connection Strings

A connection string tells your application how to connect to your database. It includes all the necessary information: username, password, host, port, and database name.  You set up several databases in Assignment 0, and you saved the connection strings in your `.env` file.

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

The database connection string is slightly different depending on your OS platform.  You configured connection strings in your `.env` file as part of Assignment 0.  Remember that these typically contain a password, so you do not want these in your code!

Your connection string may contain an "sslmode" parameter.  SSL is necessary when you connect to a cloud database, but not when you connect to a local machine.

**Security Note:** Never commit your `.env` file to version control. It contains sensitive information like passwords. Make sure to add `.env` to your `.gitignore` file to prevent accidentally committing it to GitHub.

---

## 4. Database Schema Design

### What is a Schema?

A database schema defines the structure of your database: what tables exist, what columns they have, and how they relate to each other.  The schema describes the datatype for the column (String, Int, etc.).  It describes whether a column is a primary key, or perhaps a foreign key.  It describes schema constraints: which attributes may not be null, which must be unique, etc..  The schema may also identify columns that are to be indexed for performance.

### Designing Your Tables
Based on your existing Express app, you'll need two main tables.  These are the SQL commands to create the tables:

**Users Table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
);
```

**Tasks Table:**
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  CONSTRAINT task_id_user_id_unique UNIQUE (id, user_id)
);
```

### Understanding the Schema
- **`SERIAL PRIMARY KEY`**: Creates an auto-incrementing unique identifier
- **`VARCHAR(255)`**: Variable-length string with maximum 255 characters
- **`NOT NULL`**: Field cannot be empty
- **`UNIQUE`**: No two users can have the same email
- **`REFERENCES users(id)`**: Creates a foreign key relationship
- **`DEFAULT CURRENT_TIMESTAMP`**: Automatically sets the current time
- **CONSTRAINT task_id_user_id_unique UNIQUE (id, user_id)** Creates an additional index.  

The additional index is needed for Prisma (the second part of the lesson and assignment.)  For some operations (`show()`, `update()`, `delete()`) you must specify both the id of the task and the user_id in your WHERE clause.  This is to make sure that one user can't access a different user's task record.  When doing this in Prisma, the additional index is required.

Note that all table names and column names are lower case.  You can use mixed case names, but it adds complexity.  That is why snake-case is used, as in `created_at`.

---

## 5. Node.js Database Integration

You will use the `pg` package, which you'll install as part of the assignment.  In an Express application, you can have many concurrent requests.  You don't want to create a database connection for each of them.  So, you'll use a pool:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
```

**Understanding the Code:**
- **`Pool`**: Manages multiple database connections efficiently
- **`connectionString`**: Uses your DATABASE_URL from environment variables
- **`sslmode`**: Postgres hosting platforms (like the Neon one you will use) require SSL, and will have a connection string that specifies the sslmode. For local development, your socket is local so you don't need SSL.
- **`module.exports`**: Makes the pool available to other files

You also need the `pool.on('error' ...` event handling in case an idle pool connection throws an error.  Otherwise this can disrupt your node process.

### Why Use Connection Pooling?
Instead of creating a new connection for each database operation, a pool maintains several connections and reuses them. This is more efficient and faster than creating connections on demand.

**Important:** When stopping your application, use `await pool.end()` to close all connections cleanly and prevent connection leaks.  In your assignment, you'll add this logic to the shutdown handling for your app.

---

## 6. Queries

You'll do database queries in your controllers.  Here are some sample queries:

```js
const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
const newUser = await pool.query(`INSERT INTO users (email, name, hashed_password) 
    VALUES ($1, $2, $3) RETURNING id, email, name`,
    [email, name, hashed_password]
  );
```

What happens is this: When you issue the `pool.query()`, you get a connection from the pool.  It may not be connected to an actual socket yet, in which case it is connected as you issue the query.  

The query itself is just an SQL statement, except notice the `($1, $2, $3)`.  These are parameters you pass to the query, which are substituted.  Of course, you could use string interpolation to put the values in ... **but you better not!**  That would make your code vulnerable to an SQL injection attack, where the attacker adds hostile SQL in the middle of your statement.  With parameterized queries, SQL parameters are sanitized before they are substituted, and dangerous stuff is escaped.

After a client connection is retrieved from the pool, the query is run, and once it is complete and the results have been returned, the client connection is returned to the pool.  If the server gets busy, the `pool.query()` operation may have to wait for an available connection.

All well and good, but what about transactions?  The `pool.query()` operation performs a single query in an automatically performed transaction. Suppose you need to do a series of queries in a single transaction?  In that case, the process is a little more complicated.

```js
async function runTransactionalWork() {
  const client = await pool.connect(); // Checkout a client from the pool

  try {
    await client.query("BEGIN"); // Start transaction

    // Example operation #1
    const userResult = await client.query(
      `INSERT INTO users (email) VALUES ($1) RETURNING id`,
      ["test@example.com"]
    );
    const userId = userResult.rows[0].id;

    // Example operation #2
    await client.query(
      `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)`,
      [userId, "Test User"]
    );

    // Example operation #3
    const balanceResult = await client.query(
      `UPDATE accounts SET balance = balance - 100 WHERE user_id = $1 RETURNING balance`,
      [userId]
    );
    console.log("New balance:", balanceResult.rows[0].balance);

    await client.query("COMMIT"); // Success → commit the transaction
    return { success: true, userId };
  } catch (err) {
    await client.query("ROLLBACK"); // Failure → rollback the transaction
    console.error("Transaction failed, rolled back.", err);
    throw err; // propagate error to caller
  } finally {
    client.release(); // Always release the client back to the pool
  }
}
```
In sum:

- checkout client
- begin transaction
- query
- more queries
- commit transaction
- or, in case of errors, rollback the transaction
- return the client to the pool.

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

**Important Security Note:**
YOu are going to use a globally stored user_id.  This is a temporary makeshift.  The global user_id storage approach used here is **NOT secure** for production applications. It means that once someone logs in, anyone else can access the logged-in user's tasks because there's only one global value. This is used here to match the behavior from lesson 4, but in a real application, you would use proper session management, JWT tokens, or other secure authentication methods.  You will fix this in assignment 8.

---

## 8. Error Handling

### Database Error Types

Different types of errors can occur when working with databases.  Typically you let these fall through to the global error handler middleware.  

There are times when you will need to catch specific errors within your controller logic.  For example, if a user attempts to register with an email address that is already registered, you want to catch the error in the controller so that you can return an appropriate explanation to the user.

**Connection Errors:**

You want a special log message in your error handler for connection errors, in case you forget to start your Postgres service.

You may also get query errors.  For example, queries could time out.  A request to the pool could fail because all connections are tied up. There could be an attempt to write something to the database that doesn't comply with the schema.  In general, you'd just log these to the console in your global error handler, and return the 500 return code and corresponding JSON internal server error message.

### A Health Check API

It is common to have a health check  API, so that you can see if the application is functioning.  The health check gives immediate notice if connection to the database is not successful.

---

## 9. Common Challenges and Solutions

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
1. **Complete Assignment 6a** following this lesson
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

### **Proceed to Assignment 6a**

At this point, you should do the first half of your assignment (Assignment 6a).  Then, return to the lesson to learn about Object Relational Mappers (ORMs), before proceeding on to Assignment 6b.

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

Prisma is a modern, open-source ORM for Node.js and TypeScript (except we won't use its TypeScript features). It consists of three main tools:

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

### How it Works

Under the covers, Prisma is making SQL calls, which are issued via socket connections to a database.  There is a connection pool.  Actually ... Prisma relies on the `pg` package to make this work.

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
Models represent your database tables as JavaScript classes (example only, do not use):

```prisma
model UserExample {
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

By default, every attribute listed must be non-null.  You can override this behavior by putting a `?` at the end of the data type: `String?`.

---

### Schema Mapping Concepts

**Field Mapping**
```prisma
createdAt DateTime @default(now()) @map("created_at")
```
- **Prisma Field**: `createdAt` (camelCase, JavaScript convention)
- **Database Column**: `created_at` (snake_case, SQL convention)

**Table Mapping**
```prisma
model User {
  ...
@@map("users")
}
```
- **Prisma Model**: `User` (PascalCase, JavaScript convention)
- **Database Table**: `users` (lowercase, SQL convention)

**Relationship Mapping**
```prisma
model Task {
  id           Int      @id @default(autoincrement())
  title        String
  createdAt DateTime @default(now()) @map("created_at)
  user   User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  userId       Int @map("user_id")
  isCompleted  Boolean  @default(false) @map("is_completed")
  @@map("tasks")
}
```
- **Prisma Field**: `userId` (camelCase)
- **Database Column**: `user_id` (snake_case)
- **Relation**: Links to the `User` model via the `id` field

With this schema, we have the same table names and column names as were created using the `CREATE TABLE` SQL statements at the start of this lesson.  In Prisma we use camel case column names and capitalized model names, but the column names are mapped to the lower case versions using `@map()`, and the table names are mapped to the lower case versions using `@@map()`.  With this approach, we can access the same tables from either pg or Prisma.

---

## 4. Database Introspection and Schema Generation

### What is Introspection?
Introspection is the process of reading your existing database structure and automatically generating a Prisma schema that matches it.

### Using Prisma Introspection

The following command (don't run it yet!) introspects the schema of the database.

```bash
npx prisma db pull 
```

**What This Does:**
- Connects to your existing PostgreSQL database
- Reads all tables, columns, and relationships
- Generates models in your `schema.prisma` file that matches your current database
- Preserves all existing data

**Benefits of Introspection:**
- **No Data Loss**: Your existing data remains intact
- **Accurate Mapping**: Automatically detects table structures
- **Time Saving**: No need to manually write the schema
- **Error Prevention**: Eliminates manual mapping mistakes

**Downsides of Introspection:**
- **Schema Management is in SQL**
- **Schema Evolution is difficult for a team project**
- **Schema Management is difficult in production**

### The alternative: Manage Schema with the ORM.  Use Migration.

In this case, you write and update model definitions directly.

A migrate step updates the actual table definitions in the database.

Whenever you create or modify the Prisma schema, you must also do a migration.  No tables are generated or updated until you do this:

```bash
npx prisma migrate dev --name firstVersion
```

You give each subsequent migration a different name. Run the command above and verify that it completes correctly.  No table changes will occur, because you previously created the tables you need.

---

## 4. Error Handling with Prisma

### Prisma Error Types
Prisma provides specific error codes for different scenarios:

**Common Error Codes:**
- **`P2002`**: Unique constraint violation (duplicate email) → Return 400 Bad Request
- **`P2025`**: Record not found → Return 404 Not Found
- **`P2003`**: Foreign key constraint violation → Return 400 Bad Request
- **`P2014`**: Invalid relation → Return 400 Bad Request

The `P2025` only occurs for the following operations: `update()`, `delete()`, `findUniqueOrThrow()`, `findFirstOrThrow()`.  For a `findMany()` an empty array is returned if no entry is found.  For a `findUnique()`, a null value is returned if no entry is found.

### Implementing Error Handling

The code below is an example -- but frequently, you will only catch a small subset of the errors in your controller.  You'll let most errors fall through to your global error handler.


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
  
  if (error.code === 'P2025') { // won't happen here!
    return res.status(404).json({ 
      error: "Record not found" 
    });
  }
  
  if (error.code === 'P2003') { // might happen if you tried to create a task with
  // no corresponding user
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

### Database Connection Errors

Prisma throws a `PrismaClientInitializationError` when it cannot connect to the database. This commonly occurs when the database server isn't running. You can handle this in your error handler middleware:

```javascript
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.message);
  
  // Handle database connection failures
  if (err.name === "PrismaClientInitializationError") {
    console.log("Couldn't connect to the database. Is it running?");
    return res.status(500).json({ 
      error: "Database connection failed",
      message: "Couldn't connect to the database. Is it running?"
    });
  }
  console.error(err.constructor.name, err.message);
  console.error(err.stack); // these two lines can identify problems in your code

  // Default error response
  res.status(500).json({ error: "Internal server error" });
});
```

**Benefits:**
- Provides clear feedback when the database is unavailable
- Improves debugging and user experience
- Catches connection issues early

### Error Handling in Context

```javascript
let updatedUser = null;
try {
  updatedUser = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { name: newName }
  });
} catch (err) {
  if (err.code === "P2025") {
    return res.status(404).json(message: "The entry was not found.");
  } else {
    return next(err); // if inside of a controller
  }
}
else ... // it succeeded!
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
    // password is excluded.  You could also do omit: { hashed_password : true}
  }
});
```

**Use Appropriate Methods:**
```javascript
// For single records
const user = await prisma.user.findUnique({ where: { email } }); 
// email must be unique in this case!

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

## 5. Testing and Debugging

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
1. **Complete Assignment 6b** following this lesson
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
