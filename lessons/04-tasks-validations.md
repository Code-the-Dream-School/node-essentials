# **Lesson 4 — Protected Routes, Validation, and Password Hashing**

## **Lesson Overview**

**Learning objective**: You will learn how to protect task routes, check whether a logged-in user owns a task, validate incoming data with Joi, and store password hashes instead of plain-text passwords.

This lesson is split into two parts:

- **Part 1 — Core Knowledge**: required material you should know to continue the course.
- **Part 2 — Advanced Knowledge**: optional context and reference material.

**Topics**:

1. What Week 4 adds to the todo backend
2. Authentication and authorization
3. Limits of the temporary global login
4. Protected task routes
5. Task ownership
6. Task controller functions
7. Joi validation
8. Password hashing with Node `crypto`
9. Patch updates with `Object.assign()`
10. Validation and security boundaries

---

# **Part 1 — Core Knowledge**

## **4.1 What Week 4 Adds**

In Week 3, you organized the main todo backend with controllers, routes, middleware, and basic error handling.

In Week 4, you keep building that same app.

You will add:

- Task create, read, update, and delete routes
- Protected task routes
- Ownership checks
- Joi validation
- Password hashing

The main app is still using temporary in-memory data:

```js
global.users = [];
global.tasks = [];
global.user_id = null;
```

That temporary setup lets you practice the backend patterns before the app moves to PostgreSQL and Prisma later.

## **4.2 Authentication and Authorization**

Authentication and authorization are related, but they are not the same.

**Authentication** asks:

```text
Who is logged in?
```

**Authorization** asks:

```text
Is this logged-in user allowed to access this resource?
```

In this assignment, `global.user_id` is the temporary authentication signal. If it has a user object, someone is logged in. If it is `null`, no one is logged in.

Task ownership is the authorization check. A logged-in user should only be able to see, update, or delete their own tasks.

For now, each task stores the owner's email:

```js
{
  id: 1,
  title: "Finish homework",
  isCompleted: false,
  userId: "jim@sample.com"
}
```

When a task controller looks up a task, it should check both the task ID and the current user's email.

```js
const task = global.tasks.find(
  (task) => task.id === taskId && task.userId === global.user_id.email,
);
```

That check answers: "Does this task belong to the logged-in user?"

## **4.3 Limits of `global.user_id`**

The `global.user_id` approach is a scaffold. It is useful for learning, but it is not production-ready.

Important limits:

- It is shared by the whole server.
- It only represents one logged-in user at a time.
- It resets when the server restarts.
- It does not prove which browser or client made the request.

You may hear this idea described as a `loggedOnUser` variable in general examples. In this course project, the actual variable name is `global.user_id`.

Later, you will replace this temporary approach with stronger authentication patterns.

## **4.4 Protected Task Routes**

Some routes should be public. Users need to register and log on before they can be protected.

Public routes:

```text
POST /api/users/register
POST /api/users/logon
POST /api/users/logoff
```

Task routes should be protected:

```text
POST /api/tasks
GET /api/tasks
GET /api/tasks/:id
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

A protected route checks whether a user is logged in before the controller runs.

You already learned middleware in Week 3. Here, you are applying that same middleware pattern to authentication.

Create `middleware/auth.js`:

```js
module.exports = (req, res, next) => {
  if (!global.user_id) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
};
```

The `return` matters. If the middleware sends a `401` response, it should not also continue to the controller.

In `app.js`, apply this middleware only to task routes:

```js
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");

app.use("/api/tasks", authMiddleware, taskRouter);
```

Do not put this middleware in front of every route. If you did, users would need to be logged in before they could register or log on.

## **4.5 Task Ownership**

Each task should store who owns it.

For this assignment, use the logged-in user's email:

```js
const newTask = {
  id: taskCounter(),
  userId: global.user_id.email,
  ...value,
};
```

Do not send `userId` back in API responses.

The client needs task information like:

```json
{
  "id": 1,
  "title": "Finish homework",
  "isCompleted": false
}
```

The client does not need the internal owner field:

```json
{
  "userId": "jim@sample.com"
}
```

You can remove `userId` by copying the task and leaving that property out:

```js
const { userId, ...sanitizedTask } = task;
res.status(200).json(sanitizedTask);
```

This does not delete `userId` from the stored task. It only leaves `userId` out of the response copy.

## **4.6 Task Controller Functions**

Create `controllers/taskController.js`.

Export these five functions:

```js
create
index
show
update
deleteTask
```

### **Task IDs**

For now, use a small counter helper:

```js
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();
```

Each time you call `taskCounter()`, it returns the next number.

This is still temporary. When you use a database later, the database will create IDs for you.

### **Route Parameters**

For routes like this:

```text
GET /api/tasks/:id
```

Express stores the value in `req.params.id`.

That value is a string, so convert it before comparing it to your numeric task IDs:

```js
const taskId = parseInt(req.params?.id);

if (!taskId) {
  return res.status(400).json({
    message: "The task ID passed is not valid.",
  });
}
```

### **Create**

`create` should:

- Validate the request body
- Create a task with an ID
- Store the current user's email in `userId`
- Push the task into `global.tasks`
- Return status `201`
- Return the task without `userId`

### **Index**

`index` should:

- Find tasks owned by the logged-in user
- Return those tasks without `userId`
- Return `404` if this user has no tasks

### **Show**

`show` should:

- Read `req.params.id`
- Find a task with that ID and the current user's email
- Return the task without `userId`
- Return `404` if no matching task exists

### **Update**

`update` should:

- Validate the patch body
- Read `req.params.id`
- Find a task with that ID and the current user's email
- Merge the validated patch fields into the stored task
- Return the updated task without `userId`

Use this pattern to merge patch fields:

```js
Object.assign(task, value);
```

For now, the important idea is that this copies the validated patch fields onto the existing task.

### **Delete**

`deleteTask` should:

- Read `req.params.id`
- Find the task index for the current user
- Remove that task from `global.tasks`
- Return the deleted task without `userId`

## **4.7 Joi Validation**

Validation means checking incoming data before you store it or use it.

This project uses Joi.

Install it in the homework project:

```bash
npm install joi
```

Joi lets you describe the shape of valid data.

Create:

```text
validation/userSchema.js
validation/taskSchema.js
```

### **User Schema**

A user needs:

- `email`: trimmed, lowercased, valid email, required
- `name`: trimmed, 3 to 30 characters, required
- `password`: required, at least 8 characters, includes uppercase, lowercase, number, and special character

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

### **Task Schemas**

A new task needs a title. If `isCompleted` is not provided, it should default to `false`.

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

The create schema and patch schema are different:

- Create requires a `title`.
- Patch allows partial updates, but it still needs at least one field.

### **Using Validation**

Use `.validate()` before storing data:

```js
const { error, value } = userSchema.validate(req.body, {
  abortEarly: false,
});
```

If `error` exists, return `400`.

```js
if (error) {
  return res.status(400).json({
    message: error.message,
  });
}
```

If validation succeeds, use `value`, not the original `req.body`.

Joi may clean or transform data. For example, it can trim strings or lowercase email addresses. Those cleaned values are in `value`.

If a request might not have a body, make sure validation receives an object:

```js
if (!req.body) req.body = {};
```

## **4.8 Password Hashing**

Never store plain-text passwords.

If passwords are stored directly and the data is exposed, attackers get the actual passwords. Many people reuse passwords across sites, so that can harm users beyond your app.

Instead, store a password hash.

The flow is:

```text
register -> hash password -> store hashedPassword
logon -> hash submitted password -> compare with stored hash
```

This assignment uses Node's built-in `crypto` module.

`crypto.scrypt` uses callback style, so you will use `util.promisify()` to make it work with `async` and `await`.

```js
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
```

Use these helper functions in `userController.js`:

```js
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

In `register`, store `hashedPassword` instead of `password`.

```js
const hashedPassword = await hashPassword(password);

const newUser = {
  email,
  name,
  hashedPassword,
};
```

In `logon`, compare the submitted password with the stored hash.

```js
const goodCredentials = await comparePassword(
  password,
  user.hashedPassword,
);
```

You do not need to memorize the cryptography details. The key practice is to use trusted crypto tools and never store plain-text passwords.

## **4.9 Core Check for Understanding**

1. What is the difference between authentication and authorization?
2. Why is `global.user_id` temporary and not production-ready?
3. Which routes should be protected in Assignment 4?
4. Why should task responses leave out `userId`?
5. Why should controllers use Joi's `value` instead of raw `req.body`?
6. Why should user records store `hashedPassword` instead of `password`?

### **Answers**

1. Authentication checks who is logged in. Authorization checks whether that user can access a specific resource.
2. It is shared by the whole server, only represents one user at a time, and resets when the server restarts.
3. The task routes should be protected. Register, logon, and logoff should remain public.
4. `userId` is internal ownership data. The client does not need it in task responses.
5. Joi may trim, lowercase, default, or otherwise clean the data. Those cleaned values are in `value`.
6. Plain-text passwords create serious risk if data is exposed. A hash lets the app check passwords without storing the original password.

---

# **Part 2 — Advanced Knowledge**

Part 2 is optional. It gives deeper context and reference material.

## **4.10 `Object.assign()` and Patch Updates**

PATCH means partial update.

If a task is:

```js
{
  id: 1,
  title: "Write tests",
  isCompleted: false,
  userId: "jim@sample.com"
}
```

And the patch body is:

```js
{
  isCompleted: true
}
```

You do not want to replace the whole task with only `{ isCompleted: true }`. That would lose the ID, title, and owner.

Instead, mutate the existing task object:

```js
Object.assign(task, value);
```

After that, the stored task is updated in place:

```js
{
  id: 1,
  title: "Write tests",
  isCompleted: true,
  userId: "jim@sample.com"
}
```

Because `task` is the object stored inside `global.tasks`, mutating it updates the stored array entry.

Still sanitize the response after the update:

```js
const { userId, ...sanitizedTask } = task;
res.status(200).json(sanitizedTask);
```

## **4.11 Password Security Details**

A password hash is one-way. The app should not be able to turn the hash back into the original password.

A salt is random data added before hashing. Each user gets a different salt, so two users with the same password should still have different stored hashes.

This helps protect against precomputed password lookup attacks, often called rainbow table attacks.

`crypto.timingSafeEqual()` helps compare secret values in a way that avoids leaking information through tiny timing differences.

The details matter in production, but the rule for this course is simple:

```text
Use trusted crypto tools. Do not invent your own password storage system.
```

Also avoid storing sensitive data your app does not need. Credit card numbers, government ID numbers, and unnecessary personal information create risk and may bring legal requirements.

## **4.12 Validation Boundaries**

Validation is one layer of protection.

Joi can:

- Require fields
- Check types
- Enforce length rules
- Trim strings
- Lowercase email addresses
- Provide default values

Joi does not replace authorization. A task can have valid data and still belong to a different user.

Later, database constraints will add another layer. For now, Joi protects the app before data enters the in-memory arrays.

## **4.13 Status Code Nuance**

For this assignment:

- Use `401` when no user is logged in.
- Use `400` when request data is invalid.
- Use `404` when the requested task is not found for the current user.

Some APIs use `403 Forbidden` when a user is logged in but not allowed to access a resource.

This assignment can use `404` for another user's task. That avoids revealing whether the task exists.

## **4.14 Future Authentication Direction**

`global.user_id` is only a learning scaffold.

Later, an app should know which client made the request. Common production patterns include sessions, cookies, and tokens.

You do not need to implement those in Week 4. The important idea is that the current global login will be replaced later.

## **4.15 Advanced Check for Understanding**

1. Why does PATCH usually merge fields instead of replacing the whole object?
2. What does `Object.assign(task, value)` do to the stored task object?
3. What does a salt add to password hashing?
4. Why does validation not replace authorization?
5. Why might an API return `404` instead of `403` for a resource owned by another user?

### **Answers**

1. PATCH is for partial updates. Replacing the whole object could delete fields that were not included in the request.
2. It mutates the existing task object by copying the fields from `value` onto it.
3. A salt adds unique random data so matching passwords do not produce the same stored hash.
4. Validation checks the shape and values of data. Authorization checks whether this user can access this resource.
5. Returning `404` can avoid revealing whether another user's resource exists.
