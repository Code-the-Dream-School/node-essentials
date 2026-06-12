# Week 3 Assignment: Express Middleware and Error Handling

## Learning Objectives
- Continue building the backend for your todo application
- Use Express middleware in the correct order
- Parse JSON request bodies with `express.json()`
- Organize code with `controllers/`, `routes/`, and `middleware/`
- Create route handlers for user registration, logon, and logoff
- Add not-found and error-handler middleware
- Practice middleware debugging in a separate Express app
- Practice enhanced middleware features

## Assignment Guidelines

NOTE: The AI review tool (known as AirHub) can check code and structure, but it does not run your code in a server environment to verify that aspect runs properly. We will have human reviewers checking this aspect, so you may receive a passing assignment from AirHub that could still need revisions after a human has checked that your work runs properly in the correct environment. If your AI and human reviewer feedbacks don't match, trust the human review.

1. **Setup**
   - Work in your `node-homework` repository.
   - The main todo backend files go in the root of `node-homework`.
   - The dog rescue middleware exercise uses the provided `week-3-middleware` starter folder.
   - Do not mix the dog rescue app into the main todo app.
2. **Create a branch**
   - Create a new branch for your work on assignment 3 (e.g., `assignment3`).
   - Make all your changes and commits on this branch.
3. **Before you test**
   - Please read the TDD Testing Guide for how to run and interpret the course-provided tests: [TDD Testing Guide](?page=test-driven-development-(tdd)-testing-guide)
   - Watch this video that goes over Test Driven Development: [How to Read Tests](https://www.youtube.com/watch?v=fxe1yNSC6H4)
4. **Run the tests**
   - Run the main todo backend tests with:
     ```bash
     npm run tdd assignment3a
     ```
   - Run the dog rescue middleware exercise tests with:
     ```bash
     npm run tdd assignment3b
     ```
   - If you attempt the optional advanced dog middleware tasks, run:
     ```bash
     npm run tdd assignment3c
     ```

## Assignment Parts and Test Files

This assignment has three learning parts and three test files:

1. **Assignment 3A - Main Todo Backend**
   - This is part of the main app you will keep building throughout the course.
   - Test command:
     ```bash
     npm run tdd assignment3a
     ```

2. **Assignment 3B - Dog Rescue Middleware Exercise**
   - This is a separate middleware practice app.
   - It lives in `week-3-middleware`.
   - Do not mix this code into the main todo app.
   - Test command:
     ```bash
     npm run tdd assignment3b
     ```

3. **Advanced Dog Middleware Tasks** (optional)
   - It still uses the `week-3-middleware` app.
   - Test command:
     ```bash
     npm run tdd assignment3c
     ```

**Important:** You will work with two separate apps:

- The main todo backend, which you will keep building throughout the course
- The dog rescue middleware exercise, which is a separate practice app in `week-3-middleware`

## Core Tasks (Required)

These tasks are required. The tests run with `npm run tdd assignment3a` and `npm run tdd assignment3b`.

### 1. Main Todo Backend File Structure

In the root of `node-homework`, continue working on the main Express app.

Your main app should use this structure:

```text
app.js
controllers/
  userController.js
routes/
  userRoutes.js
middleware/
  not-found.js
  error-handler.js
```

You will create the controller first, then the router, then the middleware files, and then connect everything in `app.js`.

### 2. Create `controllers/userController.js`

Create a `controllers` folder if it does not already exist.

Inside it, create:

```text
controllers/userController.js
```

Export these three functions:

```js
register
logon
logoff
```

The tests require these exact function names.

**About the globals in this assignment:** In Lesson 1, you learned that putting changing application data on `global` is usually bad practice. We are using `global.users`, `global.user_id`, and `global.tasks` here as a temporary in-memory database so you can practice controllers, routers, and middleware before we add a real database. In a later week, you will replace this fake database with PostgreSQL through Prisma, and you will see how little of your controller code has to change.

### 3. Implement `register`

The `register` function should:

- Read `name`, `email`, and `password` from `req.body`
- Create a new user object
- Add that user to `global.users`
- Set `global.user_id` to that user
- Return status `201`
- Return JSON with the user's `name` and `email`
- Do not return the password

Example response:

```json
{
  "name": "Jim",
  "email": "jim@sample.com"
}
```

### 4. Implement `logon`

The `logon` function should:

- Read `email` and `password` from `req.body`
- Find a matching user in `global.users`
- If the email and password match, set `global.user_id` to that user
- Return status `200`
- Return JSON with the user's `name` and `email`
- If the email or password does not match, return status `401`

### 5. Implement `logoff`

The `logoff` function should:

- Set `global.user_id` to `null`
- Return status `200`

### 6. Create `routes/userRoutes.js`

Create a `routes` folder if it does not already exist.

Inside it, create:

```text
routes/userRoutes.js
```

Set up these routes:

```text
POST /register
POST /logon
POST /logoff
```

Later, when you connect this router in `app.js`, you will mount it at `/api/users`, so the full routes are:

```text
POST /api/users/register
POST /api/users/logon
POST /api/users/logoff
```

### 7. Add Main App Middleware Files

Create a `middleware` folder if it does not already exist.

Inside it, create:

```text
middleware/not-found.js
middleware/error-handler.js
```

`not-found.js` should:

- Export a middleware function
- Return status `404`
- Return a JSON response

`error-handler.js` should:

- Export an error-handling middleware function with four parameters: `err`, `req`, `res`, `next`
- Return status `500`
- Return a JSON response

### 8. Connect Everything in `app.js`

After the controller, router, and middleware files exist, update the root `app.js`.

In `app.js`:

- Initialize `global.user_id = null`
- Initialize `global.users = []`
- Initialize `global.tasks = []`
- Use `express.json()` before your routes
- Mount the user router at `/api/users`
- Add not-found middleware after your routes
- Add error-handler middleware at the end
- Export `{ app, server }`

**Important:** Middleware order matters. Use this order:

```text
express.json()
routes
not-found middleware
error-handler middleware
```

Run the main app tests:

```bash
npm run tdd assignment3a
```

### 9. Dog Rescue Middleware Exercise

The dog rescue app is separate from the main todo backend.

The `week-3-middleware` folder is already provided in your repository. It contains the starter code for the dog rescue app. Read through it first and do not create this app from scratch.

Do not move this code into the main todo app.

Work only inside:

```text
week-3-middleware/
```

This app has routes for:

```text
GET /dogs
POST /adopt
GET /error
GET /images/dachshund.png
```

In `week-3-middleware/app.js`, export the Express app directly:

```js
module.exports = app;
```

By the end of the dog rescue exercise, your middleware should follow the same order taught in Lesson 3:

```text
request ID middleware
logging middleware
security headers middleware
JSON parsing middleware
static file middleware
content-type validation middleware
dog routes
404 handler
error handler
```

You will add some of these pieces in the core dog tasks and the rest in the advanced dog middleware tasks.

### 10. Add Built-In Middleware

In `week-3-middleware/app.js`:

- Add `express.json()` so `POST /adopt` can read `req.body`
- Add `express.static()` so dog images can be served from `week-3-middleware/public/images`

The image route should work:

```text
GET /images/dachshund.png
```

### 11. Add Request ID Middleware

In `week-3-middleware/app.js`, add custom middleware that:

- Adds `req.requestId`
- Adds an `X-Request-Id` response header
- Calls `next()`

Use Node's built-in `crypto.randomUUID()` to create the ID. You do not need to install `crypto`; it comes with Node.

The `uuid` package is common in real projects, but current `uuid` is ESM-only, so this CommonJS assignment uses `crypto.randomUUID()` instead.

```js
const { randomUUID } = require("crypto");

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
```

### 12. Add Logging Middleware

Add logging middleware after the request ID middleware.

The log format should be:

```text
[timestamp]: METHOD PATH (requestId)
```

Example:

```text
[2024-01-15T10:30:45.123Z]: GET /dogs (abc-123)
```

### 13. Add Error and 404 Handling

In `week-3-middleware/app.js`:

- Add a 404 handler for unmatched routes
- Add an error handler for unexpected errors

The 404 response should include:

```json
{
  "error": "Route not found",
  "requestId": "..."
}
```

The 500 response should include:

```json
{
  "error": "Internal Server Error",
  "requestId": "..."
}
```

Run the dog rescue middleware tests:

```bash
npm run tdd assignment3b
```

## Advanced Dog Middleware Tasks (Optional)

These tasks are more advanced than the first dog rescue tasks. They are still part of the dog rescue middleware app.

Continue working inside the separate `week-3-middleware` folder.

### 14. Add Security Headers

Add middleware that sets these headers on all responses:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### 15. Add Request Size Limiting

Update JSON parsing to limit body size:

```js
app.use(express.json({ limit: "1mb" }));
```

### 16. Add Content-Type Validation

Add middleware that checks POST requests.

If a POST request does not use `application/json`, return:

- Status `400`
- JSON response with `error`
- The current `requestId`

The error message should include:

```text
Content-Type must be application/json
```

`415 Unsupported Media Type` is a more specific HTTP status for unsupported content types, but this assignment and its tests use `400 Bad Request`.

### 17. Add Custom Error Classes

Inside `week-3-middleware`, create:

```text
errors.js
```

Create and export:

```js
ValidationError
NotFoundError
UnauthorizedError
```

Each class should extend `Error` and include a `statusCode`.

Suggested status codes:

```text
ValidationError -> 400
NotFoundError -> 404
UnauthorizedError -> 401
```

Example structure:

```js
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
};
```

### 18. Use Custom Errors in `routes/dogs.js`

In `week-3-middleware/routes/dogs.js`:

- Import `ValidationError` and `NotFoundError`
- In `POST /adopt`, throw or pass a `ValidationError` if required fields are missing
- In `POST /adopt`, throw or pass a `NotFoundError` if the dog does not exist or is not available
- Keep the successful `201` response unchanged

Required message patterns:

```text
Missing required fields
not found or not available
```

### 19. Improve Advanced Error Handling

Update the error handler in `week-3-middleware/app.js`:

- Use `err.statusCode` when available
- Default to status `500`
- Use `console.warn()` for `4xx` errors
- Use `console.error()` for `5xx` errors
- Include `error` and `requestId` in every error response

The test expects log messages to include:

```text
WARN:
ERROR:
```

Example error-handler shape:

```js
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else {
    console.error(`ERROR: ${err.name} - ${err.message}`);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
});
```

Run the advanced dog middleware tests:

```bash
npm run tdd assignment3c
```

## Suggested File Structure

By the end of Assignment 3, your files should look like this:

```text
node-homework/
  app.js
  controllers/
    userController.js
  routes/
    userRoutes.js
  middleware/
    not-found.js
    error-handler.js

  week-3-middleware/
    app.js
    dogData.js
    errors.js
    routes/
      dogs.js
    public/
      images/
```

## Testing Your Work

Run the required core tests:

```bash
npm run tdd assignment3a
npm run tdd assignment3b
```

If you attempt the optional advanced dog middleware tasks, also run:

```bash
npm run tdd assignment3c
```


## Video Submission

Record a short video (3-5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Answer 3 questions from Lesson 3:

1. **How does middleware order affect an Express app?**
   - Explain why `express.json()` comes before routes that read `req.body`
   - Explain why not-found middleware goes after real routes
   - Explain why error-handler middleware goes at the end

2. **What are built-in middleware and custom middleware used for?**
   - Explain what `express.json()` does
   - Explain what `express.static()` does
   - Explain one custom middleware example from this assignment

3. **How should an Express app handle errors?**
   - Explain not-found responses
   - Explain error-handling middleware
   - Explain why consistent JSON error responses are useful

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

## To Submit an Assignment

1. Do these commands:

   ```bash
   git add -A
   git commit -m "some meaningful commit message"
   git push origin assignment3
   ```

2. Go to your `node-homework` repository on GitHub.
3. Select your `assignment3` branch.
4. Create a pull request. The target of the pull request should be the main branch of your GitHub repository.
5. Once the pull request is created, your browser contains the URL of the PR. Include that link in your homework submission.
6. Do not forget to include your video link in the submission form.
