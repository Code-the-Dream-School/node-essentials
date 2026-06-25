# Lesson/Assignment 4: Protected Tasks, Validation, and Password Hashing

## Session focus

Keep the session centered on extending the main todo backend from Assignment 3. Week 4 is where students add private task data, validation, and safer password storage while still using the temporary in-memory scaffold.

## Core + advanced optional structure

Lesson 4 is split into **Core Knowledge** and **Advanced Knowledge**. Core topics are required for the app to work: authentication vs authorization, limits of `global.user_id`, protected task routes, task ownership, task CRUD controllers, Joi validation, and password hashing. Advanced topics are optional context: deeper `Object.assign()` behavior, password security details, validation boundaries, status code nuance, and future auth direction.

The advanced section should not change the required app flow. If time is short, keep students focused on the core tasks.

## Core concepts to emphasize

- Authentication answers "who is logged in?"
- Authorization answers "is this user allowed to access this task?"
- `global.user_id` is a temporary learning scaffold, not production auth.
- User routes stay public so users can register and log on.
- Task routes are protected with `authMiddleware`.
- Every stored task needs `userId: global.user_id.email`.
- Every task lookup for `show`, `update`, and `deleteTask` must check both task ID and `global.user_id.email`.
- Task responses should not include `userId`.
- Joi validation should happen before storing or updating data.
- Controllers should use Joi's cleaned `value`, not raw `req.body`.
- Passwords should be stored as `hashedPassword`, not plain `password`.

## Route and file reminders

Required files:

```text
controllers/taskController.js
routes/taskRoutes.js
middleware/auth.js
validation/userSchema.js
validation/taskSchema.js
```

Task router paths are relative to `/api/tasks`:

```text
POST / -> create
GET / -> index
GET /:id -> show
PATCH /:id -> update
DELETE /:id -> deleteTask
```

In `app.js`, the task router should be mounted with auth middleware:

```js
app.use("/api/tasks", authMiddleware, taskRouter);
```

Do not put auth middleware in front of user routes.

## Task controller guidance

For task creation:

- Validate `req.body` with `taskSchema`.
- Use `value` from Joi.
- Store `id`, `userId`, `title`, and `isCompleted`.
- Return status `201`.
- Return the task without `userId`.

For `index`:

- Filter tasks by `global.user_id.email`.
- Return `404` if there are no tasks for this user.
- Return sanitized tasks without `userId`.

For `show`:

- Parse `req.params.id`.
- Return `400` for an invalid ID.
- Find a task matching the ID and logged-in user's email.
- Return `404` if no owned task exists.

For `update`:

- Validate with `patchTaskSchema`.
- Parse the ID.
- Find the owned task.
- Use `Object.assign(task, value)` to merge validated patch fields.
- Return the sanitized updated task.

For `deleteTask`:

- Parse the ID.
- Use `findIndex()` with both task ID and logged-in user's email.
- Copy the task without `userId`.
- Remove it with `splice()`.
- Return the sanitized deleted task.

## Joi validation guidance

User schema rules:

- `email`: required, trimmed, lowercased, valid email format
- `name`: required, trimmed, 3 to 30 characters
- `password`: required and not trivial

Task schema rules:

- `taskSchema.title`: required, trimmed, 3 to 30 characters
- `taskSchema.isCompleted`: boolean, defaults to `false`, not `null`
- `patchTaskSchema.title`: optional, trimmed, 3 to 30 characters, not `null`
- `patchTaskSchema.isCompleted`: optional boolean, not `null`
- `patchTaskSchema`: requires at least one field with `.min(1)`

Remind students that create and patch need different schemas. The patch schema should not add the `isCompleted: false` default when the user only updates a title.

## Password hashing guidance

Use Node's built-in `crypto` and `util` modules:

```js
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
```

Core idea:

- `hashPassword(password)` creates a salt and stored hash.
- `comparePassword(inputPassword, storedHash)` checks login attempts.
- `register` stores `hashedPassword`.
- `logon` compares the submitted password to `user.hashedPassword`.

Students do not need to memorize cryptography internals. The practical rule is: use trusted crypto tools and never store plain-text passwords.

## Status code guidance

For Assignment 4:

- `200 OK`: successful logon/logoff, read, update, or delete
- `201 Created`: successful register or task creation
- `400 Bad Request`: invalid body or invalid task ID
- `401 Unauthorized`: no logged-in user or invalid credentials
- `404 Not Found`: no matching task for this user

Some APIs use `403 Forbidden` when a logged-in user cannot access a resource. This assignment can use `404` for another user's task so the API does not reveal whether that task exists.

## Assignment 4 reminders

Part A focuses on required Week 4 behavior:

- auth middleware
- user register/logon/logoff still working
- task create/index/show/update/delete
- task ownership checks
- task responses without `userId`
- invalid task IDs returning `400`
- basic validation and password hashing checks

Part B is the optional advanced test for deeper validation, patch update, and password security:

- user schema rules
- task schema and patch schema rules
- controllers using validation before storage
- patch updates merging fields without replacing the stored task
- password hashing in `register`
- password comparison in `logon`

Commands:

```bash
npm run tdd assignment4a
npm run tdd assignment4b # optional advanced
```

## Common student issues

- Using `routers/taskRoutes` instead of `routes/taskRoutes`.
- Protecting user routes, which prevents registration and logon.
- Forgetting to call `next()` in `authMiddleware`.
- Calling `next()` after sending a `401`.
- Checking only task ID and forgetting to check `global.user_id.email`.
- Returning `userId` in task responses.
- Using raw `req.body` instead of Joi's validated `value`.
- Adding `.default(false)` to `patchTaskSchema`.
- Storing `password` after adding `hashedPassword`.
- Comparing login password to `user.password` instead of `user.hashedPassword`.

## Debugging prompts

When students are stuck, ask:

1. Is `global.user_id` set to the logged-in user?
2. Did the request reach the controller or stop in middleware?
3. Is the task stored with the logged-in user's email?
4. Does the lookup check both task ID and owner?
5. Did Joi return an `error`?
6. Is the controller using Joi's `value`?
7. Does the stored user have `hashedPassword` instead of `password`?
