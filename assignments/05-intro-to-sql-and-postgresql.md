# **Assignment 5 — Introduction to Databases and SQL**

## **Assignment Instructions**

You create your homework file in the `node-homework` folder.
First, create a new branch for this week's homework and name it `assignment5`.

## **Assignment 5a**

Start `sqlcommand` as you did for the lesson. For each of the following tasks, you should get your SQL statements running in `sqlcommand` first, and then add them to your homework file. It may be helpful to have two terminal sessions open in VSCode - one for `sqlcommand`, and another to run your homework.  Next, create a file named `assignment5-sql.txt` within the `assignment5` directory. Each line in this file should be an SQL command, as described in the tasks.  Lines beginning with `#` are treated as comments.  As you add SQL statements to this file, you can test them using the following command:

**💡 Tip:** When typing SQL commands in the `sqlcommand` terminal, add a space at the end of each line. Without trailing spaces, lines get concatenated together (e.g., `GROUP BY orders.order_idORDER BY` becomes invalid SQL).

```bash
npm run tdd assignment5a
```

This test should be run from the `node-homework` root folder.

The [SQL section of W3Schools](https://www.w3schools.com/sql/default.asp) is a good reference to assist you with this assignment.

### **Preparation and Practice**

Within `sqlcommand`, practice running various SQL statements: SELECT, INSERT, UPDATE, DELETE, BEGIN, COMMIT, ROLLBACK. Your practice SQL statements should also include statements that use JOIN, GROUP BY, ORDER BY, HAVING, SUM, COUNT, etc. Continue practicing until you feel confident in your SQL skills. Remember that you can reload the database as needed. Also, practice writing subqueries as well. Then proceed to the following tasks.

**Note:** These tasks require SQL statements that are somewhat complicated. Implement the statements incrementally — get one part working, then add more clauses, until the full query works correctly. If you run into problems, ask for assistance from a mentor or via the Slack channel. If SQL is new to you, there is plenty to learn!

### **Task 1: Find the total price of each of the first 5 orders, ordered by order_id.**

There are several steps. You'll need to use the `price` from the `products` table and the `quantity` from the `line_items` table, so you'll need to join these with the `orders` table. You need to `GROUP BY` the `order_id`. You are grouping `line_items`. Also, `ORDER BY` the `order_id`. You need to select the `order_id` and the sum of each product's price multiplied by the `line_items` quantity. The columns returned should be `order_id` and `total_price`. You should use aliasing to label the sum of `price` times `quantity` as `total_price`.

When you have this running in `sqlcommand`, add the SQL statement to `assignment5-sql.txt`.

Run the `tdd` test until the first test completes.

### **Task 2: Understanding Subqueries**

For each customer, find the average total price of their orders, and return the results ordered by customer name.

This can be done with a subquery. You first have to get the total price of each order, so you can reuse the statement from Task 1 for the subquery, with some changes. You are going to `JOIN` the customers table, which you need for the `customer_name`, with the results of the subquery. The changes you need to make are:

- You need to return the `customer_id` in the subquery, because you are going to `JOIN` the customers table to the subquery ON customer_id.
- You don't want `LIMIT` in the subquery, because you are going to get the total price for all orders.
- You don't need `ORDER BY` in the subquery, because at the end you will order by the customer name.

So, part of your statement will be:

```
... FROM customers c JOIN (subquery) AS t ON ...
```

After the ON clause, you `GROUP BY c.customer_id, customer_name` and `ORDER BY` the customer_name. Note that you have two `customer_id` columns after the join, one being `c.customer_id` and the other being `t.customer_id`, so you have to fully qualify your references to `customer_id`. Return the following columns: the customer name and the AVG of the `total_price`, aliased as `average_order_price`.

It doesn't seem necessary to group by both `customer_id` and `customer_name`.  Since the `customer_id` values are unique, the `customer_name` field will be the same for each row when you group by `customer_id`.  But some SQL implementations don't figure this out up front, so they don't know which value to return.  You don't know that customer_name is unique, so you can't rely on that grouping.

Once you have this running in `sqlcommand`, add the statement to `assignment5-sql.txt`. Run the `tdd` test until the second test completes.

### **Task 3: Creating a New Order**

Create a new order for the customer named Perez and Sons. The customer wants 10 of the 5 least expensive products. The employee to be associated with the order is Miranda Harris.

Follow these steps:

- Create the statement that finds the `customer_id` for Perez and Sons. Once it works in `sqlcommand`, add it to `assignment5-sql.txt`.
- Next, create a statement to find the `employee_id` for Miranda Harris. When that works, add it to `assignment5-sql.txt.`
- Next, write a query to find the `product_id` for the 5 least expensive products. Add that to the assignment file too.
- Then, start a transaction with `BEGIN`, followed by an `INSERT` for the orders record with a `RETURNING` for the `order_id`, followed by an `INSERT` for the 5 line_items corresponding to the 5 least expensive products. Finally, commit the transaction with `COMMIT`.
  Once this sequence works in `sqlcommand`, add all 4 statements to the assignment file.
- Finally, write a `SELECT` statement to find all `line_items` corresponding to the new `order_id`, and return all the columns for these records. When this works, add that statement to the assignment file.

Hint 1: When you are trying this out in `sqlcommand`, if you do `BEGIN` followed by the `INSERT` of the orders record, followed by the `INSERT` of the line_items records, followed by the `COMMIT`, then, because you are typing this all in manually, the transaction may time out before you get to the `COMMIT`. So, as you are trying things out in `sqlcommand`, do it without the `BEGIN` and the `COMMIT`. But be sure to include the `BEGIN` and `COMMIT` in your homework file.

Hint 2: You will put a statement into your homework file that adds the 5 line items. Please add all 5 line items with a single statement. Within that statement, you use the `order_id` that was obtained by `RETURNING` it from the insert of the orders record. For the tdd test, the `order_id` you put in your statement won't be used, because the test will insert a different orders record, and it will use the `order_id` for that record. This is done using a parameterized query, a technique you will eventually need to learn. This is what you'd actually do in a program. See [here.](https://node-postgres.com/features/queries)

Hint 3: You can use any date you like, but it should be a string of format YYYY-MM-DD.

Then run the `tdd` test until the third test completes.

### **Task 4: Aggregation with Having**

Find all employees who are associated with more than five orders. You want the `first_name`, the `last_name`, and the count of the orders, which you return as `order_count`. To achieve this, perform a `JOIN` on the employees and orders tables. Then use `GROUP BY`, `COUNT`, and `HAVING` to filter the results, and sort them by `last_name`. Get this statement working in `sqlcommand`, and then add it to the assignment file.

Hint 1: You can't do `GROUP BY first_name, last_name` because you don't know that employees have unique names. You have to group by `employee_id`.  On the other hand, because you are returning the first_name and last_name in your SELECT, and you aren't aggregating on these fields, you need them in the `GROUP BY` as well.  You need `GROUP BY employees.employee_id, first_name, last_name`, because SQL might not figure out up front that there can't be several different first_name or last_name values in a group of rows when these are grouped only by employee_id.

Hint 2: You can't use `order_count` in your `HAVING` clause. You have to use `COUNT(order_id)` instead.

Get this running in `sqlcommand`, and then add the line to your homework file.

Then run the `tdd` test until the fourth test completes:

```bash
npm run tdd assignment5a
```

**This completes Assignment 5a.  Return to the lesson, and once you have finished it, do Assignment 5b.**

## **Assignment 5b**

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
Right now you are using globals to store users and a list of tasks for each. For this assignment, you want to eliminate all use of `global.users` and `global.tasks`, and read and write from the database instead. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

## Prerequisites
- Completed previous lessons with a working Express application
- Basic understanding of Node.js and Express
- PostgreSQL installed and running on your system

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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

You should see messages that tables were created.  This creates the schema for the production database.

#### d. Create Database Tables in the Test Database

You also need to create the schema for your test database.  This is used for the assignment TDD and also for your automated testing assignment in a later week.  The `psql` command is the same as the above, but you use the value of the `TEST_DATABASE_URL` from your `.env` file.

### 2. Database Connection Implementation

#### a. Create the Database Connection File

Create a folder in node-homework called `db`.  Within it, create `pg-pool.js` with the following content:

```javascript
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = pool;
```

This code was explained in the lesson.

#### b: Modify app.js: Graceful Shutdown

When your Node process ends, it might hang if database connections are not cleaned up.  Somewhere in the file, add this line:

```js
const pool = require("./db/pg-pool");
```

Then, in your shutdown function add this line (there is a comment in the code to show where it goes):

```javascript
await pool.end();
```

Otherwise your Node process may hang on exit.  You want it to release all database connections.

#### b. Modify app.js: Health Check

Modify the health check endpoint to verify database connectivity:

```js
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ message: `db not connected, error: ${ err.message }` });
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

You are going to substitute database calls for globals, except for `global.user_id`.  Let's start with logon in the user controller.  You will see that there aren't many try/catch stanzas.  That's because, for the most part, you can let the global error handler take care of error handling.

Your calls to the `pg` pool are asynchronous.  If some of your controller functions are not declared async you will need to change that.  You will need to call `next(err)` in some controller functions, in which case they must be declared with `req, res, next` as their parameters.

#### a. Changing Login

In userController.js, you need to have a require statement to give access to the pool, so put that near the top.  You currently do a find() on the storedUser array.  Well, you have to eliminate that.  This is the equivalent, assuming you have extracted email and password from the req.body:

```javascript
const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
```

The `result.rows` array might have 0 length, in which case authentication fails: you send back the 401 and the appropriate message.  Otherwise, you use your existing `comparePassword()` function to see if the password in the body of the request matches `result.rows[0].hashed_password`.  If it doesn't, you send the 401 and the authentication failed message.  But, if it does, you send a 200 and the appropriate message -- and you also put `result.rows[0].id` in global.user_id.

So: make those changes to the logon function now.

#### b: Changing Registration

Right now, you do a find() on the array in the memory store to see if the user is already registered.  If not, you add the user entry to the memory store.  When you switch to the database, you can do that in one step.  For this operation and all that follow, you still need to do Joi validation of your objects before writing them to the database.

```javascript
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  let user = null;
  value.hashed_password = await hashPassword(value.password);
  // the code to here is like the in-memory version
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
  return next(e); // all other errors get passed to the error handler
}
// otherwise user now contains the new user.  You can return a 201 and the appropriate
// object.  Be sure to also set global.user_id with the id of the user record you just created. 
```

Do not return the hashed_password or user_id of the user just created.  These should be removed before you send the response.  You should return a body with only the name and email.

#### c. Changing Logoff.

No change needed!

#### d. Changing the auth Middleware.

No change needed!

#### e. Changing Task Management: POST /api/tasks (create)

You will see that the attribute names change a little bit.  That is because lowercase column names are used in the database.

Here is how it's done with `pg`. The code below only shows the part you have to change.  Joi validation and the res.json() part are the same:

```javascript
// you do your Joi validation, and you have a validated task object. Then:
const task  = await pool.query(`INSERT INTO tasks (title, is_completed, user_id) 
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
  [value.title, value.is_completed, global.user_id]);
  // You don't need a try/catch because the global error handler will handle the errors
```

The attribute names change a little bit here. `isCompleted` becomes `is_completed`, because we use lower case column names in the database.

Note: You should not return the user_id.  That is a foreign key, and should only be known internally.  When using `global.tasks` you had to take out the userId value, but with the database, you can specify which columns to return, so you don't need that additional step.  

Of course, this operation could throw an error, for example if the database is down.  You do not need a try/catch in your controller for this, as your global error handler will take care of it.

#### f. Changing Task Management: GET /api/tasks (index)

In each of these task operations, the WHERE cause must filter on th `user_id`, so that a given user can't access a different user's task entries.  For `index()` you need:

```javascript
const tasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
  [global.user_id]
)
```

Again, in case of success, you should not return the user_id.

#### g. Changing Task Management: PATCH /api/tasks/:id (update)

This one's a little tricky.  You might update the title, or the is_completed, or both.  How can you assemble an SQL statement that would handle all these cases?

Note also: The WHERE clause for the update statement has to filter on both req.params.id (the task record to be updated) and also on global.user_id.  If you don't include global.user_id in the filter, one user could update another user's task records.

Let's assume that you have run req.body through Joi, and that taskChange is the object containing the updates you want.  The keys in taskChange will be in camelCase (like `isCompleted`), but the database columns use snake_case (like `is_completed`).  You need to map the keys to the database column names.  For the VALUES, we can build something up like this:

```javascript
let keys = Object.keys(taskChange);
keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
const idParm = `$${keys.length + 1}`;
const userParm = `$${keys.length + 2}`;
const updatedTask = await pool.query(`UPDATE tasks SET ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`, 
  [...Object.values(taskChange), req.params.id, global.user_id]);
```

This looks a little complicated, and there are other ways to do it if you only have two fields that might change, but if you have many fields, you'd need to do something like this. In the case of success, you want to return the updated object -- but not including the user_id.

#### h. Changing DELETE /api/tasks/:id (deleteTask)

Another one for you to do.  Remember to filter on user_id as well as the task id.

#### i. Changing GET /api/tasks/:id (show)

Same deal. Remember to filter on user_id as well as the task id.

Keep going until all dependency on the global arrays are gone.


### 4. Test Using Postman

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

Further, test to make sure that a user can't show, update, or delete a task that belongs to a different user.

### 5. Run the TDD 

Run `npm run tdd assignment5b`.  Make sure all tests complete correctly.

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
2. **User Operations**: Test registration and logon with password hashing
3. **Global User ID**: Verify user_id is stored globally after logon/registration
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

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Answer 3 questions from Lesson 5:

1. **What are the key concepts of relational databases and how do they work?**
   - Explain primary keys, foreign keys, and table relationships
   - Discuss one-to-one, one-to-many, and many-to-many associations
   - Explain what constraints are and why they're important
   - Show examples of how tables relate to each other

2. **What are the main SQL operations and how do you use them effectively?**
   - Explain the purpose of SELECT, INSERT, UPDATE, and DELETE
   - Show how to use JOINs to combine data from multiple tables
   - Demonstrate GROUP BY, HAVING, and aggregation functions
   - Explain the difference between WHERE and HAVING clauses

3. **How do you work with data from multiple tables and perform aggregations?**
   - Explain how to use JOINs to combine data from different tables
   - Show how to use GROUP BY with aggregation functions like SUM, COUNT, AVG
   - Explain the difference between WHERE and HAVING clauses

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show SQL examples (when needed)
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a `git add` and a `git commit` for the files you have created, so that they are added to the `assignment5` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment5` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
- **Don't forget to include your video link in the submission form!**
