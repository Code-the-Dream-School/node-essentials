# **Lesson 3 — Express Middleware and Error Handling**

## **Lesson Overview**

**Learning objective**: You will learn how Express processes requests through middleware and route handlers. You will write built-in, custom, and third-party middleware. You will organize not-found and error handlers, choose common API status codes, return consistent error responses, and use basic debugging techniques for Express applications.

This lesson is split into two parts:

- **Part 1 — Core Knowledge**: required material you should know to continue the course.
- **Part 2 — Advanced Knowledge**: optional context and reference material.

**Topics**:

1. Express request flow
2. Middleware functions and `next()`
3. Middleware order
4. Built-in, custom, and third-party middleware
5. Request and response modification
6. Not-found and error handling middleware
7. Common API status codes
8. Consistent error responses
9. Basic debugging techniques

---

# **Part 1 — Core Knowledge**

[Express Middleware Visual Explanation](https://www.youtube.com/watch?v=lY6icfhap2o&t=2s)

The video will help you picture middleware as a sequence of functions that a request can pass through before a route handler sends the final response.

## **3.1 Express Request Flow**

In Lesson 2, you created simple Express route handlers. A route handler is the function that sends the response for a matching method and path.

In an Express app, requests usually pass through a chain of functions before a response is sent:

```text
request -> middleware -> route handler -> response
```

Middleware functions are the pieces in the middle. They can run before route handlers. They can also handle requests that did not match a route, or errors that happened while a request was being processed.

Here is the common structure:

```js
const express = require("express");

const app = express();

app.use(express.json());

app.get("/info", (req, res) => {
  res.status(200).json({
    message: "The route handler sent this response.",
  });
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };
```

The important idea is that Express checks middleware and routes in the order they are registered.

The method you use to register a function matters:

- `app.use()` registers middleware.
- `app.get()`, `app.post()`, `app.patch()`, and similar methods register route handlers for specific HTTP methods.

When you write `app.use(someFunction)`, that function can run for every request. When you write `app.use("/api", someFunction)`, that function can run for requests whose path starts with `/api`, such as `/api/tasks` or `/api/users`.

## **3.2 What Middleware Is**

A middleware function receives the request, the response, and a `next` function.

```js
function logger(req, res, next) {
  console.log(`${req.method} ${req.path}`);
  next();
}
```

Middleware and route handlers look similar because both receive `req` and `res`. The difference is their usual job. Middleware usually prepares, checks, logs, or modifies the request before the final route handler. A route handler is usually the endpoint for a specific method and path, and it sends the main response for that route.

Middleware can do one of three things:

- Send a response.
- Call `next()` to pass control to the next matching middleware or route handler.
- Call `next(error)` or throw an error to send control to the error handler.

Think of `next()` as telling Express, "I am done with my part. Go to the next matching function." Express pauses at each middleware function until that middleware either sends a response, calls `next()`, or reports an error.

Here is a logger middleware used in an app:

```js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

If middleware does not send a response and does not call `next()`, the request hangs. The client waits until it times out.

## **3.3 Middleware Order**

Middleware order is one of the most important Express concepts. This is a place where small changes in code order can completely change what the app does.

Express runs matching middleware and routes from top to bottom:

```js
app.use(logger);
app.use(express.json());

app.get("/tasks", getTasks);
app.post("/tasks", createTask);

app.use(notFound);
app.use(errorHandler);
```

This order matters:

1. Logging comes early so every request is logged.
2. `express.json()` comes before routes that read `req.body`.
3. Routes come after shared setup middleware.
4. Not-found middleware comes after all real routes.
5. Error handling middleware comes last.

If you put `express.json()` after a route, that route cannot read the parsed JSON body.

```js
app.post("/echo", (req, res) => {
  res.status(200).json({
    weReceived: req.body,
  });
});

// Too late for the route above.
app.use(express.json());
```

The corrected order is:

```js
app.use(express.json());

app.post("/echo", (req, res) => {
  res.status(200).json({
    weReceived: req.body,
  });
});
```

There is also an important path matching difference between `app.use()` and route methods like `app.get()`.

```js
app.use("/api", logger);
```

The middleware above runs for requests whose path starts with `/api`, such as `/api`, `/api/tasks`, and `/api/users/7`.

```js
app.get("/api", handler);
```

The route above only handles `GET /api`. It does not handle `GET /api/tasks`.

Here is the same idea in table form:

| Code | Matches | Does not match |
|------|---------|----------------|
| `app.use("/api", logger)` | `/api`, `/api/tasks`, `/api/users/7` | `/tasks` |
| `app.get("/api", handler)` | `GET /api` | `POST /api`, `GET /api/tasks` |

## **3.4 Built-In Middleware**

Express includes middleware for common tasks.

The most common built-in middleware for this course is `express.json()`.

```js
app.use(express.json());
```

This reads a JSON request body and puts the parsed JavaScript object on `req.body`.

For example, if the client sends this JSON:

```json
{
  "title": "Learn middleware"
}
```

Then the route handler can read:

```js
req.body.title;
```

Express also includes `express.static()`, which serves files from a folder:

```js
app.use(express.static("public"));
```

For this backend course, `express.json()` is the one you will use most often. Static files are useful, but they are not the main focus.

## **3.5 Custom Middleware**

Custom middleware is middleware you write yourself.

### **Request Logger**

```js
function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.path}`);
  next();
}

app.use(requestLogger);
```

### **Content-Type Checker**

The middleware below checks requests that usually have a body: `POST`, `PUT`, and `PATCH`. If one of those requests is not JSON, the middleware sends a `400` response and stops the request before it reaches a route handler.

HTTP headers are small pieces of metadata sent with a request or response. A request header can tell the server what kind of body the client sent. For example, `Content-Type: application/json` means the request body should be JSON.

Express gives you a helper called `req.is()`. The call `req.is("application/json")` checks whether the request says it is sending JSON.

You do not need to memorize `req.is()` yet. The important idea is that middleware can check a request before it reaches a route handler.

```js
function requireJson(req, res, next) {
  const methodsWithBody = ["POST", "PUT", "PATCH"];

  if (methodsWithBody.includes(req.method) && !req.is("application/json")) {
    return res.status(400).json({
      message: "Content-Type must be application/json.",
    });
  }

  next();
}

app.use(requireJson);
```

The `if` statement is the part that rejects the request. It checks two things: whether the request method is in `methodsWithBody`, and whether the request is **not** JSON. If both are true, the middleware sends the `400` response. If not, it calls `next()` and the request continues.

The `return` stops the middleware function right after sending the `400` response. Without it, the function could keep going and call `next()`, even though a response has already been sent.

You may see some APIs use `415 Unsupported Media Type` for this situation. In this course's Week 3 assignment, use `400 Bad Request` for the content-type middleware so your code matches the tests.

### **Request Time**

```js
function addRequestTime(req, res, next) {
  req.requestTime = new Date().toISOString();
  next();
}

app.use(addRequestTime);
```

This middleware adds a new property, `requestTime`, to the `req` object. Because the same `req` object is passed along the middleware chain, later middleware and route handlers can read `req.requestTime`.

## **3.6 Third-Party Middleware**

Third-party middleware is middleware installed from npm. These packages solve common problems so every project does not need to rewrite the same code.

You install third-party middleware with npm:

```bash
npm install morgan
```

If you try to `require("morgan")` before installing it, Node will throw an error such as `Cannot find module 'morgan'`. When you use a third-party package, make sure it is listed in your `package.json`.

Then you require it and use it with `app.use()`.

```js
const morgan = require("morgan");

app.use(morgan("dev"));
```

Common third-party middleware examples include:

- `morgan`: logs requests.
- `cors`: configures Cross-Origin Resource Sharing.
- `cookie-parser`: parses cookies into `req.cookies`.
- `helmet`: sets helpful security-related headers.
- `compression`: compresses HTTP responses.

You do not need to use all of these right now. The important point is that Express apps often combine built-in middleware, custom middleware, and third-party middleware.

Third-party middleware still follows the same ordering rules. For example, `morgan` should usually go near the top so it logs every request. A package such as `cookie-parser` should go before any route or middleware that tries to read `req.cookies`.

Typical setup:

```js
const express = require("express");
const morgan = require("morgan");

const app = express();

app.use(morgan("dev"));
app.use(express.json());
```

## **3.7 Request and Response Modification**

Middleware is useful because it can add shared behavior in one place. If several routes need the same setup, that setup often belongs in middleware.

### **Modifying the Request**

Middleware can add data to the `req` object before the request reaches a route handler.

Express passes the same `req` object from one middleware function to the next. If one middleware function adds a property to `req`, the later middleware functions and route handler can read that property.

In this example, the middleware adds two new properties to the request:

- `req.requestId`: a simple ID that can help track one request through logs
- `req.startedAt`: the time when this request started being processed

```js
const { randomUUID } = require("crypto");

app.use((req, res, next) => {
  req.requestId = randomUUID();
  req.startedAt = Date.now();
  next();
});
```

`crypto` is built into Node, so you do not need to install it. The `uuid` package is common in real projects, but current `uuid` is ESM-only. Since this course uses CommonJS with `require()`, `crypto.randomUUID()` is the simpler choice here.

Because this middleware runs before the route handler, the `/debug` route can read those same properties from `req`.

```js
app.get("/debug", (req, res) => {
  res.status(200).json({
    requestId: req.requestId,
    startedAt: req.startedAt,
  });
});
```

A very common real-world use is authentication. After checking a login token or session, authentication middleware may attach the current user to the request.

```js
app.use((req, res, next) => {
  req.user = {
    id: 1,
    email: "sample@example.com",
  };
  next();
});
```

Then route handlers later in the chain can check `req.user` instead of repeating the login lookup in every route.

### **Modifying the Response**

Middleware can also prepare the `res` object before the route handler sends the final response.

One common example is setting a response header. A **header** is metadata sent with the response. It is not the main response body, but it gives the client extra information about the response.

In this example, every response from the app will include an `X-App-Name` header:

```js
app.use((req, res, next) => {
  res.setHeader("X-App-Name", "Node Homework");
  next();
});
```

This middleware does not send the response. It only adds a header, then calls `next()` so the request can continue to the route handler.

Middleware can also run code after the response has been sent. To do that, you can listen for the `"finish"` event on `res`.

The `"finish"` event runs when Express has finished sending the response back to the client. That makes it useful for logging, because by then the final status code is known.

```js
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`${req.method} ${req.path} -> ${res.statusCode}`);
  });

  next();
});
```

This middleware starts listening for `"finish"`, then immediately calls `next()`. Later, after a route handler sends the response, the logging function runs and prints something like:

```text
GET /tasks -> 200
```

So middleware can affect the response in two different moments:

- Before the response is sent, by setting headers or other response details.
- After the response is sent, by reacting to events like `"finish"` for logging or cleanup.

## **3.8 Not-Found Middleware**

Sometimes a request reaches your Express app, but none of your routes match it.

For example, your app might have this route:

```text
GET /tasks
```

But the client requests this path:

```text
GET /tascks
```

That typo should not return a successful response. It should return a `404` response, which means "not found."

This is different from a server error. A `404` does not mean your code crashed. It means the client requested a route your app does not provide.

A not-found middleware is usually placed after all real routes. That placement matters because Express checks routes and middleware in order. If none of the real routes send a response, the request eventually reaches the not-found middleware.

```js
app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

app.use((req, res) => {
  res.status(404).json({
    message: `No route found for ${req.method} ${req.path}`,
  });
});
```

The not-found middleware does not call `next()` because it is the final stop for unmatched requests. Its job is to say, "No route handled this request, so send a 404 response now."

Order matters here. If you place this middleware before your real routes, it will run too early.

For example, this order is wrong:

```js
app.use((req, res) => {
  res.status(404).json({
    message: `No route found for ${req.method} ${req.path}`,
  });
});

app.get("/tasks", (req, res) => {
  res.status(200).json({
    tasks: [],
  });
});
```

In that version, a request for `GET /tasks` reaches the not-found middleware first. The not-found middleware sends a `404` response, so the `/tasks` route never gets a chance to run.

The correct order is:

```text
real routes first -> not-found middleware last
```

## **3.9 Error Handling Middleware**

Error handling middleware is the place where Express sends errors that happen while processing a request.

Normal middleware and route handlers usually receive `req`, `res`, and sometimes `next`. Error handling middleware is different because it receives the error first.

```js
function errorHandler(err, req, res, next) {
  res.status(500).json({
    message: "Something went wrong.",
  });
}
```

Express recognizes error handlers by this four-parameter signature:

```js
(err, req, res, next)
```

That first parameter, `err`, is the error that was passed to Express. Normal middleware does not have that first parameter:

```js
(req, res, next)
```

When middleware or a route handler calls `next(error)`, Express changes paths. It stops looking for normal route handlers and starts looking for error handling middleware.

The flow looks like this:

```text
request -> route handler -> next(error) -> error handler -> 500 response
```

This is different from not-found middleware. A not-found response means the app did not have a matching route. Error handling middleware means a matching route or middleware started running, but something failed while it was running.

For example:

- `GET /unknown` should usually become a `404 Not Found`.
- `GET /tasks/1` starts running, but the database crashes. That should usually become a `500 Internal Server Error`.

As a general rule, use `next(error)` when you want to hand an error to Express.

In this example, the route intentionally creates an error and passes it to the error handler:

```js
app.get("/problem", (req, res, next) => {
  next(new Error("This route failed."));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal server error.",
  });
});
```

The route does not send the final response. Instead, `next(new Error(...))` tells Express, "Something went wrong. Find the error handler."

The error handler should go after normal routes and after the not-found middleware.

Common order:

```js
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);
```

The order matters because the error handler is a final safety net. It should not run before your real routes get a chance to handle the request.

Be careful not to send more than one response for the same request. If a route sends a response and then an error handler also tries to send another response, Express will report an error because the response was already sent.

Async route handlers often need error handling too. If you are waiting on a database call or another asynchronous operation, use `try`/`catch` and pass unexpected errors to `next(error)`. This is not optional. In Express, an error thrown inside a bare `async` handler is not caught automatically. If you do not catch it and call `next(error)`, Express never reaches the error handler and the request just hangs until it times out.

In this example, there are two different outcomes:

- If no task exists, the route sends a normal `404` response.
- If the database call itself fails, the `catch` block passes the unexpected error to Express.

```js
app.get("/tasks/:id", async (req, res, next) => {
  try {
    const task = await getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    res.status(200).json({
      task,
    });
  } catch (error) {
    next(error);
  }
});
```

The `404` above is not an unexpected server error. It is a normal response when the requested task does not exist. The `catch` block is for unexpected failures.

One more important detail: callbacks are different from regular `async` route code. If an error happens inside a callback, do not throw it from inside the callback. Call `next(error)` instead so Express can handle it.

### **Custom Error Classes**

Sometimes an error should carry its own HTTP status code. For example, missing request data should be a `400`, while a missing resource should be a `404`.

One way to do this is to create custom error classes. Each class extends JavaScript's built-in `Error` class.

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

The important pieces are:

- `extends Error` means your class behaves like a normal JavaScript error.
- `super(message)` sends the message to the built-in `Error` constructor.
- `this.name` gives the error a useful label for logging.
- `this.statusCode` stores the HTTP status code your error handler should use.

Then a route can throw or pass one of these errors:

```js
const { ValidationError, NotFoundError } = require("./errors");

app.post("/tasks", (req, res, next) => {
  const { title } = req.body;

  if (!title) {
    return next(new ValidationError("Title is required."));
  }

  res.status(201).json({ message: "Task created." });
});
```

### **Status-Aware Error Handlers**

A basic error handler always returns `500`. A more useful error handler checks whether the error has a `statusCode`.

```js
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else {
    console.error(`ERROR: ${err.name} - ${err.message}`);
  }

  const errorMessage =
    statusCode === 500 ? "Internal Server Error" : err.message;

  res.status(statusCode).json({
    error: errorMessage,
    requestId: req.requestId,
  });
});
```

This pattern keeps expected client problems, such as validation failures, separate from unexpected server failures.

## **3.10 Common API Status Codes**

HTTP status codes tell the client what happened.

Think of the status code as the short summary of the response. The response body can explain the details, but the status code tells the client the category of result.

You do not need to memorize every status code. Start with the common ones below.

### **Success Codes**

- `200 OK`: request succeeded and returns data.
- `201 Created`: new resource was created.
- `204 No Content`: request succeeded, but there is no response body.

Use success codes when the server understood the request and completed it successfully.

Examples:

```js
res.status(200).json({ tasks });
res.status(201).json({ task: newTask });
res.status(204).send();
```

The difference between these matters:

- Use `200` when you are returning a normal successful response.
- Use `201` after creating something new, such as a task or user.
- Use `204` when the request succeeded but there is nothing useful to send back.

### **Client Error Codes**

- `400 Bad Request`: request is malformed or missing required data.
- `401 Unauthorized`: authentication is missing or invalid.
- `403 Forbidden`: user is authenticated but not allowed.
- `404 Not Found`: route or resource was not found.
- `409 Conflict`: request conflicts with existing data.
- `415 Unsupported Media Type`: request content type is not supported.
- `422 Unprocessable Entity`: request is valid JSON, but the data fails validation.

Use `4xx` codes when the client needs to change something about the request.

Examples:

```js
res.status(400).json({ message: "Title is required." });
res.status(401).json({ message: "Authentication required." });
res.status(403).json({ message: "You cannot access this resource." });
res.status(404).json({ message: "Task not found." });
```

These are not all the same kind of problem:

- `400` means the request itself is not acceptable, such as missing required data.
- `401` means the client has not proven who they are.
- `403` means the client may be logged in, but they are not allowed to do this action.
- `404` means the route or resource does not exist.

### **Server Error Codes**

- `500 Internal Server Error`: unexpected server failure.

Example:

```js
res.status(500).json({
  message: "Internal server error.",
});
```

Choose the status code that best describes what happened from the caller's point of view.

Do not use `500` for every problem. If the client sent bad data, used the wrong credentials, or asked for a missing resource, use a `4xx` status code. Use `500` when the server failed unexpectedly and the client could not have fixed the problem by changing the request.

## **3.11 Consistent Error Responses**

APIs should return errors in a predictable shape.

Predictable error responses make frontend code easier to write. If every error response has a `message` property, the frontend can usually display `error.message` without guessing what shape the response will have.

A simple error response shape is:

```js
{
  message: "Title is required."
}
```

For this course, that is often enough.

For larger applications, an error response might include more detail. This is especially useful for validation errors, where more than one field might be wrong.

```js
{
  message: "Validation failed.",
  errors: [
    {
      field: "email",
      message: "Email must be valid."
    }
  ]
}
```

In that example, the general `message` says what kind of problem happened. The `errors` array gives field-level details.

Avoid sending internal details to the client. Stack traces, database errors, file paths, and secret values should not be exposed in API responses.

The server can log detailed errors:

```js
console.error(err);
```

But the client should get a safe message:

```js
res.status(500).json({
  message: "Internal server error.",
});
```

That separation is important:

- Server logs are for developers.
- API responses are for clients and users.

Developers need detail to debug the problem. Clients need a clear but safe message.

## **3.12 Basic Debugging Express Apps**

When an Express route does not work, debug the request flow. Try to find out how far the request got through the middleware chain.

Do not start by changing random code. First, find where the request stops.

Start with these questions:

1. Did the request reach the server?
2. Did the request match the route path and method?
3. Did earlier middleware send a response first?
4. Did middleware call `next()`?
5. Was `express.json()` registered before the route that reads `req.body`?
6. Did an error handler run?

Postman and the browser network tab are useful here. Check the exact method, URL, request body, response status code, and response body.

Many Express bugs are really mismatches between the request you think you sent and the request the server actually received.

For example:

- You wrote `app.post("/tasks")`, but sent `GET /tasks`.
- You wrote `app.get("/api/tasks")`, but requested `/tasks`.
- You expected `req.body`, but forgot `app.use(express.json())`.

### **Logging Middleware**

Add a logger near the top of `app.js` to prove the request reached your server:

```js
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.path);
  next();
});
```

This log answers the first question: "Did the request reach my app?"

You can also log the response status after the response finishes:

```js
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log("Response status:", res.statusCode);
  });

  next();
});
```

This tells you what status code the request ended with, even if a different route or middleware sent the response.

### **Route Debugging**

If a route does not run, check the method and path. Add a log inside the route you expect to run:

```js
app.post("/tasks", (req, res) => {
  console.log("POST /tasks route reached");
  res.status(201).json({
    message: "Task created.",
  });
});
```

A request to `GET /tasks` will not run a `POST /tasks` route.

The path must match too. A request to `/task` will not run a route registered as `/tasks`.

### **Body Debugging**

If `req.body` is undefined, check that this line appears before your routes:

```js
app.use(express.json());
```

Also check that the client sends `Content-Type: application/json`.

Both sides matter:

- Express needs `app.use(express.json())` so it knows how to parse JSON.
- The client needs `Content-Type: application/json` so Express knows the body is JSON.

## **3.13 A Complete Mini App**

Here is a small `app.js` that puts the core pieces together.

Read this example from top to bottom. The order is the main lesson:

- Setup middleware goes first.
- Real routes go next.
- The not-found handler catches unmatched requests.
- The error handler catches failures.

```js
const express = require("express");

const app = express();

function logger(req, res, next) {
  console.log(`${req.method} ${req.path}`);
  next();
}

function notFound(req, res) {
  res.status(404).json({
    message: `No route found for ${req.method} ${req.path}`,
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({
    message: "Internal server error.",
  });
}

app.use(logger);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

app.post("/echo", (req, res) => {
  res.status(200).json({
    weReceived: req.body,
  });
});

app.get("/problem", (req, res, next) => {
  next(new Error("Something went wrong."));
});

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };
```

Notice the order:

1. Logger middleware
2. JSON body parsing middleware
3. Real routes, including one route that intentionally triggers the error handler
4. Not-found middleware
5. Error handling middleware

This order is the main pattern you will keep using in Express apps. If something behaves strangely, come back to this order and ask which function handled the request first.

## **3.14 Core Check for Understanding**

1. What are the three things middleware can do with a request?
2. Why does middleware order matter?
3. Why should `express.json()` come before routes that read `req.body`?
4. What is the difference between not-found middleware and error handling middleware?
5. Why does error handling middleware have four parameters?
6. Name two third-party middleware packages and what they do.
7. What status code should you use when a route does not exist?
8. What should you check first when an Express request hangs?

### **Answers**

1. Middleware can send a response, call `next()`, or call `next(error)`/throw an error.
2. Express checks middleware and routes in the order they are registered, so earlier middleware can affect or stop later handlers.
3. `express.json()` parses JSON and puts the result on `req.body`. Routes cannot use `req.body` until that parsing happens.
4. Not-found middleware handles requests that did not match any route. Error handling middleware handles errors passed with `next(error)` or thrown from handlers.
5. Express recognizes error handling middleware by the `(err, req, res, next)` signature.
6. Examples: `morgan` logs requests, `cors` configures cross-origin requests, `cookie-parser` parses cookies, `helmet` sets security-related headers.
7. Use `404 Not Found`.
8. Check whether the matching middleware or route sent a response or called `next()`.

---

# **Part 2 — Advanced Knowledge**

Part 2 is optional. It gives deeper context and reference material.

## **3.15 Internet and Browser Context**

Most backend API work happens over HTTP, but HTTP itself runs on top of lower-level networking.

The Internet uses IP addresses to move packets between machines. TCP adds reliable connections on top of IP. HTTP runs over TCP. HTTPS is HTTP over an encrypted TLS connection.

You do not need to work directly with TCP for this course, but it helps to know the layers:

```text
HTTP/HTTPS -> TCP -> IP -> network
```

Browsers also keep track of extra information for web requests:

- Origin
- Cookies
- Request headers
- Response headers

This becomes important later when you work with authentication, cookies, CORS, and security.

## **3.16 Deeper HTTP Status Code Reference**

Status codes are grouped by hundreds.

### **1xx Informational**

Rare in day-to-day Express APIs. They mean the request was received and processing continues.

### **2xx Success**

- `200 OK`
- `201 Created`
- `204 No Content`

### **3xx Redirection**

- `301 Moved Permanently`
- `302 Found`
- `304 Not Modified`

Redirects are more common in browser-facing apps than in JSON APIs.

### **4xx Client Errors**

The client sent something wrong or requested something it cannot access.

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `415 Unsupported Media Type`
- `422 Unprocessable Entity`

### **5xx Server Errors**

The server failed unexpectedly.

- `500 Internal Server Error`
- `502 Bad Gateway`
- `503 Service Unavailable`
- `504 Gateway Timeout`

In your own Express apps, you will usually send `500` for unexpected server errors.

## **3.17 Static File Serving**

Express can serve static files such as images, CSS, and browser JavaScript.

```js
app.use(express.static("public"));
```

If `public/logo.png` exists, Express can serve it at:

```text
/logo.png
```

You can also mount static files under a path prefix:

```js
app.use("/static", express.static("public"));
```

Then `public/logo.png` is available at:

```text
/static/logo.png
```

This course mostly focuses on JSON APIs, but static file serving is common in Express.

## **3.18 Error Handling Best Practices**

As applications grow, error handling needs to stay consistent.

Useful practices:

- Log detailed errors on the server.
- Send safe messages to clients.
- Avoid leaking stack traces in production.
- Use consistent JSON error shapes.
- Use `404` for missing resources and `500` for unexpected failures.
- Keep the error handler near the end of `app.js`.

Development and production can behave differently:

```js
const message =
  process.env.NODE_ENV === "production"
    ? "Internal server error."
    : err.message;
```

The idea is that developers need detail, but users and API clients should not receive internal implementation details.

## **3.19 VS Code Debugger**

Console logs are useful, but you can also use the VS Code debugger.

To debug a Node app:

1. Open the Run and Debug panel in VS Code.
2. Create a Node launch configuration if one does not exist.
3. Start the debugger.
4. Set a breakpoint in `app.js` or a controller file.
5. Send a request from Postman or the browser.
6. Inspect `req`, `res`, local variables, and the call stack.

A basic launch configuration might look like this:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Express App",
      "program": "${workspaceFolder}/app.js",
      "console": "integratedTerminal"
    }
  ]
}
```

Do not commit personal `.vscode` settings unless your team agrees they should be shared.

## **3.20 Advanced Check for Understanding**

1. What lower-level protocols does HTTP depend on?
2. Why might an API avoid sending stack traces to clients?
3. When might `express.static()` be useful?
4. What is the difference between a `4xx` and a `5xx` response?
5. When would the VS Code debugger be more helpful than `console.log()`?

### **Answers**

1. HTTP usually runs over TCP, which runs over IP. HTTPS adds encryption with TLS.
2. Stack traces can expose internal implementation details and sometimes sensitive information.
3. `express.static()` is useful when an Express app needs to serve files such as images, CSS, or browser JavaScript.
4. `4xx` means the client request had a problem. `5xx` means the server failed unexpectedly.
5. The debugger is useful when you need to inspect variables, step through middleware order, or understand control flow across multiple functions.
