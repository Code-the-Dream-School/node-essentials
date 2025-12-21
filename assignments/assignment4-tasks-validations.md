# **Assignment 4 — Security Middleware, Validation, and Password Hashing**

## **Assignment Instructions**

All of the work for this assignment goes into your project.  You will do not use the assignment4 folder.  Instead, you'll make changes to your app.js and to your controllers, routers, and middleware. Before you start, create a new branch called `assignment4` from the main branch.

### **The Task Routes**

You have created route handlers that allow users to register, log in, and log off.  Now, you will add capabilities so that each user can create, update, modify, and delete on task entries.  Here is the specification for your work.  But don't start yet.

Create a task controller and a task router.  You need to support the following routes:

1. POST "/api/tasks" (the `create` function)  This creates a new entry in the list of tasks for the currently logged on user.

2. GET "/api/tasks" (`index`).  This returns the list of tasks for the currently logged on user.

3. GET "/api/tasks/:id" (`show`).  This returns the task with a particular ID for the currently logged on user.

4. PATCH "/api/tasks/:id" (`update`).  This updates the task with a particular ID for the currently logged on user.

5. DELETE "/api/tasks/:id (`deleteTask`)".  This deletes the task with a particular ID for the currently logged on user.

So, that's five functions you need in the task controller, and five routes that you need in the task router.  But, we have a few problems:

- What if there is no currently logged on user?
- How do you assign an ID for each task?
- To get, patch, or delete a task, -- how do you figure out which one you are going to work on?

Let's solve each of these.  First, for every task route, we need to check whether there is a currently logged on user, and to return a 401 if there isn't.  If there is a logged on user, the job should pass to the task controller, and the task controller should handle the request.  So -- that's middleware.  Create a `/middleware/auth.js` file.  In it, you need a single function.  The function doesn't have to have a name, because it's going to be the only export.  It checks: is there a logged on user, that is, is `global.user_id` null?  If it is null, it returns an UNAUTHORIZED status code and a JSON message that says "unauthorized".  If there is a logged on user, it calls next().  That sends the request on to the tasks controller.  Be careful that you don't do both of these: res.json() combined with next() would mess things up.

In app.js, you can then do:

```js
const authMiddleware = require("./middleware/auth");
```

But, `app.use(authMiddleware)` would protect any route.  Then no one could register or log on.  You want it only in front of the tasks routes.  So, you do the following:

```js
const taskRouter = require("./routers/taskRoutes"); 
app.use("/api/tasks", authMiddleware, taskRouter);
```

That solves the first problem.  The authMiddleware gets called before any of the task routes, and it makes sure that no one can get to those routes without being logged on.  These are called "protected routes" because they require authentication.

Protected routes act as a security barrier - they check if a user has a valid session before allowing access to sensitive operations like creating, reading, updating, or deleting tasks. Without this protection, anyone could potentially access or modify other users' data, which would be a serious security vulnerability in a real application.

Let's go on to problem 2.

Create a file called `controllers/taskController.js`.  You need the following request handler functions within it:

- create
- index
- show
- update
- deleteTask

Each task should have a unique ID. So, create a little counter function in taskController.js, as follows:

```js
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();
```

This is a closure.  You are sometimes asked to write a closure in job interviews.  We can use this to generate a unique ID for each task -- but of course, restart the server and you start over.

Each of the task objects needs a userId attribute, which records who owns that task.  For the time being, you'll put the user's email in that attribute.

In taskController.js, you need a function called `create(req, res)`. And inside that, you do:

```js
const newTask = {...req.body, id: taskCounter(), userId: global.user_id.email};
global.tasks.push(newTask);
const {userId, ...sanitizedTask} = newTask; 
// we don't send back the userId! This statement removes it.
res.json(sanitizedTask);  
```

In this REST call, as in all subsquent ones, if the operation succeeds, you return the corresponding result code and the new or updated or deleted object.  The successful result code is typically 200, meaning OK, except for creates, when it is 201.

Now for problem 3.  When you have a route defined with a colon `:`, that has a special meaning.  The string following the colon is the name of a variable, and when a request comes in for this route, Express parses the value of the variable and stores it in req.params.  For the routes above, you would have `req.params.id`.  Now, be careful: this is a string, not an integer, so you need to convert it to an integer before you go looking for the right task.  Also, the string that is passed might not be a valid id, which should be a number.  If not, you need to return an error.

The other thing to be careful about is access control.  The only tasks that the currently logged on user should be able to delete are their own!  You have to check that the `task.userId` contains the right email.

Here's how you could do it in a deleteTask(req,res) function in your task controller:

```js
const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
              // get a null
if (!taskToFind) {
  return res.status(400).json(message: "The task ID passed is not valid.")
}
const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind && task.userId === global.user_id.email);
// we get the index, not the task, so that we can splice it out
if (taskIndex === -1) { // if no such task
  return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
  // else it's a 404.
}
const task = { userId, ...global.tasks[taskIndex] }; // make a copy without userId
global.tasks.splice(taskIndex, 1); // do the delete
return res.json(task); // return the entry just deleted.  The default status code, OK, is returned
```

Now, write the remaining methods.

**Hint 1** The task objects you send back should not include a userId.  Consider the case for the index operation.  You can get a list of tasks as follows:

```js
  const userTasks = global.tasks.filter((task) => task.userId === global.user_id.email);
```

Ok, so far so good.  But you don't send the userId values back.  And you can't mutate the tasks in this list, because that would update them in place, and then those entries in `global.tasks` wouldn't have userId attributes.  So you need to make a copy of each, and take the userId out of that copy, as follows:

```js
const sanitizedTasks = userTasks.map((task) => {
  const { userId, ...sanitizedTask} = task;
  return sanitizedTask;
});
```

In the above, you are copying everything except the userId to the new sanitizedTask, and then returning an array of those.

**Hint 2** When you do the update, you **DO** want to mutate the task object in place.  You are doing a patch.  You don't want a complete replacement of the task object.  You use all the values from the body, but you leave any attributes of the task that aren't in the new body unchanged.  There is a spiffy way to do this (after you find the right task object to mutate).

```js
Object.assign(currentTask, req.body)
```

This is a good trick to remember.  But the database will handle this automatically for you when you call an update.  After you mutate the task as above, you **still** have to make a copy that doesn't include the userId, and send that back.

### **Postman Testing**

You next create Postman tests for all fo the task operations above.  You want to check:

- If no one is logged on, a 401 is returned for these operations.
- If a user is logged on, all CRUD operations can be performed for tasks belonging to that user.
- If user 1 owns a task, user 2 can't do any CRUD operations on that task.

To do the last test, you logon as user 1, create some tasks, write down the id's of each, log on as user 2, and verify that every CRUD attempt returns a 404.

### **The Automated Tests**

Run `npm run tdd assignment4` to see if your code works as expected.  Not all the tests will pass, because you haven't completed the assignment yet.

### **Validation of User Input**

At present, your app stores whatever you throw at it with Postman.  There is no validation whatsoever.  Let's fix that.  There are various ways to validate user data.  We will eventually use a database access tool called Prisma, which has built-in runtime validation but is very TypeScript-oriented.  So we'll use a different library called Joi.  Install it now using `npm install joi` command. 

Consider a user entry.  You need a name, an email, and a password.  You don't want any leading or trailing spaces.  You can't check whether the email is a real one, but you can check if it complies with the standards for email addresses.  You want to store the email address in lowercase, because you need it to be unique in your data store, so you don't want to deal with case variations.  You don't want trivial, easily guessed passwords.  All of these attributes are required.

Consider a task entry.  You need a title.  You need a boolean for `isCompleted`.  If that is not provided, you want it to default to false.  The title is required in your `req.body` when you create the task entry, but if you are just updating the isCompleted, the patch request does not have to have a title.  We won't worry about the task id -- you automatically create this in your app.  In the database, each task will also have a userId, indicating which user owns the task, but that will be automatically created too.

Joi provides a very simple language to express these requirements.  The Joi reference is [here](https://joi.dev/api/?v=17.13.3).  If a user sends a request where the data doesn't meet the requirements, Joi can provide error messages to send back.  And, if the entry to be created needs small changes, like converting emails to lower case, or stripping off leading and trailing blanks, Joi can do that too.  

Create a folder called validation.  Create two files in that folder, userSchema.js and taskSchema.js.  Here's the code for userSchema.js:

```js
const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  name: Joi.string().trim().min(3).max(30).required(),
  password: Joi.string()
    .trim()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long and include upper and lower case letters, a number, and a special character.",
    }),
});

module.exports = { userSchema };
```

You can look at the code and guess what it does.  There are some nice convenience functions,  such as `.email()`, which checks for a syntactically valid email.  The only complicated one is the password.  This is a simple check for trivial passwords.  The password pattern uses a regular expression, and the customized error message explains what is wrong if the password doesn’t meet requirements.

Here is the code for taskSchema.js:

```js
const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  isCompleted: Joi.boolean().default(false).not(null),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).not(null),
  isCompleted: Joi.boolean().not(null),
}).min(1).message("No attributes to change were specified.");

module.exports = { taskSchema, patchTaskSchema };
```

The `min(1)` means that while both `title` and `isCompleted` are optional in a patch task request, you have to have one of those attributes -- otherwise there's nothing to do.  To do a validation, you do the following:

```js
const {error, value} = userSchema.validate({name: "Bob", email: "nonsense", password: "password", favoriteColor: "blue"}, {abortEarly: false})
```

You do `{abortEarly: false}` so that you can get all the error information to report to the user, not just the first failure.  When the validate() call returns, if error is not null, there is something wrong with the request, and `error.message` says what the error is.  If error is null, then value has the object you want to store, which may be different from the original.  The email would have been converted to lower case, for example.  In this case, the email is invalid, the password fails the pattern, and favoriteColor is not part of the schema, so there are three errors. 

Add validations to your create operations for users and tasks, and your to your update operation for tasks.  It is possible that these requests might be sent without a body, so you must first have:

```js
if (!req.body) req.body = {};
```

Otherwise, validation won't work right.  You then validate `req.body`.  If you get an error, you return a BAD_REQUEST status, and you send back a JSON body with the error message provided by the validation.  If you don't get an error, you go ahead and store the returned value, returning a CREATED, or an OK if an update completes.  Then test your work with Postman, trying both good and bad requests.  

### **Storing Only a Hash of the Passwords**

You should never store user passwords.  If your database were ever compromised, your users would be in big trouble, in part because a lot of people reuse passwords, and you would be in big trouble too.

Instead, at user registration, you create a random salt, concatenate the password and the salt, and compute a cryptographically secure hash.  You store the hash plus the salt.  Each user's password has a different salt.  When the user logs on, you get the salt back out, concatenate the password the user provides with the salt, hash that, and compare that with what you've stored.  You need a cryptography routine to do the hashing.  The scrypt algorithm is a good one.   Although bcrypt is still common, it has known weaknesses and is considered now passé.  Scrypt is the old callback style, so you use util.promisify to convert it to promises.  Add the following code to userController.js:

```js
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
```

This code implements the hashing described.  You can stare at it a bit, but your typical AI helper can generate this code any time.  There's not much to learn or remember. 

Change the register function to call hashPassword.  Right now, a user entry looks like `{ name, email, password }`.  Instead, store `{name, email, hashedPassword }`.  Also, change the login method to use comparePassword.  Note that these are async functions, so you have to await the result. Once you have done all of this, test with Postman. Then run the automated tests with

```bash
npm run tdd assignment4
```

It's good that you got this fixed while you were storing passwords only in memory.  The next step for your project application is to store user and task records in a database.

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Answer 3 questions from Lesson 4:

1. **How do you protect routes using middleware in Express?**
   - Explain the concept of protected routes and why they're important
   - Show how to create authentication middleware
   - Demonstrate how to apply middleware to specific routes
   - Discuss the difference between protected and public routes

2. **What security vulnerabilities does data validation prevent and how do you implement validation?**
   - Explain how validation prevents attacks like SQL injection and XSS
   - Show your userSchema.js and taskSchema.js files and explain each validation rule

3. **Why should you never store passwords in plain text and what are the security principles for password hashing?**
   - Explain the security risks of storing plain text passwords
   - Explain why you need salt and what rainbow attacks are
   - Discuss why you should never invent your own cryptography
   - Explain the difference between hashing and encryption

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples (when needed)
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment4` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment4` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
- **Don't forget to include your video link in the submission form!**




