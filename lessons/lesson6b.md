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

**Note:** The `?schema=public` parameter tells Prisma which database schema to use.

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
  password  String
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
    password: 'hashedPassword'
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
  'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name',
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

const newUser = await prisma.user.create({
  data: { email, name, password },
  select: { id: true, email: true, name: true }
});
```

**Key Changes:**
- **`pool.query()`** → **`prisma.user.findUnique()`**
- **SQL strings** → **JavaScript objects**
- **`result.rows[0]`** → **direct object**
- **`RETURNING` clause** → **`select` option**

### Task Controller Transformation

**Before (Raw SQL):**
```javascript
const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [user_id]);
const tasks = result.rows;
```

**After (Prisma):**
```javascript
const tasks = await prisma.task.findMany({
  where: { userId: parseInt(user_id) }
});
```

**Key Changes:**
- **`pool.query()`** → **`prisma.task.findMany()`**
- **SQL WHERE clause** → **`where` object**
- **`parseInt()` conversion**: Prisma expects integers for ID fields
- **No need for `result.rows`**: Prisma returns the data directly

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
  where: { userId: parseInt(user_id) },
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
    userId: parseInt(user_id),
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
  where: { userId: parseInt(user_id) },
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
- **`P2002`**: Unique constraint violation (duplicate email)
- **`P2025`**: Record not found
- **`P2003`**: Foreign key constraint violation
- **`P2014`**: Invalid relation

### Implementing Error Handling
```javascript
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
    data: { email, name, password }
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
