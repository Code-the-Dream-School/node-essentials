# Week 2 Assignment: Events, HTTP Servers, REST, and Express

## Learning Objectives

- Use Node's `EventEmitter` to emit and listen for events
- Create a basic HTTP server with Node's built-in `http` module
- Return JSON and HTML responses from a server
- Understand how method and path work together in REST-style routes
- Test HTTP routes with the browser and the Postman VS Code Extension
- Create a small Express application with route handlers
- Organize Express route handlers with `routes/` and `controllers/` folders
- Practice a few HTTP edge cases, such as unknown routes and invalid JSON

## Assignment Guidelines

NOTE: The AI review tool (known as AirHub) can check code and structure, but it does not run your code in a server environment to verify that aspect runs properly. We will have human reviewers checking this aspect, so you may receive a passing assignment from AirHub that could still need revisions after a human has checked that your work runs properly in the correct environment. If your AI and human reviewer feedbacks don't match, trust the human review.

1. **Setup**
   - You should have already done the Getting Started instructions, which set up your `node-homework` directory.
   - Work inside the `assignment2` folder for the event and raw HTTP server files.
   - Your Express `app.js`, `routes/`, and `controllers/` folders should live in the root of `node-homework`.
2. **Create a branch**
   - Create a new branch for your work on assignment 2, for example `assignment2`.
   - Make all your changes and commits on this branch.
3. **Use Postman**
   - For testing POST requests and API endpoints, use the **Postman VS Code Extension**.
   - If you need a walkthrough, review the Postman section in Lesson 2 before starting the POST tasks.
4. **Run the tests**
   - This assignment has a **Core** part (required) and an **Advanced** part (optional), matching the lesson.
   - Run the core tests with:
     ```bash
     npm run tdd assignment2a
     ```
   - If you finish the optional advanced part, also run:
     ```bash
     npm run tdd assignment2b
     ```
   - Make sure the core tests pass before submitting your work. The advanced tests are optional.

## Assignment Tasks

**Important:** Follow the exact file names, route paths, and export instructions below. The automated tests expect specific file names and routes.

## Core Tasks (Required)

These tasks are required. The core tests run with `npm run tdd assignment2a`.

### 1. Event Emitter and Listener

Inside your `assignment2` folder, create a file called `events.js`.

In this file:

- Import Node's `events` module.
- Create an `EventEmitter`.
- Add exactly one listener for the `"time"` event.
- When the listener receives a message, log the time message.
- Export the emitter with `module.exports = emitter`.

The tests import your emitter, so the emitter must be exported.

Your file should include this basic structure:

```js
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", (message) => {
  console.log("Time received:", message);
});

module.exports = emitter;
```

Then add code that emits the `"time"` event every 5 seconds when you run the file directly with Node:

```js
if (require.main === module) {
  setInterval(() => {
    const currentTime = new Date().toString();
    emitter.emit("time", currentTime);
  }, 5000);
}
```

The `if (require.main === module)` check matters. It lets you run the file directly, but it prevents the timer from starting when the test imports your file.

Try it manually:

```bash
node assignment2/events.js
```

Use `Ctrl-C` to stop the program.

### 2. Raw Node HTTP Server

Inside your `assignment2` folder, create a file called `sampleHTTP.js`.

**Important:** Use this exact file name: `sampleHTTP.js`.

This server should listen on port `8000`.

First, create a `GET /time` route. It should return JSON with a `time` property.

The response should have:

- Status code: `200`
- Content-Type: `application/json`
- Body shape: `{ "time": "current time here" }`

Here is the idea:

```js
if (req.method === "GET" && req.url === "/time") {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      time: new Date().toString(),
    }),
  );
}
```

Next, create a `GET /timePage` route. It should return an HTML page with a button that calls `/time` and displays the result.

Use this HTML string in your server:

```js
const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
  const res = await fetch('/time');
  const timeObj = await res.json();
  console.log(timeObj);
  const timeP = document.getElementById('time');
  timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;
```

The `/timePage` response should have:

- Status code: `200`
- Content-Type: `text/html; charset=utf-8`
- Body: the `htmlString` above

Start the server:

```bash
node assignment2/sampleHTTP.js
```

Then test these URLs in your browser:

```text
http://localhost:8000/time
http://localhost:8000/timePage
```

When you open `/timePage`, click the **Get the Time** button. The button makes a request to `/time` and puts the returned time on the page.

### 3. Add a Raw Node POST Route

In `assignment2/sampleHTTP.js`, add a `POST /echo` route.

This route should:

- Accept a JSON request body
- Read the request body using the `"data"` and `"end"` events
- Parse the body with `JSON.parse()`
- Return the parsed body inside a JSON response

The response should look like this:

```json
{
  "weReceived": {
    "message": "Hello from Postman"
  }
}
```

Use Postman to test it:

- Method: `POST`
- URL: `http://localhost:8000/echo`
- Body type: `raw`
- Body format: `JSON`

Use this request body:

```json
{
  "message": "Hello from Postman"
}
```

This task gives you practice with the lower-level work Express will make easier later.

### 4. Create Your First Express Application

In the root of your `node-homework` repository, create a file called `app.js`.

This file should be at the root, not inside `assignment2`.

Express is not part of Node itself. Your repository may already have it installed, but if you need to install it, run:

```bash
npm install express
```

Start with this basic Express app:

```js
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };
```

The export at the bottom is important. The tests use `app` and `server` to send requests and close the server after testing.

Run the app:

```bash
node app
```

Open this URL in your browser:

```text
http://localhost:3000
```

You should see:

```text
Hello, World!
```

Then test the POST route with Postman:

- Method: `POST`
- URL: `http://localhost:3000/testpost`
- Body: no request body required

The route should return status `200`.

### 5. Organize the Express App Layout

Small Express examples can live in one file. Real applications usually split route definitions and route handler logic into separate folders.

In the root of your `node-homework` repository, create this structure:

```text
routes/
  timeRoutes.js
controllers/
  timeController.js
```

The `controllers/timeController.js` file should export route handler functions.

Add these two handlers:

```js
function getTime(req, res) {
  res.status(200).json({
    time: new Date().toString(),
  });
}

function echoBody(req, res) {
  res.status(200).json({
    weReceived: req.body,
  });
}

module.exports = {
  getTime,
  echoBody,
};
```

The `routes/timeRoutes.js` file should connect route paths to those controller functions.

```js
const express = require("express");
const timeController = require("../controllers/timeController");

const router = express.Router();

router.get("/time", timeController.getTime);
router.post("/echo", timeController.echoBody);

module.exports = router;
```

Then update `app.js` to import and use the router:

```js
const timeRouter = require("./routes/timeRoutes");

app.use("/api", timeRouter);
```

Now test these Express routes:

```text
GET http://localhost:3000/api/time
POST http://localhost:3000/api/echo
```

For `POST /api/echo`, send this JSON body in Postman:

```json
{
  "source": "Express layout practice"
}
```

You should get the same body back in the `weReceived` property.

That completes the core tasks. Run the core tests with:

```bash
npm run tdd assignment2a
```

## Advanced Tasks (Optional)

This part is optional, just like the Advanced section of the lesson. You can skip it and still continue the course, but it is good extra practice.

The advanced tasks focus on edge cases. An **edge case** is a situation outside the happy path, such as a bad URL, the wrong method, or invalid JSON.

### 6. Raw HTTP Unknown Route

In `assignment2/sampleHTTP.js`, add a response for unknown routes.

If the request does not match `/time`, `/timePage`, or `/echo`, return:

- Status code: `404`
- Content-Type: `application/json`
- Body shape: `{ "message": "That route is not available." }`

Example response body:

```json
{
  "message": "That route is not available."
}
```

Test it in your browser:

```text
http://localhost:8000/not-here
```

### 7. Raw HTTP Invalid JSON

In `assignment2/sampleHTTP.js`, improve your `POST /echo` route so invalid JSON does not crash the server.

Wrap `JSON.parse()` in a `try/catch`.

If parsing fails, return:

- Status code: `400`
- Content-Type: `application/json`
- Body shape: `{ "message": "Invalid JSON." }`

Here is the idea:

```js
try {
  const parsedBody = JSON.parse(body);
  // send normal success response here
} catch (error) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message: "Invalid JSON.",
    }),
  );
}
```

Use Postman to send broken JSON to `POST http://localhost:8000/echo`.

For example:

```json
{
  "message": "missing end quote
}
```

Your server should return a `400` response instead of crashing.

### 8. Express Unknown Route

In your root `app.js`, add a final fallback route for unknown Express paths.

Put this after your normal routes:

```js
app.all("*", (req, res) => {
  res.status(404).json({
    message: `No route found for ${req.method} ${req.path}`,
  });
});
```

For this assignment, think of this as a final route that catches requests your app did not handle earlier. Lesson 3 will show a more complete way to organize this kind of behavior.

Test this URL:

```text
http://localhost:3000/unknown
```

You should get a `404` response.

### 9. Optional Server Lifecycle Polish

This part is not required for the automated tests, but it is good practice for real server code.

After you create the `server` with `app.listen()`, you can listen for server startup errors. A common one is `EADDRINUSE`, which means the port is already being used by another process.

```js
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});
```

You can also handle shutdown signals such as `Ctrl-C` (`SIGINT`) or process termination (`SIGTERM`) so the HTTP server closes cleanly.

```js
let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("HTTP server closed.");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
```

You do not need to memorize this yet. The important idea is that long-running servers should handle common startup and shutdown situations predictably.

If you complete this optional part, run the advanced tests with:

```bash
npm run tdd assignment2b
```

## Suggested File Structure

By the end of the core assignment, your files should be organized like this:

```text
node-homework/
  app.js
  controllers/
    timeController.js
  routes/
    timeRoutes.js
  assignment2/
    events.js
    sampleHTTP.js
```

## Testing Your Work

After completing each script, run it to make sure it behaves as expected:

```bash
node assignment2/events.js
node assignment2/sampleHTTP.js
node app
```

Stop each long-running process with `Ctrl-C` before starting another server.

Then run the course tests:

```bash
npm run tdd assignment2a   # core (required)
npm run tdd assignment2b   # advanced (optional)
```

If a test fails, check file names and route paths first. The tests expect exact names, including `sampleHTTP.js` with uppercase `HTTP`.

## Video Submission

Record a short video (3-5 minutes) on YouTube, Loom, or a similar platform. Share the link in your submission form.

### Video Content

Answer 3 questions from Lesson 2:

1. **How do Event Emitters and Listeners work in Node.js?**
   - Explain what an event is.
   - Explain what a listener does.
   - Show your `events.js` file.

2. **What are the key differences between Node's HTTP module and Express?**
   - Explain what you had to do manually in `sampleHTTP.js`.
   - Explain what Express makes easier in `app.js`.

3. **How does Express project layout help organize a backend?**
   - Explain what `app.js` does.
   - Explain what the `routes/` folder does.
   - Explain what the `controllers/` folder does.
   - Show one route and the controller function it calls.

### Video Requirements

- Keep it concise: 3-5 minutes
- Use screen sharing to show code examples when helpful
- Speak clearly and explain concepts in your own words
- Include the video link in your assignment submission

## To Submit an Assignment

1. Do these commands:

   ```bash
   git add -A
   git commit -m "some meaningful commit message"
   git push origin assignment2
   ```

2. Go to your `node-homework` repository on GitHub.
3. Select your `assignment2` branch.
4. Create a pull request. The target of the pull request should be the `main` branch of your GitHub repository.
5. Once the pull request is created, your browser contains the URL of the PR. Include that link in your homework submission.
6. Do not forget to include your video link in the submission form.
