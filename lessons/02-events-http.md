# **Lesson 2 — Events, HTTP Serving, and Express**

## **Lesson Overview**

**Learning objective**: By the end of this lesson, you should understand how Node uses events, how to create a basic HTTP server with the built-in `http` package, what REST means for backend APIs, how to test a POST request with Postman, and how Express helps you write server code with less manual work.

This lesson is split into two parts:

- **Part 1 — Core Knowledge**: required material you should complete before moving on.
- **Part 2 — Advanced Knowledge**: optional background that gives you more context, but you can skip it and still continue the course.

**Topics**:

1. Events and event listeners
2. Basic HTTP servers in Node
3. What REST means
4. Testing requests with Postman
5. Creating a small Express server
6. What route handlers do
7. Real-world Express project layout

---

# **Part 1 — Core Knowledge**

## **1.1 HTTP vs Node HTTP vs Express**

Before writing server code, it helps to separate three ideas that often get mixed together.

**HTTP** is the protocol, or communication rulebook, used by browsers, servers, mobile apps, and API clients. It defines ideas like requests, responses, methods such as `GET` and `POST`, headers, status codes, and response bodies.

Think of HTTP like the language clients and servers agree to speak.

**Node's `http` package** is Node's built-in tool for creating an HTTP server. It gives you direct access to the request and response, but you have to do a lot of the work yourself: checking the path, checking the method, reading the request body, setting headers, and sending a response.

Think of Node HTTP like writing the conversation by hand.

**Express** is a framework built on top of Node's HTTP features. A framework is a set of tools and patterns that makes common development tasks easier. Express helps you define routes, read JSON request bodies, and send responses with less repeated code.

Think of Express like a helper that handles the repetitive HTTP details so you can focus on what your application should do.

In this lesson, you will start close to the lower-level Node HTTP tools. Then you will move up to Express and see why most Node web applications use it.

## **1.2 Event Emitters and Listeners**

An **event** is a named signal that something happened. A **listener** is a function that waits for that event and runs when the event happens.

You have seen this idea before, even if you did not call it an event. When a user clicks a button in the browser, the click is an event. Code can listen for that click and respond.

Node uses this same idea heavily. One part of a program can emit an event, and one or more listeners can react to it.

Create a file called `events-intro.js` in your `node-homework/assignment2` folder. This code creates one event emitter, registers listeners for the `"tell"` and `"error"` events, and then emits the `"tell"` event three times.

```js
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("tell", (message) => {
  console.log("listener 1 got a tell message:", message);
});

emitter.on("tell", (message) => {
  console.log("listener 2 got a tell message:", message);
});

emitter.on("error", (error) => {
  console.log("The emitter reported an error.", error.message);
});

emitter.emit("tell", "Hi there!");
emitter.emit("tell", "second message");
emitter.emit("tell", "all done");
```

Run the file with Node:

```bash
node events-intro.js
```

Both `"tell"` listeners run every time the `"tell"` event is emitted. The listeners run in the order they were registered.

This may look small, but the idea is powerful. Events let one part of a program announce that something happened without knowing every function that might care. In real applications, this helps different pieces of code stay separate while still communicating.

You will see this idea again in the next section. Incoming HTTP request bodies arrive in chunks, and Node lets you listen for `"data"` and `"end"` events on the request.

## **1.3 A Simple HTTP Server**

The `http` package is built into Node. You do not need to install it.

An HTTP server listens on a port. A **port** is a number that helps your computer know which running program should receive a network request. In development, you will often use ports like `3000`, `5000`, or `8000`.

Create a file called `sampleHTTP.js` in your `node-homework/assignment2` folder. The uppercase `HTTP` matters because the assignment tests expect this exact file name.

```js
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/time") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        time: new Date().toString(),
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message: "That route is not available.",
    }),
  );
});

server.listen(8000);
```

Start the server:

```bash
node sampleHTTP.js
```

Now open this URL in your browser:

```text
http://localhost:8000/time
```

You should see a JSON response with a `time` property.

The callback passed to `http.createServer()` runs for every incoming request. Node gives that callback two important objects:

- `req`: the request object. It contains information about what the client asked for.
- `res`: the response object. It lets you send information back to the client.

In this example, `res.writeHead()` sets the status code and response headers. `res.end()` sends the response body and finishes the response.

Your Node program keeps running because the server is still listening for requests. Stop it with `Ctrl-C` when you are done.

## **1.4 What Is REST?**

REST stands for **Representational State Transfer**. That name sounds more complicated than the idea you need right now.

For this course, think of REST as a common way to design backend APIs using HTTP methods and URL paths.

A **REST API** lets a client work with data on the server. The client might be a browser app, a mobile app, Postman, or another backend service.

For example, imagine your server manages tasks. A REST-style API might use routes like these:

```text
GET /tasks        -> get all tasks
GET /tasks/7      -> get one task
POST /tasks       -> create a task
PATCH /tasks/7    -> update part of a task
DELETE /tasks/7   -> delete a task
```

The path usually points to the kind of thing you want to work with, such as `tasks`, `users`, or `orders`. The HTTP method describes what you want to do with it.

Think of REST like a menu at a restaurant. The path tells the server what item you are talking about. The method tells the server what action you want to take.

You are about to build a small version of this idea with raw Node HTTP. Your server will look at `req.method` and `req.url`, then choose a response. Express will make that pattern easier to write later in the lesson.

## **1.5 Routing and POST with Raw Node HTTP**

The first server responded the same way to every request. Real servers need to look at the request and decide what to do.

A **route** is a combination of an HTTP method and a path. For example:

- `GET /time`
- `GET /timePage`
- `POST /echo`
- `GET /tasks`

Browsers usually make `GET` requests when you type a URL into the address bar. API clients like Postman can easily send `POST`, `PUT`, `PATCH`, and `DELETE` requests too.

Replace the code in `sampleHTTP.js` with this version. This server checks the request method and URL path before choosing a response.

```js
const http = require("http");

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

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/time") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        time: new Date().toString(),
      }),
    );
  } else if (req.method === "GET" && req.url === "/timePage") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlString);
  } else if (req.method === "POST" && req.url === "/echo") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const parsedBody = JSON.parse(body);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          weReceived: parsedBody,
        }),
      );
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "That route is not available.",
      }),
    );
  }
});

server.listen(8000);
```

If your server is already running, stop it with `Ctrl-C` and start it again:

```bash
node sampleHTTP.js
```

Try these URLs in your browser:

```text
http://localhost:8000/time
http://localhost:8000/timePage
```

The browser sends `GET` requests, so those paths are easy to test in the browser. The `/timePage` route returns HTML with a button that fetches `/time`.

The `POST` route needs a request body. A **request body** is data sent as part of the request. For REST APIs, the body is often JSON.

Notice that the body is not immediately available on `req`. Node receives the body as a stream of data. A **stream** is data that may arrive one piece at a time instead of all at once.

This is why the code listens for two events:

- `"data"`: a piece of the body arrived.
- `"end"`: the full body has arrived.

This works, but it is a lot of manual work. You have to check the method, check the path, collect the body, parse the JSON, set headers, and send the response yourself. That is one reason developers often use Express.

## **1.6 Testing with Postman**

You need Postman because browsers do not make it easy to send custom `POST` requests from the address bar.

Before sending your first request, watch this quick walkthrough:

[Postman in VS Code (Quick Walkthrough)](https://www.youtube.com/watch?v=NR-s-zANqZs)

You do not need to understand every API term yet. The goal is to learn how to send a request to a local server and read the response status and body.

Use the **Postman VS Code Extension** to test your local server. If you do not have it installed, install it from the VS Code Extensions marketplace. You can also review the [Postman VS Code Extension documentation](https://learning.postman.com/docs/developer/vs-code-extension/install/).

Open the Postman VS Code Extension and create a new HTTP request.

Use these request settings:

- Method: `POST`
- URL: `http://localhost:8000/echo`
- Body type: `raw`
- Body format: `JSON`

Paste this JSON into the request body:

```json
{
  "message": "Hello from Postman"
}
```

Click **Send**. You should get a JSON response showing the body your server received.

Now change the URL to:

```text
http://localhost:8000/not-here
```

Because this is a `POST` request to a route your server does not support, you should get a `404` response.

## **1.7 What Is Express?**

The raw Node HTTP server works, but it is low-level. Low-level means you control the details yourself, but you also have to write more code.

Express is a popular Node framework for building web servers and REST APIs. It is not built into Node, so it must be installed with npm.

Run this command from your `node-homework` folder:

```bash
npm install express
```

Express helps with common server tasks:

- Defining routes by method and path
- Reading JSON request bodies
- Sending JSON or text responses
- Organizing server code as the application grows

Think of raw Node HTTP like cooking everything from scratch. Express gives you prepared tools so you can focus on the recipe for your application.

## **1.8 A Minimal Express Server**

Now you will create a small Express server. This is not a full application yet. The goal is to see the basic shape.

Create a file called `express-intro.js` in your `node-homework/assignment2` folder. This server creates an Express app, teaches it to read JSON request bodies, defines two routes, and starts listening on port `3000`.

```js
const express = require("express");

const app = express();

app.use(express.json());

app.get("/info", (req, res) => {
  res.json({
    message: "This is an Express server.",
  });
});

app.post("/echo", (req, res) => {
  res.json({
    weReceived: req.body,
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

Start the Express server:

```bash
node express-intro.js
```

Then test this `GET` request in your browser:

```text
http://localhost:3000/info
```

To test the `POST` route, use Postman:

- Method: `POST`
- URL: `http://localhost:3000/echo`
- Body type: `raw`
- Body format: `JSON`

Use this request body:

```json
{
  "message": "Hello from Postman"
}
```

The response should include the same data under `weReceived`.

The line `app.use(express.json())` is important. When a client sends JSON, Express needs to convert the raw JSON text into a JavaScript object. With this line in place, your route handler can read that object from `req.body`.

Middleware will be explained in more detail in Lesson 3. For now, remember this: `express.json()` helps Express understand incoming JSON request bodies.

## **1.9 What Route Handlers Do**

A **route handler** is the function Express runs when a request matches a method and path.

In this route, the method is `GET`, the path is `/info`, and the route handler is the function with `req` and `res`.

```js
app.get("/info", (req, res) => {
  res.json({
    message: "This is an Express server.",
  });
});
```

The route handler receives the request and sends one response.

Route handlers usually do one or more of these jobs:

- Read information from the request
- Return data to the client
- Create new data
- Update existing data
- Delete data
- Choose a status code
- Send JSON or text back to the client

Here is a route handler that reads JSON from `req.body` and sends JSON back with `res.json()`.

```js
app.post("/echo", (req, res) => {
  const requestBody = req.body;

  res.status(201).json({
    saved: true,
    data: requestBody,
  });
});
```

For every request, your server should send exactly one response. If a route handler never sends a response, the client keeps waiting until the request times out.

In later lessons, your route handlers will talk to databases, validate data, check authentication, and handle errors. For now, focus on the basic pattern:

```text
request comes in -> route handler runs -> response goes out
```

## **1.10 Real-World Express Layout**

Small examples can keep all the code in one file. Real applications usually split code into folders so each file has a focused job.

Imagine an application with customers and orders. You might organize it like this:

```text
app.js
controllers/
  customerController.js
  orderController.js
routes/
  customerRoutes.js
  orderRoutes.js
middleware/
  authMiddleware.js
```

Here is the basic idea:

- `app.js` creates the Express app and connects the main pieces.
- `routes/` defines which URL paths exist.
- `controllers/` contains the route handler functions.
- `middleware/` contains reusable request-processing functions. You will study middleware in Lesson 3.

Think of routes like doors into the application. Controllers are the rooms where the work happens.

Here is a small example of what `app.js` might do in a real project. This code imports a router and says that customer routes should live under `/customers`.

```js
const express = require("express");
const customerRouter = require("./routes/customerRoutes");

const app = express();

app.use(express.json());
app.use("/customers", customerRouter);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

Then the customer routes file might connect paths to controller functions.

```js
const express = require("express");
const customerController = require("../controllers/customerController");

const router = express.Router();

router.get("/", customerController.getCustomers);
router.post("/", customerController.createCustomer);

module.exports = router;
```

And the controller file might contain the route handlers.

```js
function getCustomers(req, res) {
  res.json({
    customers: [],
  });
}

function createCustomer(req, res) {
  res.status(201).json({
    message: "Customer created",
    customer: req.body,
  });
}

module.exports = {
  getCustomers,
  createCustomer,
};
```

You do not need to master this layout yet. The important idea is that real Express apps are usually organized by responsibility. Routes define the entry points. Controllers hold the route handler logic. Middleware will become clearer in the next lesson.

### **Check for Understanding**

Nothing needs to be submitted for these questions. Use them to check whether the core ideas are clear.

1. What is the difference between HTTP, Node's `http` package, and Express?

2. What is an event listener?

3. In a raw Node HTTP server, what are `req` and `res` used for?

4. Why did the raw Node HTTP server need to listen for `"data"` and `"end"` events on the request?

5. What is REST, in practical terms?

6. Why is Postman useful when testing a `POST` route?

7. What does a route handler do?

8. In a real Express project, what is the difference between the `routes/` folder and the `controllers/` folder?

### **Answers**

1. HTTP is the communication protocol. Node's `http` package is Node's built-in way to create an HTTP server. Express is a framework built on top of Node that makes routing, request parsing, and responses easier to write.

2. An event listener is a function that waits for a named event and runs when that event is emitted.

3. `req` contains information about the incoming request. `res` is used to send the response back to the client.

4. The request body may arrive in chunks. The `"data"` event gives you each chunk, and the `"end"` event tells you the full body has arrived.

5. REST is a common way to design backend APIs using HTTP methods and URL paths to work with data.

6. Postman lets you send requests that are difficult to send from the browser address bar, such as custom `POST` requests with JSON bodies.

7. A route handler receives a request for a matching method and path, does the needed work, and sends one response.

8. The `routes/` folder defines which paths and methods exist. The `controllers/` folder contains the route handler functions that do the work for those routes.

---

# **Part 2 — Advanced Knowledge**

Part 2 is optional. It gives you extra context, but you can continue the course if you only complete Part 1.

## **2.1 The `net` Package**

The `http` package is not the only networking package built into Node. Node also has a `net` package.

The `net` package lets you create servers that do not use HTTP. For example, you could build a server for a custom protocol, a mail-related protocol, or another kind of network communication.

You will not need `net` for this course. It is mentioned here so you know Node can do lower-level networking beyond HTTP servers.

## **2.2 HTTP Server Edge Cases**

The raw HTTP server from Part 1 is useful for learning, but it is not production-ready.

For example, this line can crash the server if the incoming body is not valid JSON:

```js
const parsedBody = JSON.parse(body);
```

If `body` contains broken JSON, `JSON.parse()` throws an error. Later lessons will cover better error handling patterns.

You may also see examples that pass options into `http.createServer()`, such as `keepAliveTimeout`.

```js
const server = http.createServer({ keepAliveTimeout: 60000 }, (req, res) => {
  res.end("Hello");
});
```

`keepAliveTimeout` affects how long Node keeps an idle HTTP connection open before closing it. This matters more in deployed applications than in the small local examples you are building now.

## **2.3 Server Startup and Shutdown**

When an Express app calls `app.listen()`, Node creates an HTTP server. In small examples, you often see only this:

```js
const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
```

That is enough for the core assignment, but real server code often handles a few lifecycle events.

One common startup problem is that the port is already in use. In Node, that usually appears as an `EADDRINUSE` error. You can listen for server errors like this:

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

Servers also need to stop. When you press `Ctrl-C`, your terminal sends a `SIGINT` signal. Hosting platforms often send `SIGTERM` when they want a process to stop. You can listen for those signals and close the HTTP server before exiting:

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

You do not need this for every small exercise. The main lesson is that servers are long-running programs, so startup errors and shutdown behavior are part of server design.

## **2.4 Request and Response Reference**

In Express, route handlers usually receive two objects:

- `req`: the request object
- `res`: the response object

You already used `req.body`, `res.status()`, and `res.json()` in Part 1. Here are some other common pieces you will see in real applications.

Common `req` properties:

- `req.method`: the HTTP method, such as `GET` or `POST`
- `req.path`: the path portion of the URL
- `req.params`: path parameters captured from a route
- `req.query`: query string values from the URL
- `req.body`: the parsed request body
- `req.headers`: request headers

Common `res` methods:

- `res.status()`: sets the HTTP status code
- `res.json()`: sends a JavaScript object as JSON
- `res.send()`: sends text, HTML, or other response data
- `res.setHeader()`: sets a response header
- `res.cookie()`: sends a cookie header to the client

You do not need to memorize all of these now. The important idea is that `req` is for reading the request, and `res` is for writing the response.

## **2.5 Express Beyond REST APIs**

In this course, you will mostly use Express to build REST APIs. As you saw in Part 1, a REST API uses HTTP methods and paths to let clients work with data.

Express can do more than REST APIs. It can also:

- Serve static files, such as images, CSS files, or browser JavaScript files
- Return HTML pages
- Use template engines such as EJS or Pug to generate HTML on the server

You will not focus on server-rendered HTML in this course. Modern applications often use frontend frameworks for the user interface and Express for the API.

### **Check for Understanding**

Nothing needs to be submitted for these questions. Use them to check whether the optional material is clear.

1. What kinds of servers can the `net` package help create?

2. Why can `JSON.parse()` crash a raw Node HTTP server?

3. What does `EADDRINUSE` usually mean?

4. Why might a server listen for `SIGINT` or `SIGTERM`?

5. In Express, what is the simple mental model for `req` and `res`?

6. Besides REST APIs, what else can Express be used for?

### **Answers**

1. The `net` package can help create lower-level network servers that do not necessarily use HTTP.

2. `JSON.parse()` throws an error if the string is not valid JSON. If that error is not handled, it can crash the server.

3. It usually means another process is already using the port your server tried to listen on.

4. Those signals tell the process to stop. Listening for them lets the app close the HTTP server before exiting.

5. `req` is for reading information from the request. `res` is for sending the response.

6. Express can serve static files, return HTML, and generate server-rendered pages with template engines such as EJS or Pug.