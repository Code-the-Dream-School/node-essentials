# Week 4 Assignment: Protected Tasks, Validation, and Password Hashing

## Learning Objectives

- Add task create, read, update, and delete routes to the main todo backend
- Protect task routes with authentication middleware
- Check that users can only access their own tasks
- Validate user and task request bodies with Joi
- Store password hashes instead of plain-text passwords

## Assignment Guidelines

NOTE: The AI review tool (known as AirHub) can check code and structure, but it does not run your code in a server environment to verify that aspect runs properly. We will have human reviewers checking this aspect, so you may receive a passing assignment from AirHub that could still need revisions after a human has checked that your work runs properly in the correct environment. If your AI and human reviewer feedbacks don't match, trust the human review.

1. **Setup**
   - Work in your `node-homework` repository.
   - All Assignment 4 work goes into the main todo backend.
   - Do not create or use an `assignment4` folder.
2. **Create a branch**
   - Create a new branch for your work on assignment 4, such as `assignment4`.
   - Make your changes and commits on that branch.
3. **Before you test**
   - Please read the TDD Testing Guide for how to run and interpret the course-provided tests: [TDD Testing Guide](?page=test-driven-development-(tdd)-testing-guide)
4. **Run the tests**
   - Run the required Assignment 4 test with:
     ```bash
     npm run tdd assignment4a
     ```
   - If you attempt the optional advanced section, run:
     ```bash
     npm run tdd assignment4b
     ```

## What You Are Building

In Assignment 3, you added user registration, logon, and logoff to the main todo backend.

In Assignment 4, you will add:

- Task routes
- Task controller functions
- Authentication middleware for task routes
- Joi validation schemas
- Password hashing

You are still using temporary in-memory storage: `global.users`, `global.tasks`, and `global.user_id`.

This is still a scaffold. Later, you will replace this temporary storage with PostgreSQL and Prisma.

## Assignment Parts and Test Files

This assignment has one required core part and one optional advanced check:

1. **Assignment 4A - Protected Tasks, Validation, and Password Hashing**
   - This is part of the main app you will keep building throughout the course.
   - It covers the required task routes, auth middleware, task ownership, basic validation, and password hashing behavior.
   - Test command:
     ```bash
     npm run tdd assignment4a
     ```

2. **Assignment 4B - Advanced Validation, Patch Updates, and Password Security** (optional)
   - This checks deeper validation, patch update, and password security behavior.
   - It uses the same main todo backend files.
   - Test command:
     ```bash
     npm run tdd assignment4b
     ```

The core tasks below are required. The advanced section at the end gives extra context and uses the optional `assignment4b` test.

## Core Tasks (Required)

### 1. Install Joi

Install Joi in your `node-homework` project:

```bash
npm install joi
```

Joi is the validation library you will use for user and task request bodies.

### 2. Add the New Files

Create these files if they do not already exist:

```text
controllers/taskController.js
routes/taskRoutes.js
middleware/auth.js
validation/userSchema.js
validation/taskSchema.js
```

The tests call some controller functions directly, so your controller functions need to work even when the request does not go through the full Express app.

### 3. Add Authentication Middleware

Create `middleware/auth.js`.

This file is the gatekeeper for task routes. The task controllers should only run after the app knows someone is logged in.

This middleware should:

- Check whether `global.user_id` exists
- Return status `401` if no user is logged in
- Return JSON with a message such as `"Unauthorized"`
- Call `next()` if a user is logged in

Example:

```js
if (!global.user_id) return res.status(401).json({ message: "Unauthorized" });
```

Do not call `next()` after sending the `401` response.

### 4. Add Task Routes

Create `routes/taskRoutes.js`.

This router keeps the task URLs separate from the controller logic. The router decides which controller function should run for each HTTP method and path.

It should connect these routes to task controller functions:

```text
POST /api/tasks -> create
GET /api/tasks -> index
GET /api/tasks/:id -> show
PATCH /api/tasks/:id -> update
DELETE /api/tasks/:id -> deleteTask
```

The tests require these exact controller function names.

Inside `routes/taskRoutes.js`, the paths are relative to `/api/tasks`:

```text
GET / -> index
GET /:id -> show
POST / -> create
PATCH /:id -> update
DELETE /:id -> deleteTask
```

### 5. Protect the Task Routes in `app.js`

In `app.js`, require the auth middleware and task router:

```js
const authMiddleware = require("./middleware/auth");
```

```js
const taskRouter = require("./routes/taskRoutes");
```

Mount the task router with auth middleware:

```js
app.use("/api/tasks", authMiddleware, taskRouter);
```

This protects task routes only.

Do not put `authMiddleware` in front of the user routes. Users need to register and log on before they can access protected routes.

This is the difference between public and protected routes. User routes stay public so a user can start a session. Task routes are protected because they work with private user data.

### 6. Create the Task ID Counter

In `controllers/taskController.js`, add a small `taskCounter()` helper that returns the next task ID each time it is called.

This is temporary. Later, the database will create task IDs.

You need task IDs now because `show`, `update`, and `deleteTask` all need a way to identify one specific task.

### 7. Add Task Ownership

Each task should store the email of the user who owns it.

Authentication tells the app who is logged in. Ownership tells the app which tasks that user is allowed to access.

For now, use:

```js
userId: global.user_id.email
```

Task objects stored in `global.tasks` should have this shape:

```js
{
  id: 1,
  title: "first task",
  isCompleted: false,
  userId: "jim@sample.com"
}
```

Do not include `userId` in task responses.

The `userId` field is internal bookkeeping. The server needs it for authorization checks, but the client does not need to receive it.

Use this pattern to remove it from a response copy:

```js
const { userId, ...sanitizedTask } = task;
```

### 8. Create `validation/userSchema.js`

Create a `validation` folder if it does not already exist.

In `validation/userSchema.js`, create and export `userSchema`.

This schema describes what a valid user registration body looks like. Without it, the app could store missing emails, invalid emails, very short names, or weak passwords.

Rules:

- `email` is required, trimmed, lowercased, and must be valid email format.
- `name` is required, trimmed, and must be 3 to 30 characters.
- `password` is required and must not be trivial.

Useful Joi patterns:

```js
email: Joi.string().trim().lowercase().email().required()
```

```js
name: Joi.string().trim().min(3).max(30).required()
```

Your file will have this general shape:

```js
const Joi = require("joi");

const userSchema = Joi.object({
  email: ...,
  name: ...,
  password: ...,
});

module.exports = { userSchema };
```

### 9. Create `validation/taskSchema.js`

In `validation/taskSchema.js`, create and export `taskSchema` and `patchTaskSchema`.

Task creation and task updates need different rules. Creating a task needs a title. Updating a task can change only one field, but it should not accept an empty body.

Rules:

- Creating a task requires `title`.
- Creating a task defaults `isCompleted` to `false` if it is not provided.
- Updating a task allows partial updates.
- Updating a task must include at least one field.

Useful Joi patterns:

```js
title: Joi.string().trim().min(3).max(30).required()
```

```js
isCompleted: Joi.boolean().default(false).not(null)
```

```js
Joi.object({ ... }).min(1)
```

Your file will have this general shape:

```js
const Joi = require("joi");

const taskSchema = Joi.object({
  title: ...,
  isCompleted: ...,
});

const patchTaskSchema = Joi.object({
  title: ...,
  isCompleted: ...,
}).min(1);

module.exports = { taskSchema, patchTaskSchema };
```

### 10. Validate User Registration

Update `controllers/userController.js`.

Validation should happen before the controller checks for duplicate users or stores anything. If the request body is not valid, the controller should stop early with a `400` response.

Import the user schema:

```js
const { userSchema } = require("../validation/userSchema");
```

In `register`, validate `req.body` before creating a user:

```js
const { error, value } = userSchema.validate(req.body, { abortEarly: false });
```

Use `value`, not raw `req.body`, when creating the user. Joi may trim or lowercase the data.

If validation fails, return status `400` with the validation message.

The validation belongs near the top of `register`, before checking for an existing user and before creating the new user:

```js
exports.register = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(...);
  if (error) return res.status(400).json(...);

  // use value.email, value.name, and value.password after this point
  ...
};
```

### 11. Add Password Hashing

In `controllers/userController.js`, add these imports and helper setup:

```js
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
```

`crypto.scrypt` uses callback style. `util.promisify()` lets you use it with `async` and `await`.

Add these helper functions:

- `hashPassword(password)`: creates a salt, hashes the password, and returns the stored hash string.
- `comparePassword(inputPassword, storedHash)`: hashes the submitted password with the stored salt and compares the result.

Useful crypto patterns:

```js
const salt = crypto.randomBytes(16).toString("hex");
```

```js
return `${salt}:${derivedKey.toString("hex")}`;
```

In `register`:

- Validate the request body
- Use the validated `value`
- Hash the password
- Store `hashedPassword`
- Do not store plain `password`

The goal is that `global.users` never stores the original password. It should store enough information to check a future login, but not the password itself.

Example structure:

```js
const newUser = { email, name, hashedPassword };
```

The hashing belongs after validation succeeds and before you push the user into `global.users`:

```js
const hashedPassword = await hashPassword(value.password);
const newUser = { email: value.email, name: value.name, hashedPassword };
```

In `logon`:

- Find the user by email
- Compare the submitted password with `user.hashedPassword`
- Return `401` if the credentials do not match

After this change, logging in should no longer compare `password` to `user.password`. The stored user should have `hashedPassword` instead.

The password comparison happens after you find the user:

```js
const goodCredentials = user && await comparePassword(password, user.hashedPassword);
```

### 12. Implement `create` in `taskController.js`

Import `taskSchema`:

```js
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
```

The `create` function should:

- Validate `req.body` with `taskSchema`
- Return `400` if validation fails
- Create a new task with `id`, `userId`, and the validated values
- Push the task into `global.tasks`
- Return status `201`
- Return the task without `userId`

Use the validated task data to build the stored task. This matters because Joi may add `isCompleted: false` when the request did not include it.

Example structure:

```js
const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };
```

The validation belongs at the start of `create`, before creating the task:

```js
exports.create = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(...);
  if (error) return res.status(400).json(...);

  // build and store the task after validation passes
  ...
};
```

### 13. Implement `index`

The `index` function should:

- Get tasks for the logged-in user
- Return `404` if the user has no tasks
- Return status `200` and an array of tasks if tasks exist
- Remove `userId` from every returned task

This function should not return every task in `global.tasks`. It should return only the tasks owned by the logged-in user.

Example filtering:

```js
const userTasks = global.tasks.filter(
  (task) => task.userId === global.user_id.email,
);
```

Example sanitizing:

```js
const { userId, ...sanitizedTask } = task;
```

For an array of tasks, use the same sanitizing pattern inside `.map()`.

### 14. Implement `show`

The `show` function should:

- Convert `req.params.id` to a number
- Return `400` if the ID is not valid
- Find a task with that ID and the logged-in user's email
- Return `404` if no matching task exists
- Return status `200` and the task without `userId`

Finding by ID is not enough. Two users should not be able to see each other's tasks, so the lookup also needs the current user's email.

Example:

```js
const taskId = parseInt(req.params?.id);
```

After parsing the ID, search for a task that matches both `taskId` and `global.user_id.email`.

### 15. Implement `update`

The `update` function should:

- Validate `req.body` with `patchTaskSchema`
- Return `400` if validation fails
- Convert `req.params.id` to a number
- Find a task with that ID and the logged-in user's email
- Return `404` if no matching task exists
- Merge the validated patch fields into the stored task
- Return status `200` and the updated task without `userId`

Validate first, then find the task, then update it. That order keeps invalid data from being written into the in-memory task list.

Use this pattern:

```js
Object.assign(task, value);
```

This copies the validated patch fields onto the existing task.

The update flow should be:

```js
validate patch body -> parse id -> find owned task -> Object.assign(...) -> return sanitized task
```

### 16. Implement `deleteTask`

The `deleteTask` function should:

- Convert `req.params.id` to a number
- Return `400` if the ID is not valid
- Find the task index for that ID and the logged-in user's email
- Return `404` if no matching task exists
- Remove the task from `global.tasks`
- Return status `200` and the deleted task without `userId`

Use `findIndex()` for delete because you need the array position in order to remove the task with `splice()`.

When finding the task index, check both the task ID and `global.user_id.email`.

The delete flow should be:

```js
parse id -> find owned task index -> copy task without userId -> splice -> return copied task
```

### 17. Test With Postman

Test these cases manually:

- No logged-in user gets `401` for task routes
- A logged-in user can create, list, show, update, and delete their own tasks
- A second user cannot access the first user's tasks
- Invalid task IDs return `400`
- Missing tasks return `404`
- Invalid user and task bodies return `400`

### 18. Run the Automated Tests

Run:

```bash
npm run tdd assignment4a
```

The basic tests check:

- User register/logon/logoff still work
- Task controller functions work
- Users cannot access each other's tasks
- Task responses do not include `userId`
- Basic validation and password hashing are in place

If you attempt the optional advanced section, also run:

```bash
npm run tdd assignment4b
```

The optional advanced tests check deeper validation, patch update, and password security behavior:

- User and task schemas exist
- Validation rejects invalid user/task data
- Patch updates merge fields without replacing the stored task
- Passwords are stored as hashes instead of plain text

## Suggested File Structure

By the end of Assignment 4, your main app files should include:

```text
node-homework/
  app.js
  controllers/
    userController.js
    taskController.js
  routes/
    userRoutes.js
    taskRoutes.js
  middleware/
    auth.js
    not-found.js
    error-handler.js
  validation/
    userSchema.js
    taskSchema.js
```

## Advanced Knowledge (Optional)

The following ideas give more context. They are useful, but the core tasks above are what you need to complete the assignment.

If you work through this optional advanced section, use `npm run tdd assignment4b` to check the deeper validation, patch update, and password security cases.

### `Object.assign()` and Patch Updates

PATCH means partial update.

If the request body is:

```js
{
  isCompleted: true
}
```

You do not want to replace the whole task with only that object. You only want to update the fields that were sent.

`Object.assign(task, value)` mutates the existing task object stored in `global.tasks`.

After using it, still remove `userId` from the response.

### Password Security Details

The hashing helpers store a value in this format:

```text
salt:hash
```

Each password gets a different salt. This helps protect against precomputed password attacks.

`crypto.timingSafeEqual()` compares values in a safer way than a simple string comparison.

You do not need to memorize these internals. The important rule is to use trusted crypto tools and never invent your own password storage system.

The same idea applies to other sensitive data. Do not store credit card numbers, government ID numbers, or other private information unless the app truly needs it and you understand the legal and security requirements.

### Validation Boundaries

Joi validates request data before your app stores it.

Joi does not replace authorization. A task body can be valid and still belong to another user.

Later, database constraints will add another layer of protection.

### Status Code Nuance

For this assignment:

- Use `401` when no user is logged in.
- Use `400` when request data is invalid.
- Use `404` when the task is not found for this user.

Some APIs use `403` when a logged-in user is not allowed to access a resource. This assignment can use `404` for another user's task so the API does not reveal whether that task exists.

### Future Authentication Direction

`global.user_id` is only a learning scaffold.

Later, the app should know which client made the request. Common production patterns include sessions, cookies, and tokens.

You do not need to implement those in Assignment 4. The important idea is that the current global login will be replaced later.

## Video Submission

Record a short video (3-5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Answer 3 questions from the core Lesson 4 material:

1. **What is the difference between authentication and authorization?**
   - Explain what `global.user_id` represents in this assignment
   - Explain how task ownership is checked

2. **How does Joi validation fit into user and task creation?**
   - Explain what `error` and `value` mean
   - Explain why controllers should use validated `value`

3. **Why should passwords be hashed before they are stored?**
   - Explain why plain-text passwords are dangerous
   - Explain what changes in `register` and `logon`

**Video Requirements**:

- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples when useful
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

## To Submit an Assignment

1. Do these commands:

   ```bash
   git add -A
   git commit -m "some meaningful commit message"
   git push origin assignment4
   ```

2. Go to your `node-homework` repository on GitHub.
3. Select your `assignment4` branch.
4. Create a pull request. The target of the pull request should be the main branch of your GitHub repository.
5. Once the pull request is created, your browser contains the URL of the PR. Include that link in your homework submission.
6. Do not forget to include your video link in the submission form.
