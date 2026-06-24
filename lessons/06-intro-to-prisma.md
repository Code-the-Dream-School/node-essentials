# **Lesson 6 — Using an Object Relational Mapping**

## **Lesson Overview**

You have learned how to use SQL for CRUD operations in your app. Many real applications still use SQL databases, but the application code does not always write SQL directly.

In this lesson, you will learn about an Object-Relational Mapper, or ORM. An ORM lets your Node code work with database records through JavaScript methods. You will use Prisma as the ORM. This lesson explains why Prisma can speed up development, what its limits are, and how you will start converting your app from `pg` queries to Prisma calls.

## **Learning Objectives**

By the end of this lesson, you should understand:
- What object-relational mappings (ORMs) are
- Why ORMs are used
- Characteristics of the Prisma ORM
- How to set up Prisma in your project
- How to use Prisma to manage the schema
- Prisma for CRUD operations: How to replace your SQL with Prisma calls
- Compare ORM vs. raw SQL approaches for database operations

**Topics:**

1. What is an ORM, and why are they used?
2. Characteristics of the Prisma ORM
3. Workflow for adding Prisma support to your app
4. Managing the database schema with Prisma
5. Error handling with Prisma
6. Prisma methods for database operations
7. Testing and debugging

## **1. What Is an ORM, and Why Is It Used?**

SQL is powerful, but it can be verbose. In JavaScript, you are used to working with objects. You can pass objects into functions, read their properties, and update their values.

An ORM lets you work with database entries in a way that feels closer to working with JavaScript objects. Instead of writing a SQL statement for every operation, you call methods provided by the ORM. Your editor can also help with autocomplete and other development support.

ORMs have some important advantages:

1. You have learned the `pg` package, but `pg` only talks to PostgreSQL. If you later move to MySQL, or even MongoDB, you would normally need to learn a different package and syntax. An ORM can handle many of those differences for you, so the application code may need fewer changes. Converting from SQL to MongoDB is not completely transparent, but Prisma supports both.

2. Database schema management is complicated, especially on team projects. As you add or modify tables, you need to track which changes have been applied to production, testing, and development databases. Without help, you often need custom SQL scripts and a separate record of what has already run. An ORM can manage much of this for you.

3. Prisma has special advantages in a TypeScript environment. This class does not use TypeScript, but Prisma can provide strong typing and type safety when TypeScript is used.

4. Much of SQL's power is available through the ORM. You can do many of the same operations without giving up performance for common use cases.

There are also tradeoffs:

1. The ORM hides the actual SQL queries being executed in the database. Since that work happens behind the scenes, it can be harder to monitor, optimize, or debug the SQL itself.

2. Sometimes the ORM cannot express the SQL you want. Prisma gives you an escape route: you can run raw SQL, similar to using `pg`. This is why you still need to understand SQL.

## **2. Characteristics of the Prisma ORM**

Prisma:
- has a clear way to manage schema.
- has good support for most SQL operations: SELECT, INSERT, UPDATE, DELETE, transactions, GROUP BY, aggregation, HAVING.
- supports relationships (associations) between tables.
- does not like to do joins. This is a side effect of the type safety focus.
- has significant limitations for GROUP BY and HAVING support.
- will not do subqueries.

Another popular Node ORM is Sequelize. We could have used it, but it is harder to learn, and schema management with Sequelize requires an additional package. For this course, Prisma gives you a smoother transition from `pg`.

### **How it Works**

Instead of writing:
```js
const results = await pool.query(`SELECT * FROM users WHERE email = 'john@example.com'`);
```

You write:
```javascript
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' }
});
```

Prisma makes the SQL call internally. If you are using PostgreSQL, Prisma uses the `pg` package and a `pg` pool behind the scenes.

Prisma consists of three main tools:

1. **Prisma Schema**: A declarative way to define your database structure
2. **Prisma Client**: An auto-generated, type-safe database client
3. **Prisma Migrate**: Database migration and schema management

## **3. Workflow for adding Prisma support to your app**

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

## **4. Managing the database schema with Prisma**

### **Elements of the Prisma Schema**

**Models**

Models represent your database tables in the Prisma schema.

```prisma
model Task {
  id           Int      @id @default(autoincrement())
  title        String   @db.VarChar(255)
  isCompleted Boolean  @default(false) @map("is_completed")
  userId      Int @map("user_id")
  createdAt   DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  users        users    @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([id, userId], map: "task_id_user_id_unique")
  @@map("tasks")
}

model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique @db.VarChar(255)
  name            String   @db.VarChar(30)
  hashedPassword String   @db.VarChar(255) @map("hashed_password")
  createdAt      DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  tasks           tasks[]

  @@map("users")
}
```

Each model has a name, a collection of fields, and possibly one or more indexes. It may also have a `@@map` clause. By convention, the model name is capitalized and singular. Since database table names are often lowercase and plural, the `@@map` clause maps the Prisma model name to the database table name.

The `@@unique` line declares an index. It says that `id` and `userId` together form a unique composite key.

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

### **The Prisma Schema and the Database Schema**

The Prisma schema describes the database schema. There are two cases to consider:

1. **Introspection** There is already a database schema. For Prisma Client to work with that database, Prisma needs a schema file that matches it. Prisma can read the existing database schema and create a Prisma schema from it. The existing data is preserved.

**Benefits of Introspection:**
- **No Data Loss**: Your existing data remains intact
- **Accurate Mapping**: Automatically detects table structures
- **Time Saving**: No need to manually write the schema
- **Error Prevention**: Eliminates manual mapping mistakes

**Downsides of Introspection:**
- **Schema Management is in SQL**
- **Schema Evolution is difficult for a team project**
- **Schema Management is difficult in production**

2. **Migration** If there is no existing database schema, you can write Prisma schema definitions by hand, like the examples above. Prisma can then use those definitions to create tables with the matching columns, constraints, and indexes. This process is called **migration**. If there is existing data, it can be preserved.

In the assignment, you will do each of these.

After the Prisma and database schemas exist, you may need to change them. For example, you might add a table or add/remove columns. In that case, you change the Prisma schema and run migration again. Every Prisma schema change requires another migration. Since the Prisma schema is just a file, it can be shared through GitHub and used during production deployment.

## **5. Error Handling with Prisma**

### **Prisma Error Types**

Prisma provides specific error codes for different situations:

**Common Error Codes:**
- **`P2002`**: Unique constraint violation (duplicate email) → Return 400 Bad Request
- **`P2025`**: Record not found → Return 404 Not Found
- **`P2003`**: Foreign key constraint violation → Return 400 Bad Request
- **`P2014`**: Invalid relation → Return 400 Bad Request

The `P2025` error only occurs for these operations: `update()`, `delete()`, `findUniqueOrThrow()`, and `findFirstOrThrow()`. For `findMany()`, Prisma returns an empty array if no records are found. For `findUnique()`, Prisma returns `null` if no record is found.

### Implementing Error Handling

The code below is an example. In most controllers, you will catch only the errors that need a specific response. Most unexpected errors should fall through to your global error handler.


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

Prisma throws a `PrismaClientInitializationError` when it cannot connect to the database. This commonly happens when the database server is not running. You can handle this in your error handler middleware:

```javascript
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.message);
  
  // Handle database connection failures
  if (err.name === "PrismaClientInitializationError") {
    console.log("Couldn't connect to the database. Is it running?");
  }
  console.error(err.constructor.name, err.message);
  console.error(err.stack); // these two lines can identify problems in your code

  // Default error response
  res.status(500).json({ error: "Internal server error" });
});
```

**Benefits:**
- Provides clear operational feedback when the database is unavailable
- Improves debugging
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
    return res.status(404).json({ message: "The entry was not found." });
  } else {
    return next(err); // if inside of a controller
  }
}
else ... // it succeeded!
```

As mentioned above, not all errors should be handled inside controllers. That would be repetitive. Some errors should be handled in context, though. For example, if a user is registering and the `P2002` error occurs, the controller should handle it so the caller gets useful feedback.

---

## 6. Performance and Best Practices

### Connection Management

All connection management in your app should be centralized, just as it was with the `pg` package. You will create a shared module in your `db` folder to establish the client. Other modules will import that client. This helps you close all connections during server shutdown and keeps connection sharing efficient.

```javascript
const prisma = new PrismaClient();
```

You also add a statement to your shutdown procedure:

```js
// Handle graceful shutdown
  await prisma.$disconnect();
```
Specific instructions on the location of these lines will be given during your assignment.

**Important:** Always call `await prisma.$disconnect()` when shutting down your application or in tests to close database connections cleanly and prevent connection leaks.

## **7. Prisma Methods for Database Operations**

In your assignment, you will replace `pg` queries with Prisma methods. This link shows the syntax for Prisma [CRUD operations](https://www.prisma.io/docs/orm/prisma-client/queries/crud). The rough match with SQL looks like this:

- INSERT: `prisma.model.create()`
- SELECT: `prisma.model.findMany()`, `prisma.model.findFirst()`, `prisma.model.findUnique()`, `prisma.model.groupBy`
- UPDATE: `prisma.model.update()`, `prisma.model.updateMany()`
- DELETE: `prisma.model.delete()`, `prisma.model.deleteMany()`

This is not a complete list. If the model is User, and it maps to a users table, you can do `prisma.user.create({data: {name: "Jack"}})` to create a record.

*Note: this example would not be schema-compliant.* Many Prisma methods have a `where` property to specify which records should be read, modified, or deleted. Methods that create or update records use a `data` property to specify the field names and values. When retrieving data, you can use `select` to choose the fields you want. Other options, such as `orderBy` and `groupBy`, correspond to SQL features you have already seen.

In your assignment, you will get specific guidance and examples for converting from `pg` to Prisma. Refer to the link above as needed.

All of these methods are asynchronous and return a promise. You must use `await` to get the return value.

### **Query Optimization**

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
// This only works if the schema specifies that emails are unique.

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

## **8. Testing and Debugging**

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

In this lesson, you learned:
- What ORMs are and why they are useful
- How Prisma works as a modern ORM for Node.js
- Prisma features such as relationships and transactions
- Best practices for performance and error handling

### Key Benefits of Prisma
- **Type Safety**: Catch errors at compile time
- **Developer Experience**: Better autocomplete and error messages
- **Maintainability**: Easier to refactor and modify
- **Performance**: Optimized queries and connection management
- **Relationships**: Simple handling of complex database relationships

### Next Steps
1. **Complete Assignment 6** following this lesson
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

**Remember:** This lesson builds on Lesson 5. Make sure you have a working PostgreSQL application before adding Prisma ORM.
