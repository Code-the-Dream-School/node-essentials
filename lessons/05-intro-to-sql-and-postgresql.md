# **Lesson 5 — Introduction to Databases and SQL**

## **Lesson Overview**

**Topics**:

1. Introduction to SQL: What SQL is, why relational databases matter, and how constraints, associations, and transactions work.
2. The syntax, verbs, and clauses of the SQL language: SELECT, INSERT, UPDATE, DELETE, and table management.
3. Practicing SQL from a command line environment
4. More on JOINs.
5. BEGIN, COMMIT, and RETURNING.
6. SQL from a Node program.
7. Converting Your Tasks App From an in-memory store to PostgreSQL
8. Understanding Schema
9. Using the pg Package in Your Node App
10. Queries
11. Error Handling
12. Common Challenges and Solutions

## Learning Objectives
By the end of this lesson, you will be able to:
- Understand why databases are essential for web applications
- Explain the key concepts of PostgreSQL and relational databases
- Create tables with schemas
- Use the SQL language, including SELECT, INSERT, UPDATE, and other standard SQL verbs.
- Understand JOINs and transactions, primary and foreign keys, associations, and table constraints.
- Connect a Node.js application to PostgreSQL using the `pg` library
- Implement database operations (CRUD) in your Express controllers
- Understand database security concepts like parameterized queries
- Handle database connections and errors properly

## Overview
In this lesson, you will connect your Express application to PostgreSQL. Up to this point, your app has stored data in memory. That works for practice, but memory storage disappears when the server restarts. PostgreSQL gives your app a real database, so the data can stay available after the Node process stops.

This is the first of several changes to where your data lives and how your app tracks the logged-in user. For the big picture of how those pieces evolve across the whole course, see the [Data and Identity guide](../DATA-AND-IDENTITY-GUIDE.md).

**Prologue:**
Right now, your app uses `global.users` to store users and `global.tasks` to store each user's tasks. In this lesson, you will remove those globals and read from and write to the database instead. You will still use `global.user_id` for now. The REST calls your application supports should keep working the same way, so your Postman tests do not need to change.

**Prerequisites:** This lesson builds on the work you completed in **Week 4**, where you built a working Express application with in-memory storage. Make sure you have a functional Express app with user and task management before proceeding.

**Why This Matters:**
- **Data Persistence**: Your data survives server restarts and crashes
- **Scalability**: Can handle multiple users and larger datasets
- **Security**: Better data isolation and user ownership
- **Professional Development**: Real-world applications use databases, not memory storage

**The Problem with In-Memory Storage**

When you store data in JavaScript arrays or objects, that data exists only while your server is running. When you restart the server, the data disappears. Your server also has limited memory, much less than a production application usually needs.

**Databases Solve This Problem**

Databases store data on disk or in the cloud, so your data can still be there after your application stops running.

**Benefits of Database Storage:**
- **Persistence**: Data survives server restarts
- **Concurrent Access**: Multiple users can access data simultaneously
- **Data Integrity**: Built-in rules ensure data consistency
- **Backup & Recovery**: Easy to backup and restore data
- **Scalability**: Can handle millions of records efficiently

## **5.1 What SQL is, and Why it is Used**

SQL stands for Structured Query Language. It is the standard language used to work with relational databases such as MySQL, PostgreSQL, Microsoft SQL Server, Oracle Database, and others.

In a relational database, data is stored in tables. A table looks a little like a spreadsheet: it has rows and columns. The database also has a schema. The schema describes each table, each column, and the type of data each column can hold. For example, a column might be named `email`, `age`, or `created_at`, and the data type might be INTEGER, TEXT, or REAL.

This is different from a NoSQL database like MongoDB, where records can look more like flexible JSON documents. A strict schema may feel limiting at first, but it is also a strong foundation. It gives the database clear rules, which helps keep data organized and reliable as the application grows.

MongoDB is widely used and often feels natural in JavaScript applications. SQL asks you to think more carefully about tables, relationships, and schemas. That makes it a little more work to learn, but it also teaches important ideas used in many production systems.

Read the following introduction: <https://www.theodinproject.com/lessons/databases-databases-and-sql>. If you already know this material, you can jump to the Knowledge Check at the bottom of that page. Make sure you understand the ideas of Primary Key and Foreign Key.

There are two important words that introduction does not cover enough for this course: association and transaction.

### **Associations**

An association exists between tables when one table has a foreign key that points to another table. Here are three common cases:

1. An application has a `users` table and a `user_profiles` table. Each record in the `user_profiles` table has a foreign key, which is the primary key of a record in the `users` table. This is a **one-to-one** association.
2. An application has blogs. Each blog has a series of posts. The application might have a `blogs` table and a `posts` table. Each record in the `posts` table would have a foreign key for a `blogs` table record, indicating the blog to which it belongs. This is a **one-to-many** association, as one blog has many posts.
3. A magazine publisher has magazines and subscribers. Each subscriber may subscribe to several magazines, and each magazine may have many subscribers. This creates a challenge.

We cannot put a list of subscribers inside one magazine record. Relational database records do not work that way. We also do not want to duplicate the magazine information once for every subscriber. The solution is to add a table in the middle, often called a **join table**. In this example, the join table might be `subscriptions`. Each subscription record has two foreign keys: one for the magazine and one for the subscriber. This is a **many-to-many** association.

### **Transactions**

A transaction is a group of SQL operations that should succeed or fail together. Think about a banking operation where a user transfers money from one account to another. The steps might look like this:

- Begin the transaction.
- Read the amount in account A to make sure there's enough.
- Update that record to decrease the balance by the desired amount.
- Update that record to increase the balance by the desired amount.
- Commit the transaction.

The transaction keeps the data consistent. When the account is read, that entry can be locked. The details depend on the isolation level, which is an advanced topic, but the reason matters now. Without the lock, another withdrawal could happen after the balance is checked but before the balance is updated. That could make the account overdrawn.

You also do not want the first update to remove money from one account if the second update fails to add money to the other account. With a transaction, both write operations succeed or neither succeeds.

This is one of the strengths of relational databases. They are good at structured data, relationships between data, and operations that must stay consistent.

### **Constraints**

When a table is defined in the schema, you can also define **constraints**. A constraint is a rule the database enforces.

- Datatype constraints: One constraint comes from the datatype of the column. For example, you cannot put a TEXT value in an INTEGER column.
- NOT NULL constraint: When present, it means that whenever a record is created or updated, that column in the record must have a value.
- UNIQUE constraint: You wouldn't want several users to have the same ID for example.
- FOREIGN KEY constraint. In the blog example above, each post must belong to a blog. The post record has the blog's primary key as a foreign key. Otherwise, you could have a post that belongs to no blog.

If you create or update a record in a way that breaks a constraint, the database returns an error.

### **Different Relational Databases**

There are many implementations of relational databases. They all support SQL, but each one is optimized for different use cases. For very large data volumes or very high transaction rates, a company might use Amazon Aurora, BigQuery, or another database service.

SQL implementations also vary. A SQL statement that works in one database may need changes before it works in another. In this class, you will use PostgreSQL because it is free, widely used, and can run both on your laptop and in the cloud.

### **PostgreSQL**

PostgreSQL is often called Postgres. It is a powerful, open-source relational database management system, and it is commonly used for web applications. As part of your workspace setup, you installed PostgreSQL on your laptop. Later in the course, you will also use a cloud-hosted PostgreSQL database.

**Key Features:**
- **Open Source**: Free to use and modify
- **ACID Compliant**: Ensures data reliability and consistency
- **Extensible**: Can add custom functions and data types
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Production Ready**: Used by companies like Instagram, Reddit, and Netflix

(The acronym ACID, by the way, stands for Atomicity, Consistency, Isolation, and Durability, all critical functions for storing critical data.)

## **5.2 Learning and Practicing the SQL Language**

SQL is the language used to access relational databases. You use it for CRUD operations: Create, Read, Update, and Delete.

SQL is not where you write most of your application logic. Instead, JavaScript asks the database to run SQL operations. These are the key SQL verbs you will use:

- SELECT: Used for queries, to read subsets of the data.
- INSERT: Used to insert one or many records into a table.
- UPDATE: Used to modify one or many records in a table.
- DELETE: Used to delete one or many records from a table.
- BEGIN: Starts a transaction.
- COMMIT: Completes a transaction. All changes either complete successfully or none of them do, so that the database is kept in a consistent state.
- ROLLBACK: Rolls back the transaction. All uncommitted changes are discarded.
- CREATE DATABASE, DROP DATABASE: create or drop a database.
- CREATE TABLE, ALTER TABLE, DROP TABLE: manage the schema of the database, meaning the tables that comprise the database, the columns in each table, the datatypes for each column, primary and foreign keys, and constraints.

Now practice these ideas. Do **ALL** the exercises in this tutorial: [https://sqlbolt.com/](https://sqlbolt.com/). Be sure to do the additional topics on unions, intersections, exceptions, and subqueries.

W3Schools also provides a useful SQL reference [here.](https://www.w3schools.com/sql/default.asp) The TryIt editor in that tutorial does not work for most operations, so use it mainly as a reference.

### **Check For Understanding**

1. What SQL verb is used for read operations?

2. What is the clause that filters the records returned?

3. What would happen if you did a DELETE without a WHERE clause?

4. How can you insert multiple records with a single operation?

5. What are some aggregation functions to use with a SELECT? When you use an aggregation function, you often want to aggregate within groups. How do you do that?

6. What is the clause you use to filter on the results of an aggregation like SUM?

7. In SQLBolt lesson 7, you have two tables, Buildings and Employees. There is an association between the two tables. What kind of association? What is the primary key for Buildings? What is the foreign key in Employees?

8. How can you get a result set that combines data from multiple tables?

9. Suppose that you notice that the Employees table is two years out of date. How can you add 2 to each of the entries in the Years_employed column in a single operation?

### **Answers**

1. To read SQL records, you use the SELECT verb.

2. The WHERE clause filters the records (rows) returned. You can also specify the particular columns you want by listing them before the FROM in the select.

3. A DELETE without a WHERE clause would delete every record in the table.

4. You can insert multiple records by specifying multiple sets of values. For example, to add several records to the Buildings table from SQLBolt exercise 7, you could do:

   ```SQL
   INSERT INTO Buildings (Building_name, Capacity) VALUES ('3a', 35),('3b', 30);
   ```

   However, this won't work in SQLBolt, because of the limitations of that simulated environment.

5. Some aggregation functions are SUM, COUNT, AVG, MIN, and MAX. To aggregate in groups, you use GROUP BY. Using the Employees table from SQLBolt exercise 7, if you want to find the number of employees in each role, you could do:

   ```SQL
   SELECT Role, COUNT(Name) AS Count FROM Employees GROUP BY Role;
   ```

6. To filter on the results of an aggregate, you use HAVING. So suppose you only want the roles with at least 5 people. You would do:

   ```SQL
   SELECT Role, COUNT(Name) AS Count FROM Employees GROUP BY Role HAVING COUNT(Name) >= 5;
   ```

7. There is a one-to-many association between Buildings and Employees. One building may have many Employees. The schema you are shown doesn't make clear which is the primary key, but the primary key for Buildings appears to be Building_name. It is clear that Building is the foreign key in the Employees table: It points to an entry in the Buildings table.

8. To get a result set that combines entries from multiple tables, you use JOIN. When you JOIN, you match up entries from each table. You specify the matching rule with an ON clause. The default is an INNER JOIN, which will not include any data where the ON clause doesn't match.

9. You can change all records in the Employees table with a single UPDATE statement as follows:

   ```SQL
   UPDATE Employees SET Years_employed = Years_employed + 2;
   ```

   This would change all records in the Employees table, as there is no WHERE clause. Note, however, that this does not work in SQLBolt, because of the limitations of that tutorial.

## **5.3 A Command Line Practice Environment**

Your `node-homework` directory contains an SQL command-line tool. Make that directory active, then run the tool with:

```bash
node sqlcommand.js
```

This tool gives you SQL access to a Postgres database you created when you set up the `node-homework` directory. There are five tables:

- customers
- employees
- line_items
- products
- orders

The primary key for the customer table is `customer_id`, and it is an auto-incremented integer. The other tables have similar primary keys. From inside the `sqlcommand` environment, enter:

```SQL
SELECT * FROM customers LIMIT 5;
```

This shows you the schema for the customers table. Run the same query for the other tables. You will notice foreign keys in several of them. Those foreign keys show the associations between the tables.

### **Check For Understanding**

1. What is the association between customers and orders? Between employees and orders?

2. What is the association between orders and line_items? Between line_items and products?

3. There is an association between orders and products. What is it? What is the table in the middle that makes it work? What is this type of table called?

### **Answers**

1. There is a one-to-many association between customers and orders. A customer may have many orders. Similarly, there is a one-to-many association between employees and orders.

2. Similarly, there is a one-to-many association between orders and line items. There is also a one-to-many association between products and line_items: For a given product, there may be many line_items across different orders.

3. There is a many-to-many association between orders and products. There may be many orders for a product, and a given order may include many products. The table in the middle, called a join table, is line_items. So, for each order, there is a list of line_items, each corresponding to one product. Each line_items record also includes a quantity, which is how many of the given product is being ordered.

### **Tips on sqlcommand**

Here are some tips for using the `sqlcommand` command-line interface:

- You can enter multiple lines of input. These will only be processed when you end a line with a `;`.
- If you make a mistake, you can use the up and down arrows to recall your command, and you can edit it to correct the problem.
- If you do INSERT, UPDATE, or DELETE operations, you are changing your real data, the Postgres database that you created at neon.com. You can restore the database to its original state by running:

  ```bash
  node load-db.js
  ```

- When you specify a string value, you need to surround it with single quotes. This is the SQL standard, and Postgres requires compliance.
- In general, searches are case-sensitive.
- Ctrl+C quits the program.

## **5.4 More On Joins**

### **A Many-To-Many Association, Multiple Table Joins, and Aliasing**

Suppose you want a list of all the `product_name` values ordered by the customer named "Williams-Mack". You need the `customers` table because it contains customer names. You need the `orders` table because it connects customers to orders. For each order, you need the `line_items` table to see which products were ordered. Finally, you need the `products` table because that is where `product_name` lives.

So you need to join all of these tables together:

```SQL
SELECT DISTINCT product_name FROM customers JOIN orders ON customer_id = customer_id JOIN line_items ON order_id = order_id JOIN products ON product_id = product_id WHERE customer_name = 'Williams-Mack';
```

The DISTINCT filter handles the case where the customer ordered the same product more than once. However, the statement above does not work yet. Several tables have a `customer_id` column. Several have an `order_id` column, and several have a `product_id` column. SQL needs to know which table each shared column name comes from, so you need to fully qualify the ambiguous column names:

```SQL
SELECT DISTINCT product_name FROM customers JOIN orders ON customers.customer_id = orders.customer_id JOIN line_items ON orders.order_id = line_items.order_id JOIN products ON line_items.product_id = products.product_id WHERE customer_name = 'Williams-Mack';
```

You do not need to fully qualify `product_name`, because it only exists in one table. The statement above works, but it is a lot to type. To make it shorter and easier to read, you can use **aliasing**. Aliasing gives a table a short nickname, usually one letter, so you do not have to type the full table name over and over:

```SQL
SELECT DISTINCT product_name FROM customers AS c JOIN orders AS o ON c.customer_id = o.customer_id JOIN line_items AS l ON o.order_id = l.order_id JOIN products AS p ON l.product_id = p.product_id WHERE customer_name = 'Williams-Mack';
```

You can make it even shorter by leaving out the word AS:

```SQL
SELECT DISTINCT product_name FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN line_items l ON o.order_id = l.order_id JOIN products p ON l.product_id = p.product_id WHERE customer_name = 'Williams-Mack';
```

Aliasing is also useful for renaming the columns returned in your results. Use double quotes around the new column name when needed:

```SQL
SELECT DISTINCT product_name "product names" FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN line_items l ON o.order_id = l.order_id JOIN products p ON l.product_id = p.product_id WHERE customer_name = 'Williams-Mack';
```

Now the column will appear as "Product Names" instead of "product_name" in your results.

Copy the statement above and run it in sqlcommand.

## **5.5 Using BEGIN, COMMIT, and RETURNING**

In the SQLBolt examples, you did not use transactions explicitly. Since there was no BEGIN, the database automatically opened and committed a transaction for each write operation. Now you will practice a transaction in `sqlcommand`.

Suppose you want to create an order for the customer named "Conrad-Harris". The order is associated with employee David Thornton. It should include 2 of "Fantastic Shoes" and 5 of "Sausages".

To create this order, you need the `customer_id` for "Conrad-Harris", the `employee_id` for David Thornton, and the `product_id` values for "Fantastic Shoes" and "Sausages". You also need to create one `orders` record and two `line_items` records. These writes should all happen together. If one succeeds and another fails, the database would be inconsistent.

### **Schema Violations and the Foreign Key Constraint**

Try this statement first:

```SQL
INSERT INTO orders (date) VALUES ('2025-03-11');
```

This does not work because the schema says `customer_id` and `employee_id` cannot be null. What do you think will happen if you try the following? Try it and see.

```SQL
INSERT INTO orders (customer_id, employee_id, date) VALUES (9000, 9001, '2025-03-11');
```

This does not work because it violates the foreign key constraint. There is no customers record with `customer_id = 9000`. How about this:

```SQL
DELETE FROM customers WHERE customer_name = 'Conrad-Harris';
```

This does not work either. This customer has an order. If the customer record were deleted, there would be an order record with no matching customer record. That would also violate the foreign key constraint.

### **Steps to create the Order**

1. Begin the transaction.
2. Resolve the customer_id, the employee_id, and the product_ids.
3. Create the orders record.
4. Create the two line_items records.
5. Commit the transaction.

There is one more useful tool here: `RETURNING`. When you create the `orders` record, you do not specify the `order_id`. The database assigns it automatically. But you need that `order_id` to create the `line_items` records. So you add `RETURNING order_id` to the INSERT statement for the order. For INSERT, UPDATE, or DELETE operations, you can return a list of columns or use `*` to return all columns.

### **Check for Understanding**

1. See if you can specify each of the 5 SQL statements you need. For the date, use '2025-03-11'. There are actually two products with product_name = 'Sausages', so you use the first of these.

2. Try them out in sqlcommand. You paste them in one at a time.

### **Answer**

1. The statements you need are:

```SQL
BEGIN;
SELECT customer_id FROM customers WHERE customer_name = 'Conrad-Harris';
SELECT employee_id FROM employees WHERE first_name = 'David' AND last_name='Thornton';
SELECT product_id FROM products WHERE product_name = 'Fantastic Shoes';
SELECT product_id FROM products WHERE product_name = 'Sausages';
INSERT INTO orders (customer_id, employee_id, date) VALUES (3, 2, '2025-03-11') RETURNING order_id;
INSERT INTO line_items (order_id, product_id, quantity) VALUES (252, 1, 2), (252, 3, 5);
COMMIT;
```

The value you need to use for order_id (252 in the example above) will vary.

2. You can check to make sure the records were written, using the following (and again, order_id may be different for you):

```SQL
SELECT * FROM line_items WHERE order_id = 252;
```

### **Why Start the Transaction Before the Selects?**

In this order example, you do not really need to start the transaction before the SELECT statements. But imagine a bank transfer again. You would want to check the source account balance inside the transaction before transferring money. If the transaction isolation level is SERIALIZABLE, that record is locked so it cannot change before the transfer happens. If there is not enough money, the right step is to roll back the transaction and tell the user the transfer cannot be completed.

In the order example above, the `customer_id`, `product_id`, and `employee_id` values are not likely to change while you are working.

### **Advanced Topic: Locking and Database Isolation Levels**

The actual behavior of the database during a transaction depends on the configured **isolation level**. This is an advanced topic. Eventually, every back end developer who uses SQL needs to understand isolation levels, and you may be asked about them in an interview. For now, this section is optional. The default isolation level for your Postgres database gives you the behavior you need for this project.

<details>
<summary style="font-size: 1.3em;">Understanding Isolation Levels</summary>

While a transaction is in progress, the records it touches in the database may be locked. This can be important to maintain consistency, for example for the bank transfer case above. But, there is a downside. If you hold a lock, other concurrent processes that attempt to access the relevant records have to wait. Eventually either your transaction times out or those other processes do. So, if you have a transaction in process, you don't want to delay. Get the work done and COMMIT or ROLLBACK.

There are four standard isolation levels for relational databases:

1. READ UNCOMMITTED: Read operations from other processes may get dirty reads, values that have been written but not committed. This one is rarely used. Postgres doesn't even support it.

2. READ COMMITTED: Read operations from other processes only get the values that are committed. Seems pretty good, right? But it isn't, for some uses. Suppose you are reporting on Tom's accounts. He has three, balances as follows:

   - Account 1: 500
   - Account 2: 100
   - Account 3: 50
     Now you want to report the amount in each, and also the total. So you do:

   ```SQL
   BEGIN;
   SELECT balance FROM accounts WHERE name = 'Tom';
   SELECT SUM(balance)
   COMMIT;
   ```

   And you get back:  
   500  
   100  
   50  
   750  
   Well, this doesn't add up. Why? Between the first and second SELECT statements, some other process deposited 100 into account 3. So, you need more isolation.

3. REPEATABLE READ: In this case, you get a snapshot. For the same transaction as above, you would report:  
   500  
   100  
   50  
   650  
   Which is looking better. There are still some potential problems though. Suppose that between the first and second SELECT operations, some other process opened another account for Tom, with balance 100. You could then have a phantom read, which returns as follows:  
   500  
   100  
   50  
   750  
   Postgres, and some other SQL implementations, prevent phantom reads in REPEATABLE READ isolation, so for read-only transactions, this is a reasonable isolation level. However ... the records **still** aren't locked. Consider this sequence:

   ```SQL
   BEGIN;
   SELECT balance FROM accounts WHERE account_id = 3;
   ```

   Then, if the balance suffices, let Tom withdraw 40:

   ```SQL
   UPDATE accounts SET balance = balance - 40 WHERE account_id = 3;
   COMMIT;
   ```

   This might result in Tom going overdrawn. Between the SELECT and the UPDATE, some other process could change the value in Tom's account number 3.

4. SERIALIZABLE: In this case, the records retrieved **are locked** for the duration of the transaction. So then Tom can't go overdrawn, given the sequence above.

The more isolation you have, the greater the locking cost, but the stronger your guarantees of data integrity.

The default isolation level for the Postgres database you are using is READ COMMITTED. You can change this default when establishing a connection, and you can also change it for a particular transaction.

</details>

## **5.6 SQL in a Node Application**

There are several ways to run SQL from Node. In this lesson, you will use the `node-postgres` package, usually called `pg`. The `pg` package sends the SQL statements you write to PostgreSQL. You have two example `pg` programs in your `node-homework` folder:

- load-db.js. This connects to the database, creates the tables with the appropriate column names, data types, and schema constraints, and populates each table with values from CSV files, which are in the csv folder of your node-homework directory.
- sqlcommand.js.

Look through each of these programs so you can see how `pg` performs SQL operations.

Spend a little time with this. It is useful to know how `pg` works. Many Node applications also use an Object-Relational Mapper, or ORM. An ORM can make schema management and data manipulation easier because you do not write SQL for every operation. At the same time, you cannot really learn SQL if you only use an ORM.

**At this point, please proceed to your assignment.  Do the exercises in Assignment 5a.  When those are complete, resume reading this lesson.

## **5.7 Converting Your Tasks App From the Memory Store to PostgreSQL**

Now that you understand what SQL does, it is time to use it from your app. You will start with the `pg` package.

### **Configuring the Connection**

Database connections require a connection string, which is a URL. You created several connection strings during Assignment 0, and they are stored in your `.env` file. The connection string includes the host, database name, SSL mode, user ID, and password. The password must stay secret, so it belongs in `.env`, never in your source code. Make sure `.env` is listed in `.gitignore`. You do not use SSL for the local connection, but you will use SSL for the cloud database.

In your app, you want to centralize database connection management for two reasons:

- When you stop the server, you need to bring all database connections to a graceful end.
- You want to have a pool of reused connections for efficiency.

You will create a dedicated module in a `db` folder for this purpose.

## **5.8 Understanding Schema**

The schema of a relational database describes the tables and their properties. Each table has a name and a list of columns. Each column has a name and a datatype, such as String, Int, Boolean, or Timestamp. One column is usually the primary key.

The schema also describes constraints. For example, some columns cannot be null, and some columns must contain unique values. The schema can also define relationships between tables. These relationships implement the associations described earlier, usually with one or more foreign keys that point to records in another table.

The following SQL statements create the tables with those schema elements.

**Users Table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(30) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
);
```

**Tasks Table:**
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT task_id_user_id_unique UNIQUE (id, user_id)
);
```

### Understanding the Schema
- **`SERIAL PRIMARY KEY`**: Creates an auto-incrementing unique identifier
- **`VARCHAR(255)`**: Variable-length string with maximum 255 characters
- **`NOT NULL`**: Field cannot be empty
- **`UNIQUE`**: No two users can have the same email
- **`REFERENCES users(id)`**: Creates a foreign key relationship
- **`DEFAULT CURRENT_TIMESTAMP`**: Automatically sets the current time
- **CONSTRAINT task_id_user_id_unique UNIQUE (id, user_id)** Creates an additional index.  

The additional index is needed for assignment 6. 

## **5.9 Using the pg Package in Your Node App.**

You will use the `pg` package, which you will install as part of the assignment. In an Express application, many requests can happen at the same time. You do not want to create a brand-new database connection for each request. Instead, you will use a pool. In your assignment, you will put the following code in a `pg-pool` module in the `db` folder.

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

**Understanding the Code:**
- **`Pool`**: Manages multiple database connections efficiently
- **`connectionString`**: Uses your DATABASE_URL from environment variables
- **`sslmode`**: Postgres hosting platforms (like the Neon one you will use) require SSL, and will have a connection string that specifies the sslmode. For local development, your socket is local so you don't need SSL.
- **`module.exports`**: Makes the pool available to other files

You also need the `pool.on('error' ...` event handling in case an idle pool connection throws an error. Without this, an unexpected pool error can disrupt your Node process.

### Why Use Connection Pooling?
Instead of creating a new connection for each database operation, a pool keeps several connections ready and reuses them. This is faster and more efficient than opening a new connection every time.

**Important:** When stopping your application, use `await pool.end()` to close all connections cleanly and prevent connection leaks.  In your assignment, you'll add this logic to the shutdown handling for your app.

---

## **5.10 Queries**

You will run database queries in your controllers. Here are some sample queries:

```js
const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
const newUser = await pool.query(`INSERT INTO users (email, name, hashed_password) 
    VALUES ($1, $2, $3) RETURNING id, email, name`,
    [email, name, hashed_password]
  );
```

When you call `pool.query()`, the pool gives you a connection. If that connection is not connected to an actual socket yet, it connects when you issue the query.

The query itself is just a SQL statement, but notice the `($1, $2, $3)` placeholders. These are parameters you pass to the query. You could use string interpolation to put values directly into the SQL string, but do not do that. It would make your code vulnerable to SQL injection, where an attacker adds hostile SQL inside your statement. With parameterized queries, values are treated as data and dangerous characters are escaped.

After the pool provides a client connection, the query runs. When the query is complete and the results are returned, the connection goes back to the pool. If the server gets busy, `pool.query()` may wait until a connection is available.

What about transactions? `pool.query()` performs one query in an automatic transaction. If you need several queries to be part of one transaction, the process is a little more complicated. The following sequence might occur in a banking application:

```js
async function runTransactionalWork() {
  const client = await pool.connect(); // Checkout a client from the pool
  let success = true;
  let reasonMessage;
  try {
    await client.query("BEGIN"); // Start transaction

    // Example operation #1
    const userResult = await client.query(
      `SELECT * FROM users WHERE email = $1`,
      ["testuser@example.com"]
    );
    if (userResult.rows.length) { // if the user was found
      const userId = userResult.rows[0].id;

      // Example operation #2
      const balanceResult = await client.query(
        `SELECT balance FROM accounts WHERE user_id = $1`, [user_id]
      );

      if (balanceResult.rows.length && balanceResult.rows[0].balance >= 100) {

        // Example operation #3
        const balanceAfter = await client.query(
          `UPDATE accounts SET balance = balance - 100 WHERE user_id = $1 RETURNING balance`,
          [userId]
        );
        console.log("New balance:", balanceAfter.rows[0].balance);
        await client.query("COMMIT"); // Success → commit the transaction

      } else { // not enough money
        console.log("Not enough money for that withdrawal");
        success = false;
      }
    } else { // the user for that email wasn't found
      console.log("User not found.");
      success = false;
    }
    if (!success) {
      await client.query("ROLLBACK"); // can't do the withdrawal, so rollback
    }
    return { success, userId };
  } catch (err) {
    await client.query("ROLLBACK"); // Failure → rollback the transaction
    console.error("Transaction failed, rolled back.", err);
    throw err; // propagate error to caller
  } finally {
    client.release(); // Always release the client back to the pool
  }
}
```
In summary, for transactions, you do this:

- checkout client
- begin transaction
- query
- more queries
- commit transaction
- or, in case of errors, rollback the transaction
- return the client to the pool.

We won't do transactions with `pg`.

### **What is SQL Injection?**
SQL injection is a security vulnerability where malicious users can execute unauthorized SQL commands through your application.

**Example of Vulnerable Code:**
```javascript
// DANGEROUS - vulnerable to SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**Example of Safe Code:**
```javascript
// SAFE - uses parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
```

**Why Parameterized Queries are Safe:**
- Values are treated as data, not as SQL code
- Special characters are automatically escaped
- Prevents malicious SQL from being executed

### User Ownership Validation
Always verify that users can access only their own data:

```javascript
// Ensure user can only access their own tasks
const result = await pool.query(
  'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
  [taskId, userId]
);

if (result.rows.length === 0) {
  return res.status(404).json({ error: "Task not found or access denied" });
}
```

**Important Security Note:**
You are going to use a globally stored `user_id`. This is temporary. The global `user_id` approach used here is **NOT secure** for production applications. It means that once someone logs in, anyone else can access that logged-in user's tasks because there is only one global value. This matches the behavior from Lesson 4 for now, but a real application needs proper session management, JWT tokens, or another secure authentication approach. You will fix this in Assignment 8.

---

## **5.11. Error Handling**

### Database Error Types

Different types of errors can happen when working with databases. Usually, you let these errors fall through to the global error handler middleware.

Sometimes, though, you need to catch a specific error inside your controller. For example, if a user tries to register with an email address that is already registered, you want to catch that error in the controller so you can return a helpful message.

**Connection Errors:**

You want a special log message in your error handler for connection errors, especially in case you forgot to start your Postgres service.

You may also get query errors. A query could time out. A request to the pool could fail because all connections are busy. A write could fail because the data does not follow the schema. In general, you log these errors in your global error handler and return a `500` response with the corresponding JSON internal server error message.

### A Health Check API

It is common to have a health check API so you can see whether the application is functioning. You already have a health check, but now it should report a problem if the app cannot connect to the database.

---

## **5.12. Common Challenges and Solutions**

### Challenge: Database Connection Fails
**Symptoms:** `ECONNREFUSED` error
**Solutions:**
- Check if PostgreSQL is running
- Verify connection string in `.env`
- Check firewall settings
- Ensure correct port number

### Challenge: Tables Don't Exist
**Symptoms:** `42P01` error (undefined table)
**Solutions:**
- Run your schema SQL file
- Check table names in your queries
- Verify database name in connection string

### Challenge: Permission Denied
**Symptoms:** `42501` error (insufficient privilege)
**Solutions:**
- Check database user permissions
- Verify username and password
- Ensure user has access to the database

---

## **Summary**

In this lesson, you learned:
- Why databases are essential for web applications
- How PostgreSQL works as a relational database
- How to connect Node.js to PostgreSQL using the `pg` library
- How to implement database operations in your controllers
- Security best practices like parameterized queries
- Proper error handling for database operations

### Next Steps
1. **Complete Assignment 5** following this lesson.  You have done 5a, so complete 5b.
2. **Test your database connection** and API endpoints

---

### Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Package](https://node-postgres.com/)
- [Express.js Documentation](https://expressjs.com/)
- [SQL Tutorial](https://www.w3schools.com/sql/)
- [Database Design Basics](https://www.postgresql.org/docs/current/tutorial.html)

---

### Getting Help

- Review the lesson materials thoroughly
- Check your database connection and credentials
- Use `console.log` statements for debugging
- Test each endpoint individually
- Ask for help if you get stuck on specific concepts
