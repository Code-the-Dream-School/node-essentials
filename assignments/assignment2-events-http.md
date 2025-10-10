# Week 2 Assignment Event Handlers, HTTP Servers, and Express

## Assignment Instructions
- Your assignment files are to be created in the `assignment2` folder of your node-homework folder.
- Create an `assignment2` ```git branch``` before you start.

### Task 1: Practice With An Event Emitter and Listener
- Create a file called `events.js`.
- Create an emitter. Use an `emitter.on()` statement to listen to this emitter for the 'time' event. Whenever the listener receives the event, it should print out "Time received: " followed by the string it receives. Then, call `setInterval(callback, 5000)`. Your callback for the `setInterval` should emit a 'time' message with the current time as a string. Try it out. You use `Ctrl-C` to end the program.

### Task 2: Practice with the HTTP Server
Modify your `sampleHTTP.js`. First, add the following to the top of your file:

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

This, of course, is a web page.  
Then change your logic so that you handle requests for the URL `'/time'`. A JSON document should be returned with an attribute `'time'` that has a value of the current time as a string.

Once you've got that code in place, restart your server and test the new URL from your browser. Then, add logic to handle requests for `'/timePage'`. It should return the page above.  
You will need to set the header content-type to be: `"text/html; charset=utf-8"`.

Then restart your server and try that URL. You should see the page with a button.  
Click on the button, and you should see the time. The button causes a fetch to your server.  
You have now coded your first REST API.

### Task 3: Creating your First Express Application
You need Express. It is not part of the Node base, so be sure it is installed in your `node-homework` repository:

```bash
npm install express
```

Actually, your `node-homework` repository already has all the required packages installed.  
If you were setting up your own project, you’d need to install them manually using `npm install`.

In the root of `node-homework`, create a file called `app.js`, with the following code:

```js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const port = process.env.PORT || 3000;
try {
  app.listen(port, () =>
    console.log(`Server is listening on port ${port}...`),
  );
} catch (error) {
  console.log(error);
}
```
Start this app from your VSCode terminal with:

```bash
node app
```

Go to your browser, and go to the URL http://localhost:3000.  
Ah, ok, Hello World. It's a start.

This file, `app.js`, is the first file for your final project. You'll keep adding on to this file and creating modules that it calls.

**Let's explain the code**

You call `express()` to create the app. You need a route handler for the app if it is to do anything.  
The `app.get` statement tells the app about a route handler function to call when there is an HTTP GET request for `"/"`.  
You tell the app to start listening for such requests. By default, it listens on `port 3000`, but if there is an environment variable set, it will use that value for the port.  
The `listen()` statement might throw an error, typically because there is another process listening on the same `port`.

Route handlers for an operation on a route are passed two or three parameters.  
The `req` parameter gives the properties of the request. The `res` parameter is used to respond to the request.  
The other parameter that might be passed is `next`. When `next` is passed, it contains another route handler function. If the route handler function for the route doesn't take care of the request, it can pass it on to `next()`.

**Be Careful of the Following**

Make sure that your route handlers respond to each request exactly once.  
Stop the server with a `Ctrl-C`. Make the following change, and then restart the server:

```js
app.get("/", (req, res) => {
//   res.send("Hello, World!");
  console.log("Hello, World")
});
```
Then try http://localhost:3000 again.  
Nothing happens until eventually the browser times out. This is bad.  
Once again, stop the server, make this change, and then restart the server.

```js
app.get("/", (req, res) => {
  res.send("Hello, World!");
  res.send("Hello, World!");
});
```
In this case, the browser does see a response, but in the server log, you see a bad error message.  
If you see this error in future development, you'll know what caused it. 

Now try this (you have to restart the server again):

```js
app.get("/", (req, res) => {
//   res.send("Hello, World!");
  throw(new Error("something bad happened!"));
});
```
As you can see, a bad error appears on your browser screen, as well as in your server log.  
Every Express application needs an error handler. 

An error handler in Express is like a route handler, except that it has four parameters instead of three.  
They are `err`, `req`, `res`, and `next`. Add the following code after your `app.get()` block:

```js
app.use((err, req, res, next) => {
  console.log(`A server error occurred responding to a ${req.method} request for ${req.url}.`, err.name, err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).send("A server error occurred.");
  }
});
```
Then try the same URL again from your browser.  
The user sees a terse error message this time, and the server log includes information about what caused the error, including some useful information in the req object. 

Note that the error handler checks to see if a response has already been sent.  
The error might have been thrown after a response was sent, so if you try to send a response again, it will throw an error — and an error thrown by an error handler would be unfortunate.

The error handler is configured with `app.use()`, which is what you use for middleware.  
Any request: GET, POST, PATCH, and so on, are handled by this middleware, but only if an error is thrown. The default result code for any send is `200`, which means `OK`, but in this case you are setting it to `500`, which means internal server error.  
If you need to set the status, you do it before you send the response.

At this point, you can put the `app.get()` for `"/"` back to what it was.

## Nodemon

Nodemon saves time. It automatically restarts your app server when you make a code change. You install it with:

```bash
npm install nodemon --save-dev
```

You are installing it as a development dependency. You do not want it included in any image deployed to production. 

Edit your `package.json`, so that the scripts stanza includes this line:

```json
"scripts": {
    "dev": "nodemon app"
}
```

Then run ```npm run dev``` from the command line.
Your server will start and automatically restart whenever you change your code. You can still stop it with `Ctrl-C`.

**Staying Organized**

You don't want all your Express code in `app.js`. That would be a mess.  
There are standard ways to organize it.  
The error handler is middleware. So, create a middleware folder. Within it, create a file called `error-handler.js`. Do an `npm install` of `http-status-codes`. You use the values in this component instead of numbers like `500`.  
Put this code in `error-handler.js`

```js
const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(
    "Internal server error: ",
    err.constructor.name,
    JSON.stringify(err, ["name", "message", "stack"]),
  );
  
  if (!res.headersSent) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("An internal server error occurred.");
  }
};

module.exports = errorHandlerMiddleware;
```
Then, in `app.js`, take out the error handler code and substitute this:

```js
const errorHandler = require("./middleware/error-handler");
app.use(errorHandler);
```
Test the result.  
In an Express application, the error handler goes after all of the routes you declare. You can now take the `throw()` statement out of your `app.get()`, and put the send of "Hello, World" back in.

Within your route handlers, you may have expected or unexpected errors being thrown.  
Suppose a user tries to register with an email address that has already been registered. Suppose you have configured the database to require unique email addresses. In this case, the database call returns an error you can recognize. You can catch it in your route handler and give the user an appropriate message.

However, the database might give an unexpected error — for example, if it is down. In this case, you may as well let the error handler take care of things.  
An unexpected error might occur outside of a try block. In this case, it is passed to the error handler automatically. 

An unexpected error might occur within a try block of your route handler. Within your catch block, you see that it is not one of the errors you expected. You can just throw the error, or better, call `next(err)` to pass it on to the error handler.

## More Middleware

Try this URL: http://localhost:3000/nonsense. Again, you get an error — a 404. You've seen those. You need to handle this case. 

Create a file `./middleware/not-found.js`.  
You need a `req` and a `res`, but no `next` in this case. You return `StatusCodes.NOT_FOUND` and the message  
```js
`You can't do a ${req.method} for ${req.url}`
```

Export your function and add the needed `require()` and `app.use()` statements in `app.js`.  
Every Express application has a 404 handler like this. You put it after all the routes, but before the error handler. Then test it out.

The middleware you have created so far is a little unusual, because in these there is no call to `next()`. Often, middleware is, as you might expect, in the middle.  
A middleware function runs for some or all routes before the route handlers for those routes, but then, instead of calling `res.send()` or an equivalent, it calls `next()` to pass the work on. 

Note: There are two ways to call `next()`.  
If you call `next()` with no parameters, Express calls the next route handler in the chain. Sometimes, the only one left is the not-found handler. But if you call `next(e)`, `e` should be an Error object. 
In this case, the error handler is called, and the error is passed to it.

**Exiting Cleanly**

Your Express program opens a port.  
You need to be sure that port is closed when the program exits. If there are other open connections, such as database connections, they must also be cleaned up. If not, you may find that your program becomes a zombie process, and that the port you had been listening on is still tied up.  
This is especially important when you are running a debugger or an automated test.

Here is some code to put at the bottom of `app.js` to ensure a clean exit:

```js
let isShuttingDown = false;
async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');
  // Here add code as needed to disconnect gracefully from the database
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown();
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown();
});
```

### Task 4: Add a Post Route Handler
Modify your `app.js`.  
Add an `app.post()` for `"/testpost"`.  
Send something back. Then test this new route handler using Postman. You do not need to put anything in the body.

### Task 5: Add Logging Middleware
Modify your Express `app.js`.  
Add an `app.use()` statement, above your other routes.  
You can declare this middleware function inline, in `app.js`. 

The middleware function you add should do a `console.log()` of the `req.method`, the `req.path`, and the `req.query`.  
Don't forget to call `next()`, as this is middleware. 

Then start the server and try sending various requests to your server from your browser, to see the log messages.  
You could also try POST requests using Postman. The `req.query` object gives the query parameters. 
You can add them to your request from your browser or from Postman by putting something like `?height=7&color=brown` at the end of the URL you send from your browser or Postman. 
This middleware is useful — it could help with debugging. We haven't explained how to get `req.body`, but eventually you could get that as well.

**There is no TDD for this week.**

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or a similar platform. 
Share the link in your submission form.

### Video Content: 
**Answer 3 questions from Lesson 2:**

1. **How do Event Emitters and Listeners work in Node.js?**
   - Explain the EventEmitter class and its purpose
   - Discuss the synchronous nature of event emission 

2. **What are the key differences between Node's HTTP module and Express.js?**
   - Explain what Express provides that makes development easier
   - Discuss middleware and routing concepts

3. **How do you handle different HTTP methods and routes in a web server?**
   - Explain HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - Show how to parse request bodies and headers
   - Demonstrate route handling and response formatting
   - Discuss error handling and status codes

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

📌 Follow these steps to submit your work:

1️⃣ Add, Commit, and Push Your Changes  
Within your node-homework folder, do a `git add` and a `git commit` for the files you have created, so that they are added to the `assignment2` branch.  
Push that branch to GitHub.

2️⃣ Create a Pull Request  
Log on to your GitHub account.
Open your `node-homework` repository.  
Select your `assignment2` branch. It should be one or several commits ahead of your main branch.  
Create a pull request.

3️⃣ Submit Your GitHub Link  
Your browser now has the link to your pull request.  
Copy that link to be included in your homework submission form.

4️⃣ **Don't forget to include your video link in the submission form!**