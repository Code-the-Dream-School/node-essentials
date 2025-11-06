# Assignment 6a: PostgreSQL and Node.js Integration

## Learning Objectives
- Connect your Node.js application to a PostgreSQL database
- Replace in-memory storage with persistent database storage
- Implement proper database connections and error handling
- Use the `pg` library for database operations
- Understand database relationships and foreign keys
- Test your API endpoints with real database persistence

## Assignment Overview
In this assignment, you will modify your existing Express application to use PostgreSQL instead of in-memory storage. You'll transform your working Express app that stores data in memory to one that persists data in a real database.

**Prologue:**
Right now you are using `memoryStore.js` to store users and a list of tasks for each. For this assignment, you want to eliminate all use of `memoryStore.js`, and read and write from the database instead. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

## Prerequisites
- Completed previous lessons with a working Express application
- Basic understanding of Node.js and Express
- PostgreSQL installed and running on your system

Be sure to create an assignment6a branch before you do any of the following.  You will create two branches for the two parts of assignment.

---

## Assignment Tasks

### 1. Database Setup and Connection

#### a. Install Required Packages

Install the necessary packages for PostgreSQL integration:
```bash
npm install pg dotenv
```

**Note:** We'll use the built-in Node.js `crypto` module for password hashing with scrypt (from lesson 4), so no additional package installation is needed.

**Also:** You'll use a database you created in Assignment 0, as well as the `.env` file from that assignment.

**Security Note:** Never commit your `.env` file to version control. It contains sensitive information like passwords. Make sure to add `.env` to your `.gitignore` file to prevent accidentally committing it to GitHub.

#### b. Is Your PostgreSQL Service Running?

You installed Postgres and created the databases you need in Assignment 0.  Depending on how you configured Postgres, it may start automatically when you restart your system, or it may not.  So, check to make sure it is running as follows:

For Mac:

```bash
psql --version # check version
brew services start postgresql@14 # You might have 15 or some different version
```

For Linux:

```bash
sudo service start postgresql
```

For Windows, you open the Windows Services panel and start the postgresql service if it is not running.

Remember these steps!  If your app quits running, perhaps your database service is not running!

#### c. Create Database Tables

Create a file in node-homework called `schema.sql` with the following tables:

```sql
-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table to store user tasks with foreign key relationship
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  CONSTRAINT task_id_user_id_unique UNIQUE (id, user_id)
);
```

Once that file is created, run the following command:

For Mac and Linux:

```bash
psql <DATABASE_URL> -f schema.sql
```

where `DATABASE_URL` is the value you saved in your `.env` file during assignment 0.  On Windows, the command is little longer:

```bash
"C:\Program Files\PostgreSQL\17\bin\psql.exe" <DATABASE_URL> -f schema.sql
```
The above assumes you have Postgres 17 -- adjust the number as needed.

#### d. Create Database Tables in the Test Database

You should see messages that tables were created.  This creates the schema for the production database, but you also need a test database.  This is used for the assignment TDD, and also for your automated testing assignment in a later week.  The `psql` command is the same as the above, but you use the value of the `TEST_DATABASE_URL` from your `.env` file.

### 2. Database Connection Implementation

#### a. Create Database Connection File

Create a folder in node-homework called `db`.  Within it, create `pg-pool.js` with the following content:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
```

This code was explained in the lesson.

#### b: Modify app.js: Graceful Shutdown

When your Node process ends, it might hang if database connections are not cleaned up.  Somewhere in the file, add this line:

```
const pool = require("./db/pg-pool");
```

Then, in your shutdown function, after the "gracefully" message, add this line:

```javascript
await pool.end();
```

Otherwise your Node process may hang on exit.  You want it to release all database connections.

#### b. Modify app.js: Health Check

Add a health check endpoint to verify database connectivity:

```js
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});
```

#### c. Modify Your Error Handler

Add the following line to the top of your error handler middleware:

```javascript
  if (err.code === "ECONNREFUSED" && err.port === 5432) { // the postgresql port
    console.log("The database connection was refused.  Is your database service running?");
  }
```

If the database service is not up, you want to know.  Your error handler will handle other database errors as well.

### 3. Modify Controllers for Database Operations

You need to eliminate all use of `util/memoryStore.js`.  In general, you are going to substitute database calls, except the one for the currently logged on user.  For that, you are going to use `global.user_id`.  Globals are accessible via every module.  Let's start with login in the user controller.  You will see that there aren't many try/catch stanzas.  That's because, for the most part, you can let the global error handler take care of error handling.

#### a. Changing Login:

In userController.js, you need to have a require statement to give access to the pool, so put that near the top.  You currently do a find() on the storedUser array.  Well, you have to eliminate that.  This is the equivalent, assuming you have extracted email and password from the req.body:

```javascript
const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

The returned array might have 0 length, in which case authentication fails: you send back the 401 and the appropriate message.  Otherwise, you use your existing `comparePassword()` function to see if the password in the body of the request matches `user[0].hashed_password`.  If it doesn't, you send the 401 and the authentication failed message.  But, if it does, you send a 200 and the appropriate message -- and you also put `user[0].id` in global.user_id.

So: make those changes to the login function now.

#### b: Changing Registration

Right now, you do a find() on the array in the memory store to see if the user is already registered.  If not, you add the user entry to the memory store.  When you switch to the database, you can do that in one step.  For this operation and all that follow, you still need to do Joi validation of your objects before writing them to the database.

```javascript
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  let user = null;
  value.hashed_password = await hashPassword(value.password);
  // the code to here is like the memoryStore version
  try {
    user = await pool.query(`INSERT INTO users (email, name, hashed_password) 
    VALUES ($1, $2, $3) RETURNING id, email, name`,
    [value.email, value.name, value.hashed_password]
  ); // note that you use a parameterized query
} catch (e) { // the email might already be registered
  if (e.code === "23505") { // this means the unique constraint for email was violated
    // here you return the 400 and the error message.  Use a return statement, so that 
    // you don't keep going in this function
  }
  next(e); // all other errors get passed to the error handler
}
// othewise newUser now contains the new user.  You can return a 201 and the appropriate
// object.  Be sure to also set global.user_id with the id of the user record you just created. 
```

#### c. Changing Logoff.

Pretty easy.  This is one for you.

#### d. Changing the auth Middleware.

Pretty easy.  You use global.user_id instead of the memory store.

#### e. Changing Task Management: POST /tasks (create)

You have a controller method for that, but it uses the memory store.  Here is the equivalent for `pg`.  This only shows the part you have to change.  Joi validation and the res.json() part are the same:

```javascript
// you do your Joi validation, and you have a validated task object. Then:
const task  = await pool.query(`INSERT INTO tasks (title, is_completed, user_id) 
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
  [value.title, value.is_completed, global.user_id]);
  // You don't need a try/catch because the global error handler will handle the errors
```

#### f. Changing Task Management: GET /tasks (index)

In each of these task operations, the WHERE cause must include the `user_id`, so that a given user can't access a different user's task entries.  For `index()` you need:

```javascript
const tasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
  [global.user_id]
)
```

#### g. Changing Task Management: PATCH /tasks/:id (update)

This one's a little tricky.  You might update the title, or the is_completed, or both.  How can you assemble an SQL statement that would handle all these cases?

Note also: The WHERE clause for the update statement has to filter on both req.params.id (the task record to be updated) and also on global.user_id.  If you don't include global.user_id in the filter, one user could update another user's task records.

Let's assume that you have run req.body through Joi, and that taskChange is the object containing the updates you want.  Lets see: taskChange.keys() would contain the columns to update.  For the VALUES, we can build something up like this:

```javascript
const keys = taskChange.keys(updates);
const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
const idParm = `$${keys.length + 1}`;
const userParm = `$${keys.length + 2}`;
const updatedTask = await pool.query(`UPDATE tasks ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm}`, 
  [...taskChange.values(), req.params.id, global.user_id]);
```

#### h. Changing DELETE /tasks/:id (deleteTask)

Another one for you to do.  Remember to filter on user_id as well as the task id.

#### i. Changing GET /tasks/:id (show)

Same deal. Remember to filter on user_id as well as the task id.

Keep going until all dependency on the memoryStore is gone.


### 4. Test Using Postman

Make sure all operations work as before.


### 5. Run the TDD 

Run `npm run tdd assignment6a`.  Make sure all tests complete correctly.

**Important Security Note:**
The global user_id storage approach used here is **NOT secure** for production applications. It means that once someone logs in, anyone else can access the logged-in user's tasks because there's only one global value. This is used here to match the behavior from lesson 4, but in a real application, you would use proper session management, JWT tokens, or other secure authentication methods.  You will fix the problem in assignment 8.

### Code Quality Requirements
- Use async/await consistently
- Implement proper error handling
- Use parameterized queries for security
- Follow consistent naming conventions
- Use environment variables for configuration

### Testing Requirements
Test all endpoints with Postman or curl:
1. **Database Setup**: Verify tables are created
2. **User Operations**: Test registration and login with password hashing
3. **Global User ID**: Verify user_id is stored globally after login/registration
4. **Task Operations**: Test all CRUD operations using global user_id (no query parameters)
5. **Error Handling**: Test invalid inputs and database errors
6. **Security**: Verify user ownership validation and password hashing

For the security testing, you should try Postman tests where you GET, UPDATE, or DELETE an entry that belongs to another user.  You would log on as user 1, do a GET for `/tasks`, and record the id of an entry belonging to that user.  You would then log on as user 2, and try to get, update, and delete the task with that ID.  All should fail with a message that the entry was not found.  This is how you can be sure that access control is enforced.

---

## Submission Requirements

### Code Submission
- All modified files with database integration
- Working database connection and tables
- Complete CRUD operations for users and tasks
- Proper error handling and validation
- Environment configuration file

### Testing Documentation
- Postman collection or curl commands for testing
- Test results showing all endpoints working
- Database connection verification
- Any issues encountered and solutions

**Important:** Make sure you now have:
- All the modified files with database integration
- Working database connection and table creation
- Complete CRUD operations for users and tasks
- Proper error handling and validation
- All endpoints tested and working with Postman or curl

---

You will next convert the project to use Prisma, which is the Node Object Relational Mapper.  That will overwrite what you have done.  But, you want to save what you have done, and your reviewer will want to see it, so at this time, add and commit all your changes.  Make the commit message "pg conversion completed".  Then make a pull request.  Do not submit your homework yet! you have more to do.

## Submission Instructions

### Add, Commit, and Push Your Changes
Within your `node-homework` folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment6a` branch.

```bash
git add .
git commit -m "Complete Assignment 6a: PostgreSQL and Node.js Integration"
git push origin assignment6a
```


**Important:** Make sure your pull request includes:
- All the modified files with database integration
- Working database connection and table creation
- Complete CRUD operations for users and tasks
- Proper error handling and validation
- All endpoints tested and working with Postman or curl

---

## Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Package](https://node-postgres.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Postman API Testing](https://www.postgresql.org/docs/)

---

## Getting Help

- Review the lesson materials thoroughly
- Check your database connection and credentials
- Use `console.log` statements for debugging
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts

**Remember:** This assignment builds on your Node.js fundamentals. Make sure you have a solid understanding of Express and basic database concepts before proceeding!

# Assignment 6b: Prisma ORM Integration

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
- Completed Assignment 6a with a working PostgreSQL application
- Basic understanding of database concepts and SQL
- Node.js and npm installed

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

This will build your client in the wrong place.  You want it to be in the default location, which is within `node_modules`.  So change the file as follows:

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Important** You must also erase the `prisma.config.ts` file.  That is an artifact of the latests Prisma release, something that I think they screwed up.

Now you can generate the client, using this command:

```bash
npx prisma generate
```

#### b. Create the Schema

You need model stanzas in the `schema.prisma`.  You want one such stanza for each table, and it describes the schema for the table. You already have the tables you want, as created by SQL statements in the first part of this lesson.  So, in this case, you can `introspect` the schema:

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
}
```

Do you see how the model stanzas map to the SQL you used in part 1?  Pay particular attention to the way the relation between tasks and users is specified.  The models above are ok ... but typically, you make them a little friendlier.  By convention, the name of the model is capitalized. and it is singular, not plural.  Also, the convention in JavaScript is that variable names are camel case.  But if we change the models to match this convention, we have a problem.  Prisma will look for tables named User and Task, and for columns like createdAt.  We fix this by adding `@map` for columns, and `@@map` for tables.  The final product is:

```
model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique @db.VarChar(255)
  name           String   @db.VarChar(30)
  hashedPassword String   @db.VarChar(255) @map("hashed_password")
  createdAt     DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  tasks          tasks[]
  @@map("users")
}

model Task {
  id           Int      @id @default(autoincrement())
  title        String   @db.VarChar(255)
  isCompleted Boolean  @default(false) @map("is_completed")
  userId      Int       @map("user_id")
  createdAt   DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  users        users    @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  @@map("tasks")
}
```

#### c. Migration

You can create the schema following the pattern above: You first did the SQL commands to create the tables, then you introspected the schema, then you tweaked the names with mapping as needed.  Most people find that this is the hard way.  You can instead create the model definitions and use them to create or modify the table schema, using migrate.  You do the following:

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

Then, change the shutdown so that as well as ending the pool, it also does the following:

```javascript
  try {
    console.log("disconnecting prisma");
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error disconnecting Prisma:", err);
  }
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
That may return null, in which case authentication fails.  If not, you still have to do a comparePassword(), which may or may not return true.

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

#### c. Fix Task Index

```js
const options = {
  where: {
    userId: global.user_id, // only the tasks for this user!
  },
  omit: { userId: true },
};
const tasks = await prisma.task.findMany();
```

#### d. Fix Task Create

This one's kind of like register.  You want to create the task with a userId of global.user_id.

#### e. Fix Task Update

```js
// assuming that value contains the validated change coming back from Joi
const task = await prisma.task.update( data: value,
    where: {
      id: parseInt(req.params.id),
      userId: global.user_id,
    });
```

This is where that special unique index for [id, user_id] is important!  Prisma does not
let you do update() or delete() or findUnique() with two attributes in the where clause **unless** a uniqueness index is present for that combination of attributes.

#### f. Update Show

You need to use `prisma.task.findUnique()`, but you filter both on the id and the userId, so that there is good access control.

#### g. Update DeleteTask

This works similar to update().  You need to use the delete() method.

#### h. Remove All Pool References

You no longer need the pool, as all operations now use Prisma.

### 4. Testing Your Prisma Integration
- Test using Postman.  Everything should still work -- but remember that the migrate step delected all the data, so you have to create each entry again.
- Run `npm tdd assignment6b

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
- Advanced filtering and sorting

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
│   └── prisma.js
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

