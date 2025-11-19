# Assignment 6: Prisma ORM Integration

## Learning Objectives
- Transform your PostgreSQL application from raw SQL to Prisma ORM
- Implement type-safe database operations using Prisma Client
- Understand the benefits of ORM over raw SQL queries
- Set up and configure Prisma in an existing project
- Implement advanced Prisma features like relationships and transactions

## Assignment Overview
In this assignment, you will transform your existing PostgreSQL application (from Assignment 6a) to use Prisma ORM instead of raw SQL queries. You'll gain better type safety, autocomplete, and maintainability while keeping the same functionality.

Be sure to create an assignment6b branch before you make any new changes.  This branch should build on top of assignment6a, so you create the assignment6b branch when assignment6a is the active branch.

**Prologue:**
Right now you are using raw SQL queries with the `pg` library to interact with your PostgreSQL database. For this assignment, you want to replace all raw SQL queries with Prisma ORM methods, while maintaining the same functionality including password hashing and global user_id storage. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

## Prerequisites
- Completed Assignment 5 with a working PostgreSQL application
- Basic understanding of database concepts and SQL

---

## Assignment Tasks

### 1. Prisma Setup and Configuration

#### a. Install Prisma Dependencies

Install the necessary packages for Prisma integration:
```bash
npm install prisma @prisma/client
npx prisma init
```

The prisma init command above creates the prisma folder, and within it the shell of a `schema.prisma` file.  It also creates a `.env` file if you don't have one.  You need to fix `schema.prisma`.  The init generates:

```
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

This would build your client in the wrong place.  You want it to be in the default location, which is within `node_modules`.  So change the file as follows:

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Important** You must also erase the `prisma.config.ts` file.  That is an artifact of the latest Prisma release, something that I think they screwed up.

Now you can generate the client, using this command:

```bash
npx prisma generate
```

#### b. Create the Schema

You need model stanzas in the `schema.prisma`.  You want one such stanza for each table, and it describes the schema for the table. You already have the tables you want, as created by SQL statements in the first part of this lesson.  So, in this case, you can `introspect` the schema.  Run the following command:

```bash
npx prisma db pull
```

Take a look at your `prisma/schema.prisma` file.  You now have two model stanzas, like so:

```
model users {
  id             Int      @id @default(autoincrement())
  email          String   @unique @db.VarChar(255)
  name           String   @db.VarChar(30)
  hashedpassword String   @db.VarChar(255)
  created_at     DateTime @default(now()) @db.Timestamp(6)
  tasks          tasks[]
}

model tasks {
  id           Int      @id @default(autoincrement())
  title        String   @db.VarChar(255)
  is_completed Boolean  @default(false)
  user_id      Int
  created_at   DateTime @default(now()) @db.Timestamp(6)
  users        users    @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  @@unique([id, user_id])
}
```

Do you see how the model stanzas map to the SQL you used in part 1?  Pay particular attention to the way the relation between tasks and users is specified.  Also, notice the `@@unique`, which describes the additional index you need.  The models above are ok ... but typically, you make them a little friendlier.  By convention, the name of the model is capitalized. and it is singular, not plural.  Also, the convention in JavaScript is that variable names are camel case.  But if we change the models to match this convention, we have a problem.  Prisma will look for tables named User and Task, and for columns like createdAt.  We fix this by adding `@map` for columns, and `@@map` for tables.  The final product is:

```
// This is your Prisma schema file
// Learn more at https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique @db.VarChar(255)
  name           String   @db.VarChar(30)
  hashedPassword String   @db.VarChar(255) @map("hashed_password")
  createdAt     DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  Task          Task[]
  @@map("users")
}

model Task {
  id           Int      @id @default(autoincrement())
  title        String   @db.VarChar(255)
  isCompleted Boolean  @default(false) @map("is_completed")
  userId      Int       @map("user_id")
  createdAt   DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  User       User    @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  @@unique([id, userId])
  @@map("tasks")
}
```

#### c. Migration

You can create the schema following the pattern above. You first did the SQL commands to create the tables, then you introspected the schema, then you tweaked the names with mapping as needed.  Most people find that this is the hard way.  You can instead create the model definitions and use them to create or modify the table schema, using migrate.  You do the following:

```bash
npx prisma migrate reset # answer yes when prompted.  This deletes all the data.
npx prisma migrate dev --name firstMigration
```

From this point on, you can make your schema changes with Prisma.  The sequence above drops the tables and recreates them according to the original schema.  There are ways to preserve the data during the switchover, but that's a little more complicated.  Prisma keeps track of the state of the schema as follows:

- The `prisma/schema.prisma` file is the authoritative source for what the database schema should be.
- A special table in the database called `_prisma_migrations` keeps track of what has been done.
- The `prisma/migrations` folder keeps track of what has to be done, i.e. the migrations that must be performed.

There is plenty one can learn about this -- but you have enough information for now.

As you may make schema changes in the future, you also want Prisma to manage the schema of the test database.  So do the following:

```bash
DATABASE_URL=<TEST_DATABASE_URL> prisma migrate deploy
```

Here for `<TEST_DATABASE_URL>` you put in the value of that environment variable from your `.env` file.  Every time you do a migration for the development database, you do it for the test database as well, with the command above.

---

**Important:** You must run `npx prisma migrate dev --name <someMigrationName>` every time you modify your Prisma schema file. The generated client needs to be updated to reflect any changes to your models, fields, or relationships.  Every time you do a migration for the development database, you do it for the test database as well, with the command above.

From this point on, if you make a schema change, you change the model, do a `prisma migrate dev`, and then, for the test database, do the corresponding `migrate deploy`.  You do not change the schema with ordinary SQL.

### 2. Create Prisma Database Connection

#### a. Create Database Client File
Create `db/prisma.js`.  This is going to be the substitute for the `pg` pool.  This file should say:

```js
const { PrismaClient } = require("@prisma/client");
if (!process.env.NODE_ENV || process.env.NODE_ENV == "development") {
  opts = {log: ["query"]};
} else {
  opts = {};
}
const prisma = new PrismaClient(opts);

module.exports = prisma;
```

It can be a little opaque to figure out what an ORM like Prisma is doing.  The code above turns on logging of the queries it issues.  You'll actually see the SQL statements appear in the log as they are executed.  Obviously this should only happen in development mode.

In the log, you'll see each of the table names prefixed with "public".  This is the default database schema, which is only important if your database is multi-tenant -- which it isn't.

#### b. Fix Shutdown, Health Check, and Error Handling

You now need to replace references to the `pg` pool them with references to the `prisma` client instance. You can do them incrementally, so that all operations work as you substitute prisma code one part at a time.

First, in app.js, add this statement:

```js
const prisma = require("./db/prisma");
```

Then, change the shutdown so that as well as ending the pg pool, it also does the following:

```javascript
    await prisma.$disconnect();
    console.log("Prisma disconnected");
```

Change your health check so that it uses Prisma:

```js
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});
```

Also, you want to catch connection errors in your error handler, perhaps adding a statement to the top of your error handler like this:

```js
if (err.name === "PrismaClientInitializationError") {
  console.error("Couldn't connect to the database. Is It running?")
}
```

Once you've done this much, test the new health check to make sure it works.

### 3. Transform Your Controllers

In the steps that follow, you can fix one controller method at a time and test that method.  Other methods will use `pg` until you have fixed them all.

#### a. Fix Login

You need to have a `require()` statement for prisma in the user controller, in addition the one for the pool.  For login, you need to find the user:

```js
const user = await prisma.user.findUnique({ where: { email: { equals: email, mode: "insensitive" }}});
```
That may return null, in which case authentication fails.  If not, you still have to do a `comparePassword()`, which may or may not return true.

#### b. Fix Register

You need to catch the error that might occur if the email is already registered.  Like so:

```js
// Do the Joi validation, so that value contains the user entry you want.
// hash the password, and put it in value.hashedPassword
// delete value.password as that doesn't get stored
let user = null;
try {
  user = await prisma.user.create({
    data: { name, email, hashedPassword },
    select: { name: true, email: true, id: true} // specify the column values to return
  });
} catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code == "P2002") {
      // send the appropriate error back -- the email was already registered
    } else {
      return next(err); // the error handler takes care of other erors
    }
}
// otherwise register succeeded, so set global.user_id with user.id, and do the
// appropriate res.status().json().
```

#### c. Fix the Task Index Method

```js
const tasks = await prisma.task.findMany({
  where: {
    userId: global.user_id, // only the tasks for this user!
  },
  select: { title: true, isCompleted: true, id: true }
});
```

#### d. Fix the Task Create Method

This one's kind of like register.  You want to create the task with a userId of global.user_id.

#### e. Fix Task Update

```js
// assuming that value contains the validated change coming back from Joi, and that
// you have a valid req.params.id:
try {
const task = await prisma.task.update( data: value,
    where: {
      id,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true });
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  }
}
```

With the pg package, you'd just get an empty array returned, if no matching task was found.  But Prisma throws the `P2025` error in this case.  You want to catch it at this point -- if you passed it to the global error handler, the caller would not get a useful message.

This is where that special unique index for [id, userId] is important!  Prisma does not
let you do update() or delete() or findUnique() with two attributes in the where clause **unless** a uniqueness index is present for that combination of attributes.

#### f. Update the Show Method

You need to use `prisma.task.findUnique()`, but you filter both on the id and the userId, so that there is good access control.  You need to catch `P2025` errors in this case also.

#### g. Update DeleteTask

This works similar to update().  You need to use the delete() method, and catch `P2025` errors.

#### h. Remove All Pool References

You no longer need the pool, as all operations now use Prisma.

### 4. Testing Your Prisma Integration

Test using Postman.  Everything should still work -- but remember that the migrate step delected all the data, so you have to create each entry again.

Make sure all operations work as before.  They are:

- register
- logon
- create task
- show task
- list tasks
- update task
- delete task
- logoff
- health check

As you did for pg, conduct a test to verify that one user can't read, modify, or delete another's tasks.

Then, run `npm tdd assignment6` and make sure it completes without test failure.

#### a. Database Testing

**Requirements:**
- Verify Prisma Client is generated correctly
- Test all CRUD operations with Prisma
- Verify relationships work as expected
- Test error scenarios and edge cases

#### b. API Testing
Test your endpoints using Postman or curl:

**Required Tests:**
- All user operations (register, login) with password hashing
- Global user_id storage after login/registration
- All task operations (create, read, update, delete) using global user_id
- Relationship queries (user with tasks, tasks with user)
- Error handling scenarios

**Required Tests:**
- All user operations (register, login) with password hashing
- Global user_id storage after login/registration
- All task operations (create, read, update, delete) using global user_id
- Relationship queries (user with tasks, tasks with user)
- Error handling scenarios

---

## Implementation Guidelines

### File Structure
Your project should maintain this structure:
```
project/
├── controllers/
│   ├── userController.js (transformed for Prisma)
│   └── taskController.js (transformed for Prisma)
├── routes/
│   ├── userRoutes.js (no changes needed)
│   └── taskRoutes.js (no changes needed)
├── prisma/
│   └── schema.prisma (NEW - Prisma schema)
├── db/
│   ├── prisma.js
│   └── pg-pool.js (no longer used)
├── middleware (No changes needed for Prisma)
├── app.js 
├── .env 
└── package.json
```

### Code Quality Requirements
- Use async/await consistently
- Implement proper Prisma error handling
- Use Prisma Client methods instead of raw SQL
- Maintain existing validation and security
- Follow consistent naming conventions

### Testing Requirements
Test all endpoints with Postman or curl:
1. **Prisma Setup**: Verify client generation and connection
2. **User Operations**: Test all user endpoints with Prisma
3. **Task Operations**: Test all task endpoints with Prisma
4. **Relationships**: Test user-task relationships
5. **Error Handling**: Test Prisma error scenarios

---

## Submission Requirements

### Code Submission
- All modified files with Prisma integration
- Working Prisma schema and client
- Complete CRUD operations using Prisma
- Proper error handling for Prisma operations
- Advanced Prisma features implemented

### Testing Documentation
- Postman collection or curl commands for testing
- Test results showing all endpoints working with Prisma
- Verification of Prisma Client generation
- Any issues encountered and solutions

---

## Submission Instructions

You now create the 

### 1️⃣ Add, Commit, and Push Your Changes
Within your `node-homework` folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment6b` branch.

```bash
git add .
git commit -m "Complete Assignment 6b: Prisma ORM Integration"
git push origin assignment6b
```

### 2️⃣ Create a Pull Request
1. Log on to your GitHub account
2. Open your `node-homework` repository
3. Select your `assignment6b` branch. It should be one or several commits ahead of your main branch
4. Create a pull request with a descriptive title like "Assignment 6b: Prisma ORM Integration"

### 3️⃣ Submit Your GitHub Link
Your browser now has the link to your pull request. Copy that link, to be included in your homework submission form.  Include also a link to the pull request for assignment 6a.

**Important:** Make sure your pull request includes:
- All the modified files with Prisma integration
- Working Prisma schema and database connection
- Complete CRUD operations using Prisma Client
- Proper error handling and validation
- All endpoints tested and working with Postman or curl
- Successful transition from raw SQL to Prisma ORM

---

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Short demos based on Lesson 6:

1. **How do you connect Node.js to PostgreSQL and what are the benefits over in-memory storage?**
   - Show your database connection setup in `db.js`
   - Explain connection pooling and why it's important
   - Walk through your database schema and explain foreign key relationships

2. **What is an ORM and how does Prisma improve database operations?**
   - Show your Prisma schema file and explain the model definitions
   - Demonstrate the difference between raw SQL queries and Prisma methods
   - Show how Prisma handles relationships with `include` and `select`
   - Explain type safety and autocomplete benefits

3. **How do you transform raw SQL queries to Prisma operations?**
   - Walk through a specific database operation (like creating a user or fetching tasks)
   - Show how Prisma handles error codes and validation
   - Demonstrate the generated Prisma Client and its methods

**Video Requirements**:
- Show actual code from your assignment
- Explain concepts clearly while demonstrating
- Keep demos focused and concise

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

## Getting Help

- Review the lesson materials thoroughly
- Check your Prisma schema and database connection
- Use Prisma Studio to visualize your database
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts

**Remember:** This assignment builds on Assignment 6a. Make sure you have a working PostgreSQL application before adding Prisma ORM!

