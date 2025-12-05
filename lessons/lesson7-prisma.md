# **Lesson 7: Advanced Prisma ORM Features**

## **Lesson Overview**

You have learned to use Prisma ORM for basic CRUD operations in your app from Lesson 6.  Often, though, you need more advanced features.  This lesson will describe advanced Prisma features that will make your database operations more powerful and efficient.  The lesson explains eager loading, aggregations, transactions, batch operations, raw SQL, and performance optimization techniques.  You'll implement these features in the assignment.

## **Learning Objectives**

You will learn:
- What eager loading is and how it eliminates N+1 query problems
- How to use groupBy operations for data aggregation and analytics
- Why database transactions are important and how to implement them
- How to perform batch operations for better performance
- When and how to use raw SQL with $queryRaw
- Performance optimization techniques including pagination and selective field loading
- Advanced error handling for Prisma operations

**Topics:**

1. **Eager loading and relations (include)** - When you need to display tasks with user information, or users with their tasks, eager loading prevents making hundreds of separate database queries. Instead of one query per user to get their tasks (the N+1 problem), you fetch everything in a single efficient query.

2. **Aggregation and groupBy operations** - Essential for building dashboards, analytics, and reports. You'll need this to answer questions like "How many tasks are completed vs incomplete?" or "How many tasks did each user create this week?" without fetching all records and counting in JavaScript.

3. **Database transactions for data consistency** - Critical when multiple database operations must succeed or fail together. For example, when a user registers, you want to create their account AND their welcome tasks atomically. If creating the tasks fails, you don't want a user account without tasks—transactions ensure both succeed or both fail.

4. **Batch operations (createMany, updateMany, deleteMany)** - When you need to create, update, or delete many records at once (like importing data, bulk updates, cleanup operations, or initializing default data), batch operations are much faster than looping through individual create/update/delete calls. They reduce database round trips and improve performance significantly.

5. **Raw SQL basics with $queryRaw** - Sometimes Prisma's query builder can't express what you need, like complex text search with relevance ranking, advanced JOINs, or database-specific features. Raw SQL gives you the power to write custom queries while still using Prisma's connection management and security features.

6. **Performance optimization (pagination, selective field loading)** - As your app grows, you can't load thousands of records at once. Pagination limits data transfer and improves response times. Selective field loading prevents fetching sensitive data (like passwords) and reduces memory usage by only getting the fields you actually need.

7. **Advanced error handling** - Different database errors require different responses. A duplicate email during registration should return 400 (Bad Request), while a missing record should return 404 (Not Found). Proper error handling gives users clear feedback and helps debug production issues.

## **1. Eager Loading and Relations**

### a. Understanding Eager Loading

Eager loading fetches related data in a single query, eliminating the "N+1 query problem" where you make one query for the main data and then additional queries for each related record.

**The N+1 Problem:**
```javascript
// ❌ N+1 Problem: One query for users, then one for each user's tasks
const users = await prisma.user.findMany();
for (const user of users) {
  const tasks = await prisma.task.findMany({ where: { userId: user.id } });
  user.tasks = tasks;
}
// This makes 1 + N queries (1 for users, N for each user's tasks)
```

**Eager Loading Solution:**
```javascript
// ✅ Eager Loading: Single query with LEFT JOIN
const usersWithTasks = await prisma.user.findMany({
  include: {
    Task: true
  }
});
// This makes only 1 query with a JOIN
```

**What this generates in SQL:**
```sql
SELECT u.*, t.* 
FROM users u 
LEFT JOIN tasks t ON u.id = t.user_id
```

### b. Using Include for Eager Loading

As you learned in Lesson 6, Prisma supports relationships between models. The `include` option tells Prisma to fetch related data in the same query:

```javascript
// Include tasks with filtering and ordering
const usersWithActiveTasks = await prisma.user.findMany({
  include: {
    Task: {
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

// Include nested relations
const tasksWithUser = await prisma.task.findMany({
  include: {
    User: {
      select: {
        name: true,
        email: true
      }
    }
  }
});

// Using select with relations (an alternative to include)
// This allows you to select specific fields from both the main model and relations
const tasksWithUserInfo = await prisma.task.findMany({
  where: { userId: 1 },
  select: {
    id: true,
    title: true,
    isCompleted: true,
    priority: true,
    createdAt: true,
    User: {
      select: {
        name: true,
        email: true
      }
    }
  }
});
```

**Benefits:**
- **Performance**: Fewer database round trips
- **Consistency**: All data fetched at the same time
- **Efficiency**: Database optimizes the JOIN operation

---

## **2. Aggregation and GroupBy Operations**

### a. Basic Aggregations

Prisma provides aggregation functions for data analysis:

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

### b. GroupBy with Single Field

The most common use case is grouping by a single field and counting:

```javascript
// Count tasks by completion status
const taskStats = await prisma.task.groupBy({
  by: ['isCompleted'],
  where: { userId: 1 },
  _count: {
    id: true
  }
});

// Count tasks by priority level
const priorityStats = await prisma.task.groupBy({
  by: ['priority'],
  _count: {
    id: true
  }
});

// Group by date for weekly progress tracking
// First, calculate the date from one week ago
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

// Then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
const weeklyProgress = await prisma.task.groupBy({
  by: ['createdAt'],
  where: {
    userId: 1,
    createdAt: {
      gte: oneWeekAgo
    }
  },
  _count: {
    id: true
  }
});
```

### c. Using _count with Relations

When you need to count related records while also fetching those relations, you need to use `include` and then transform the result:

```javascript
// Get users with task counts and incomplete tasks
// Note: In Prisma, you need to use include for relations, then transform the result
const usersRaw = await prisma.user.findMany({
  include: {
    Task: {
      where: { isCompleted: false },
      select: { id: true },
      take: 5
    },
    _count: {
      select: {
        Task: true
      }
    }
  },
  skip: skip,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// Transform to only include the fields we want
const users = usersRaw.map(user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  _count: user._count,
  Task: user.Task
}));
```

**Important:** You cannot mix `select` with relations directly when using `_count`. Use `include` for relations and then transform the result to select only the fields you need.

**Use Cases:**
- Dashboard statistics
- Analytics and reporting
- Performance metrics
- Data insights

---

## **3. Database Transactions**

### a. Why Use Transactions?

Transactions ensure that multiple database operations either all succeed or all fail together, maintaining data consistency.

**Example Scenario:**
When a user registers, you want to:
1. Create the user account
2. Create welcome tasks for the user

If step 2 fails, you don't want a user account without tasks. A transaction ensures both succeed or both fail.

### b. Implementing Transactions

```javascript
const result = await prisma.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Smith',
      hashedPassword: 'hashedpassword'
    }
  });

  // Create welcome task for the user
  const welcomeTask = await tx.task.create({
    data: {
      title: 'Welcome! Complete your profile',
      userId: user.id,
      isCompleted: false,
      priority: 'medium'
    }
  });

  return { user, welcomeTask };
});
```

### c. Transaction with Error Handling

```javascript
try {
  const result = await prisma.$transaction(async (tx) => {
    // Create user account
    const newUser = await tx.user.create({
      data: { email, name, hashedPassword },
      select: { id: true, email: true, name: true }
    });

    // Create 3 welcome tasks using createMany
    const welcomeTaskData = [
      { title: "Complete your profile", userId: newUser.id, priority: "medium" },
      { title: "Add your first task", userId: newUser.id, priority: "high" },
      { title: "Explore the app", userId: newUser.id, priority: "low" }
    ];
    await tx.task.createMany({ data: welcomeTaskData });

    // Fetch the created tasks to return them
    const welcomeTasks = await tx.task.findMany({
      where: {
        userId: newUser.id,
        title: { in: welcomeTaskData.map(t => t.title) }
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        userId: true,
        priority: true
      }
    });

    // If any operation fails, the entire transaction rolls back
    return { user: newUser, welcomeTasks };
  });
  
  // Transaction succeeded
  res.status(201).json({
    user: result.user,
    welcomeTasks: result.welcomeTasks,
    transactionStatus: "success"
  });
} catch (error) {
  // Handle specific Prisma errors
  if (error.code === "P2002") {
    return res.status(400).json({ error: "Email already registered" });
  }
  // All changes are automatically rolled back
  return next(error);
}
```

**Transaction Benefits:**
- **Data Consistency**: All operations succeed or fail together
- **Rollback**: Automatic cleanup on failure
- **Isolation**: Other operations don't see partial changes

---

## **4. Batch Operations**

### a. Creating Multiple Records

Use `createMany` to insert multiple records efficiently:

```javascript
// Create multiple tasks for a user
const newTasks = await prisma.task.createMany({
  data: [
    { title: 'Task 1', userId: 1, priority: 'high' },
    { title: 'Task 2', userId: 1, priority: 'medium' },
    { title: 'Task 3', userId: 1, priority: 'low' }
  ]
});

// Create multiple users with skipDuplicates
const newUsers = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1', hashedPassword: 'hash1' },
    { email: 'user2@example.com', name: 'User 2', hashedPassword: 'hash2' }
  ],
  skipDuplicates: true  // Skip if email already exists
});
```

### a.1. Bulk Create with Validation

When creating multiple records from user input, always validate each record:

```javascript
// Bulk create with validation
exports.bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ 
      error: "Invalid request data. Expected an array of tasks." 
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId: global.user_id
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: tasks.length
    });
  } catch (err) {
    return next(err);
  }
};
```

### b. Updating Multiple Records

Use `updateMany` to update multiple records at once:

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
```

**Example Use Cases:**
- Mark all tasks older than 7 days as completed
- Update priority for all high-priority tasks
- Archive all completed tasks from a specific date range

### c. Deleting Multiple Records

Use `deleteMany` to delete multiple records at once:

```javascript
// Delete all completed tasks older than 30 days
const deletedTasks = await prisma.task.deleteMany({
  where: {
    isCompleted: true,
    createdAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Older than 30 days
    }
  }
});

// Delete all tasks for a specific user
const deletedUserTasks = await prisma.task.deleteMany({
  where: {
    userId: 1
  }
});
```

**Example Use Cases:**
- Clean up old completed tasks
- Delete all tasks for a user when they delete their account
- Remove test data or temporary records

**Important Notes:**
- `deleteMany` does NOT return the deleted records, only a count
- Use with caution - there's no undo! Consider soft deletes (marking as deleted) for important data
- Always use a `where` clause - without it, `deleteMany` will delete ALL records in the table

**Batch Operation Benefits:**
- **Performance**: Fewer database round trips
- **Efficiency**: Database optimizes bulk operations
- **Consistency**: All records updated/deleted with same logic

---

## **5. Raw SQL with $queryRaw**

### a. When to Use Raw SQL

Prisma doesn't support:
- Complex JOINs (inner joins, cross joins)
- Subqueries
- Advanced SQL functions
- Custom SQL logic
- Database-specific features

When you need these features, use `$queryRaw`.

### b. Using $queryRaw Safely

```javascript
// Get users with task statistics using raw SQL
const userStats = await prisma.$queryRaw`
  SELECT 
    u.id, 
    u.name, 
    u.email,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.is_completed = true THEN 1 END) as completed_tasks
  FROM users u
  LEFT JOIN tasks t ON u.id = t.user_id
  GROUP BY u.id, u.name, u.email
  ORDER BY total_tasks DESC
`;

// Search tasks with complex text matching and relevance ordering
// Construct search patterns outside the query for proper parameterization
const searchPattern = `%${searchTerm}%`;
const exactMatch = searchTerm;
const startsWith = `${searchTerm}%`;

const searchResults = await prisma.$queryRaw`
  SELECT 
    t.id,
    t.title,
    t.is_completed as "isCompleted",
    t.priority,
    t.created_at as "createdAt",
    t.user_id as "userId",
    u.name as "user_name"
  FROM tasks t
  JOIN users u ON t.user_id = u.id
  WHERE t.title ILIKE ${searchPattern} 
     OR u.name ILIKE ${searchPattern}
  ORDER BY 
    CASE 
      WHEN t.title ILIKE ${exactMatch} THEN 1
      WHEN t.title ILIKE ${startsWith} THEN 2
      WHEN t.title ILIKE ${searchPattern} THEN 3
      ELSE 4
    END,
    t.created_at DESC
  LIMIT ${parseInt(limit)}
`;
```

### c. Parameterized Queries for Security

**✅ SAFE - Use template literals with $queryRaw:**
```javascript
// Construct search pattern outside the query
const searchPattern = `%${searchTerm}%`;

const userTasks = await prisma.$queryRaw`
  SELECT * FROM tasks 
  WHERE user_id = ${userId} 
  AND title ILIKE ${searchPattern}
`;
```

**✅ SAFE - Use $queryRawUnsafe with parameters:**
```javascript
const userTasks = await prisma.$queryRawUnsafe(
  'SELECT * FROM tasks WHERE user_id = $1 AND title ILIKE $2',
  [userId, `%${searchTerm}%`]
);
```

**❌ DANGEROUS - Never do this:**
```javascript
// DON'T: Direct string concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;
const result = await prisma.$queryRawUnsafe(query);
```

**Why SQL Injection is Dangerous:**

SQL injection is when an attacker tricks your app into running malicious SQL code instead of the intended query. This happens when user input is directly inserted into SQL strings without proper sanitization.

**Example Attack:**
```javascript
// Attacker enters this as email: ' OR 1=1; --
// Your unsafe query becomes:
// SELECT * FROM users WHERE email = '' OR 1=1; --'
// This returns ALL users in your database!
```

**What Attackers Can Do:**
- **Steal all your data**: Read every user record, password, personal information
- **Modify your data**: Change prices, user permissions, or delete records
- **Destroy your database**: Drop tables, corrupt data, or crash your app

**Why Parameterized Queries Work:**
- **Separation**: User input is treated as data, not code
- **Database protection**: The database engine handles the input safely
- **Type safety**: Input is properly escaped and validated
- **No code execution**: User input can never become executable SQL

**Remember:** Always use parameterized queries, never concatenate user input directly into SQL strings.
---

## **6. Performance Optimization**

### a. Selective Field Loading

As previously mentioned in Lesson 6, you can use `select` to load only the fields you need. This becomes even more important when working with advanced queries:

```javascript
// ❌ Loads all fields (including password)
const users = await prisma.user.findMany();

// ✅ Loads only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    createdAt: true
    // hashedPassword is excluded
  }
});
```

**Benefits:**
- **Security**: Exclude sensitive data like passwords
- **Performance**: Less data transferred over the network
- **Efficiency**: Database only fetches requested columns

### b. Pagination

Use `take` and `skip` for offset-based pagination:

```javascript
// Basic pagination
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const tasks = await prisma.task.findMany({
  where: { userId: global.user_id },
  select: {
    id: true,
    title: true,
    isCompleted: true,
    priority: true,
    createdAt: true,
    User: {
      select: {
        name: true,
        email: true
      }
    }
  },
  take: limit,        // Limit results
  skip: skip,          // Offset for page
  orderBy: { createdAt: 'desc' }
});

// Get total count for pagination metadata
const totalTasks = await prisma.task.count({
  where: { userId: global.user_id }
});

// Build pagination object with complete metadata
const pagination = {
  page,
  limit,
  total: totalTasks,
  pages: Math.ceil(totalTasks / limit),
  hasNext: page * limit < totalTasks,
  hasPrev: page > 1
};

// Return tasks with pagination information
res.status(200).json({
  tasks,
  pagination
});
```

**Pagination Benefits:**
- **Performance**: Limit the amount of data returned
- **User Experience**: Faster page loads
- **Scalability**: Works with large datasets

### c. Filtering with Query Parameters

You can add filtering capabilities to your index endpoints by reading query parameters from `req.query` and building dynamic `where` clauses. Each filter type can be implemented independently and combined together.

#### 1. Search by Title (`find` parameter)

Search for tasks containing a specific string in the title (case-insensitive search).

**Example URL:** `GET /api/tasks?find=meeting`

**Code Implementation:**
```javascript
const { find } = req.query;
const whereClause = { userId: global.user_id };

if (find) {
  whereClause.title = {
    contains: find,        // Matches %find% pattern
    mode: 'insensitive'    // Case-insensitive search (ILIKE in PostgreSQL)
  };
}
```

This searches for tasks with "meeting" anywhere in the title, regardless of case. The `contains` operator with `mode: 'insensitive'` translates to `ILIKE '%meeting%'` in PostgreSQL.

#### 2. Filter by Completion Status (`isCompleted` parameter)

Filter tasks by their completion status (completed or not completed).

**Example URLs:**
- `GET /api/tasks?isCompleted=true` - Returns only completed tasks
- `GET /api/tasks?isCompleted=false` - Returns only incomplete tasks

**Code Implementation:**
```javascript
const { isCompleted } = req.query;
const whereClause = { userId: global.user_id };

if (isCompleted !== undefined) {
  whereClause.isCompleted = isCompleted === 'true';
}
```

Note: We check `isCompleted !== undefined` because the query parameter might be missing entirely. When present, we convert the string `'true'` to boolean `true`.

#### 3. Filter by Minimum Date (`min_date` parameter)

Filter tasks created on or after a specific date.

**Example URL:** `GET /api/tasks?min_date=2024-01-01`

Returns tasks created on or after January 1, 2024.

**Code Implementation:**
```javascript
const { min_date } = req.query;
const whereClause = { userId: global.user_id };

if (min_date) {
  whereClause.createdAt = {
    gte: new Date(min_date)  // Greater than or equal to
  };
}
```

The `gte` operator means "greater than or equal to", so it includes tasks created on the specified date and all dates after.

#### 4. Filter by Maximum Date (`max_date` parameter)

Filter tasks created on or before a specific date.

**Example URL:** `GET /api/tasks?max_date=2024-12-31`

Returns tasks created on or before December 31, 2024.

**Code Implementation:**
```javascript
const { max_date } = req.query;
const whereClause = { userId: global.user_id };

if (max_date) {
  whereClause.createdAt = {
    lte: new Date(max_date)  // Less than or equal to
  };
}
```

The `lte` operator means "less than or equal to", so it includes tasks created on the specified date and all dates before.

#### 5. Combining Multiple Filters

You can combine multiple filters together by building the `whereClause` incrementally. All filters are combined with AND logic.

**Example URL:** `GET /api/tasks?find=project&isCompleted=false&min_date=2024-01-01`

This returns incomplete tasks with "project" in the title, created after January 1, 2024.

**Implementation Idea:**
Start with a base `whereClause` and add each filter conditionally. Each filter checks if its query parameter exists, and if so, adds the appropriate condition to the `whereClause`. When you use the `whereClause` in your `findMany()` query, Prisma automatically combines all conditions with AND logic.

**Note:** When combining `min_date` and `max_date`, you need to merge them into a single `createdAt` object with both `gte` and `lte` properties, rather than overwriting one with the other.

**Filtering Benefits:**
- **Flexibility**: Users can filter data based on their needs
- **Performance**: Database does the filtering efficiently
- **User Experience**: Users see only relevant data
- **Composability**: Multiple filters can be combined

### d. Query Optimization

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

## **7. Advanced Error Handling**

### a. Prisma Error Codes

As you learned in Lesson 6, Prisma provides specific error codes for different scenarios. In this section, we'll explore how to handle these errors in more advanced contexts:

**Common Error Codes:**
- **`P2002`**: Unique constraint violation (duplicate email) → Return 400 Bad Request
- **`P2025`**: Record not found → Return 404 Not Found
- **`P2003`**: Foreign key constraint violation → Return 400 Bad Request
- **`P2014`**: Invalid relation → Return 400 Bad Request

The `P2025` only occurs for the following operations: `update()`, `delete()`, `findUniqueOrThrow()`, `findFirstOrThrow()`.  For a `findMany()` an empty array is returned if no entry is found.  For a `findUnique()`, a null value is returned if no entry is found.

### b. Implementing Error Handling

```javascript
try {
  const user = await prisma.user.create({
    data: { email, name, hashedPassword }
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
  
  console.error('Prisma error:', error);
  res.status(500).json({ 
    error: "Internal server error" 
  });
}
```

### c. Error Handling in Context

```javascript
let updatedTask = null;
try {
  updatedTask = await prisma.task.update({
    where: { 
      id: parseInt(taskId),
      userId: req.userId
    },
    data: { title: newTitle }
  });
} catch (err) {
  if (err.code === "P2025") {
    return res.status(404).json({ message: "The task was not found." });
  } else {
    return next(err); // if inside of a controller
  }
}
// ... it succeeded!
```
As previously mentioned, not all errors should be handled in the context of the controllers.  That would be redundant.  Some the errors should be handled in context, though.  For example, if a user is registering, and the `P2002` error occurs, that is best handled in context, so that good feedback can be returned to the caller.

### d. Error Handling in Analytics Controllers

When building analytics endpoints, ensure proper error handling for all operations:

```javascript
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
      by: ['isCompleted'],
      where: { userId },
      _count: { id: true }
    });

    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate weekly progress using groupBy
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyProgress = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo }
      },
      _count: { id: true }
    });

    res.status(200).json({
      taskStats,
      recentTasks,
      weeklyProgress
    });
    return;
  } catch (err) {
    // Handle errors appropriately
    if (next && typeof next === 'function') {
      return next(err);
    }
    // If next is not provided (like in tests), send error response directly
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error", 
        message: err.message 
      });
    }
  }
};
```
---

## **8. Setting Up Routes**

### a. Creating Route Files

When implementing advanced Prisma features, you'll need to create route files to expose your endpoints. Here's how to set up routes for analytics and bulk operations:

#### Creating Analytics Routes

Create a new file `routes/analyticsRoutes.js`:

```javascript
const express = require("express");
const router = express.Router();
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

// GET /api/analytics/users/:id - User productivity analytics
router.get("/users/:id", getUserAnalytics);

// GET /api/analytics/users - Users with task statistics and pagination
router.get("/users", getUsersWithStats);

// GET /api/analytics/tasks/search - Task search with raw SQL
router.get("/tasks/search", searchTasks);

module.exports = router;
```

#### Adding Bulk Endpoint to Task Routes

Update your existing `routes/taskRoutes.js` to include the bulk create endpoint:

```javascript
const express = require("express");
const router = express.Router();
const {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkCreate,  // Add this import
} = require("../controllers/taskController");

router.get("/", index);
router.get("/:id", show);
router.post("/", create);
router.post("/bulk", bulkCreate);  // Add this route - must come before /:id
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;
```

**Important:** The `/bulk` route must be defined before `/:id` because Express matches routes in order. If `/:id` comes first, it will match `/bulk` as an ID parameter.

### b. Wiring Routes in app.js

Update your main `app.js` file to include the new routes:

```javascript
const express = require("express");
const prisma = require("./db/prisma");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");  // Add this
const authMiddleware = require("./middleware/auth");
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/analytics", authMiddleware, analyticsRoutes);  // Add this

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ 
      status: "error", 
      db: "not connected", 
      error: err.message 
    });
  }
});

app.use(notFound);
app.use(errorHandler);

// ... rest of server setup
```

### c. Route Structure Summary

Your complete route structure should look like this:

```
/api/users
  POST /register          - User registration with welcome tasks (transaction)
  POST /login            - User login
  POST /logoff           - User logoff

/api/tasks (requires auth)
  GET  /                 - List tasks with pagination and eager loading
  GET  /:id              - Show task with user info (eager loading)
  POST /                 - Create single task
  POST /bulk             - Bulk create tasks (createMany)
  PATCH /:id             - Update task
  DELETE /:id            - Delete task

/api/analytics (requires auth)
  GET  /users/:id        - User analytics with groupBy operations
  GET  /users            - Users with stats and pagination
  GET  /tasks/search     - Task search with raw SQL
```

**Note:** All `/api/tasks` and `/api/analytics` routes require authentication middleware, which sets `global.user_id` for session management.

---

### Key Benefits of Advanced Prisma Features
- **Performance**: Fewer database queries and optimized operations
- **Data Consistency**: Transactions ensure atomic operations
- **Security**: Parameterized queries prevent SQL injection
- **Flexibility**: Raw SQL when needed, Prisma methods when possible
- **Maintainability**: Clear error handling and consistent patterns

### Next Steps
1. **Complete Assignment 7** following this lesson
2. **Test your advanced Prisma features** thoroughly
3. **Explore Prisma documentation** for more advanced usage
---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Query Examples](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)

---

## Getting Help

- Use Prisma Studio to visualize your database
- Enable query logging to see generated SQL
- Check the Prisma error codes for specific problems
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts


