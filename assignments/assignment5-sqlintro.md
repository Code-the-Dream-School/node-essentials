# **Assignment 5 — Introduction to Databases and SQL**

## **Assignment Instructions**

You create your homework file in the node-homework folder. First, create a branch for this week's homework. It should be called assignment5. Next, start sqlcommand as you did for the lesson. For each of the following tasks, you should get your SQL statements running in sqlcommand first, and then add them to your homework file. It may be helpful to have two terminal sessions within VSCode, one for sqlcommand, and one to run your homework.  Create a file called assignment5-sql.txt within assignment5 directory. Each line in the file should be an SQL command, as described in the task. If the line begins with a `#`, it is a comment. As you add SQL commands to this file, you can test them with the following command:

```bash
npm run tdd assignment5
```

This test should be run from the node-homework root folder.

The [SQL section of w3schools](https://www.w3schools.com/sql/default.asp) is a good reference to assist you with this assignment.

### **Preparation and Practice**

Within sqlcommand, practice doing various SQL statements: SELECT, INSERT, UPDATE, DELETE, BEGIN, COMMIT, ROLLBACK. Your practice SQL statements should include use of JOIN, GROUP BY, ORDER BY, HAVING, SUM, COUNT, etc. Do this until you feel confident in your SQL skills. Remember that you can reload the database as needed. You should try subqueries as well. Then proceed to the following tasks.

**Note:** These tasks require SQL statements that are somewhat complicated. Implement the statements incrementally: Get one part working, then add more clauses, until everything works. If you run into problems, ask for assistance from a mentor or via the slack channel. If SQL is new to you, there is plenty to learn!

### **Task 1: Find the total price of each of the first 5 orders, as ordered by order_id.**

There are several steps. You are going to have to use the price from the products table, and the quantity from the line_items table, so you are going to have to join these with the orders table. You need to GROUP BY the order_id. You are grouping line_items. Also, ORDER BY the order_id. You need to select the order_id and the sum of the products price times the line_items quantity. The columns returned should be order_id and total_price. You use aliasing to specify total_price for the sum of price times quantity.

When you have this running in sqlcommand, add the SQL statement to assignment5-sql.txt.

Run the tdd test until the first test completes.

### **Task 2: Understanding Subqueries**

For each customer, find the average total price of their orders, and return the results ordered by customer name.

This can be done with a subquery. You first have to get the total price of each order, so you can reuse the statement from Task 1 for the subquery, with some changes. You are going to JOIN the customers table, which you need for the customer_name, with the results of the subquery. The changes you need to make are:

- You need to return the customer_id in the subquery, because you are going to JOIN the customers table to the subquery ON customer_id.
- You don't want LIMIT in the subquery, because you are going to get the total price for all the orders.
- You don't need ORDER BY in the subquery, because at the end you will order by the customer name.

So, part of your statement will be:

```
... FROM customers c JOIN (subquery) AS t ON ...
```

After the ON clause, you GROUP BY customer_id and ORDER BY the customer_name. Note that you have two customer_id columns after the join, one being customers.customer_id and the other being t.customer_id, so you have to fully qualify your references to customer_id. Return the following columns: the customer name and the AVG of the total_price as average_order_price.

Once you have this running in sqlcommand, add the statement to assignment5-sql.txt. Run the tdd test until the second test completes.

### **Task 3: Creating a New Order**

Create a new order for the customer named Perez and Sons. The customer wants 10 of the 5 least expensive products. The employee to be associated with the order is Miranda Harris. First, create the statement that finds the customer_id for Perez and Sons. When that works in sqlcommand, add it to assignment5-sql.txt. Next, create the statement that finds the employee_id for Miranda Harris. When that works, add it to assignment5-sql.txt. Next, create the statement that gets the product_ids for the 5 least expensive products. Add that the the assignment file too. Then, do a BEGIN, followed by an INSERT for the orders record with a RETURNING for the order_id, followed by an INSERT for the 5 line_items corresponding to the 5 least expensive products, followed by a COMMIT. Once you have this sequence working in sqlcommand, add those 4 statements to the assignment file. Then do a SELECT to find all line_items corresponding to the new order_id, and return all the columns for these records. When this works, add that statement to the assignment file.

Hint: When you are trying this out in sqlcommand, if you do BEGIN followed by the INSERT of the orders record, followed by the INSERT of the line_items records, followed by the COMMIT, then, because you are typing this all in manually, the transaction may time out before you get to the COMMIT. So, as you are trying things out in sqlcommand, do it without the BEGIN and the COMMIT. But be sure to include the BEGIN and COMMIT in your homework file.

Hint 2: You will put a statement into your homework file that adds the 5 line items. Please add all 5 with one statement. Within that statement, you use the order_id that was obtained by RETURNING it from the insert of the orders record. For the tdd test, the order_id you put in your statement won't be used, because the test will insert a different orders record, and it will use the order_id for that record. This is done using a parameterized query, a technique you will eventually need to learn. This is what you'd actually do in a program. See [here.](https://node-postgres.com/features/queries)

Hint 3: You can use any date you like, but it should be a string of format YYYY-MM-DD.

Then run the tdd test until the third test completes.

### **Task 4: Aggregation with Having**

Find all employees associated with more than 5 orders. You want the first_name, the last_name, and the count of the orders, which you return as order_count. You need to do a JOIN on the employees and orders table, and then use GROUP BY, COUNT, and HAVING, and order the results by last_name. Get this statement working in sqlcommand, and then add it to the assignment file.

Hint: You can't use order_count in your HAVING clause. You have to use COUNT(order_id) instead. Also, you can't use last_name in your ORDER BY. This is a little subtle. The problem is that there are multiple rows after the join with the same last_name and employee_id, for the different orders, and your GROUP BY is for employees.employee_id, not last_name. So you have to do `ORDER BY MIN(last_name)`.

Get this running in sqlcommand, and then add the line to your homework file.

Then run the tdd test until the fourth test completes.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment5` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment5` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
