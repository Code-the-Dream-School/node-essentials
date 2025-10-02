# Assignment 7: Advanced Prisma ORM Features

## Learning Objectives
- Implement eager loading to optimize database queries and eliminate N+1 problems
- Use groupBy operations for data aggregation and analytics
- Implement database transactions for data consistency
- Perform batch operations for better performance
- Use advanced Prisma query patterns and filtering
- Implement raw SQL with $queryRaw when needed
- Apply performance optimization techniques

## Assignment Overview
Building on your existing Prisma application from Lesson 6b, you'll enhance it with advanced features learned in Lesson 7. You'll add analytics endpoints, implement complex queries, and optimize performance while maintaining the same API structure.

## Prerequisites
- Completed Lesson 6b with a working Prisma application
- PostgreSQL database with users and tasks tables
- Basic understanding of Prisma ORM operations
- **Important**: You will need to add a `priority` field to your Task model for this assignment

---

## Assignment Tasks

### 1. Enhanced Task Analytics API

#### a. User Productivity Analytics Endpoint
Create a new endpoint `GET /api/analytics/users/:id` that provides comprehensive user statistics:

**Requirements:**
- Use `groupBy` to count tasks by completion status
- Include recent task activity (last 10 tasks)
- Calculate weekly progress metrics
- Use eager loading to fetch related user data efficiently

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
      "user": { "name": "John Doe" }
    }
  ],
  "weeklyProgress": [
    { "createdAt": "2024-01-15", "_count": { "id": 3 } },
    { "createdAt": "2024-01-22", "_count": { "id": 5 } }
  ]
}
```

#### b. User List with Task Counts
Create `GET /api/analytics/users` endpoint that shows all users with their task statistics:

**Requirements:**
- Show all users with their total task counts
- Include pending (incomplete) tasks for each user (limit to 5 tasks per user)
- Use `_count` aggregation for efficient counting
- Implement pagination (limit to 10 users per page)
- Exclude sensitive information like passwords
- Include user creation date for sorting

**Expected Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "_count": { "tasks": 8 },
      "tasks": [
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

### 2. Advanced Query Implementation

#### a. Complex Task Filtering
Enhance your existing `GET /api/tasks` endpoint to support advanced filtering:

**New Query Parameters:**
- `status`: Filter by completion status
- `priority`: Filter by priority (required - add this field to your schema)
- `date_range`: Filter by creation date range
- `search`: Text search in task titles
- `sort_by`: Sort by different fields
- `sort_order`: Ascending or descending order

**Implementation Requirements:**
- Use Prisma's advanced `where` clauses with `AND`, `OR`, `NOT`
- Implement proper input validation
- Use `select` to limit returned fields for performance
- Add pagination support

**Expected Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Learn Prisma ORM",
      "isCompleted": false,
      "priority": "high",
      "createdAt": "2024-01-15T10:30:00Z",
      "userId": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### b. Task Search with Raw SQL
Create a new endpoint `GET /api/analytics/tasks/search` that uses `$queryRaw` for complex text search:

**Requirements:**
- Search across task titles and user names
- Use PostgreSQL's `ILIKE` for case-insensitive search
- Implement relevance scoring (exact matches first)
- Use parameterized queries to prevent SQL injection
- Include user information in results

**Example Query:**
```sql
SELECT t.*, u.name as user_name
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.title ILIKE $1 OR u.name ILIKE $1
ORDER BY 
  CASE WHEN t.title ILIKE $1 THEN 1 ELSE 2 END,
  t.created_at DESC
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

### 3. Database Transactions

#### a. User Registration with Welcome Tasks
Enhance your user registration to create initial tasks automatically:

**Requirements:**
- Use `$transaction` to ensure data consistency
- Create user account
- Create 3 welcome tasks (e.g., "Complete your profile", "Add your first task", "Explore the app")
- If any operation fails, rollback everything
- Return the created user with their welcome tasks

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

#### b. Bulk Task Operations
Implement `POST /api/tasks/bulk` for creating multiple tasks:

**Requirements:**
- Accept an array of task objects
- Use `createMany` for batch insertion
- Validate all tasks before insertion
- Return success count and any errors
- Use transactions if you need to ensure all-or-nothing behavior

**Expected Response:**
```json
{
  "message": "Bulk task creation successful",
  "tasksCreated": 8,
  "totalRequested": 8
}
```

### 4. Performance Optimization

#### a. Implement Pagination
Add pagination to all list endpoints:

**Requirements:**
- Use `take` and `skip` for offset-based pagination
- Add pagination metadata to responses
- Handle edge cases (invalid page numbers, empty results)

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Sample Task",
      "isCompleted": false
    }
  ],
  "pagination": {
    "currentPage": 2,
    "totalPages": 5,
    "totalItems": 48,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": true,
    "nextPage": 3,
    "previousPage": 1
  }
}
```

#### b. Selective Field Loading
Optimize your existing endpoints to load only necessary fields:

**Requirements:**
- Use `select` to exclude sensitive data (passwords)
- Implement different response schemas for different use cases
- Add a `fields` query parameter to let clients specify which fields they need
- Document the available field options

**Expected Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "_count": { "tasks": 8 }
    }
  ],
  "fieldsRequested": ["id", "name", "email", "taskCount"],
  "availableFields": ["id", "name", "email", "createdAt", "taskCount"]
}
```

### 5. Error Handling and Validation

#### a. Enhanced Error Handling
Improve error handling across your application:

**Requirements:**
- Handle Prisma-specific error codes (P2025, P2002, etc.)
- Provide meaningful error messages
- Implement proper HTTP status codes

#### b. Input Validation
Enhance your existing validation:

**Requirements:**
- Validate date ranges for analytics queries
- Sanitize search inputs
- Validate pagination parameters

---

## Implementation Guidelines

### File Structure
Your enhanced application should maintain the same structure as Lesson 6b, with these additions:

```
project/
├── controllers/
│   ├── userController.js (enhanced)
│   ├── taskController.js (enhanced)
│   └── analyticsController.js (new)
├── routes/
│   ├── userRoutes.js (enhanced)
│   ├── taskRoutes.js (enhanced)
│   └── analyticsRoutes.js (new)
├── prisma/
│   ├── schema.prisma (updated with priority field)
│   └── db.js
├── app.js (enhanced)
└── .env
```

### Code Quality Requirements
- Use async/await consistently
- Implement proper error handling
- Follow consistent naming conventions
- Use environment variables for configuration

### Testing Requirements
Test all new endpoints with Postman or similar tools:

1. **Analytics Endpoints:**
   - Test `GET /api/analytics/users/:id` with existing users and tasks
   - Test `GET /api/analytics/users` with pagination
   - Test `GET /api/analytics/tasks/search` with search queries
   - Verify aggregation calculations
   - Test with empty data sets

2. **Advanced Filtering:**
   - Test `GET /api/tasks` with all filter combinations (status, priority, date_range, search)
   - Verify pagination works correctly
   - Test edge cases (invalid parameters)
   - Test sorting by different fields

3. **Transactions:**
   - Test `POST /api/users/register` with welcome tasks creation
   - Test `POST /api/tasks/bulk` with bulk task creation
   - Test failure scenarios (verify rollback)
   - Test concurrent operations

4. **Performance:**
   - Test with datasets
   - Verify pagination performance
   - Test field selection with different field combinations

---

## Submission Requirements

### Code Submission
- All enhanced files with new functionality
- Updated Prisma schema (if you added new fields)
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
4. Create a pull request with a descriptive title like "Assignment 7: Advanced Prisma Features"

### 3️⃣ Submit Your GitHub Link
Your browser now has the link to your pull request. Copy that link, to be included in your homework submission form.

**Important:** Make sure your pull request includes:
- All the updated files from your existing Lesson 6b application
- New analytics endpoints and advanced query implementations
- Transaction handling and performance optimizations
- Proper error handling and validation
- All endpoints tested and working

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Query Examples](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

## Getting Help

- Review Lesson 7 materials thoroughly
- Check Prisma error codes in the documentation
- Use `console.log` and Prisma query logging for debugging
- Test queries incrementally before implementing full endpoints
- Ask for help if you're stuck on specific concepts

**Remember:** This assignment builds on your existing work from Lesson 6b. Focus on enhancing what you already have rather than rebuilding from scratch!
