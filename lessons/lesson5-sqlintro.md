# **Lesson 5 — Introduction to Databases and SQL**

## **Lesson Overview**

**Learning Objectives**: Students will gain foundational knowledge of SQL databases using Postgres. They will understand the basic purpose and attributes of SQL databases.  They will learn the SQL language, including SELECT, INSERT, UPDATE, and other standard SQL verbs.  They will understand JOINs and transactions, primary and foreign keys, associations, and table constraints.  They will learn how to create tables with schemas.  This is a generalized introduction to SQL, so no Object Relational Mapper (ORM) will be used.  In this lesson, the focus is on SQL itself, so there will be no JavaScript code developed.

**Topics**:

1. Introduction to SQL: What SQL is, why relational databases matter, and how constraints, associations, and transactions work.
2. The syntax, verbs, and clauses of the SQL language: SELECT, INSERT, UPDATE, DELETE, and table management.
3. Practicing SQL from a command line environment
4. More on JOINs.
5. BEGIN, COMMIT, and RETURNING.
6. SQL from a Node program.

## **5.1 What SQL Is, and Why it is Used**

SQL is the language used to access relational databases. In a relational database, the data is stored in tables, each of which looks like a spreadsheet. The database has a schema, and for each table in the database, the schema describes the columns in each table, giving each a name and a datatype such as INTEGER or TEXT or REAL. One can compare this to no-SQL databases like MongoDB, in which you can store any JSON document you like. The relational database schema can seem like a straitjacket, but it is really more like a set of rails, organizing data into a structured form. It's a good idea to learn MongoDB as well, of course, as it is widely used -- but MongoDB is pretty easy to learn. SQL is a deeper topic.

Read the following introduction: <https://www.theodinproject.com/lessons/databases-databases-and-sql>. Or, if you know this stuff, jump to the bottom of that page and do the Knowledge Check. Be sure that you understand the concepts of Primary Key and Foreign Key.

There are two important words left out of that introduction: Association and Transaction.

### **Associations**

An association exists between tables if one table has a foreign key that points to the other. Consider the following cases:

1. An application has a `users` table and a `user_profiles` table. Each record in the `user_profiles` table has a foreign key, which is the primary key of a record in the `users` table. This is a one-to-one association.
2. An application has blogs. Each blog has a series of posts. The application might have a `blogs` table and a `posts` table. Each record in the `posts` table would have a foreign key for a `blogs` table record, indicating the blog to which it belongs. This is a one-to-many association, as one blog has many posts.
3. A magazine publisher has magazines and subscribers. Each subscriber may subscribe to several magazines, and each magazine may have many subscribers. Now we have a problem.  

We can't put a list of subscribers into a magazine record. Relational database records can't contain lists. For a given magazine, we could create one record for each subscriber, but we'd be duplicating all the information that describes the magazine many times over. Similarly, there is no way for the `subscribers` table to contain records for each magazine for each subscriber. So, you need a table in the middle, sometimes called a **join table**. In this case, the join table might be `subscriptions`. Each subscription record has two foreign keys, one for the magazine and one for the subscriber. This is a many-to many association.

### **Transactions**

A transaction is a write operation on an SQL database that guarantees consistency. Consider a banking operation. A user wants to transfer money from one account to another. The sequence of SQL operations is as follows (this is pseudocode of course):

- Begin the transaction.
- Read the amount in account A to make sure there's enough.
- Update that record to decrease the balance by the desired amount.
- Update that record to increase the balance by the desired amount.
- Commit the transaction

The transaction maintains consistency. When the read occurs, that entry is locked. (This depends on the isolation level and other stuff we won't get into now.) That lock is important, as otherwise there could be another withdrawal from the account that happens after the read but before the update, and the account would go overdrawn. Neither do you want the update that decreases the balance to complete while the update that increases the balance in the other account fails. That would anger the user, and justifiably so. With transactions, either both write operations succeed or neither succeeds.

Relational databases' strength, by comparision with no-SQL databases, is the efficient handing of structured and interrelated data and transactional operations on that data.

### **Constraints**

When a table is defined in the schema, one or several **constraints** on the values may also be specified.

- Datatype constraints: One constraint comes from the datatype of the column: you can't put a TEXT value in an INTEGER column, etc.
- NOT NULL constraint: When present, it means that whenever a record is created or updated, that column in the record must have a value.
- UNIQUE constraint: You wouldn't want several users to have the same ID for example.
- FOREIGN KEY constraint. In the blog example above, each post must belong to a blog, meaning that the post record has the blog's primary key as a foreign key. Otherwise you'd have a post that belonged to no blog, a worthless situation.

If you try to create a record that doesn't comply with constraints, or update one in violation of constraints, you get an error.

## **5.2 Learning and Practicing the SQL Language**

SQL is the language used to access relational databases. You use it to do CRUD operations: Create, Read, Update, and Delete. You don't use SQL to implement program logic. Instead, from a language like JavaScript, you invoke SQL operations. The key verbs in SQL are as follows:

- SELECT: Used for queries, to read subsets of the data.
- INSERT: Used to insert one or many records into a table.
- UPDATE: Used to modify one or many records in a table.
- DELETE: Used to delete one or many records from a table.
- BEGIN: Starts a transaction.
- COMMIT: Completes a transaction. All changes either complete successfully or none of them do, so that the database is kept in a consistent state.
- ROLLBACK: Rolls back the transaction. All uncomitted changes are discarded.
- CREATE DATABASE, DROP DATABASE: create or drop a database.
- CREATE TABLE, ALTER TABLE, DROP TABLE: manage the schema of the database, meaning the tables that comprise the database, the columns in each table, the datatypes for each column, primary and foreign keys, and constraints.

Now, learn these and practice! Do **ALL** the exercises in the following tutorial: [https://sqlbolt.com/](https://sqlbolt.com/). Be sure to do the exercises for the additional topics on unions, intersections, exceptions, and subqueries.

W3Schools provides a useful and comprehensive reference [here.](https://www.w3schools.com/sql/default.asp) However the tryit editor provided with the tutorial doesn't work for most operations.

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

2. The WHERE clause filters the records returned. You can also specify the particular columns you want by listing them before the FROM in the select.

3. A DELETE without a WHERE clause would delete every record in the table.

4. You can insert multiple records by specifying multiple sets of values. For example, , to add several records to the Buildings table from SQLBolt exercise 7, you could do:

   ```SQL
   INSERT INTO Buildings (Building_name, Capacity) VALUES ("3a", 35),("3b",30));
   ```

   However, this won't work in SQLBolt, because of the limitations of that simulated environment.

5. Some aggregation functions are SUM, COUNT, AVG, MIN, and MAX. To aggregate in groups, you use GROUP BY. Using the Employees table from SQLBolt exercise 7, if you want to find the number of employees in each role, you could do:

   ```SQL
   SELECT Role, COUNT(Name) AS Count FROM Employees GROUP BY Role;
   ```

6. To filter on the results of an aggregate, you use HAVING. So suppose you only want the roles with at least 5 people. You would do:

   ```SQL
   SELECT Role, COUNT(Name) AS Count FROM Employees HAVING COUNT(Name) >= 5;
   ```

7. There is a one-to-many association between Buildings and Employees. One building may have many Employees. The schema you are shown doesn't make clear which is the primary key, but the primary key for Buildings appears to Building_name. It is clear that Building is the foreign key in the Employees table: It points to an entry in the Buildings table.

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

This shows you the schema for the customers table. Repeat this for each of the other tables. You will notice some foreign keys in several of the tables. Based on these, you should recognize that there are associations between these tables.

### **Check For Understanding**

1. What is the association between customers and orders? Between employees and orders?

2. What is the association between orders and line_items? Between line_items and products?

3. There is an association between orders and products. What is it? What is the table in the middle that makes it work? What is this type of table called?

### **Answers**

1. There is a one-to-many association between customers and orders. A customer may have many orders. Similarly, there is a one-to-many association between employees and orders.

2. Similarly, there is a one-to-many association between orders and line items. There is also a one-to-many association between products and line_items: For a given product, there may be many line_items.

3. There is a many-to-many association between orders and products. There may be many orders for a product, and a given order may include many products. The table in the middle, called a join table, is line_items. So, for each order, there is a list of line_items, each corresponding to one product. Each line_items record also includes a quantity, which is how many of the given product is being ordered.

### **Tips on sqlcommand**

Here are some tips on using the sqlcommand command line interface:

- You can enter multiple lines of input. These will only be processed when you end a line with a `;`.
- If you make a mistake, you can use the up and down arrows to recall your command, and you can edit it to correct the problem.
- If you do INSERT, UPDATE, or DELETE operations, you are changing your real data, the Postgres database that you created at neon.com. You can restore the database to the original state by doing
  ```bash
  node load-db.js
  ```
- When you specify a string value, you need to surround it with single quotes. This is the SQL standard, and Postgres requires compliance.
- In general, searches are case-sensitive.
- Ctrl-C quits the program.

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

You don't need to fully qualify product_name, because that is only one table. The statement above will work, but it's a lot of typing. So, you can use **aliasing**:

```SQL
SELECT DISTINCT product_name FROM customers AS c JOIN orders AS o ON c.customer_id = o.customer_id JOIN line_items AS l ON o.order_id = l.order_id JOIN products AS p ON l.product_id = p.product_id WHERE customer_name = 'Williams-Mack';
```

And, you can even leave out the AS:

```SQL
SELECT DISTINCT product_name FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN line_items l ON o.order_id = l.order_id JOIN products p ON l.product_id = p.product_id WHERE customer_name = 'Williams-Mack';
```

Aliasing is also useful to rename the returned columns. For column names, you use double quotes when needed:

```SQL
SELECT DISTINCT product_name "product names" FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN line_items l ON o.order_id = l.order_id JOIN products p ON l.product_id = p.product_id WHERE customer_name = 'Williams-Mack';
```

Copy the statement above and run it in sqlcommand.

## **4.5 Using BEGIN, COMMIT, and RETURNING**

In the examples in SQLBolt, you did not use transactions explicitly. As there wsas no BEGIN, a transaction was automatically opened and committed with each write operation. You will now practice a transaction in sqlcommand.

Suppose you want to create an order for the customer named "Conrad-Harris". The order is to be associated with employee David Thornton, it should include 2 of "Fantastic Shoes" and 5 of Sausages. To create this order, you need to use the customer_id for "Conrad-Harris", the employee_id of David Thornton, and the product_id values for "Fantastic Shoes" and "Sausages". You need to create the orders record and two line_items records. You want to be sure that the creation of the orders record and both of the line_items records all happen or all fail, otherwise the database will be inconsistent.

### **Schema Violations and the Foreign Key Constraint**

Try this statement first:

```SQL
INSERT INTO orders (date) VALUES ('2025-03-11');
```

This doesn't work, because the schema for the customer_id and employee_id columns specifies NOT NULL. What do you think will happen if your try the following? Try it and see.

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

1. See if you can specify the each of the 5 SQL statements you need. For the date, use '2025-03-11'. There are actually two products with product_name = 'Sausages', so you use the first of these.

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

### **Why Start the Transaction Before the Selects?\***

Actually, in this case, you don't need to. But suppose you are doing a bank transfer. You want to be sure that when you do the transfer, there is enough money in the source account, so you do a SELECT to check, within the transaction. If the isolation level for the transaction is SERIALIZABLE, that locks the record in the table, so that it can't change before the transfer occurs. If there isn't enough money, the right step is to rollback the transaction and tell the user tough luck. But, in the case above, the customer_id, the product_id, and the employee_id aren't going to change.

### **Locking and Database Isolation Levels**

While a transaction is in progress, the records it touches in the database may be locked. This can be important to maintain consistency, for example for the bank transfer case above. But, there is a downside. If you hold a lock, other concurrent processes that attempt to access the relavant records have to wait. Eventually either your transaction times out or those other processes do. So, if you have a transaction in process, you don't want to diddle about. Get the work done and COMMIT or ROLLBACK.

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

3. REPEATABLE READ: In this case, you get a snapshot. Foror the same transaction as above, you would report:  
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
   UPDATE balance SET balance = balance - 40 WHERE account_id = 3;
   COMMIT;
   ```

   This might result in Tom going overdrawn. Between the SELECT and the UPDATE, some other process could change the value in Tom's account number 3.

4. SERIALIZABLE: In this case, the records retrieved **are locked** for the duration of the transaction. So then Tom can't go overdrawn, given the sequence above.

The more isolation you have, the greater the locking cost, but the stronger your guarantees of data integrity. Try to remember these levels. You could be asked about them in a job interview.

The default isolation level for the Postgres database you are using is READ COMMITTED. You can change this default when establishing a connection, and you can also change it for a particular transaction.

## **5.6 SQL in a Node Application**

There are several ways to do SQL in Node. You can use the node-postgres package. That one basically issues the SQL statements you specify. You have two examples of pg programs in your node-homework folder:

- load-db.js. This connects to the database, creates the tables with the appropriate column names, data types, and schema constraints, and populates each table with values from CSV files, which are in the csv folder of your node-homework directory.
- sqlcommand.js.

Have a look at each of these programs, so that you can see how the node-postgres package (pg) works to perform SQL operations. Spend a little time with this. It's a good idea to learn how to use the pg package. However, it is much more common for Node application development to use an Object Relational Mapper (ORM). The ORM makes the schema management and data manipulation a lot easier. So, for reasons of brevity, your homework won't include any JavaScript. You will do the programming next week, using an ORM. The downside of using an ORM is that it hides many of the details of SQL from you, so if you were to start with the ORM, you wouldn't learn SQL as well as a backend developer needs to.
