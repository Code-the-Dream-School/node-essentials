# Lesson 7: Advanced Prisma ORM Features

## Prerequisites: What You Should Have from Lesson 6b

Before starting this lesson, ensure you have completed Lesson 6b and have the following setup:

### Database Schema
Your PostgreSQL database should have these tables (created via Prisma schema):

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table with foreign key relationship
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Prisma Schema File
Your `prisma/schema.prisma` should look like this:

```prisma
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

### Sample Data
Your database should contain some test data to practice with:

**Users:**
- At least 2-3 users with different names and emails
- Think of them as test accounts you can use to practice

**Tasks:**
- Each user should have a few tasks
- Mix of completed and incomplete tasks
- Various task titles for testing search and filtering

### Working API Endpoints
Your existing app should have these endpoints working:

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/tasks?user_id=X` - Get user's tasks
- `POST /api/tasks?user_id=X` - Create new task
- `PATCH /api/tasks/:id?user_id=X` - Update task
- `DELETE /api/tasks/:id?user_id=X` - Delete task

### Project Structure
Your project should look like this:

```
project/
├── controllers/
│   ├── userController.js
│   └── taskController.js
├── routes/
│   ├── userRoutes.js
│   └── taskRoutes.js
├── prisma/
│   ├── schema.prisma
│   └── db.js
├── app.js
├── .env
└── package.json
```

### Environment Configuration
Your `.env` file should contain:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/yourdatabase"
PORT=3000
```

### What You Should Be Able to Do
Before proceeding with Lesson 7, you should be able to:
1. Start your server with `npm start`
2. Connect to your PostgreSQL database
3. Create, read, update, and delete users and tasks
4. Test all endpoints with Postman or similar tools
5. See data being stored and retrieved from the database

**If any of these are not working, please complete Lesson 6b first or ask for help with the setup.**

---

## Overview
Building on your Prisma ORM knowledge from Lesson 6b, this lesson explores **Advanced Prisma features** that will make your database operations more powerful and efficient. You'll learn how to handle complex queries, optimize performance, and work with advanced database patterns.

**What You'll Learn:**
- **Eager loading and relation handling (LEFT JOIN equivalents)**: Learn how to fetch related data in a single query instead of making multiple database calls. Use this when you need to display a user's profile along with their recent tasks, or when building dashboard views that show multiple related pieces of information.

- **Advanced querying with groupBy and aggregations**: Discover how to analyze your data for insights and reporting. Use groupBy when you want to count how many tasks each user has completed, calculate completion rates, or generate statistics for analytics dashboards.

- **Database transactions for data consistency**: Learn how to ensure multiple database operations either all succeed or all fail together. Use transactions when creating a user account and their initial settings, or when updating multiple related records that must stay in sync.

- **Batch operations for better performance**: Master techniques for handling multiple records efficiently. Use batch operations when importing data, bulk updating user preferences, or processing large datasets without overwhelming your database.

- **Raw SQL with $queryRaw when needed**: Understand when Prisma's built-in features aren't enough and how to safely use raw SQL. Use $queryRaw for complex searches across multiple fields, custom aggregations, or database-specific features that Prisma doesn't support.

- **Performance optimization techniques**: Learn how to make your database queries faster and more efficient. Use these techniques when your app starts getting slower with more users, or when you need to handle larger amounts of data without performance degradation.

- **Security best practices**: Master techniques to keep your database safe from attacks. Use these practices in production applications to prevent SQL injection, secure sensitive data, and maintain user privacy.

---

## 1. Eager Loading and Relations

### a. Understanding Eager Loading
Eager loading fetches related data in a single query, eliminating the "N+1 query problem" where you make one query for the main data and then additional queries for each related record.

**Example: Get users with their tasks**
```javascript
// ❌ N+1 Problem: One query for users, then one for each user's tasks
const users = await prisma.user.findMany();
for (const user of users) {
  const tasks = await prisma.task.findMany({ where: { userId: user.id } });
  user.tasks = tasks;
}

// ✅ Eager Loading: Single query with LEFT JOIN
const usersWithTasks = await prisma.user.findMany({
  include: {
    tasks: true
  }
});
```

**What this generates in SQL:**
```sql
SELECT u.*, t.* 
FROM users u 
LEFT JOIN tasks t ON u.id = t.user_id
```

### b. Advanced Eager Loading
```javascript
// Include tasks with filtering and ordering
const usersWithActiveTasks = await prisma.user.findMany({
  include: {
    tasks: {
      where: {
        isCompleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5  // Limit to 5 most recent tasks
    }
  }
});

// Include nested relations (if you had categories)
const tasksWithUserAndCategory = await prisma.task.findMany({
  include: {
    user: {
      select: {
        name: true,
        email: true
      }
    }
    // category: true  // If you had a category relation
  }
});
```

**Benefits:**
- **Performance**: Fewer database round trips
- **Consistency**: All data fetched at the same time
- **Efficiency**: Database optimizes the JOIN operation

---

## 2. Aggregation and GroupBy Operations

### a. Basic Aggregations
```javascript
// Count total tasks
const totalTasks = await prisma.task.count();

// Count tasks by user
const taskCounts = await prisma.task.groupBy({
  by: ['userId'],
  _count: {
    id: true
  }
});

// Get completion statistics
const completionStats = await prisma.task.groupBy({
  by: ['isCompleted'],
  _count: {
    id: true
  }
});
```

### b. Advanced GroupBy with Multiple Fields
```javascript
// Group by user and completion status
const userTaskAnalysis = await prisma.task.groupBy({
  by: ['userId', 'isCompleted'],
  _count: {
    id: true
  },
  _avg: {
    id: true
  }
});

// Group by date (daily task creation)
const dailyTaskCreation = await prisma.task.groupBy({
  by: ['createdAt'],
  _count: {
    id: true
  },
  where: {
    createdAt: {
      gte: new Date('2024-01-01')
    }
  }
});
```

### c. Aggregation Functions
```javascript
// Get user productivity metrics
const userMetrics = await prisma.task.groupBy({
  by: ['userId'],
  _count: {
    id: true,
    isCompleted: true
  },
  _sum: {
    id: true
  },
  where: {
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    }
  }
});
```

**Use Cases:**
- Dashboard statistics
- Analytics and reporting
- Performance metrics
- Data insights

---

## 3. Database Transactions

### a. Why Use Transactions?
Transactions ensure that multiple database operations either all succeed or all fail together, maintaining data consistency.

**Example: User registration with welcome task**
```javascript
const result = await prisma.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Smith',
      password: 'hashedpassword'
    }
  });

  // Create welcome task for the user
  const welcomeTask = await tx.task.create({
    data: {
      title: 'Welcome! Complete your profile',
      userId: user.id,
      isCompleted: false
    }
  });

  // Create initial settings (if you had a settings table)
  // const settings = await tx.userSettings.create({
  //   data: { userId: user.id, theme: 'light' }
  // });

  return { user, welcomeTask };
});
```

### b. Transaction with Error Handling
```javascript
try {
  const result = await prisma.$transaction(async (tx) => {
    // Multiple operations...
    const user = await tx.user.create({ /* ... */ });
    const task = await tx.task.create({ /* ... */ });
    
    // If any operation fails, the entire transaction rolls back
    return { user, task };
  });
  
  console.log('Transaction successful:', result);
} catch (error) {
  console.error('Transaction failed:', error);
  // All changes are automatically rolled back
}
```

**Transaction Benefits:**
- **Data Consistency**: All operations succeed or fail together
- **Rollback**: Automatic cleanup on failure
- **Isolation**: Other operations don't see partial changes

---

## 4. Batch Operations

### a. Creating Multiple Records
```javascript
// Create multiple users at once
const newUsers = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1', password: 'hash1' },
    { email: 'user2@example.com', name: 'User 2', password: 'hash2' },
    { email: 'user3@example.com', name: 'User 3', password: 'hash3' }
  ],
  skipDuplicates: true  // Skip if email already exists
});

// Create multiple tasks for a user
const newTasks = await prisma.task.createMany({
  data: [
    { title: 'Task 1', userId: 1 },
    { title: 'Task 2', userId: 1 },
    { title: 'Task 3', userId: 1 }
  ]
});
```

### b. Updating Multiple Records
```javascript
// Mark all overdue tasks as completed
const updatedTasks = await prisma.task.updateMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
    },
    isCompleted: false
  },
  data: {
    isCompleted: true
  }
});

// Update user preferences in bulk
const updatedUsers = await prisma.user.updateMany({
  where: {
    createdAt: {
      lt: new Date('2024-01-01')
    }
  },
  data: {
    // Add new fields if you had them
    // preferences: { theme: 'dark' }
  }
});
```

**Batch Operation Benefits:**
- **Performance**: Fewer database round trips
- **Efficiency**: Database optimizes bulk operations
- **Consistency**: All records updated with same logic

---

## 5. Raw SQL with $queryRaw

### a. When to Use Raw SQL
Prisma doesn't support:
- Complex JOINs (inner joins, cross joins)
- Subqueries
- Advanced SQL functions
- Custom SQL logic
- Database-specific features

### b. Using $queryRaw Safely
```javascript
// Get users with task statistics using raw SQL
const userStats = await prisma.$queryRaw`
  SELECT 
    u.id, 
    u.name, 
    u.email,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.is_completed = true THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.is_completed = false THEN 1 END) as pending_tasks
  FROM users u
  LEFT JOIN tasks t ON u.id = t.user_id
  GROUP BY u.id, u.name, u.email
  ORDER BY total_tasks DESC
`;

// Search tasks with complex text matching
const searchResults = await prisma.$queryRaw`
  SELECT t.*, u.name as user_name
  FROM tasks t
  JOIN users u ON t.user_id = u.id
  WHERE t.title ILIKE ${`%${searchTerm}%`}
    OR u.name ILIKE ${`%${searchTerm}%`}
  ORDER BY 
    CASE WHEN t.title ILIKE ${`%${searchTerm}%`} THEN 1 ELSE 2 END,
    t.created_at DESC
`;
```

### c. Parameterized Queries for Security
```javascript
// ✅ SAFE: Use template literals with $queryRaw
const userTasks = await prisma.$queryRaw`
  SELECT * FROM tasks 
  WHERE user_id = ${userId} 
  AND title ILIKE ${`%${searchTerm}%`}
`;

// ✅ SAFE: Use $queryRawUnsafe with parameters
const userTasks = await prisma.$queryRawUnsafe(
  'SELECT * FROM tasks WHERE user_id = $1 AND title ILIKE $2',
  [userId, `%${searchTerm}%`]
);

// ❌ DANGEROUS: Direct string concatenation (NEVER DO THIS)
const query = `SELECT * FROM users WHERE email = '${email}'`;
const result = await prisma.$queryRawUnsafe(query);
```

### c. SQL Injection Prevention
**❌ DANGEROUS - Never do this:**
```javascript
// DON'T: Direct string concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;
const result = await prisma.$queryRawUnsafe(query);
```

**✅ SAFE - Use parameterized queries:**
```javascript
// DO: Use template literals with $queryRaw
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// DO: Use $queryRawUnsafe with parameters
const result = await prisma.$queryRawUnsafe(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

**Why SQL Injection is Dangerous:**

**What is SQL Injection?**
SQL injection is when an attacker tricks your app into running malicious SQL code instead of the intended query. This happens when user input is directly inserted into SQL strings without proper sanitization.

**Real Attack Examples:**

**Example 1: Data Theft**
```javascript
// Attacker enters this as email: ' OR 1=1; --
// Your unsafe query becomes:
// SELECT * FROM users WHERE email = '' OR 1=1; --'
// This returns ALL users in your database!
```

**Example 2: Database Destruction**
```javascript
// Attacker enters this as email: '; DROP TABLE users; --
// Your unsafe query becomes:
// SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
// This deletes your entire users table!
```

**Example 3: Admin Access**
```javascript
// Attacker enters this as email: ' OR email = 'admin@company.com' OR '1'='1
// Your unsafe query becomes:
// SELECT * FROM users WHERE email = '' OR email = 'admin@company.com' OR '1'='1'
// This gives the attacker access to admin accounts!
```

**What Attackers Can Do:**
- **Steal all your data**: Read every user record, password, personal information
- **Modify your data**: Change prices, user permissions, or delete records
- **Destroy your database**: Drop tables, corrupt data, or crash your app
- **Access other systems**: If your database has network access, attackers might reach other servers
- **Steal user accounts**: Get admin access, impersonate users, or reset passwords

**Real-World Consequences:**
- **Financial Loss**: Stolen customer data, fraudulent transactions
- **Legal Issues**: Data breach lawsuits, regulatory fines (GDPR, HIPAA)
- **Reputation Damage**: Loss of customer trust, negative publicity
- **Business Disruption**: App downtime, data recovery costs
- **Identity Theft**: Stolen user credentials used for fraud

**How Attackers Find Vulnerabilities:**
- **Automated scanning**: Bots constantly test websites for common vulnerabilities
- **Manual testing**: Hackers try different inputs to see how your app responds
- **Error messages**: Database errors that reveal your table structure
- **Public information**: Code repositories, documentation, or forum posts

**Why Parameterized Queries Work:**
- **Separation**: User input is treated as data, not code
- **Database protection**: The database engine handles the input safely
- **Type safety**: Input is properly escaped and validated
- **No code execution**: User input can never become executable SQL

**Remember:** SQL injection is one of the most dangerous web vulnerabilities. Always use parameterized queries, never concatenate user input directly into SQL strings, and validate all inputs before using them in database operations.

---

## 6. Performance Optimization

### a. Selective Field Loading
```javascript
// ❌ Loads all fields (including password)
const users = await prisma.user.findMany();

// ✅ Loads only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // password is excluded
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

### b. Pagination
```javascript
// Basic pagination
const tasks = await prisma.task.findMany({
  take: 20,        // Limit results
  skip: 40,        // Offset for page 3
  orderBy: { createdAt: 'desc' }
});

// Cursor-based pagination (more efficient for large datasets)
const tasks = await prisma.task.findMany({
  take: 20,
  cursor: { id: lastTaskId },  // Start after this ID
  orderBy: { id: 'asc' }
});
```

### c. Query Optimization
```javascript
// Use indexes effectively
const recentTasks = await prisma.task.findMany({
  where: {
    userId: 1,
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

---

## 7. Advanced Query Patterns

### a. Complex Filtering
```javascript
// Advanced where conditions
const filteredTasks = await prisma.task.findMany({
  where: {
    AND: [
      { userId: 1 },
      { 
        OR: [
          { title: { contains: 'urgent' } },
          { title: { contains: 'important' } }
        ]
      },
      { 
        AND: [
          { isCompleted: false },
          { createdAt: { gte: new Date('2024-01-01') } }
        ]
      }
    ]
  },
  include: {
    user: {
      select: {
        name: true,
        email: true
      }
    }
  }
});
```

### b. Conditional Includes
```javascript
// Include related data conditionally
const tasks = await prisma.task.findMany({
  include: {
    user: {
      select: {
        name: true,
        email: true
      }
    }
  },
  where: {
    isCompleted: false
  }
});
```

---

## 8. Practical Exercise: Task Analytics API

### a. Build Advanced Endpoints
```javascript
// Get user productivity analytics
app.get('/api/users/:id/analytics', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Get task completion statistics
    const taskStats = await prisma.task.groupBy({
      by: ['isCompleted'],
      where: { userId },
      _count: { id: true }
    });

    // Get recent activity
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    // Get weekly progress
    const weeklyProgress = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _count: { id: true }
    });

    res.json({
      taskStats,
      recentTasks,
      weeklyProgress
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team overview (if you had multiple users)
app.get('/api/team/overview', async (req, res) => {
  try {
    const teamStats = await prisma.user.findMany({
      include: {
        _count: {
          select: { tasks: true }
        },
        tasks: {
          where: { isCompleted: false },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(teamStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### b. Test Your Implementation
1. Start your PostgreSQL database
2. Ensure Prisma is properly configured
3. Test the analytics endpoints
4. Experiment with different query patterns

---

## 9. Best Practices and Tips

### a. Error Handling
```javascript
try {
  const user = await prisma.user.findUnique({
    where: { email: 'nonexistent@example.com' }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  if (error.code === 'P2025') {
    // Prisma record not found error
    console.log('Record not found');
  } else if (error.code === 'P2002') {
    // Unique constraint violation
    console.log('Email already exists');
  } else {
    console.error('Database error:', error);
  }
}
```

### b. Environment Management
```javascript
// Different configurations for different environments
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: 'pretty'
});
```

### c. Connection Management
```javascript
// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});
```

---

## Summary

In this lesson, you learned:
- **Eager Loading**: Efficiently fetch related data with LEFT JOIN equivalents
- **Aggregations**: Use groupBy for data analysis and statistics
- **Transactions**: Ensure data consistency across multiple operations
- **Batch Operations**: Improve performance with bulk operations
- **Raw SQL**: Use $queryRaw when Prisma's features aren't sufficient
- **Security**: Prevent SQL injection with parameterized queries
- **Performance**: Optimize queries with selective loading and pagination
- **Advanced Patterns**: Complex filtering and conditional includes

**Next Steps:**
- Practice with the analytics API exercise
- Explore Prisma's documentation for more features
- Build real applications using these advanced patterns
- Learn about Prisma Studio for database visualization
- Consider implementing caching strategies for frequently accessed data

**Remember:** Prisma makes complex database operations simple and safe, but always prioritize security and performance when building production applications!
