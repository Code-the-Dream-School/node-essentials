# Lesson/Assignment 3: Express Middleware and Error Handling

## Session focus

Keep the session centered on Express request flow. Lesson 2 already introduced raw HTTP, basic Express routes, Postman, and routers/controllers. In Lesson 3, the new material is what happens before, after, and around route handlers.

## Core + advanced optional structure

Lesson 3 is now split into **Core Knowledge** and **Advanced Knowledge**. Core topics are required for students to continue with the course: middleware flow, `next()`, ordering, built-in/custom/third-party middleware, not-found handling, error handling, common status codes, and basic debugging. Advanced topics are optional context and deeper reference material; use them when the group has time or when students ask follow-up questions.

## Core concepts to emphasize

- Express checks middleware and routes from top to bottom.
- Middleware functions receive `req`, `res`, and `next`.
- Middleware must send a response, call `next()`, or report an error with `next(error)` / `throw`.
- If middleware does none of those things, the request hangs.
- `express.json()` must appear before routes that read `req.body`.
- `app.use()` can match path prefixes; route methods like `app.get()` match a specific method and path.
- The same `req` object moves through the chain, so middleware can add data like `req.requestTime`.
- Not-found middleware handles requests that matched no route.
- Error handling middleware has four parameters: `err`, `req`, `res`, `next`.

## Middleware types

Built-in middleware:

- `express.json()` parses JSON bodies into `req.body`.
- `express.static()` serves static files.

Custom middleware:

- request logger
- request time / request ID with Node's built-in `crypto.randomUUID()`
- content-type validation
- auth checks

Third-party middleware:

- `morgan` for request logging
- `cors` for cross-origin requests
- `cookie-parser` for cookies
- `helmet` for security-related headers
- `compression` for compressed responses

Remind students that third-party middleware must be installed with npm before it can be required.

## Not-found vs error handler

Use this distinction often:

- Not-found means no route matched the request.
- Error handling means something broke while processing a matched request.

Recommended order:

```js
app.use(logger);
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);

app.use(notFound);
app.use(errorHandler);
```

## Status code guidance

Students should not use `500` for every problem.

- `200 OK`: success with a response body
- `201 Created`: new resource created
- `204 No Content`: success with no response body
- `400 Bad Request`: invalid request data
- `401 Unauthorized`: not logged in or invalid credentials
- `403 Forbidden`: logged in but not allowed
- `404 Not Found`: route or resource missing
- `415 Unsupported Media Type`: wrong `Content-Type`
- `422 Unprocessable Entity`: valid JSON shape, invalid data rules
- `500 Internal Server Error`: unexpected server failure

Note: `415` is the more specific content-type status, but the Week 3 assignment tests expect `400 Bad Request` for the content-type validation middleware.

## Debugging prompts

When students are stuck, ask:

1. Did the request reach the server?
2. Did the method and path match?
3. Did each middleware call `next()` or send a response?
4. Is `express.json()` before the route?
5. Was a response sent twice?
6. Did the request skip to the not-found handler?
7. Did the error handler run?

Use Postman and the browser network tab to inspect status codes and response bodies. Use console logs early, and introduce the VS Code debugger when students are ready.

## Assignment 3 reminders

Part A extends the project app:

- user register, logon, and logoff
- controllers and routers
- in-memory globals as a temporary database scaffold

Part B focuses on required dog middleware practice:

- request logging and tracking
- JSON body parsing
- static file serving
- not-found handling
- basic error handling middleware

Part C focuses on optional advanced dog middleware practice:

- security headers
- request size limiting
- content-type validation
- custom error classes
- advanced error logging

Commands:

```bash
npm run tdd assignment3a
npm run week3
npm run tdd assignment3b
npm run tdd assignment3c # optional advanced
```

## Common student issues

- Putting not-found middleware before real routes.
- Forgetting that error middleware needs four parameters.
- Calling `res.json()` and then calling `next()`.
- Forgetting `return` before an early response in validation middleware.
- Throwing inside a callback instead of using `next(error)`.
- Sending stack traces or raw error objects to the client.
