# **Lesson 5 — Introduction to Databases and SQL**

## **Lesson Overview**

**Learning Objectives**: Students will gain foundational knowledge of SQL databases using Postgres. They will understand the basic purpose and attributes of SQL databases. They will learn the SQL language, including SELECT, INSERT, UPDATE, and other standard SQL verbs. They will understand JOINs and transactions, primary and foreign keys, associations, and table constraints. They will learn how to create tables with schemas. This is a generalized introduction to SQL, so no Object Relational Mapper (ORM) will be used. In this lesson, the focus is on SQL itself, so there will be no JavaScript code developed.

**Topics**:

1. Introduction to SQL: What SQL is, why relational databases matter, and how constraints, associations, and transactions work.
2. The syntax, verbs, and clauses of the SQL language: SELECT, INSERT, UPDATE, DELETE, and table management.
3. Practicing SQL from a command line environment
4. More on JOINs.
5. BEGIN, COMMIT, and RETURNING.
6. SQL from a Node program.
7. Converting Your Tasks App From the Memory Store to PostgreSQL
8. Understanding Schema
9. Using the pg Package in Your Node App
10. Queries
11. Error Handling
12. Common Challenges and Solutions

## Learning Objectives
By the end of this lesson, you will be able to:
- Understand why databases are essential for web applications
- Explain the key concepts of PostgreSQL and relational databases
- Connect a Node.js application to PostgreSQL using the `pg` library
- Implement database operations (CRUD) in your Express controllers
- Understand database security concepts like parameterized queries
- Handle database connections and errors properly

## Overview
In this lesson, you will learn how to integrate PostgreSQL with your Node.js Express application. You'll move from storing data in memory (which gets lost when the server restarts) to using a persistent database that keeps your data safe and accessible.

**Prologue:**
Right now you are using `memoryStore.js` to store users and a list of tasks for each. For this lesson, you want to eliminate all use of `memoryStore.js`, and to read and write from the database instead. The REST calls your application supports should still work the same way, so that your Postman tests don't need to change.

**Prerequisites:** This lesson builds on the work you completed in **Week 4**, where you built a working Express application with in-memory storage. Make sure you have a functional Express app with user and task management before proceeding.

**Why This Matters:**
- **Data Persistence**: Your data survives server restarts and crashes
- **Scalability**: Can handle multiple users and larger datasets
- **Security**: Better data isolation and user ownership
- **Professional Development**: Real-world applications use databases, not memory storage

**The Problem with In-Memory Storage**

When you store data in JavaScript arrays or objects, that data exists only while your server is running. When you restart your server, all the data disappears.  Also, your server only has so much memory, much less than a production application would typically need to store.

**Databases Solve This Problem**

Databases store data on disk (or in the cloud), so your data persists even when your application stops running.

**Benefits of Database Storage:**
- **Persistence**: Data survives server restarts
- **Concurrent Access**: Multiple users can access data simultaneously
- **Data Integrity**: Built-in rules ensure data consistency
- **Backup & Recovery**: Easy to backup and restore data
- **Scalability**: Can handle millions of records efficiently

## **5.1 What SQL is, and Why it is Used**

SQL (Structured Query Language) is the standard language used to access relational databases such as MySQL, PostgreSQL. In a relational database, the data is stored in tables, each of which looks like a spreadsheet. The database has a schema, and for each table in the database, the schema describes the columns, giving each column a name (like "email" or "age") and a data type such as INTEGER (for whole numbers), TEXT or REAL (for decimals). One can compare this to NoSQL databases like MongoDB, in which you can store any JSON document you like. The relational database schema can seem like a straitjacket, but it is really more like a set of rails, organizing data into a structured form. It's a good idea to learn MongoDB as well, of course, as it is widely used - but MongoDB is pretty easy to learn. SQL is a deeper topic.

Read the following introduction: <https://www.theodinproject.com/lessons/databases-databases-and-sql>. Or, if you know this stuff, jump to the bottom of that page and do the Knowledge Check. Be sure that you understand the concepts of Primary Key and Foreign Key.

There are two important words left out of that introduction: Association and Transaction.

### **Associations**

An association exists between tables if one table has a foreign key that points to the other. Consider the following cases:

1. An application has a `users` table and a `user_profiles` table. Each record in the `user_profiles` table has a foreign key, which is the primary key of a record in the `users` table. This is a **one-to-one** association.
2. An application has blogs. Each blog has a series of posts. The application might have a `blogs` table and a `posts` table. Each record in the `posts` table would have a foreign key for a `blogs` table record, indicating the blog to which it belongs. This is a **one-to-many** association, as one blog has many posts.
3. A magazine publisher has magazines and subscribers. Each subscriber may subscribe to several magazines, and each magazine may have many subscribers. This creates a challenge.

We can't put a list of subscribers into a magazine record. Relational database records can't contain lists. For a given magazine, we could create one record for each subscriber, but we'd be duplicating all the information that describes the magazine many times over. Similarly, there is no way for the `subscribers` table to contain records for each magazine for each subscriber. So, you need a table in the middle, sometimes called a **join table**. In this case, the join table might be `subscriptions`. Each subscription record has two foreign keys, one for the magazine and one for the subscriber. This is a **many-to-many** association.

### **Transactions**

A transaction is a write operation on an SQL database that guarantees consistency. Consider a banking operation. A user wants to transfer money from one account to another. The sequence of SQL operations is as follows (this is pseudocode of course):

- Begin the transaction.
- Read the amount in account A to make sure there's enough.
- Update that record to decrease the balance by the desired amount.
- Update that record to increase the balance by the desired amount.
- Commit the transaction.

The transaction maintains consistency. When the read occurs, that entry is locked. (This depends on the isolation level and other stuff we won't get into now.) That lock is important, as otherwise there could be another withdrawal from the account that happens after the read but before the update, and the account would go overdrawn. You also don't want the update that decreases the balance to complete while the update that increases the balance in the other account fails. That would anger the user, and justifiably so. With transactions, either both write operations succeed or neither succeeds.

The strength of relational databases, compared with NoSQL databases, is the efficient handling of structured and interrelated data and transactional operations on that data.

### **Constraints**

When a table is defined in the schema, one or several **constraints** on the values may also be specified.

- Datatype constraints: One constraint comes from the datatype of the column: you can't put a TEXT value in an INTEGER column, etc.
- NOT NULL constraint: When present, it means that whenever a record is created or updated, that column in the record must have a value.
- UNIQUE constraint: You wouldn't want several users to have the same ID for example.
- FOREIGN KEY constraint. In the blog example above, each post must belong to a blog, meaning that the post record has the blog's primary key as a foreign key. Otherwise you'd have a post that belonged to no blog, a worthless situation.

If you try to create a record that doesn't comply with constraints, or update one in violation of constraints, you get an error.

**PostgreSQL**

PostgreSQL (often called "Postgres") is a powerful, open-source relational database management system. It's one of the most popular databases for web applications.  As part of your workspace setup, you installed PostgreSQL on your laptop, but database access can also be remote.  Later in the course, you will use a cloud resident implementation of PostgreSQL.

**Key Features:**
- **Open Source**: Free to use and modify
- **ACID Compliant**: Ensures data reliability and consistency
- **Extensible**: Can add custom functions and data types
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Production Ready**: Used by companies like Instagram, Reddit, and Netflix

(The acronym ACID, by the way, stands for Atomicity, Consistency, Isolation, and Durability, all critical functions for storing critical data.)

## **5.2 Learning and Practicing the SQL Language**

SQL is the language used to access relational databases. You use it to do CRUD operations: Create, Read, Update, and Delete. You don't use SQL to implement program logic. Instead, from a language like JavaScript, you invoke SQL operations. The key verbs in SQL are as follows:

- SELECT: Used for queries, to read subsets of the data.
- INSERT: Used to insert one or many records into a table.
- UPDATE: Used to modify one or many records in a table.
- DELETE: Used to delete one or many records from a table.
- BEGIN: Starts a transaction.
- COMMIT: Completes a transaction. All changes either complete successfully or none of them do, so that the database is kept in a consistent state.
- ROLLBACK: Rolls back the transaction. All uncommitted changes are discarded.
- CREATE DATABASE, DROP DATABASE: create or drop a database.
- CREATE TABLE, ALTER TABLE, DROP TABLE: manage the schema of the database, meaning the tables that comprise the database, the columns in each table, the datatypes for each column, primary and foreign keys, and constraints.

Now, learn these and practice! Do **ALL** the exercises in the following tutorial: [https://sqlbolt.com/](https://sqlbolt.com/). Be sure to do the exercises for the additional topics on unions, intersections, exceptions, and subqueries.

W3Schools provides a useful and comprehensive reference [here.](https://www.w3schools.com/sql/default.asp) However, the TryIt editor provided with the tutorial doesn't work for most operations.

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

Your node-homework directory contains an SQL command line tool. Make that directory active, and then run the tool with:

```bash
node sqlcommand.js
```

This tool gives you SQL access to a Postgres SQL database you created when you set up the node-homework directory. There are five tables:

- customers
- employees
- line_items
- products
- orders

The primary key for the customer table is customer_id, and this is an autoincremented integer. There are similar primary keys for each of the tables. From within the sqlcommand command line environment, enter:

```SQL
SELECT * FROM customers LIMIT 5;
```

This shows you the schema for the customers table. Run this same query for each of the other tables. You will notice some foreign keys in several of the tables. Based on the foreign keys, you should recognize that there are associations between these tables.

### **Check For Understanding**

1. What is the association between customers and orders? Between employees and orders?

2. What is the association between orders and line_items? Between line_items and products?

3. There is an association between orders and products. What is it? What is the table in the middle that makes it work? What is this type of table called?

### **Answers**

1. There is a one-to-many association between customers and orders. A customer may have many orders. Similarly, there is a one-to-many association between employees and orders.

2. Similarly, there is a one-to-many association between orders and line items. There is also a one-to-many association between products and line_items: For a given product, there may be many line_items across different orders.

3. There is a many-to-many association between orders and products. There may be many orders for a product, and a given order may include many products. The table in the middle, called a join table, is line_items. So, for each order, there is a list of line_items, each corresponding to one product. Each line_items record also includes a quantity, which is how many of the given product is being ordered.

### **Tips on sqlcommand**

Here are some tips on using the sqlcommand command line interface:

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

Suppose you want to have a list of all the product_names ordered by the customer named "Williams-Mack". You need to use the customers table, because that contains the customer names. You need to use the orders table. For a given order, you can only find out which products were ordered by using the line_items table. And the product_name values are in the products table. So, you need to join all of these together, as follows:

```SQL
SELECT DISTINCT product_name FROM customers JOIN orders ON customer_id = customer_id JOIN line_items ON order_id = order_id JOIN products ON product_id = product_id WHERE customer_name = 'Williams-Mack';
```

The DISTINCT filter handles the case where the customer orders a given product several times. Well, of course, the statement above does not work. Several of the tables have a customer_id column. Several have an order_id column, and several have a product_id column. So, you need to fully qualify the column names for ambiguous columns:

```SQL
SELECT DISTINCT product_name FROM customers JOIN orders ON customers.customer_id = orders.customer_id JOIN line_items ON orders.order_id = line_items.order_id JOIN products ON line_items.product_id = products.product_id WHERE customer_name = 'Williams-Mack';
```

You don't need to fully qualify product_name, because product_name only exists in one table, so SQL knows which table you mean. The statement above will work, but it's a lot of typing! To make it shorter and easier to read, you can use **aliasing** — giving tables nickname letters. Aliasing means giving a table a short nickname (usually one letter) so you don't have to type the full table name over and over:

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

In the examples in SQLBolt, you did not use transactions explicitly. As there was no BEGIN, a transaction was automatically opened and committed with each write operation. You will now practice a transaction in sqlcommand.

Suppose you want to create an order for the customer named "Conrad-Harris". The order is to be associated with employee David Thornton, it should include 2 of "Fantastic Shoes" and 5 of Sausages. To create this order, you need to use the customer_id for "Conrad-Harris", the employee_id of David Thornton, and the product_id values for "Fantastic Shoes" and "Sausages". You need to create the orders record and two line_items records. You want to be sure that the creation of the orders record and both of the line_items records all happen or all fail, otherwise the database will be inconsistent.

### **Schema Violations and the Foreign Key Constraint**

Try this statement first:

```SQL
INSERT INTO orders (date) VALUES ('2025-03-11');
```

This doesn't work, because the schema for the customer_id and employee_id columns specifies NOT NULL. What do you think will happen if you try the following? Try it and see.

```SQL
INSERT INTO orders (customer_id, employee_id, date) VALUES (9000, 9001, '2025-03-11');
```

This doesn't work, because you are violating the foreign key constraint. There is no customers record with customer_id = 9000. How about this:

```SQL
DELETE FROM customers WHERE customer_name = 'Conrad-Harris';
```

This doesn't work either. This customer has an order. If the customer record were deleted, there would be an order record with no corresponding customer record, again violating the foreign key constraint.

### **Steps to create the Order**

1. Begin the transaction.
2. Resolve the customer_id, the employee_id, and the product_ids.
3. Create the orders record.
4. Create the two line_items records.
5. Commit the transaction.

There is one more trick, which is to use `RETURNING`. When you create the orders record, you do not specify the order_id. That is assigned automatically. But, you need to know the order_id to create the line_items records. So, you specify `RETURNING order_id` on the INSERT statement for the order. You can return a list of columns, or use `*` to get all columns, for any INSERT, UPDATE, or DELETE operations you do.

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
INSERT INTO orders (customer_id, employee_id, date) VALUES(3,2, '2025-03-11') RETURNING order_id;
INSERT INTO line_items (order_id, product_id, quantity) VALUES (252, 1, 2), (252, 3, 5);
COMMIT;
```

The value you need to use for order_id (252 in the example above) will vary.

2. You can check to make sure the records were written, using the following (and again, order_id may be different for you):

```SQL
SELECT * FROM line_items WHERE order_id = 252;
```

### **Why Start the Transaction Before the Selects?**

Actually, in this case, you don't need to. But suppose you are doing a bank transfer. You want to be sure that when you do the transfer, there is enough money in the source account, so you do a SELECT to check, within the transaction. If the isolation level for the transaction is SERIALIZABLE, that locks the record in the table, so that it can't change before the transfer occurs. If there isn't enough money, the right step is to rollback the transaction and tell the user tough luck. But, in the case above, the customer_id, the product_id, and the employee_id aren't going to change.

### **Advanced Topic: Locking and Database Isolation Levels**

The actual behavior of the database during the transaction depends on the configured **isolation level**.  This is an advanced topic.  Sooner or later, every back end developer that uses SQL has to understand about isolation levels, and you may be asked about it during a job interview.  But, for now, the following section is optional.  The default isolation level for your Posgres database ensures the behavior you need for this project.

<details>
<summary style="font-size: 1.3em;">Understanding Isolation Levels</summary>

While a transaction is in progress, the records it touches in the database may be locked. This can be important to maintain consistency, for example for the bank transfer case above. But, there is a downside. If you hold a lock, other concurrent processes that attempt to access the relevant records have to wait. Eventually either your transaction times out or those other processes do. So, if you have a transaction in process, you don't want to diddle about. Get the work done and COMMIT or ROLLBACK.

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

There are several ways to do SQL in Node. You can use the `node-postgres` (pg) package. That one basically issues the SQL statements you specify. You have two examples of pg programs in your node-homework folder:

- load-db.js. This connects to the database, creates the tables with the appropriate column names, data types, and schema constraints, and populates each table with values from CSV files, which are in the csv folder of your node-homework directory.
- sqlcommand.js.

Have a look at each of these programs, so that you can see how the node-postgres package (pg) works to perform SQL operations.

 Spend a little time with this. It's a good idea to learn how to use the pg package. It is also common for Node application development to use an Object-Relational Mapper (ORM). The ORM makes the schema management and data manipulation a lot easier.  You don't need to write SQL statements for much of the ORM access.  ON the other hand, you can't learn SQL if you only use the ORM.

**At this point, please proceed to your assignment.  Do the exercises in Assignment 5a.  When those are complete, resume reading this lesson.

## **5.7 Converting Your Tasks App From the Memory Store to PostgreSQL**

Now that you understand what SQL does, it's time to program with it.  You'll do this initially using the `pg` package.

### **Configuring the Connection**

Database connections require a connection string -- a URL.  You created several during Assignment 0, and they are stored in your `.env` file.  This includes the host, the database name, the SSL mode, and your user id and password.  Obviously, the latter must be kept secret, so you only store it in the `.env` file, never in code, and you must take care that the `.env` file is listed in the `.gitignore`.  You don't use SSL for the local connection, but you will for the cloud resident database.

## **5.8 Understanding Schema**

The schema of a relational database is the list of tables and their properties.  Each table has a name and a list of columns.  Each column has a name and a datatype: String, Int, Boolean, Timestamp, etc.. One column is typically the primary key.  The schema also describes database constraints: columns where the values can't be null, or columns where all values must be unique.  Relations between tables may be defined.  This implement the associations previously described, and for relations, there may be one or several foreign keys, i.e. pointers to the corresponding entries in a different table.



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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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

The additional index is needed for Prisma (the second part of the lesson and assignment.)  For some operations (`show()`, `update()`, `delete()`) you must specify both the id of the task and the user_id in your WHERE clause.  This is to make sure that one user can't access a different user's task record.  When doing this in Prisma, the additional index is required.

## **5.9 Using the pg Package in Your Node App.**

You will use the `pg` package, which you'll install as part of the assignment.  In an Express application, you can have many concurrent requests.  You don't want to create a database connection for each of them.  So, you'll use a pool:

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

You also need the `pool.on('error' ...` event handling in case an idle pool connection throws an error.  Otherwise this can disrupt your node process.

### Why Use Connection Pooling?
Instead of creating a new connection for each database operation, a pool maintains several connections and reuses them. This is more efficient and faster than creating connections on demand.

**Important:** When stopping your application, use `await pool.end()` to close all connections cleanly and prevent connection leaks.  In your assignment, you'll add this logic to the shutdown handling for your app.

---

## **5.10 Queries**

You'll do database queries in your controllers.  Here are some sample queries:

```js
const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
const newUser = await pool.query(`INSERT INTO users (email, name, hashed_password) 
    VALUES ($1, $2, $3) RETURNING id, email, name`,
    [email, name, hashed_password]
  );
```

What happens is this: When you issue the `pool.query()`, you get a connection from the pool.  It may not be connected to an actual socket yet, in which case it is connected as you issue the query.  

The query itself is just an SQL statement, except notice the `($1, $2, $3)`.  These are parameters you pass to the query, which are substituted.  Of course, you could use string interpolation to put the values in ... **but you better not!**  That would make your code vulnerable to an SQL injection attack, where the attacker adds hostile SQL in the middle of your statement.  With parameterized queries, SQL parameters are sanitized before they are substituted, and dangerous stuff is escaped.

After a client connection is retrieved from the pool, the query is run, and once it is complete and the results have been returned, the client connection is returned to the pool.  If the server gets busy, the `pool.query()` operation may have to wait for an available connection.

All well and good, but what about transactions?  The `pool.query()` operation performs a single query in an automatically performed transaction. Suppose you need to do a series of queries in a single transaction?  In that case, the process is a little more complicated.

```js
async function runTransactionalWork() {
  const client = await pool.connect(); // Checkout a client from the pool

  try {
    await client.query("BEGIN"); // Start transaction

    // Example operation #1
    const userResult = await client.query(
      `INSERT INTO users (email) VALUES ($1) RETURNING id`,
      ["test@example.com"]
    );
    const userId = userResult.rows[0].id;

    // Example operation #2
    await client.query(
      `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)`,
      [userId, "Test User"]
    );

    // Example operation #3
    const balanceResult = await client.query(
      `UPDATE accounts SET balance = balance - 100 WHERE user_id = $1 RETURNING balance`,
      [userId]
    );
    console.log("New balance:", balanceResult.rows[0].balance);

    await client.query("COMMIT"); // Success → commit the transaction
    return { success: true, userId };
  } catch (err) {
    await client.query("ROLLBACK"); // Failure → rollback the transaction
    console.error("Transaction failed, rolled back.", err);
    throw err; // propagate error to caller
  } finally {
    client.release(); // Always release the client back to the pool
  }
}
```
In sum, for transactions, you do:

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
Always verify that users can only access their own data:

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
YOu are going to use a globally stored user_id.  This is a temporary makeshift.  The global user_id storage approach used here is **NOT secure** for production applications. It means that once someone logs in, anyone else can access the logged-in user's tasks because there's only one global value. This is used here to match the behavior from lesson 4, but in a real application, you would use proper session management, JWT tokens, or other secure authentication methods.  You will fix this in assignment 8.

---

## **5.11. Error Handling**

### Database Error Types

Different types of errors can occur when working with databases.  Typically you let these fall through to the global error handler middleware.  

There are times when you will need to catch specific errors within your controller logic.  For example, if a user attempts to register with an email address that is already registered, you want to catch the error in the controller so that you can return an appropriate explanation to the user.

**Connection Errors:**

You want a special log message in your error handler for connection errors, in case you forget to start your Postgres service.

You may also get query errors.  For example, queries could time out.  A request to the pool could fail because all connections are tied up. There could be an attempt to write something to the database that doesn't comply with the schema.  In general, you'd just log these to the console in your global error handler, and return the 500 return code and corresponding JSON internal server error message.

### A Health Check API

It is common to have a health check  API, so that you can see if the application is functioning.  The health check gives immediate notice if connection to the database is not successful.

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

In this lesson, you've learned:
- **Why databases are essential** for web applications
- **How PostgreSQL works** as a relational database
- **How to connect Node.js** to PostgreSQL using the `pg` library
- **How to implement database operations** in your controllers
- **Security best practices** like parameterized queries
- **Proper error handling** for database operations

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
