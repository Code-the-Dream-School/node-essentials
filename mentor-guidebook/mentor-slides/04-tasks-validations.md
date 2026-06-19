---
marp: true
theme: default
paginate: true
---

# Mentor Instructions - Using Marp

**Option 1: VS Code**
- Install the Marp extension
- Open this .md file
- Click "Open Preview"
- Present in full screen

**Option 2: Marp Web App**
- Go to https://marp.app/
- Paste this markdown
- Present from browser

---

# Lesson 4 - Protected Tasks, Validation, and Password Hashing
## Node.js/Express

---

# Game Plan

- Warm-Up
- Authentication vs authorization
- Protected task routes
- Task ownership
- Joi validation
- Password hashing
- Assignment Preview

---

# Warm-Up (5 min)

In chat or out loud:

1. What did Assignment 3 add to the todo backend?
2. Which routes in a task app should require a logged-in user?

<!-- Mentor note: Use this to connect Week 3 middleware to Week 4 auth middleware. -->

---

# What Week 4 Adds

Students keep using the main todo backend.

This week they add:

- Task routes and task controllers
- Auth middleware for task routes
- Ownership checks so users only access their own tasks
- Joi schemas for user and task request bodies
- Password hashing with Node's built-in `crypto`

---

# Authentication vs Authorization

Authentication asks:

> Who is logged in?

In this assignment, the app uses:

```js
global.user_id
```

Authorization asks:

> Is this logged-in user allowed to access this task?

---

# Temporary Login Scaffold

`global.user_id` is a learning scaffold.

It lets students practice protected routes before sessions, cookies, tokens, databases, or Prisma.

Important limitation:

- It does not identify separate clients
- It is not production-ready auth
- It will be replaced later

---

# Auth Middleware Pattern

```js
module.exports = (req, res, next) => {
  if (!global.user_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};
```

Either send a response or call `next()`.

Do not do both.

---

# Protecting Task Routes

User routes stay public:

```js
app.use("/api/users", userRouter);
```

Task routes are protected:

```js
app.use("/api/tasks", authMiddleware, taskRouter);
```

Users need to register and log on before they can access tasks.

---

# Task Routes

Inside `routes/taskRoutes.js`, paths are relative to `/api/tasks`:

```text
POST   /      -> create
GET    /      -> index
GET    /:id   -> show
PATCH  /:id   -> update
DELETE /:id   -> deleteTask
```

The tests expect these controller function names.

---

# Task Ownership

Each stored task needs an internal owner:

```js
userId: global.user_id.email
```

Stored task shape:

```js
{
  id: 1,
  title: "first task",
  isCompleted: false,
  userId: "jim@sample.com"
}
```

---

# Do Not Return `userId`

`userId` is for server-side authorization checks.

The client does not need it in task responses.

Pattern:

```js
const { userId, ...sanitizedTask } = task;
```

Use the sanitized copy in `res.json()`.

---

# Controller Flow

For `show`, `update`, and `deleteTask`:

1. Parse `req.params.id`
2. Return `400` if the ID is invalid
3. Find a task matching both ID and `global.user_id.email`
4. Return `404` if no owned task is found
5. Return the task without `userId`

---

# Create Flow

```text
validate body -> create task -> push to global.tasks -> return sanitized task
```

The stored task includes `userId`.

The response does not include `userId`.

---

# Update Flow

```text
validate patch body -> parse id -> find owned task -> merge fields -> return sanitized task
```

Useful pattern:

```js
Object.assign(task, value);
```

Core idea: use it to merge validated patch fields into the stored task.

---

# Delete Flow

Use `findIndex()` because delete needs the array position:

```js
const taskIndex = global.tasks.findIndex(...);
```

Then remove the task with:

```js
global.tasks.splice(taskIndex, 1);
```

Copy the task without `userId` before returning it.

---

# Joi Validation

Joi validates request bodies before the app stores data.

Students create:

```text
validation/userSchema.js
validation/taskSchema.js
```

The controller should use the validated `value`, not raw `req.body`.

---

# User Schema

Rules from the assignment:

- `email` is required, trimmed, lowercased, and valid email format
- `name` is required, trimmed, and 3 to 30 characters
- `password` is required and must not be trivial

Useful pattern:

```js
email: Joi.string().trim().lowercase().email().required()
```

---

# Task Schemas

Create schema:

- `title` is required
- `isCompleted` defaults to `false`

Patch schema:

- Allows partial updates
- Does not default `isCompleted`
- Requires at least one field

```js
Joi.object({ ... }).min(1)
```

---

# Where Validation Goes

Validate near the top of the controller.

```js
const { error, value } = userSchema.validate(req.body, {
  abortEarly: false,
});
```

If `error` exists, return `400`.

If validation passes, build objects from `value`.

---

# Password Hashing

Never store plain-text passwords.

Assignment 4 uses Node's built-in modules:

```js
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
```

`crypto.scrypt` uses callback style. `util.promisify()` lets students use `await`.

---

# Register With Hashing

In `register`:

1. Validate `req.body`
2. Use the validated `value`
3. Hash the password
4. Store `hashedPassword`
5. Do not store plain `password`

Stored user shape:

```js
{ email, name, hashedPassword }
```

---

# Logon With Hashing

In `logon`:

1. Find the user by email
2. Compare the submitted password with `user.hashedPassword`
3. Return `401` if credentials do not match
4. Set `global.user_id` when login succeeds

Do not compare against `user.password` after this change.

---

# Status Code Guide

For this assignment:

- `200`: successful read, update, delete, or logon/logoff
- `201`: successful register or task create
- `400`: invalid request body or invalid task ID
- `401`: no logged-in user or invalid credentials
- `404`: no task found for this user

---

# Assignment Preview

Students will:

- Add `controllers/taskController.js`
- Add `routes/taskRoutes.js`
- Add `middleware/auth.js`
- Add `validation/userSchema.js`
- Add `validation/taskSchema.js`
- Update `app.js`
- Update `controllers/userController.js`

---

# Tests

Run the required Week 4 test:

```bash
npm run tdd assignment4a
```

`assignment4a` checks protected task behavior, basic validation, and password hashing.

If students attempt the optional advanced section, also run:

```bash
npm run tdd assignment4b
```

`assignment4b` checks deeper validation, patch update, and password security behavior.

---

# Advanced Knowledge

Use these if time allows:

- `Object.assign()` mutates the stored task object
- Salted password hashes protect against precomputed password attacks
- Joi validation does not replace authorization
- Some APIs use `403`, but this assignment can use `404` for another user's task
- Real auth later uses sessions, cookies, or tokens

---

# Wrap-Up

In chat:

1. What is the difference between authentication and authorization?
2. Why should task responses leave out `userId`?
3. Why should controllers use Joi's validated `value`?
4. Why should passwords be hashed before storage?

---

# Closing

This week:

Protected task routes, task ownership, validation, and password hashing.

Next week:

SQL and PostgreSQL replace temporary in-memory storage.
