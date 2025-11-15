## 4. Advanced Prisma Features

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

Prisma has other features.

- You can do "eager" load, which loads data from related tables for inclusion in the returned objects.
- You can group multiple operations within a single transaction, with a commit or rollback at the end.
- You can do queries with aggregation, as you would using GROUP BY, SUM, AVG, and so on in plain SQL.
- You can do the equivalent of a HAVING clause.

But, there are some things that Prisma doesn't enable, like subqueries.  When you find that Prisma won't do the SQL you want, you can send exactly the SQL you want using `prisma.$queryRaw()`.  Avoid this approach when you can, but sometimes it is necessary.