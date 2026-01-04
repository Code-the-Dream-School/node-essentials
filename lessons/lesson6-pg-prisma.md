# **Lesson 6: Using an Object Relational Mapping**

## **Lesson Overview**

You have learned to use SQL for CRUD operations in your app.  Often, though, that's not how apps are built.  This lesson will describe an alternative. You use an SQL database, but you access the database with an Object-Relational Mapper -- an ORM.  The lesson explains why this approach can speed development, but also its limitations.  The lessons also explain the steps needed to convert your app to the use of the Prisma ORM.  You'll do that conversion in the assignment.

## **Learning Objectives**

You will learn:
- What object-relational mappings (ORMs) are
- Why ORMs are used.
- Characterisics of the Prisma ORM
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

## **1. What is an ORM, and why are they used?**

SQL is a powerful language, but it isn't pretty.  In modern languages, you have objects, which may belong to classes.  You can create new instances with `new` operations, you can pass the objects as arguments to methods, and you can modify their attributes.  With an ORM, you can operate on database entries as if they were objects, which can be more straightforward than writing SQL.  Within your programming environment, you get autocomplete support and other programminga assistance.

In addition, ORMs have certain inherent advantages:

1. You have learned the `pg` package, but it only talks to PostgreSQL.  Suppose you are converting to MySQL, or for that matter, to MongoDB? You'd have to learn an entirely different package, with different syntax.  An ORM can handle the differences more or less transparently, so that it is not necessary to make big changes to the code.  (Converting from SQL to MongoDB is not transparent, but the ORM you will use supports both.)

2. Database schema management is complicated, especially with team projects.  As you add and modify tables, how do you keep track of what has been done to the production database and to the various test and development database instances?  You more or less have to write a special program for the SQL operations involved, and then you have to keep track of the steps in a separate table.  The ORM can do this for you.

3. The Prisma ORM brings special advantages to a TypeScript environment.  We don't do TypeScript in this class, but with Prisma, one gets strong typing and type safety.

4. Most of the power of SQL is carried forward into the ORM.  You can do most of the same things, without a performance cost.

On the other hand:

1. The ORM can mask what you are really doing in the database.  Under the covers, it is doing SQL.  But what SQL?  Sometimes it's hard to guess.

2. Sometimes the ORM won't do the SQL you want.  There's an escape route: You can tell it to emit raw SQL, as if you were using the `pg` package.  Sometimes you'll need to do that -- so you still need to know SQL.

## **2. Characteristics of the Prisma ORM**

The Prisma ORM:
- has an elegant way of managing schema.
- has good support for most SQL operations: SELECT, INSERT, UPDATE, DELETE, transactions, GROUP BY, aggregation, HAVING.
- supports relationships (associations) between tables.
- doesn't like to do joins.  This is a side effect of the type safety focus.
- has significant limitations for GROUP BY and HAVING support.
- won't do subqueries.

We could have used Sequelize, another ORM for Node, but it's harder to learn, and schema management with Sequelize requires an additional package.  As you'll see, the transition from `pg` to Prisma is pretty easy.

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

Under the covers, Prisma makes the SQL call.  In fact, if you are using PostgreSQL, it uses the pg package and a pg pool.

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

Models represent your database tables as JavaScript classes.

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

Each model has a name, a collection of fields, perhaps one or several indexes, and perhaps a `@@map` clause.  By convention, the model is given a capitalized singular name.  As we typically use lowercase table names, the `@@map` clause mapes the model name to the table name.

The `@@unique` line declares an index.  It is saying that the id and the userId comprise a unique composite key.

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

The Prisma schema describes the database schema.  There are two cases to consider:

1. **Introspection** There is an existing database schema.  For the Prisma client to be able to operate on the database, a Prisma schema must be created to match.  Prisma provides a means to read the database schema and to create a Prisma schema from it. All of the existing data is preserved.

**Benefits of Introspection:**
- **No Data Loss**: Your existing data remains intact
- **Accurate Mapping**: Automatically detects table structures
- **Time Saving**: No need to manually write the schema
- **Error Prevention**: Eliminates manual mapping mistakes

**Downsides of Introspection:**
- **Schema Management is in SQL**
- **Schema Evolution is difficult for a team project**
- **Schema Management is difficult in production**

2. **Migration** If there is no existing databae schema, Prisma schema definitions can be created by hand, like those above.  Then, those schema definitions are used to create tables with corresponding columns, constraints, and indexes.  This process is called **migration**.  If there is existing data, it can be preserved.

In the assignment, you will do each of these.

Once the Prisma and database schemas have been created by one of the processes above, it may be necessary to modify the schema, perhaps to add tables or to add or remove columns from tables.  In this case, the Prisma schema is changed, and the migration step is performed again.  Every change to the Prisma schema requires that you run migration again.  As the Prisma schema is just a file, it can be shared within a development team via Github, and it can be propagated from Github to the production deployment.

## **5. Error Handling with Prisma**

### **Prisma Error Types**

Prisma provides specific error codes for different scenarios:

**Common Error Codes:**
- **`P2002`**: Unique constraint violation (duplicate email) → Return 400 Bad Request
- **`P2025`**: Record not found → Return 404 Not Found
- **`P2003`**: Foreign key constraint violation → Return 400 Bad Request
- **`P2014`**: Invalid relation → Return 400 Bad Request

The `P2025` only occurs for the following operations: `update()`, `delete()`, `findUniqueOrThrow()`, `findFirstOrThrow()`.  For a `findMany()` an empty array is returned if no entry is found.  For a `findUnique()`, a null value is returned if no entry is found.

### Implementing Error Handling

The code below is an example.  More frequently, you will only catch a small subset of the errors in your controller.  You'll let most errors fall through to your global error handler.


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

Prisma throws a `PrismaClientInitializationError` when it cannot connect to the database. This commonly occurs when the database server isn't running. You can handle this in your error handler middleware:

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
    return res.status(404).json(message: "The entry was not found.");
  } else {
    return next(err); // if inside of a controller
  }
}
else ... // it succeeded!
```

As previously mentioned, not all errors should be handled in the context of the controllers.  That would be redundant.  Some the errors should be handled in context, though.  For example, if a user is registering, and the `P2002` error occurs, that is best handled in context, so that good feedback can be returned to the caller.

---

## 6. Performance and Best Practices

### Connection Management

All connection management within your app should be centralized, just as it was with the pg package.  You create a shared module within your `db` folder to establish the client, and the resulting client is imported by other modules in your app.  This ensures that all connections can be ended at server shutdown, and also optimizes connection sharing.

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

In your assignment, you will substitute Prisma methods for methods from the pg package.  The following link shows the syntax of the Prisma methods for [CRUD operations](https://www.prisma.io/docs/orm/prisma-client/queries/crud).  You see the following correspondence with SQL statements:

- INSERT: `prisma.model.create()`
- SELECT: `prisma.model.findMany()`, `prisma.model.findFirst()`, `prisma.model.findUnique()`, `prisma.model.groupBy`
- UPDATE: `prisma.model.update()`, `prisma.model.updateMany()`
- DELETE: `prisma.model.delete()`, `prisma.model.deleteMany()`

This is not an exhaustive list.  If the model is User, which is mapped to a users table, you can do `prisma.user.create({data: {name: "Jack"}})` to create an entry.  Of course, this example wouldn't be schema compliant.  Many of these methods have a `where` attribute to specify which entries in teh database are to be read or modified or deleted.  Methods for creating and modifying records have a `data` attribute to specify the attribute names and values.  When retrieving data, you can specify the columns you want with a `select` attribute.  There are various other choices such as `orderBy` and `groupBy`, which correspond to SQL features you have seen before.

In your assignment, you are given specific guidance and examples to complete the conversion from pg to Prisma.  Refer to the link above as needed.

All of these methods are asynchronous, returning a promise.  You must do an `await` to get the return value.

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

## 7. Testing and Debugging

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
- **Advanced Prisma features** like relationships and transactions
- **Best practices** for performance and error handling

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

**Remember:** This lesson builds on Lesson 5. Make sure you have a working PostgreSQL application before adding Prisma ORM!
