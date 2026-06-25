# **Assignment 6 — Prisma ORM Integration**

## Learning Objectives
- Transform your PostgreSQL application from raw SQL to Prisma ORM
- Implement type-safe database operations using Prisma Client
- Understand the benefits of ORM over raw SQL queries
- Set up and configure Prisma in an existing project
- Implement advanced Prisma features like relationships and transactions

## Assignment Overview
In this assignment, you will update your PostgreSQL application from Assignment 5 so it uses Prisma ORM instead of raw SQL queries. The app should keep the same behavior, but your database code will move from hand-written SQL to Prisma Client methods.

Create an `assignment6` branch before you make new changes. This branch should build on top of `assignment5`, so create it while `assignment5` is your active branch.

**Prologue:**
Right now, your app uses raw SQL queries with the `pg` library. In this assignment, replace those raw SQL queries with Prisma ORM methods. Keep the same functionality, including password hashing and global user_id storage. The REST calls your application supports should still work the same way, so your Postman tests do not need to change.

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

The `prisma init` command creates a `prisma` folder. Inside that folder, it creates the beginning of a `schema.prisma` file. It also creates a `.env` file if you do not already have one. You need to adjust `schema.prisma`. The generated version looks like this:

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

This would build your client in the wrong place. You want the client in the default location, which is inside `node_modules`. Change the file to this:

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Important** You must also erase the `prisma.config.ts` file. This is an artifact of the latest Prisma release that needs to be removed.

Now you can generate the client, using this command:

```bash
npx prisma generate
```

#### b. Create the Schema

You need model stanzas in `schema.prisma`. Each model describes one database table. Since you already created the tables with SQL in Assignment 5, Prisma can read the existing database and create models from it. This is called introspection. Run:

```bash
npx prisma db pull
```

Open `prisma/schema.prisma`. You should now have two model stanzas, like these:

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

Notice how the model stanzas map to the SQL tables you created earlier. Pay close attention to the relation between tasks and users. Also notice `@@unique`, which describes the additional index you need.

The models above work, but they are not very friendly for JavaScript code. By convention, Prisma model names are capitalized and singular. JavaScript property names usually use camelCase. If you rename the models and fields to match those conventions, Prisma needs to know how those names map back to the existing database tables and columns. Use `@map` for columns and `@@map` for tables. The final result is:

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

You can create the schema with the pattern above: create tables with SQL, introspect the schema, then adjust names with mapping. Most people find that this is the harder path.

Going forward, you can instead write the Prisma model definitions and let Prisma create or modify the database schema with migrations. Do this:

```bash
npx prisma migrate reset # answer yes when prompted.  This deletes all the data.
npx prisma migrate dev --name firstMigration
```

From this point on, make schema changes with Prisma. The sequence above drops the tables and recreates them from your Prisma schema. There are ways to preserve data during a switchover, but that is more complicated. Prisma tracks schema state in three places:

- The `prisma/schema.prisma` file is the authoritative source for what the database schema should be.
- A special table in the database called `_prisma_migrations` keeps track of what has been done.
- The `prisma/migrations` folder keeps track of what has to be done, i.e. the migrations that must be performed.

There is much more to learn about migrations, but this is enough for now.

Since you may make schema changes later, you also want Prisma to manage the test database schema. This time, run:

```bash
DATABASE_URL=<TEST_DATABASE_URL> npx prisma migrate reset
```

For `<TEST_DATABASE_URL>`, use the value from your `.env` file. This reset deletes all data in the test database, but that is okay. It brings the test database into sync with your models and the migration history from the development database.

---

**Important:** You must run `npx prisma migrate dev --name <someMigrationName>` every time you modify your Prisma schema file. The generated client needs to be updated to reflect any changes to your models, fields, or relationships.  Every time you do a migration for the development database, you do it for the test database as well, with the command above.

From this point on, if you make a schema change, change the Prisma model first. Then run `npx prisma migrate dev`. For the test database, run the corresponding `npx prisma migrate deploy`. Do not change the schema with ordinary SQL. You will also use `deploy` with the production database you create for Internet deployment in Lesson 10. Never use schema `reset` with the production database because it deletes all data.

### 2. Create Prisma Database Connection

#### a. Create Database Client File
Create `db/prisma.js`. This will replace the `pg` pool as the shared database client. This file should contain:

```js
const { PrismaClient } = require("@prisma/client");

let opts;
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  opts = { log: ["query"] };
} else {
  opts = {};
}

const prisma = new PrismaClient(opts);

module.exports = prisma;
```

It can be hard to see what an ORM like Prisma is doing behind the scenes. The code above turns on query logging in development mode. You will see the SQL statements Prisma runs as they execute. This should only happen in development mode.

In the log, each table name may be prefixed with "public". This is the default database schema. It only matters for more complex multi-tenant databases, which this project is not using.

#### b. Fix Shutdown, Health Check, and Error Handling

Now replace references to the `pg` pool with references to the `prisma` client instance. You can do this incrementally. Update one operation at a time, test it, and then move to the next one.

First, in app.js, add this statement:

```js
const prisma = require("./db/prisma");
```

Then update shutdown so that, in addition to ending the pg pool while it still exists, it also does this:

```javascript
    await prisma.$disconnect();
    console.log("Prisma disconnected");
```

Change your health check so that it uses Prisma:

```js
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});
```

You also want your error handler to recognize Prisma connection errors. Add a check near the top of your error handler like this:

```js
if (err.name === "PrismaClientInitializationError") {
  console.error("Couldn't connect to the database. Is it running?")
}
```

After this change, test the health check to make sure it still works.

### 3. Transform Your Controllers

In the steps below, fix one controller method at a time and test that method. Other methods can keep using `pg` until you have converted them.

#### a. Fix Logon

Add a `require()` statement for Prisma in the user controller, in addition to the one for the pool while you are still converting. For logon, find the user:

```js
email = email.toLowerCase() // Joi validation always converts the email to lower case
                            // but you don't want logon to fail if the user types mixed case
const user = await prisma.user.findUnique({ where: { email }});
                            // also Prisma findUnique can't do a case insensitive search
```
That may return `null`. If it does, authentication fails. If a user is found, still run `comparePassword()` to check the password.

#### b. Fix Register

You need to catch the error that can happen when the email is already registered. Use this pattern:

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
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
    } else {
      return next(err); // the error handler takes care of other errors
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

This method follows the same pattern as register.  Create the task with a userId of global.user_id.

#### e. Fix Task Update

```js
// assuming that value contains the validated change coming back from Joi, and that
// you have a valid req.params.id:
try {
  const task = await prisma.task.update({
    data: value,
    where: {
      id,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true }
  });
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  }
}
```

With the `pg` package, you would usually get an empty array if no matching task was found. Prisma throws the `P2025` error in this case. Catch it here so the caller gets a useful 404 response instead of a generic server error.

This is where the special unique index for [id, userId] matters. Prisma does not let you use update(), delete(), or findUnique() with two attributes in the where clause **unless** a uniqueness index exists for that combination of attributes.

#### f. Update the Show Method

You need to use `prisma.task.findUnique()`, but you filter both on the id and the userId, so that there is good access control.  You need to catch `P2025` errors in this case also.

#### g. Update DeleteTask

This works similar to update().  You need to use the delete() method, and catch `P2025` errors.

#### h. Remove All Pool References

Once every operation uses Prisma, you no longer need the pool.

### 4. Testing Your Prisma Integration

Test with Postman. Everything should still work, but remember that the migration reset deleted the data. You will need to create users and tasks again.

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

As you did with `pg`, test that one user cannot read, modify, or delete another user's tasks.

Then, run `npm run tdd assignment6` and make sure it completes without test failure.

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

### 1️⃣ Add, Commit, and Push Your Changes
Within your `node-homework` folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment6` branch.

```bash
git add .
git commit -m "Complete Assignment 6: Prisma ORM Integration"
git push origin assignment6
```

### 2️⃣ Create a Pull Request
1. Log on to your GitHub account
2. Open your `node-homework` repository
3. Select your `assignment6` branch. It should be one or several commits ahead of your main branch
4. Create a pull request with a descriptive title like "Assignment 6: Prisma ORM Integration"

### 3️⃣ Submit Your GitHub Link
- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.

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
   - Show your database connection setup in `db/prisma.js`
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

**Remember:** This assignment builds on Assignment 5. Make sure you have a working PostgreSQL application before adding Prisma ORM.

