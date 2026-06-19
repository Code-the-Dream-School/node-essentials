# Lesson/Assignment 2: Events, HTTP, and Express

## Session focus

Help students move from Node basics into server-side request handling. The main progression is: event emitters, raw Node HTTP, Postman testing, then a first Express app with routes and controllers.

## Core + advanced optional structure

Assignment 2 now has a required **Core** section and an optional **Advanced** section. Students should focus on passing the Core work first. Advanced topics are useful stretch goals, but they should not block a student who is still working through the required server, route, and controller basics.

## Core concepts to emphasize

- `EventEmitter` uses `emitter.on()` to listen and `emitter.emit()` to fire an event.
- Raw Node HTTP requires manual checks for `req.method` and `req.url`.
- Request bodies in raw HTTP arrive in chunks through `"data"` and `"end"` events.
- Postman is needed to test `POST` requests conveniently.
- Express wraps raw HTTP with cleaner routing, body parsing, and response helpers.
- `module.exports = { app, server }` matters because Supertest needs access to the app and tests need to close the server.
- Routers are mounted with prefixes, so `app.use("/api", timeRouter)` plus `router.get("/time")` becomes `GET /api/time`.

## Assignment 2 core tasks

Students should create:

- `assignment2/events.js`
- `assignment2/sampleHTTP.js`
- root-level `app.js`
- `controllers/timeController.js`
- `routes/timeRoutes.js`

Core route expectations:

- `GET /time` returns JSON with a `time` property.
- `GET /timePage` returns HTML with `text/html; charset=utf-8`.
- `POST /echo` returns the parsed body under `weReceived`.
- `GET /` in Express returns `Hello, World!`.
- `POST /testpost` returns `{ message: "POST route works" }`.
- `GET /api/time` and `POST /api/echo` work through the Express router.

## Advanced topics

Keep these short unless students are ready for them:

- Unknown raw HTTP routes return `404`.
- Invalid JSON to raw `POST /echo` returns `400`.
- Unknown Express routes return `404`.
- `server.on("error")` can catch startup errors such as `EADDRINUSE`.
- Graceful shutdown can close the server on `SIGINT` or `SIGTERM`.

## TDD reminders

Core tests:

```bash
npm run tdd assignment2a
```

Advanced tests:

```bash
npm run tdd assignment2b
```

Core should be treated as required. Advanced is optional.

## Common student issues

- Naming the raw server file with the wrong casing. The current assignment expects `sampleHTTP.js`.
- Forgetting to export the event emitter from `events.js`.
- Forgetting `express.json()` before routes that read `req.body`.
- Mounting the router at `/api` but also writing `/api/time` inside the router, causing `/api/api/time`.
- Leaving a server running on port `3000` or `8000`.
