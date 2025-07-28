# **Assignment 4 — Introduction to Databases and SQL**

## **Assignment Instructions**

All of the work for this assignment goes into your project.  You do not use the assignment4 folder.  Instead, you'll make changes to your app.js and to your controllers, routers, and middleware.  Create an assignment4 git branch before you start.

### **The Task Routes**

You have created route handlers that allow users to register, to logon, and to logoff.  Now, you add capabilites so that each user can do create, update, modify, and delete on task entries.  Here is the specification for your work.  But don't start yet.

Create a task controller and a task router.  You need to support the following routes:

1. POST "/tasks".  This creates a new entry in the list of tasks for the currently logged on user.

2. GET "/tasks".  This returns the list of tasks for the currently logged on user.

3. GET "/tasks/:id".  This returns the task with a particular ID for the currently logged on user.

4. PATCH "/tasks/:id.  This updates the task with a particular ID for the currently logged on user.

5. DELETE "/tasks/:id.  This deletes the task with a particular ID for the currently logged on user.

So, that's five functions you need in the task controller, and five routes that you need in the task router.  But, we have a few problems:

- What if there is no currently logged on user?
- How do you assign an ID for each task?
- To get, patch, or delete a task, how do you figure out which one you are going to work on?

Let's solve each of these.  First, for every task route, we need to check whether there is a currently logged on user, and to return a 401 if there isn't.  If there is a logged on user, the job should pass to the task controller, and the task controller should handle the request.  So -- that's middleware.  Create a `/middleware/auth.js` file.  In it, you need a single function.  The function doesn't have to have a name, because it's going to be the only export.  It checks: is there a logged on user?  If not, it returns an UNAUTHORIZED status code and a JSON message that says "unauthorized".  If there is a logged on user, it calls next().  That sends the request on to the tasks controller.  Be careful that you don't do both of these: res.json() combined with next() would mess things up.

In app.js, you can then do:

```js
const authMiddleware = require("./middleware/auth");
```

But, `app.use(authMiddleware)` would protect any route.  Then no one could register or logon.  You want it only in front of the tasks routes.  So, you do the following:

```js
const taskRouter = require("./routers/task");
app.use("/tasks", authMiddleware, taskRouter);
```

That solves the first problem.  The authMiddleware gets called before any of the task routes, and it makes sure that no one can get to those routes without being logged on.  These are called "protected routes" because they require authentication.

Let's go on to problem 2.  Within your tasks controller, `loggedOnUser` is a reference to an object, and you want to have a list of tasks within that object.  Each should have a unique ID  You didn't create that list when you stored the user object. First, create a little counter function in taskController.js, as follows:

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

In taskController.js, you need a function called `create(req, res)`. And inside that, you do:

```js
const loggedOnUser = getLoggedOnUser();
if (loggedOnUser.tasklist === undefined) {
    loggedOnUser.tasklist = [];
};
req.body.id = taskCounter();
const newTask = {...req.body}; // make a copy
loggedOnUser.tasklist.push(newTask);
res.json(newTask);  // send it back, with an id attached
```

Be a little careful about loggedOnUser.  You know that the logged on user can change.  So, you need to get the logged on user each time you need to refer to it.  On the other hand, once you have loggedOnUser, you can mutate that object it all you want.

Now for problem 3.  When you have a route defined with a colon `:`, that has a special meaning.  The string following the colon is the name of a variable, and when a request comes in for this route, Express parses the value of the variable and stores it in req.params.  For the routes above, you would have `req.params.id`.  Now, be careful: this is a string, not an integer, so you need to convert it to an integer before you go looking for the right task.  Here's how you could do it in a deleteTask(req,res) function in your task controller:

```js
const taskToFind = parseInt(req.params.id);
const loggedOnUser = getLoggedOnUser();
if (loggedOnUser.tasklist) {  // if we have a list
  const taskIndex = loggedOnUser.tasklist.indexOf((task)=> task.id === taskToFind);
  if (taskIndex != -1) {
    const task = loggedOnUser.tasklist[taskIndex];
    loggedOnUser.tasklist.splice(taskIndex, 1); // do the delete
    return res.json(task); // return the entry just deleted.  The default status code, OK, is returned.
  }
};
res.sendStatus(StatusCodes.NOT_FOUND); // else it's a 404.
```

So, write the remaining methods, set up the routes, and test everything with Postman.  To test the operations that use a task ID, you would all of the tasks for the currently logged on user, so you know what the IDs are.  Postman will show you what is sent back.  Then you can show or patch or delete one of them.

One hint about the update function in the task router.  You are doing a patch.  You don't want a complete replacement of the task object.  This means you use all the values from the body, but you leave any attributes of the task that aren't in the new body unchanged.  There are two (2) spiffy ways to do this:

```js
const newTask = { ...currentTask, ...req.body}
// or
Object.assign(currentTask, req.body)
```

The advantage of the second one is the current task is in a list, and you'd probably want to update it in place.  These are good tricks to remember.  But the database will do the same for you when you call an update.

### **The Automated Tests**

Run `npm run tdd assignment4` to see if your code works as expected.  Not all the tests will pass, because you haven't completed the assignment yet.

### **Validation of User Input**

At present, your app stores whatever you throw at it with Postman.  There is no validation whatsoever.  Let's fix that.  There are various ways to validate user data.  We will eventually use a database access tool called Prisma, and it has validation built in, but it is very TypeScript oriented.  So we'll use a different library called Joi.  Do an npm install of it now.

Consider a user entry.  You need a name, an email, and a password.  You don't want any leading or trailing spaces.  You can't check whether the email is a real one, but you can check if it complies with the standards for email addresses.  You want to store the email address as lower case, because you need it to be unique in your data store, so you don't want to deal with case variations.  You don't want trivial, easily guessed passwords.  All of these attributes are required.

Consider a task entry.  You need a title.  You need a boolean for isCompleted.  If that is not provided, you want it to default to false.  The title is required in your req.body when you create the task entry, but if you are just updating the isCompleted, the patch request does not have to have a title.  We won't worry about the task id -- you automatically create this in your app.  In the database, each task will also have a userId, indicating which user owns the task, but that will be automatically created too.

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

You can look at the code and guess what it does.  There are some nice convience functions, like email(), which checks for a syntactically valid email.  The only complicated one is the password.  This is a simple check for trivial passwords.  The password pattern is a regular expression, and the customized error message explains what is wrong if the password is inadequate.

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

The `min(1)` means that while both title and isCompleted are optional in a patch task request, you have to have one of those attributes -- otherwise there's nothing to do.  To do a validation, you do the following:

```js
const {error, value} = userSchema.validate({name: "Bob", email: "nonsense", password: "password", favoriteColor: "blue"}, {abortEarly: false})
```

You do `{abortEarly: false}` so that you can get all the error information to report to the user, not just the first failure.  When the validate() call returns, if error is not null, there is something wrong with the request, and error.message says what the error is.  If error is null, then value has the object you want to store, which may be different from the original.  The email would have been converted to lower case, for example.  In this case, the email is not correct, the password is not allowed, and favoriteColor is not part of the schema, so there are three errors. 

Add validations to your create operations for users and tasks, and your to your update operation for tasks.  It is possible that these requests might be sent without a body, so you must first have:

```js
if (!req.body) req.body = {};
```

Otherwise validation won't work right.  You then validate req.body.  If you get an error, you return a BAD_REQUEST status, and you send back a JSON body with the error message provided by the validation.  If you don't get an error, you go ahead and store the returned value, returning a CREATED, or an OK if an update completes.  Then test your work with Postman, trying both good and bad requests.  

### **Storing Only a Hash of the Passwords**

You should never store user passwords.  If your database were ever compromised, your users would be in big trouble, in part because a lot of people reuse passwords, and you would be in big trouble too.

Instead, at user registration, you create a random salt, concatenate the password and the salt, and compute a cryptographically secure hash.  You store the hash plus the salt.  Each user's password has a different salt.  When the user logs on, you get the salt back out, concatenate the password the user provides with the salt, hash that, and compare that with what you've stored.  You need a cryptography routine to do the hashing.  The scrypt algorithm is a good one.  Many times bcrypt is used, but it has some weaknesses, so it is now passé.  Scrypt is the old callback style, so you use util.promisify to convert it to promises.  Add the following code to userController.js:

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

This code implements the hashing described.  You can stare at it a bit, but your typical AI helper can provide this code any time.  There's not much to learn or remember. 

Change the register function to call hashPassword.  Right now, a user entry looks like `{ name, email, password }`.  Instead store `{name, email, hashedPassword }`.  Also, change the login method to use comparePassword.  Note that these are async functions, so you have to await the result. Once you have done all of this, test with Postman. Then run the automated tests with

```bash
npm run tdd assignment4
```

It's good that you got this fixed while you were storing passwords only in memory.  The next step for your project application is to store user and task records in a database.

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




