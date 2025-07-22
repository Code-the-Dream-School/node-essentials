# **Lesson 4 — Security Middleware, Validation, and Password Hashing**

## **Lesson Overview**

**Learning objective**: Students will learn how to protect routes using middleware.  Students will learn about the importance of validation of data before it is stored or updated, and how to do this validation.  Students will learn that only a cryptographic hash of a password should be stored, and best practices on how to do that.

**Topics**:

1. Protected Routes and Middleware
2. Data Validation for Create and Update Operations
3. Hashing Passwords

## **4.1 Protected Routes and Middleware**

There aren't a lot of concepts to cover in this week's lesson.  They are important topics, but we'll cover them quickly.  On the other hand, the assignment is quite a bit of work.  The assignment includes implementation of the concepts of the lesson.

You do not want to give unauthenticated users access to private or sensitive data.  You do not want to give authenticated users access to data that they are not authorized to access.  The task information your application will store and retrieve are a case in point.  An unauthenticated user should not be able to access any task records.  An authenticated user should not be able to access any task records except their own.

You are about to create route handlers in the task controller.  Each of these route handers could check, on every operation, if the user has been authenticated and if the requested tasks actually belong to that user.  But, that would violate the DRY (Don't Repeat Yourself) principle.  You want one place in the code that establishes if the user has been authenticated and who that user is, before any of the route handlers for tasks are invoked.  For that, we use a middleware function.  This middleware checks to see if a user is logged on, and if not, it returns a 401 (unauthorized).  If a user is logged on, the middleware typically stores information about the user identity in req.user, so that route handlers can use that to enforce authorization policies.  For the moment, we are storing the information about the logged on user in a global variable, which is loggedOnUser.  However, that's a temporary makeshift.  It means that only one user can be logged on at a given time, and if that user is logged on, anyone can access protected data as if they were that user.  These are serious defects, and we'll fix them in a later lesson.

For your assignment, you'll create a middleware function that just checks if someone is logged on, and returns the 401 if no one is.  You'll then put that middleware function in front of all the task routes.  You do not put this middleware function in front of all of your routes, because then someone would have to be logged on in order to do a logon.

## **4.2 Data Validation for Create and Update Operations**

Whenever data is stored or changed, your API should check to see that the new or updated records are valid.  As your userController is, anyone could store anything as a user record.  When you change the storage mechanism from the current in memory store to a database, you'll configure the database with some validation, but databases only perform limited checks.  Sometimes validation needs to be done for delete operations too.  You would not want the a record describing a customer to be deleted, if there are orders for that customer in the database.

You'll use a package called Prisma for data access.  Prisma can do data validation, so that it occurs automatically with the data access.  However, validation in Prisma is configured using TypeScript.  This class does not use TypeScript, so we'll use another data validation tool called Joi.  Some amount of data transformation may occur at the validation step, such as converting emails to lower case and trimming leading and trailing blanks.  Joi does that as well.

Validation can also help with one security problem.  You do not want users to use trivial passwords.  The password checking you'll do is not quite sufficient to protect against that, but it does help.  In a production application, you could use an npm package like `check-password-strength`.

## **4.3 Hashing Passwords**

Never store passwords in the database. You do not need to store the passwords to authenticate the user.  If your database were compromised, or perhaps if an ill-behaved application administrator has a peek at the passwords, you have created a security exposure, which is a problem for the user, and potentially a legal problem for you.

Instead, you hash the password, and store the hash.  When the user sends a logon request, you hash the password the user sends, and compare that with what is stored.  If you get a match, the user is authenticated.

When hashing the password, you should adhere to the following rules:

1. Use a publicly available hashing algorithm and code.  Use one that is current and believed to be strong.  Never invent your own cryptography!  That is **extremely hard** to get right.  Cryptographic algorithms are invented by mathematicians with specialized skills, and each invented algorithm goes through an extensive period of public review by other such geeks, with extensive testing.  You can't match that.  Even so, weaknesses are periodically discovered in widely used algorithms, at which time they must be replaced.  OWASP, the Open Worldwide Application Security Project, reports that cryptographic weakness is a frequent cause of security exposures.  And, just as you shouldn't invent cryptography, you also shouldn't write the code that implements a public algorithm.  It is too easy to make a mistake.  The publicly available npm packages are what you should use.

2. For each password, you include a cryptographically chosen salt.  Each password has a different salt.  This prevents a security exposure called the rainbow attack.

### **Check for Understanding**

1. If a user is securely authenticated, they should be able to access the data they request, correct?

2. Can you think of any create/update operations that would need only limited validation?

3. Can you think of any security exposures created by limited validation?

4. You shouldn't store passwords.  What else shouldn't you store?

### **Answers**

1. False! An authenticated user may still attempt to access data they have no business getting to.

2. There are some cases where the validation can be a little bit loose, like appends to a public forum.

3. We have discussed one security exposure caused by limited validation, which is weak passwords.  Another one we'll learn about is an injection attack.  The REST call to your API stores a dangerous script. That script is subsequently returned to the front end, where it runs.  We'll protect against that in a later lesson.

4. You shouldn't store credit card numbers.  They should only be stored if the application and the entire development and deployment process has been reviewed and approved for PCI DSS (Payment Card Industry Data Security Standards).  You shouldn't store bank account numbers.  You should avoid, in most cases, storing PII (Personally Identifiable Information).  You shouldn't store health data.  There's another standard called HIPAA for that.

