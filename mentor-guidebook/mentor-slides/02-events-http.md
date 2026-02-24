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

# Lesson 2 — Events, HTTP, and Express
## Node.js/Express

---

# Game Plan

- Warm-Up
- Event Emitters & Listeners
- Node HTTP Server
- Testing with Postman
- Introducing Express
- Assignment Preview
- Wrap-Up

---

# Warm-Up (5 min)

In chat or out loud:

1. How are you feeling after Week 1 — any concepts still fuzzy?
2. What's one thing from Node basics you feel solid on?

<!-- Mentor note: Students often feel shaky on async after week 1. Validate that — it takes time. Use this to segue into how Node's event system is the same pattern, just built in. -->

---

# From Last Week: The Event Loop

Node is single-threaded, so it delegates slow work.

When done, that work comes back via a **callback**:

```js
fs.readFile("file.txt", "utf8", (err, data) => {
  console.log(data); // called when ready
});
console.log("This runs first");
```

This week: we see that same pattern **everywhere**.

---

# Event Emitters

Node has a built-in `EventEmitter` class.

Any object can emit named events. Other code **listens** for them.

```js
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("greet", (name) => {
  console.log("Hello,", name);
});

emitter.emit("greet", "class");
```

<!-- Mentor note: Emphasize that this is the same pub/sub pattern used in front-end addEventListener. -->

---

# Why Event Emitters?

They let one piece of code **communicate** with many others.

- `emitter.on("event", callback)` — subscribe
- `emitter.emit("event", data)` — publish

You can have multiple listeners for the same event.

> Always add an `"error"` listener — otherwise unhandled errors crash the process.

---

# Quick Think (2 min)

Where have you seen this pattern before?

- `button.addEventListener("click", handler)`
- `req.on("data", chunk => ...)`
- `stream.on("end", () => ...)`

Event emitters are the same idea — just built into Node.

---

# The Node HTTP Module

Node's built-in `http` module lets you create a server.

```js
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ data: "Hello World!" }));
});

server.listen(8000);
```

Go to `http://localhost:8000` — you have a server!

<!-- Mentor note: Stress that Node keeps running as long as the server is open. Stop with Ctrl-C. -->

---

# HTTP Requests Have Parts

When a request arrives, `req` gives you:

- `req.method` — GET, POST, PATCH, DELETE, etc.
- `req.url` — the path (`/api/tasks`)
- `req.headers` — key-value metadata
- **Body** — *not* available yet, needs extra work

---

# Reading the Body (Raw HTTP)

The body arrives in chunks via event listeners:

```js
let body = "";
req.on("data", (chunk) => (body += chunk));
req.on("end", () => {
  const parsed = JSON.parse(body);
  res.end(JSON.stringify({ received: parsed }));
});
```

This is **exactly** why Express exists — it handles this for you.

<!-- Mentor note: Briefly show this pain point, then say "and this is what Express fixes". Don't dwell on it. -->

---

# HTTP vs Express

| | Node `http` | Express |
|---|---|---|
| Routing | Manual if/else | `app.get()`, `app.post()` |
| Body parsing | Manual chunks | `express.json()` middleware |
| Error handling | Manual | Error handler middleware |

Express wraps Node's `http` module to make things easier.

---

# Testing POST Requests with Postman

Browsers only send GET requests naturally.

To test POST/PATCH/DELETE — use **Postman VS Code Extension**.

Steps:
1. Install from VS Code Extensions
2. New → HTTP Request
3. Switch to POST
4. Set URL: `http://localhost:8000`
5. Body → raw → JSON → paste JSON

---

# Hello Express

```js
const express = require("express");
const app = express();

app.use(express.json());  // parse JSON bodies

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.listen(3000, () => console.log("Listening on port 3000"));
```

Less boilerplate. Automatic body parsing. Clean routing.

---

# The Express App Has Layers

```
Request → Middleware → Route Handler → Response
```

1. **Middleware** — runs for every (or many) requests
2. **Route handlers** — tied to a specific method + path
3. **404 handler** — catches unmatched routes
4. **Error handler** — catches thrown errors

Order matters — register them top to bottom.

---

# Route Handlers

```js
app.get("/hello", (req, res) => {
  res.json({ message: "Hello!" });
});

app.post("/echo", (req, res) => {
  res.json({ youSent: req.body });
});
```

Every handler must:
- **Send a response** (`res.json`, `res.send`)
- OR **call next** to pass control forward

---

# The 404 and Error Handlers

Always include these at the end:

```js
// Not-found handler (after all routes)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler (4 params = error handler)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: "Internal server error." });
});
```

---

# We Do — Reading the Request

Let's trace what happens with this request:

```
POST /api/users/register
Content-Type: application/json

{ "name": "Alex", "email": "alex@test.com" }
```

What is available in `req`?

- `req.method` → `"POST"`
- `req.path` → `"/api/users/register"`
- `req.body` → `{ name: "Alex", email: "alex@test.com" }` *(after `express.json()`)*

<!-- Mentor note: Do this as a group discussion — ask students to predict before revealing the answers. -->

---

# We Do — Build a Mini API

Together, let's build a small Express server with:

1. `GET /ping` → responds `{ status: "ok" }`
2. `POST /echo` → responds with whatever was sent in the body
3. A 404 handler

What should the 404 handler return for a request to `/unknown`?

<!-- Mentor note: Live-code this together. Take suggestions from students on how to write each handler. -->

---

# You Do (5 min)

Add one more route to the mini API:

- `GET /time` — returns `{ time: new Date().toISOString() }`

Then test with your browser and/or Postman.

**Bonus:** Add a route that accepts `{ a, b }` in the body and returns `{ sum: a + b }`.

<!-- Mentor note: Let students work independently. After 5 min, ask someone to share their solution. -->

---

# Assignment Preview

This week you'll:

1. Create an event emitter that fires every 5 seconds
2. Build an HTTP server that handles `/time` and `/timePage`
3. Create your first Express app (`app.js`)
4. Add routes for user register, logon, and logoff
5. Store users in memory with `global.users`

The assignment is where the course project starts — you'll keep building on `app.js` every week.

---

# Assignment: Key Details

Your `app.js` will use global state for now:

```js
global.user_id = null;
global.users = [];
global.tasks = [];
```

This is temporary — not secure, but it gets you started.

You'll replace this with a real database in Week 5.

---

# Wrap-Up

In chat:

1. What does `emitter.on()` do vs `emitter.emit()`?
2. Why do we need Postman to test POST requests?
3. What's the difference between middleware and a route handler?

---

# Confidence Check

On a scale of 1–5:

How comfortable do you feel starting Assignment 2?

---

# Resources

- https://nodejs.org/api/events.html
- https://expressjs.com/en/guide/routing.html
- Postman VS Code Extension docs (linked in assignment)
- Ask questions in Slack

---

# Closing

**This week:**
Event emitters + HTTP + your first Express routes.

**Next week:**
Dive deeper — REST, JSON, middleware chain, and debugging Express.

See you then!
