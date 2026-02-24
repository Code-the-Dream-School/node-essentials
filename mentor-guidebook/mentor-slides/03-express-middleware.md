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

# Lesson 3 — Express Application Concepts
## Node.js/Express

---

# Game Plan

- Warm-Up
- HTTP Deep Dive
- REST & JSON
- The Middleware Chain
- Route Handlers & Error Handling
- Status Codes
- Debugging Express
- Assignment Preview
- Wrap-Up

---

# Warm-Up (5 min)

In chat or out loud:

1. What's one thing that clicked after working on Assignment 2?
2. What's one thing that still feels murky?

<!-- Mentor note: Use responses to calibrate how much time to spend on review. Common sticking points: body parsing, the order of middleware, 404 vs error handler. -->

---

# The Layers Under Express

**HTTP** — the protocol (language browsers and servers speak)

**Node `http` module** — low-level implementation (manual everything)

**Express** — high-level framework (automatic routing, parsing, etc.)

Think of it like:
> HTTP is the language. Node `http` is manual translation. Express is the automatic translator.

---

# HTTP Methods

Every HTTP request has a **method**:

- `GET` — retrieve data (never change data on a GET!)
- `POST` — create something new
- `PATCH` — partially update something
- `PUT` — replace something entirely
- `DELETE` — remove something

These map directly to `app.get()`, `app.post()`, etc. in Express.

---

# Parts of an HTTP Request

```
POST /api/tasks HTTP/1.1
Content-Type: application/json

{ "title": "Buy groceries" }
```

- **Method**: `POST`
- **Path**: `/api/tasks`
- **Header**: `Content-Type: application/json`
- **Body**: `{ "title": "Buy groceries" }`

Query params look like: `/api/tasks?isCompleted=false`

---

# REST & JSON

**REST** — a style for how APIs exchange data over HTTP.

**JSON** — the format for that data.

```json
{
  "id": 1,
  "title": "Buy groceries",
  "isCompleted": false
}
```

By convention:
- `GET /tasks` → list of tasks
- `POST /tasks` → create a task
- `PATCH /tasks/1` → update task with id 1
- `DELETE /tasks/1` → delete task with id 1

---

# Predict This

```js
app.use(express.json());

app.post("/api/items", (req, res) => {
  console.log(req.body);
  res.status(201).json({ created: req.body });
});
```

What happens if you POST without `Content-Type: application/json`?

<!-- Mentor note: Answer: req.body will be undefined. This is a very common bug students encounter. -->

---

# The Middleware Chain

Every request passes through a series of functions in order:

```
Request
  → Middleware 1 (logging)
  → Middleware 2 (body parsing)
  → Middleware 3 (auth check)
  → Route Handler
  → Response
```

Each function must either:
- Call `next()` to pass control forward
- Send a response (`res.json()`, `res.send()`)
- Throw an error / call `next(error)`

---

# Order Matters!

```js
// ✅ Correct order
app.use(express.json());       // parse bodies first

app.post("/api/tasks", (req, res) => {
  res.json({ task: req.body }); // req.body is available
});
```

```js
// ❌ Wrong order
app.post("/api/tasks", (req, res) => {
  res.json({ task: req.body }); // undefined!
});

app.use(express.json()); // too late
```

---

# Common Express App Structure

```js
// 1. Body parsing
app.use(express.json());

// 2. Your routes
app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);

// 3. 404 handler (after routes)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// 4. Error handler (always last, 4 params)
app.use((err, req, res, next) => {
  res.status(500).json({ message: "Internal server error." });
});
```

---

# What Route Handlers Do

A route handler is matched by **method** + **exact path**:

```js
app.get("/api/tasks", (req, res) => { /* ... */ });
// Only called for GET /api/tasks — nothing else
```

A route handler must always do one of:
1. Send a response
2. Call `next(error)`
3. Throw an error

If none of these happen, the request just... hangs.

---

# Middleware vs Route Handler

| | Middleware | Route Handler |
|---|---|---|
| Registered with | `app.use()` | `app.get()`, `app.post()`, etc. |
| Path match | Prefix (optional) | Exact match |
| Methods | All | Specific |
| Typical behavior | Calls `next()` | Sends response |

---

# Path Parameters

You can capture parts of the URL as variables:

```js
app.get("/api/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  res.json({ taskId });
});
```

A request to `/api/tasks/42` gives you `req.params.id === "42"`.

Note: `req.params` values are always **strings**.

---

# The `req` Object

```js
req.method       // "GET", "POST", etc.
req.path         // "/api/tasks"
req.params       // { id: "42" }
req.query        // { isCompleted: "true" }
req.body         // { title: "Buy groceries" }
req.headers      // { "content-type": "application/json", ... }
req.get("content-type")  // shorthand for headers
```

---

# The `res` Object

```js
res.status(201)            // set status code
res.json({ key: "value" }) // send JSON (also sets Content-Type)
res.send("plain text")     // send text
res.status(404).json({ message: "Not found" })  // chain them
```

> `res.json()` and `res.send()` both **end** the response.
> Calling either twice for the same request is an error.

---

# HTTP Status Codes

| Range | Meaning | Examples |
|---|---|---|
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 4xx | Client error | 400 Bad Request, 401 Unauthorized, 404 Not Found |
| 5xx | Server error | 500 Internal Server Error |

Returning the right status code is part of the API contract.

---

# Error Handling in Express

When something goes wrong, throw or call `next(error)`:

```js
app.get("/api/tasks/:id", (req, res, next) => {
  const task = findTask(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }
  res.json(task);
});
```

For unexpected errors, Express 5 auto-catches `async` throws.
For callbacks: **use `next(error)`** — never `throw` inside a callback.

---

# We Do — Debug This

What's wrong with this route?

```js
app.post("/api/users", (req, res) => {
  const user = { name: req.body.name };
  global.users.push(user);
  res.status(201).json(user);
  console.log("User created");
  res.json({ status: "done" }); // ← problem?
});
```

<!-- Mentor note: Two issues: (1) calling res.json() twice, (2) console.log after res. The second res.json() will throw "Cannot set headers after they are sent". Ask students to spot both. -->

---

# We Do — Trace a Request

Walk through this request together:

```
PATCH /api/tasks/5
Content-Type: application/json

{ "isCompleted": true }
```

What is:
- `req.method`? `req.path`? `req.params`? `req.body`?

What status code should we return on success?

<!-- Mentor note: Guide students to answer 200 (success) or 204 (no content). Both are valid. -->

---

# You Do (5 min)

Add a route to your Express app:

```
GET /api/tasks/:id
```

It should:
1. Find the task in `global.tasks` by matching the `id`
2. Return 404 if not found
3. Return the task if found

Try it with Postman after creating a task first.

<!-- Mentor note: This directly previews the show() function they'll write in Assignment 3. Walk around virtually and help anyone stuck on finding the task by id. -->

---

# Debugging Express

**Technique 1: console.log**

Add logs to see what's in `req.body`, `req.params`, etc.

**Technique 2: Postman**

The Network tab shows exactly what was sent and received.

**Technique 3: VS Code Debugger**

Set a breakpoint, press F5 to start debugging, inspect variables live.

---

# Debugging Middleware Tip

You can log every request with a small middleware:

```js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

Put this **before** all other middleware to catch every request.

---

# Assignment Preview

This week you'll extend your Express app with:

1. Route handlers for users: register, logon, logoff
2. Route handlers for tasks: create, index, show, update, delete
3. Controllers and routers as separate files
4. An auth middleware that protects task routes
5. A basic debugger exercise

This is where the structure of the real app starts to take shape.

---

# Wrap-Up

In chat:

1. What's the difference between `req.params` and `req.query`?
2. What must a route handler always do?
3. Why does the error handler have 4 parameters?

---

# Confidence Check

On a scale of 1–5:

How comfortable do you feel building route handlers and middleware?

---

# Resources

- https://expressjs.com/en/guide/writing-middleware.html
- https://expressjs.com/en/guide/error-handling.html
- Ask questions in Slack

---

# Closing

**This week:**
The full middleware chain — routing, parsing, error handling.

**Next week:**
Protecting routes and validating data before it hits your database.

See you then!
