# Assignment 7: Advanced Prisma ORM Features

## Learning Objectives
- Implement eager loading to optimize database queries and eliminate N+1 problems
- Use groupBy operations for data aggregation and analytics
- Implement database transactions for data consistency
- Perform batch operations for better performance
- Use raw SQL with $queryRaw when needed
- Apply performance optimization techniques with pagination and selective field loading
- Implement proper error handling for advanced Prisma operations

## Assignment Overview
Building on your existing Prisma application from Assignment 6, you'll enhance it with advanced features learned in Lesson 7. You'll add analytics endpoints, implement complex queries, and optimize performance while maintaining the same API structure.

Be sure to create an assignment7 branch before you make any new changes. This branch should build on top of assignment6, so you create the assignment7 branch when assignment6 is the active branch.

**Prologue:**
Right now you are using basic Prisma ORM operations from Assignment 6 for CRUD functionality. For this assignment, you want to add advanced Prisma features including eager loading with `include`, `groupBy` operations for analytics, database transactions, batch operations, raw SQL queries, pagination, and selective field loading. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

## Prerequisites
- Completed Assignment 6 with a working Prisma application
- PostgreSQL database with users and tasks tables
- Basic understanding of Prisma ORM operations
- **Important**: You will need to add a `priority` field to your Task model for this assignment

---

## Assignment Tasks

### 1. Add Priority Field to Schema

#### a. Update Prisma Schema

You need to add a `priority` field to your Task model. Open your `prisma/schema.prisma` file and update the Task model:

```prisma
model Task {
  id           Int      @id @default(autoincrement())
  title        String   @db.VarChar(255)
  isCompleted Boolean  @default(false) @map("is_completed")
  priority    String   @default("medium") @db.VarChar(10) // Add this line
  userId      Int       @map("user_id")
  createdAt   DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  User        User     @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  @@unique([id, userId])
  @@map("tasks")
}
```

#### b. Run Migration

After updating the schema, you need to create and apply a migration:

```bash
npx prisma migrate dev --name add_priority_field
```

Then apply the migration to your test database:

```bash
DATABASE_URL=<TEST_DATABASE_URL> npx prisma migrate deploy
```

**Important:** You must run `npx prisma migrate dev --name <someMigrationName>` every time you modify your Prisma schema file. The generated client needs to be updated to reflect any changes to your models, fields, or relationships. Every time you do a migration for the development database, you do it for the test database as well, with the command above.

**Note:** After adding the priority field, make sure your task creation method in `taskController.js` includes `priority` in the `select` statement. The test expects tasks to have a `priority` field that defaults to "medium" if not specified. Your taskSchema validation should already handle this (it should have `priority: Joi.string().valid("low", "medium", "high").default("medium")`).

### 2. Implement Eager Loading with Include

#### a. Update Task Index Method

You need to update your existing task index method to use eager loading. In your `taskController.js`, find the method that lists tasks and update it to include user information.

**What is eager loading?** Instead of making separate queries for each task's user, you fetch everything in one query using `select` with nested relations.


```js
const tasks = await prisma.task.findMany({
  where: {
    userId: global.user_id, // using global.user_id from auth
  },
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

**Key points:**
- Use `select` (not `include`) when you want to specify exactly which fields to return
- The `User` object is nested inside `select` because it's a relation
- This fetches user information in the same query, eliminating the N+1 problem
- The test expects tasks to have a `User` property with `name` and `email`

#### b. Optional: Add User Show Method

**Note:** This is completely optional and not required. There was no user show method in Assignment 6, and `assignment7.test.js` does not test for it. The test file only imports `login`, `register`, and `logoff` from `userController` (line 16), and there are no tests that call a user show method. However, if you want to practice eager loading with user-to-task relationships, you can optionally add this method as an extra exercise.

If you choose to implement it, create a user show method that includes tasks using eager loading. You want to include incomplete tasks, limit to 5, and order by creation date descending:

```js
// In userController.js (if you have a show method)
exports.show = async (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: { 
          id: true, 
          title: true, 
          priority: true,
          createdAt: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};
```

### 3. Implement GroupBy Operations

#### a. Create Analytics Controller

Create a new file `controllers/analyticsController.js`. You need to require prisma at the top, similar to how you did it in your other controllers in Assignment 6:

```js
const prisma = require("../db/prisma");
```

#### b. User Productivity Analytics Endpoint

Create a method for `GET /api/analytics/users/:id` that provides comprehensive user statistics. You need to:

1. Parse and validate the user ID from req.params (check if it's a valid number)
2. Use `groupBy` to count tasks by completion status (group by `isCompleted`, use `_count` with `id: true`)
3. Use `findMany` with eager loading to get recent tasks (last 10, ordered by createdAt descending) with user information
4. Use `groupBy` to calculate weekly progress (tasks created in the last 7 days, grouped by createdAt)

**What is groupBy?** `groupBy` lets you count or aggregate data by specific fields. For example, you can count how many tasks are completed vs incomplete.

**Important points:**
- The test expects `taskStats` to be an array with `isCompleted` and `_count` properties
- The test expects `recentTasks` to include user information (name)
- The test expects `weeklyProgress` to be an array of groupBy results
- For weekly progress, calculate a date 7 days ago using JavaScript's `Date` object

```js
// Parse and validate user ID
const userId = parseInt(req.params.id);
if (isNaN(userId)) {
  // ... handle invalid ID
}

// Use groupBy to count tasks by completion status
const taskStats = await prisma.task.groupBy({
  by: ['isCompleted'],
  where: { userId },
  _count: {
    id: true
  }
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
// First, calculate the date from one week ago
// Hint: Use new Date() and setDate() to subtract 7 days
const oneWeekAgo = // ... you need to calculate this

// Then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
const weeklyProgress = await prisma.task.groupBy({
  by: ['createdAt'],
  where: {
    userId,
    createdAt: { gte: oneWeekAgo }
  },
  _count: { id: true }
});

// Return response with taskStats, recentTasks, and weeklyProgress
res.status(200).json({
  // ... you need to return the three properties
});
return;
```

**What to return:**
- `taskStats`: Array of groupBy results with `isCompleted` and `_count`
- `recentTasks`: Array of task objects with user information
- `weeklyProgress`: Array of groupBy results showing tasks created per day in the last week

**Expected Response:**
```json
{
  "taskStats": [
    { "isCompleted": false, "_count": { "id": 5 } },
    { "isCompleted": true, "_count": { "id": 12 } }
  ],
  "recentTasks": [
    {
      "id": 1,
      "title": "Recent task",
      "isCompleted": false,
      "priority": "medium",
      "createdAt": "2024-01-15T10:30:00Z",
      "userId": 1,
      "User": { "name": "John Doe" }
    }
  ],
  "weeklyProgress": [
    { "createdAt": "2024-01-15", "_count": { "id": 3 } },
    { "createdAt": "2024-01-22", "_count": { "id": 5 } }
  ]
}
```

#### c. User List with Task Counts

Create a method for `GET /api/analytics/users` that shows all users with their task statistics. You need to:

1. Parse pagination parameters from query (page, limit) - default to page 1 and limit 10
2. Use `findMany` with `include` to get users, including `_count` for tasks and incomplete tasks (limit to 5)
3. Use `skip` and `take` for pagination
4. Get total count using `count()` for pagination metadata
5. Return users and pagination information

**Important points:**
- The test expects `users` array and `pagination` object in the response
- The test expects each user to have `_count.Task` property
- You need to use `include` for relations when using `_count`, then transform the result
- For pagination, the test expects `page`, `limit`, `total`, `pages`, `hasNext`, `hasPrev`


```js
// Parse pagination parameters (similar to how you did in the task index method above)
// Hint: Parse page and limit from req.query, calculate skip

// Get users with task counts using _count aggregation
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

// Get total count for pagination
const totalUsers = await prisma.user.count();

// Build pagination object with page, limit, total, pages, hasNext, hasPrev
// Hint: Use Math.ceil() for pages, compare page * limit with total for hasNext
const pagination = // ... you need to build this object

// Return users and pagination
res.status(200).json({
  // ... you need to return users and pagination
});
```

**Expected Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "_count": { "Task": 8 },
      "Task": [
        {
          "id": 3
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 4. Implement Database Transactions

#### a. Enhance User Registration with Welcome Tasks

You need to update your user registration method in `userController.js` to create initial tasks automatically using a transaction. As you did in Assignment 6, you'll need to do the Joi validation and hash the password first. Then:

1. Use `prisma.$transaction()` to wrap both user creation and task creation
2. Inside the transaction, create the user account (similar to how you did it in Assignment 6, but now using `tx` instead of `prisma`)
3. Create 3 welcome tasks with these **exact titles and priorities**:
   - "Complete your profile" (priority: "medium")
   - "Add your first task" (priority: "high")
   - "Explore the app" (priority: "low")
   Use `createMany` to create all three at once
4. Fetch the created tasks to return them (query by userId and task titles)
5. If transaction succeeds, set global.user_id and return the user with welcome tasks **and `transactionStatus: "success"`**
6. Handle P2002 errors (duplicate email) appropriately, as you did in Assignment 6

```js
// In your register method, after validation and password hashing:
// Do the Joi validation, so that value contains the user entry you want.
// hash the password, and put it in value.hashedPassword
// delete value.password as that doesn't get stored
try {
  const result = await prisma.$transaction(async (tx) => {
    // Create user account (similar to Assignment 6, but using tx instead of prisma)
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

    return { user: newUser, welcomeTasks };
  });

  // Store the user ID globally for session management (not secure for production)
  global.user_id = result.user.id;
  
  // Send response with status 201
  res.status(201);
  res.json({
    user: result.user,
    welcomeTasks: result.welcomeTasks,
    transactionStatus: "success"
  });
  return;
} catch (err) {
  if (err.code === "P2002") {
    // send the appropriate error back -- the email was already registered
    return res.status(400).json({ error: "Email already registered" });
  } else {
    return next(err); // the error handler takes care of other errors
  }
}
```

**Expected Response:**
```json
{
  "user": {
    "id": 5,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "createdAt": "2024-01-15T16:00:00Z"
  },
  "welcomeTasks": [
    {
      "id": 20,
      "title": "Complete your profile",
      "isCompleted": false,
      "userId": 5
    },
    {
      "id": 21,
      "title": "Add your first task",
      "isCompleted": false,
      "userId": 5
    },
    {
      "id": 22,
      "title": "Explore the app",
      "isCompleted": false,
      "userId": 5
    }
  ],
  "transactionStatus": "success"
}
```

#### b. Implement Bulk Task Operations

Add a method to your `taskController.js` for `POST /api/tasks/bulk`. You need to:


**What is bulk create?** Instead of creating tasks one at a time, you can create multiple tasks in a single database operation using `createMany`. 

**Important points:**
- The test expects the request body to have a `tasks` array
- The test expects `tasksCreated` and `totalRequested` in the response
- The test expects status 201 on success, 400 for invalid data
- You must validate each task using your taskSchema before inserting

```js
// Validate the tasks array
if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
  return res.status(400).json({ 
    error: "Invalid request data. Expected an array of tasks." 
  });
}

// Map tasks to include userId and set defaults
const validTasks = tasks.map(task => ({
  title: task.title,
  isCompleted: task.isCompleted || false,
  priority: task.priority || 'medium',
  userId: userId
}));

// Use createMany for batch insertion
const result = await prisma.task.createMany({
  data: validTasks,
  skipDuplicates: false
});

// Return success message with counts
// Hint: The test expects message, tasksCreated, and totalRequested
res.status(201).json({
  // ... you need to return the response object
});
```

**Expected Response:**
```json
{
  "message": "Bulk task creation successful",
  "tasksCreated": 8,
  "totalRequested": 8
}
```

### 5. Implement Raw SQL with $queryRaw

#### a. Task Search with Raw SQL

Add a method to your `analyticsController.js` for `GET /api/analytics/tasks/search`. You need to:

1. Get search query from req.query (parameter `q`) and validate it (must be at least 2 characters)
2. Get limit from query (default to 20 if not provided)
3. Use `prisma.$queryRaw` with template literals for parameterized queries (never concatenate user input!)
4. Write a SQL query that:
   - Joins tasks and users tables
   - Searches in task titles and user names using ILIKE
   - Orders by relevance (exact matches first, then prefix matches, then contains)
   - Limits results
5. Return results with `results` array, `query` string, and `count` number

**Why use raw SQL?** Prisma's query builder can't express complex text search with relevance ranking, so we use `$queryRaw` for this.

**Important points:**
- The test expects query parameter `q` (at least 2 characters)
- The test expects `results`, `query`, and `count` in the response
- The test expects status 400 if query is too short (< 2 characters)
- Always use parameterized queries (template literals) to prevent SQL injection
- Use PostgreSQL column names in SQL but alias them to camelCase

```js
// Validate search query
if (!searchQuery || searchQuery.trim().length < 2) {
  return res.status(400).json({ 
    error: "Search query must be at least 2 characters long" 
  });
}

// Get limit from query (default to 20)
const limit = //...parse from req.query

// Construct search patterns outside the query for proper parameterization
const searchPattern = `%${searchQuery}%`;
const exactMatch = searchQuery;
const startsWith = `${searchQuery}%`;

// Use raw SQL for complex text search with parameterized queries
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

// Return results with query and count
// Hint: The test expects results array, query string, and count number
res.status(200).json({
  // ... you need to return the response object
});
```

**Expected Response:**
```json
{
  "results": [
    {
      "id": 5,
      "title": "Learn Prisma Advanced Features",
      "isCompleted": false,
      "createdAt": "2024-01-15T14:20:00Z",
      "priority": "high",
      "userId": 1,
      "user_name": "John Doe"
    }
  ],
  "query": "Prisma",
  "count": 1
}
```

**Important:** Notice how we use template literals with `$queryRaw` to ensure parameterized queries. This prevents SQL injection attacks. Never concatenate user input directly into SQL strings.

### 6. Implement Pagination

#### a. Add Pagination to Task Index

Update your task index method to support pagination. You need to:

1. Parse page and limit from query parameters (default to 1 and 10)
2. Calculate skip value for pagination (skip = (page - 1) * limit)
3. Use `skip` and `take` in your `findMany` query
4. Get total count using `count()` for pagination metadata
5. Build pagination object with `page`, `limit`, `total`, `pages`, `hasNext`, `hasPrev`
6. Return tasks and pagination information

**What is pagination?** Instead of loading all tasks at once, pagination lets you load them in smaller chunks (pages). This improves performance and user experience.

**Important points:**
- The test expects `tasks` array and `pagination` object in the response
- The test expects pagination to have: `page`, `limit`, `total`, `pages`, `hasNext`, `hasPrev`
- Keep the eager loading you added earlier (User information with name and email)
- Default to page 1 and limit 10 if not provided

**Here's the complete implementation:**
```js
// Parse pagination parameters
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

// Get tasks with pagination and eager loading
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
  skip: skip,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// Get total count for pagination metadata
const totalTasks = await prisma.task.count({
  where: { userId: global.user_id }
});

// Build pagination object with complete metadata
// Hint: The test expects page, limit, total, pages, hasNext, hasPrev
// Use Math.ceil() to calculate pages, and compare page * limit with total for hasNext
const pagination = {
  // ... you need to build this object
};

// Return tasks with pagination information
res.status(200).json({
  // ... you need to return tasks and pagination
});
```

**Expected Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Sample Task",
      "isCompleted": false,
      "priority": "medium",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 48,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 7. Implement Selective Field Loading

#### a. Update User Methods to Exclude Sensitive Data

As you did in Assignment 6, make sure all user-related endpoints use `select` to exclude the `hashedPassword` field. Update your user methods to always use `select`, similar to how you did it in Assignment 6:

```js
// In userController.js, update methods to always use select:
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    createdAt: true
    // hashedPassword is excluded
  }
});
```

#### b. Add Fields Query Parameter Support (Optional)

You can enhance endpoints to allow clients to specify which fields they need. This is optional, but if you want to implement it, parse the fields query parameter and build the select object dynamically.

### 8. Enhanced Error Handling

#### a. Update Error Handling in Controllers

As you did in Assignment 6, make sure you're catching Prisma-specific error codes appropriately. For update and delete operations, catch P2025 errors, similar to how you handled them in Assignment 6:

```js
try {
  const task = await prisma.task.update({
    where: {
      id: parseInt(req.params.id),
      userId: req.userId
    },
    data: value,
    select: { title: true, isCompleted: true, id: true, priority: true }
  });
  res.json(task);
} catch (err) {
  if (err.code === "P2025") {
    return res.status(404).json({ message: "The task was not found." });
  } else {
    return next(err); // pass other errors to the global error handler
  }
}
```

#### b. Input Validation

Add validation for pagination and search parameters. Validate that page is >= 1 and limit is between 1 and 100. You can use Joi validation similar to how you did it in Assignment 6, or simple checks.

### 9. Create Routes

#### a. Create Analytics Routes

Create `routes/analyticsRoutes.js` with routes for:
- `GET /users/:id` - user analytics
- `GET /users` - users with stats
- `GET /tasks/search` - task search

#### b. Update Task Routes

Add the bulk endpoint to `routes/taskRoutes.js`:
- `POST /bulk` - bulk task creation

#### c. Update app.js

Add the analytics routes to `app.js` using the auth middleware.

### 10. Testing Your Advanced Prisma Features

Test using Postman. Everything should still work -- your existing endpoints from Assignment 6 should continue to function, but now with enhanced functionality:

- Analytics endpoints with groupBy operations
- User registration with welcome tasks (transaction)
- Bulk task creation
- Task search with raw SQL
- Pagination on list endpoints
- Selective field loading

Make sure all operations work as before. They are:

- register (now with welcome tasks)
- logon
- create task
- show task
- list tasks (now with pagination)
- update task
- delete task
- logoff
- health check
- new analytics endpoints

As you did for Assignment 6, conduct a test to verify that one user can't read, modify, or delete another's tasks.

Then, run `npm tdd assignment7` and make sure it completes without test failure.

#### a. Database Testing

**Requirements:**
- Verify transactions work correctly (rollback on failure)
- Test groupBy operations with various data sets
- Verify eager loading eliminates N+1 queries
- Test pagination with edge cases (empty results, invalid page numbers)
- Test raw SQL queries with various search terms

#### b. API Testing

Test your endpoints using Postman or curl:

**Required Tests:**
- All analytics endpoints with different user IDs
- User registration with welcome tasks creation
- Bulk task operations with various array sizes
- Task search with different query terms
- Pagination with different page and limit values
- Error handling scenarios

---

## Implementation Guidelines

### File Structure
Your enhanced application should maintain the same structure as Assignment 6, with these additions:

```
project/
├── controllers/
│   ├── userController.js (enhanced with transactions)
│   ├── taskController.js (enhanced with pagination and bulk operations)
│   └── analyticsController.js (new)
├── routes/
│   ├── userRoutes.js (no changes needed)
│   ├── taskRoutes.js (enhanced with bulk endpoint)
│   └── analyticsRoutes.js (new)
├── prisma/
│   ├── schema.prisma (updated with priority field)
│   └── migrations/ (new migration files)
├── db/
│   └── prisma.js (no changes needed)
├── middleware (No changes needed)
├── app.js (enhanced with analytics routes)
├── .env 
└── package.json
```

### Code Quality Requirements
- Use async/await consistently
- Implement proper Prisma error handling
- Use Prisma Client methods instead of raw SQL where possible
- Use raw SQL only when necessary (complex searches, joins)
- Maintain existing validation and security
- Follow consistent naming conventions
- Use transactions for operations that must be atomic
- Always use parameterized queries with $queryRaw

### Testing Requirements
Test all new endpoints with Postman or curl:

1. **Analytics Endpoints:**
   - Test `GET /api/analytics/users/:id` with existing users and tasks
   - Test `GET /api/analytics/users` with pagination
   - Test `GET /api/analytics/tasks/search` with search queries
   - Verify aggregation calculations
   - Test with empty data sets

2. **Transactions:**
   - Test `POST /api/users/register` with welcome tasks creation
   - Test `POST /api/tasks/bulk` with bulk task creation
   - Test failure scenarios (verify rollback)
   - Test concurrent operations

3. **Pagination:**
   - Test with different page and limit values
   - Test edge cases (invalid page numbers, empty results)
   - Verify pagination metadata is correct

4. **Performance:**
   - Verify eager loading reduces query count
   - Test with larger datasets
   - Verify field selection works correctly

---

## Submission Requirements

### Code Submission
- All enhanced files with new functionality
- Updated Prisma schema with priority field
- New migration files
- Environment configuration
- Clear documentation of new endpoints

---

## Submission Instructions

### 1️⃣ Add, Commit, and Push Your Changes
Within your `node-homework` folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment7` branch.

```bash
git add .
git commit -m "Complete Assignment 7: Advanced Prisma ORM Features"
git push origin assignment7
```

### 2️⃣ Create a Pull Request
1. Log on to your GitHub account
2. Open your `node-homework` repository
3. Select your `assignment7` branch. It should be one or several commits ahead of your main branch
4. Create a pull request with a descriptive title like "Assignment 7: Advanced Prisma ORM Features"

### 3️⃣ Submit Your GitHub Link
Your browser now has the link to your pull request. Copy that link, to be included in your homework submission form.  Include also a link to the pull request for assignment 6.

**Important:** Make sure your pull request includes:
- All the modified files with advanced Prisma features
- Updated Prisma schema with priority field
- New analytics endpoints and advanced query implementations
- Transaction handling and performance optimizations
- Proper error handling and validation
- All endpoints tested and working with Postman or curl
- Successful implementation of eager loading, groupBy, transactions, batch operations, raw SQL, pagination, and selective field loading

---

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Short demos based on Lesson 7:

1. **How do you use Prisma's advanced querying features for analytics and reporting?**
   - Show your analytics controller and explain `groupBy` operations
   - Walk through a complex query that uses filtering and sorting
   - Show how you use `_count` aggregations for user statistics
   - Demonstrate eager loading with `include`

2. **What are database transactions and how do you implement them with Prisma?**
   - Explain why transactions are important for data consistency
   - Demonstrate your user registration with welcome tasks
   - Show what happens when a transaction fails (rollback)
   - Walk through your bulk operations using `createMany`

3. **When and how do you use raw SQL with Prisma's `$queryRaw`?**
   - Show your task search endpoint that uses raw SQL
   - Explain why you chose raw SQL over Prisma methods for this case
   - Demonstrate parameterized queries to prevent SQL injection
   - Show the difference between `$queryRaw` and `$queryRawUnsafe`

**Video Requirements**:
- Show actual code from your assignment
- Explain concepts clearly while demonstrating
- Keep demos focused and concise

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Query Examples](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

## Getting Help

- Review the lesson materials thoroughly
- Check your Prisma schema and database connection
- Use Prisma Studio to visualize your database
- Test each endpoint individually
- Use Prisma query logging to see generated SQL
- Ask for help if you get stuck on specific concepts

**Remember:** This assignment builds on Assignment 6. Make sure you have a working Prisma application from Assignment 6 before adding advanced features!
