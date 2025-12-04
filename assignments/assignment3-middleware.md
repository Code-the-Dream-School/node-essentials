# **Assignment 3 — Extending Your Express App, and a Middleware Debugging Exercise**

This assignment is to be done in the node-homework folder.  Within that folder, create an `assignment3` ```git branch``` for your work.  As you work on this assignment, add and commit your work to this branch periodically.

> REMEMBER: Commit messages should be meaningful. `Week 3 assignment` is not a meaningful commit message.

## **Task 1: A Route Handler for User Registration, Logon, and Logoff**

You have started work on the application you'll use for your final project.  You now start adding the main functions.

For your final project, you'll have users with todo lists.  A user will be able to register with the application, log on, and create, modify, and delete tasks in their todo lists.  You'll now create the route that does the register.  That's a POST operation for the `/api/users` path.  Add that to app.js, before the 404 handler.  For now, you can just have it return a message.  By convention, REST API routes start with `/api'.

You cannot test this with the browser.  Browsers send GET requests, and only do POSTs from within forms.  Postman is the tool you'll use.  Start it up.  On the upper left-hand side, you see a `new` button.  Create a new collection, called `node-homework`.  On the upper right-hand side, you see an icon that is a rectangle with a little eye.  No, it doesn't mean the Illuminati.  This is the Postman environment.  Create an environment variable called host, with a value of `http://localhost:3000`.  This is the base URL for your requests.  When it comes time to test your application as it is deployed on the internet, you can just change this environment variable.

Hover over the node-homework collection and you'll see three dots. Click on those, and select 'add request'.  Give it a name, perhaps `register`.  A new request, by default, is a GET, but there is a pulldown to switch it to POST.  Save the request, and then send it.  If your Express app is running, you should see your message come back.  Of course, to create a user record, you need data in the body of the request.  So, click on the body tab for the request.  Select the `raw` option.  There's a pulldown to the right that says `Text`.  Click on that, and choose the JSON option.  Then, put JSON data in for the user you want to create.  You need a name, an email, and a password.  Remember that this is JSON, not a JavaScript object, so you have to have double quotes around the attribute names and string values.  Save the request again, and then send it.  The result is the same of course -- the request handler doesn't do more than send a message at the moment.

Go back to app.js.  You need to be able to get the body of the request.  For that you need middleware, in this case middleware that Express provides.  Add this line above your other routes:

```js
app.use(express.json({ limit: "1kb" }));
```

This tells Express to parse JSON request bodies as they come in.  The express.json() middleware only parses the request body if the Content-Type header says "application/json". The resulting object is stored in req.body.  Of course, any routes that need to look at the request body have to come after this app.use().

Make the following change to the request handler:

```js
app.post("/api/users", (req, res)=>{
    console.log("This data was posted", JSON.stringify(req.body));
    res.send("parsed the data");
});
```

Then try the Postman request again.  You see the body in your server log, but you are still just sending back a message.

What you should do for this request is store the user record.  Eventually you'll store it in a database, but we haven't learned how to do that yet.  So, for the moment, you can just store it in memory.  Use the following globals:

```js 
global.user_id // The logged on user.  This will be undefined or null if no user is logged on.
global.users // an array of user objects, initially empty.
global.tasks   // an array of task object, initially empty.
```

Near the start of `app.js`, add:

```js
global.user_id = null;
global.users = [];
global.tasks = [];
```

And then, change the app.post() as follows:

```js
app.post("/api/users", (req, res)=>{
    const newUser = {...req.body}; // this makes a copy
    global.users.push(newUser);
    global.user_id = newUser;  // After the registration step, the user is set to logged on.
    delete req.body.password;
    res.status(201).json(req.body);
});
```


When creating a new record, it is standard practice to return the object just created, but of course, you don't want to send back the user password.

Test this with your Postman request.

### **Why the Memory Store is Crude**

Let's list all the hokey things you just did.

1. There is no validation.  You don't know if there was a valid body.  Hopefully your Postman request did send one.

2. You stored to memory (globals).  When you restart the server, the data's gone.  Your users will not be happy.

3. You don't know if the email is unique.  You are going to use the email as the userid, but a bunch of entries could be created with the same email.

4. You stored the plain text password, which is very insecure.

5. Only one user can be logged on at a time.

Well ... we'll fix all of that, over time.

### **Keeping Your Code Organized: Creating a Controller**

You are going to have to create a couple more post routes.  Also, you are going to have to add a lot of logic, to solve problems 1 through 5 above.  You don't want all of that in app.js.  So, create a directory called controllers. Within it, create a file called userController.js.  Within that, create a function called register.  The register() function takes a req and a res, and the body is just as above.  You can move the require() statement for the memoryStore over there (but you have to use a relative path).  You should also do a require for http-status-codes, and instead of using 201, you use StatusCodes.CREATED.  Then, you put register inside the module.exports object for this module.

### **On Naming**

In the general case, you can name modules and functions as you choose.  However, we are providing tests for what you develop, and so you need to use the names specified below, so that the tests work:

```
/controllers/userController.js with functions logon, register, and logoff
/controllers/taskController.js with functions index, create, show, update, and deleteTask.
```  

The show function returns a single task, and the index function returns all the tasks for the logged on user (or 404 if there aren't any.)

### **Back to the Coding***

Change the code for the route as follows:

```js
const { register } = require("./controllers/userController");
app.post("/api/users", register);
```

Test again with Postman to make sure it works.

### **More on Staying Organized: Creating a Router**

You are going to create several more user post routes, one for logon, and one for logoff.  You could have app.post() statements in app.js for each.  But as your application gets more complex, you don't want all that stuff in app.js.  So, you create a router.  Create a folder called routes.  Within that, create a file called userRoutes.js.  It should read as follows:

```js
const express = require("express");

const router = express.Router();
const { register } = require("../controllers/userController");

router.route("/").post(register);

module.exports = router;
```

Then, change app.js to take out the app.post().  Instead, put this:

```js
const userRouter = require("./routes/userRoutes");
app.use("/api/users", userRouter);
```

The user router is called for the routes that start with "/api/users".  You don't include that part of the URL path when you create the router itself.

All of the data sent or received by this app is JSON.  You are creating a back end that just does JSON REST requests.  So, you really shouldn't do res.send("everything worked.").  You should always do this instead:

```js
res.json({message: "everything worked."});
```

At this time, change the res.send() calls you have in your app and middleware to res.json() calls.  Remember that res.json() calls must return an object.  If this is only a message, then for the sake of consistency, start that object with a `message` attribute.

### **The Other User Routes**

Here's a spec.

1. You need to have an `/api/users/logon` POST route.  That one would get a JSON body with an email and a password.  The controller function has to do a find() on the `global.users` array for an entry with a matching email.  If it finds one, it checks to see if the password matches.  If it does, it returns a status code of OK, and a JSON body with the user name and email.  The user name is convenient for the front end, because it can show who is logged on.  The email may or may not be used by the front end, but you can return it.  The controller function for the route would also set the value of `global.user_id` to be the entry in the `global.users` array that it finds.  (You don't make a copy, you just set the reference.)  If the email is not found, or if the password doesn't match, the controller returns an UNAUTHORIZED status code, with a message that says Authentication Failed.

2. You need to have an `/api/users/logoff` POST route.  That one would just set the `global.user_id` to null and return a status code of OK.  You could do `res.sendStatus()`, because you don't need to send a body.

3. You add the handler functions to the userController, and you add the routes to the userRoutes.js router, doing the necessary exports and requires.

4. You test with Postman to make sure all of this works.

5. Run the TDD test!  You type `npm run tdd assignment3a` .


For the rest of this assignment, you'll set your app aside for a moment, and learn some debugging skills.

---

## **Task 2: Debugging Middleware**

### ***Introduction to the Scenario**

You're volunteering for a local dog rescue, **The Good Boys and Girls Club**, to help them upgrade their adoption site.

They’ve already built the main API routes, but their middleware is a mix of broken and missing. Your job is to clean things up and ensure the app behaves, just like all their dogs!

The site serves adorable images of adoptable dogs, accepts applications from potential adopters, and includes a test route for simulating server errors. It just needs your help to become a robust, production-ready app using Express middleware the right way.

You'll be implementing middleware that handles things like:

* Logging and request tracking
* Request validation and parsing
* Serving dog images as static files
* Gracefully handling unexpected errors
The dogs are counting on you.

### Setup

1. The `week-3-middleware` folder is already provided in your repository. This folder contains the skeleton code for the dog rescue application.

2. To run the provided framework enter ```npm run week3``` in terminal.  You do this to start server before you begin testing with Postman.

3. To run the test, enter ```npm run tdd assignment3b``` in terminal.  Your task is to modify the existing files in the `week-3-middleware folder` to make the tests pass.

### **Advanced Middleware Implementation**

The dog rescue team wants to add more robust middleware to their application. Implement these additional features:


**Request Validation:**
- Add middleware that validates the `Content-Type` header for POST requests
- If a POST request doesn't have `application/json` content type, return a 400 error with a helpful message
- Include the request ID in the error response

**Error Handling Middleware:**
- Create custom error classes that extend `Error` with status code properties
- Add middleware to catch different error types and return appropriate HTTP status codes:
  - `ValidationError` → 400 Bad Request
  - `NotFoundError` → 404 Not Found  
  - `UnauthorizedError` → 401 Unauthorized
  - Default errors → 500 Internal Server Error
- Log errors with different severity levels based on status code (see Task 4 for details)


**Testing Your Implementation:**
- Test with Postman to ensure all new middleware works correctly
- Test that invalid content types return proper error responses
- Error responses include the correct status code, message, and requestId
- Unmatched routes return a 404 JSON response


4. In **Postman**, set up the following routes.  They should all be in one collection called "dogs":

   * `GET {{host}}/dogs`
   * `GET {{host}}/images/dachshund.png`
   * `GET {{host}}/error`
   * `POST {{host}}/adopt`
     * Body:

       ```json
       {
         "name": "your name",
         "address": "123 Sesame Street",
         "email": "yourname@codethedream.org",
         "dogName": "Luna"
       }
       ```
  Here `{{host}}` is a Postman environment variable you should configure.  It should be set to `http://localhost:3000`.  You'll do manual testing with Postman.

5. Get coding!

### Deliverables

Your work will involve editing `app.js` to add the expected middleware. You will also need to modify `routes/dogs.js` to throw custom errors (`ValidationError` and `NotFoundError`) instead of returning error responses directly.

**Important:** Pay attention to the **order** of your middleware! As you learned in Lesson 3, middleware executes in the order it's defined. Place each middleware in the correct position in the chain.

**Recommended Middleware Order:**
1. Request ID middleware (adds `req.requestId`)
2. Logging middleware (logs requests with requestId)
3. Security headers middleware (sets security headers)
4. Body parsing middleware (`express.json()` with size limit)
5. Content-Type validation middleware (for POST requests)
6. Routes (your route handlers)
7. Error handling middleware (catches thrown errors)
8. 404 handler (catches unmatched routes)

1. **Built-In Middleware**  

   * The `POST /adopt` endpoint doesn’t seem to be processing requests as expected. This route expects a `name`, `email`, and `dogName`, but the controller keeps erroring. Implement the appropriate middleware to parse JSON requests on this endpoint.  
   * The images for adoptable dogs are not being served on  `GET /images/**` as expected. Implement the appropriate middleware to serve the images of adoptable dogs from the `public/images/..` directory on this endpoint.  

2. **Custom Middleware**  

   * The following middleware should be chained and applied globally to all routes:  
     * We would like to add a unique request ID to all incoming requests for debugging purposes. Using the `uuid` library to generate the unique value, write a custom middleware that:
       * Adds a `requestId` property to `req` object (e.g., `req.requestId`) for all requests in the application
       * Injects this value as an `X-Request-Id` header in the response headers (note: header name is case-insensitive, but use `X-Request-Id`)
       * This middleware should run first, before any other middleware that might need the requestId
       
       **💡 Hint: Using the `uuid` Library**
       - First, install the package: `npm install uuid`
       - Import it at the top of your `app.js`: `const { v4: uuidv4 } = require('uuid');`
       - Generate a unique ID: `const requestId = uuidv4();` (this creates a string like "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
       - Example middleware structure:
         ```js
         app.use((req, res, next) => {
           req.requestId = uuidv4();
           res.setHeader('X-Request-Id', req.requestId);
           next();
         });
         ```
       
     * We would like to output logs on all requests. These logs should contain the timestamp of the request, the method, path, and request ID. They should be formatted as:

       ```js
       `[${timestamp}]: ${method} ${path} (${requestID})`
       ```
       
       **💡 Hint: Logging Format Requirements**
       - Use `console.log()` to output these logs
       - The timestamp can be formatted as an ISO string: `new Date().toISOString()` (e.g., "2024-01-15T10:30:45.123Z")
       - The method should be `req.method` (e.g., "GET", "POST")
       - The path should be `req.path` (e.g., "/dogs", "/adopt")
       - The requestID should come from `req.requestId` set by the request ID middleware above
       - Example implementation:
         ```js
         app.use((req, res, next) => {
           const timestamp = new Date().toISOString();
           console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
           next();
         });
         ```
       - **Important:** Make sure this middleware runs AFTER the request ID middleware, so that `req.requestId` is already set

3. **Custom Error Handling**  

* Catch any uncaught errors and respond with a `500 Internal Server Error` error status and a JSON response body with the `requestId` (note: lowercase 'd') and an error message set to "Internal Server Error"
* The error response should be a JSON object: `{ error: "Internal Server Error", requestId: "..." }`
* You can test this middleware with the `/error` endpoint

**💡 Hint: Basic Error Handling Middleware**

Error handling middleware must have 4 parameters: `(err, req, res, next)`. Express recognizes it as an error handler because of the 4 parameters.

```js
app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Internal Server Error",
    requestId: req.requestId
  });
});
```

**Note:** The error handling middleware should be placed after all routes but before the 404 handler, as error handlers must be the last middleware (except for 404 handlers).

## **Task 3: Enhanced Middleware Features**

The dog rescue team wants to add more robust middleware to their application. Implement these additional features:

### **Request Size Limiting**
- Add middleware to limit request body size to prevent large requests from crashing the server
- Use `express.json({ limit: '1mb' })` for JSON request bodies
- This middleware should come before your routes but after security headers

**💡 Hint: Request Size Limiting**
- The `limit` option in `express.json()` prevents the server from processing request bodies larger than the specified size
- If a request exceeds the limit, Express will automatically return a 413 (Payload Too Large) error
- The limit can be specified as a string like `'1mb'`, `'500kb'`, or `'10mb'`
- Example: `app.use(express.json({ limit: '1mb' }));`
- This helps protect your server from denial-of-service attacks where attackers send extremely large request bodies

### **Content-Type Validation**
- Add middleware that validates the `Content-Type` header for POST requests
- If a POST request doesn't have `application/json` content type, return a 400 error with a helpful message
- The error message should match the pattern: `Content-Type must be application/json`
- Include the request ID in the error response (as `requestId` in the JSON response body)
- The error response should be: `{ error: "Content-Type must be application/json", requestId: "..." }`
- **Important:** This validation should only apply to POST requests - GET requests should not be validated
- This middleware should run after body parsing middleware but before routes

**💡 Hint: Content-Type Validation Middleware**
- Check if the request method is POST: `req.method === 'POST'`
- Get the Content-Type header: `req.get('Content-Type')` or `req.headers['content-type']`
- Check if it equals `'application/json'` (case-insensitive comparison is recommended)
- If validation fails, send a 400 response with the error message and requestId
- If validation passes (or it's not a POST request), call `next()` to continue
- Example structure:
  ```js
  app.use((req, res, next) => {
    if (req.method === 'POST') {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
          error: 'Content-Type must be application/json',
          requestId: req.requestId
        });
      }
    }
    next();
  });
  ```

### **404 Handler**
- Add a proper 404 handler that runs after all routes (this should be the very last middleware)
- It should return a JSON response with status 404 and include the request ID:
  ```js
  {
    "error": "Route not found",
    "requestId": "your-request-id"
  }
  ```
- The requestId should be accessed from `req.requestId` (set by your request ID middleware)

## **Task 4: Advanced Error Handling**

Implement sophisticated error handling using custom error classes:

### **Custom Error Classes**
- Create a new file called `errors.js` in the `week-3-middleware` folder
- Create a `ValidationError` class that extends `Error` with a status code property (400)
- Create a `NotFoundError` class for 404 errors
- Create an `UnauthorizedError` class for 401 errors
- Export all error classes from the `errors.js` file
- Import and use these error classes in your `app.js` and `routes/dogs.js` files

**Note:** While `UnauthorizedError` is not tested in assignment3b, you should create it as you'll need it for future assignments that implement authentication.

**💡 Hint: How to Create Custom Error Classes**

In JavaScript, you can create custom error classes by extending the built-in `Error` class. Here's how:

```js
// errors.js
class ValidationError extends Error {
  constructor(message) {
    super(message); // Call the parent Error constructor with the message
    this.name = 'ValidationError'; // Set the error name (used for error identification)
    this.statusCode = 400; // Add a custom property for the HTTP status code
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError
};
```

**Key Points:**
- `extends Error` makes your class inherit from JavaScript's built-in Error class
- `super(message)` calls the parent constructor to set the error message
- `this.name` should match the class name (this helps error handlers identify the error type)
- `this.statusCode` is a custom property you add for HTTP status codes
- Export the classes so they can be imported in other files

**Usage Example:**
```js
// In routes/dogs.js
const { ValidationError, NotFoundError } = require('../errors');

// Throw a ValidationError
if (!name || !email || !dogName) {
  throw new ValidationError("Missing required fields");
}

// Throw a NotFoundError
if (!dog || dog.status !== "available") {
  throw new NotFoundError("Dog not found or not available");
}
```

**Important:** You will need to modify `routes/dogs.js` to throw these custom errors:

1. **Add validation for required fields:**
   - In the `/adopt` POST route, first check if required fields are present
   - If `name`, `email`, or `dogName` are missing, throw a `ValidationError` with the exact message: `"Missing required fields"`
   - This will result in a 400 Bad Request response

2. **Add validation for dog existence and availability:**
   - After checking required fields, check if the requested dog exists and is available
   - Find the dog in the `dogData` array (imported from `../dogData.js`) by matching the `dogName` from the request body with the dog's `name` property in the array
   - If the dog is not found in the array OR if the dog's `status` is not "available", throw a `NotFoundError` with a message that matches the pattern `/not found or not available/`
   - Example messages that would match: `"Dog not found or not available"` or `"Dog not found or not available for adoption"`
   - This will result in a 404 Not Found response

3. **Error message requirements:**
   - **The error messages must match exactly** - the test checks for specific patterns in the error messages
   - For ValidationError: The message must match `/Missing required fields/`
   - For NotFoundError: The message must match `/not found or not available/`
   - If your error messages don't match these patterns, the tests will fail

4. **Implementation details:**
   - The error should be thrown (not returned with `res.status`), so that the error handling middleware can catch it
   - Make sure to import the error classes at the top of `routes/dogs.js`
   - **Note:** The success response (status 201 with message) should remain unchanged - only modify the error handling logic

### **Error Handling Middleware**
- Add middleware to catch different error types and return appropriate HTTP status codes:
  - `ValidationError` → 400 Bad Request
  - `NotFoundError` → 404 Not Found  
  - `UnauthorizedError` → 401 Unauthorized
  - Default errors → 500 Internal Server Error
- Log errors with different severity levels based on the error type:
  - **4xx errors (400, 401, 404):** Use `console.warn()` to log these errors
    - `ValidationError` (400) → Log with `console.warn("WARN: ValidationError", error.message)` or `console.warn("WARN: ValidationError " + error.message)`
    - `UnauthorizedError` (401) → Log with `console.warn("WARN: UnauthorizedError", error.message)` or `console.warn("WARN: UnauthorizedError " + error.message)`
    - `NotFoundError` (404) → Log with `console.warn("WARN: NotFoundError", error.message)` or `console.warn("WARN: NotFoundError " + error.message)`
  - **5xx errors (500):** Use `console.error()` to log these errors
    - Default errors (500) → Log with `console.error("ERROR: Error", error.message)` or `console.error("ERROR: Error " + error.message)`
- **Important:** The logged message must contain "WARN:" for 4xx errors and "ERROR:" for 5xx errors (the test uses `stringMatching` to check if the logged string contains these patterns)
- Ensure all error responses include the request ID for debugging
- All error responses should be JSON objects with `error` and `requestId` properties

**💡 Hint: Error Handling Middleware Structure**

Error handling middleware has 4 parameters: `(err, req, res, next)`. Express recognizes it as an error handler because it has 4 parameters.

```js
app.use((err, req, res, next) => {
  // Determine the status code from the error
  const statusCode = err.statusCode || 500;
  
  // Log based on error type
  if (statusCode >= 400 && statusCode < 500) {
    // 4xx errors: client errors (use console.warn)
    // This includes ValidationError (400), UnauthorizedError (401), NotFoundError (404)
    console.warn(`WARN: ${err.name}`, err.message);
  } else {
    // 5xx errors: server errors (use console.error)
    console.error(`ERROR: Error`, err.message);
  }
  
  // Send error response
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    requestId: req.requestId
  });
});
```

**Key Points:**
- Check `err.name` or `err.statusCode` to identify the error type
- Use `err.statusCode` if available, otherwise default to 500
- For 4xx errors (400-499), use `console.warn()` with "WARN:" prefix
- For 5xx errors (500+), use `console.error()` with "ERROR:" prefix
- Always include `requestId` from `req.requestId` in the error response
- The error response should have `error` and `requestId` properties

### **Security Headers**
- Add middleware that sets basic security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
- **Important:** This middleware should run for all responses, so place it early in your middleware chain (after request ID and logging, but before body parsing)
- These headers help protect against common web vulnerabilities

## **Task 5: Testing Your Implementation**

Test all your new middleware features:

- **Basic Functionality:** Ensure all existing routes still work
- **Content-Type Validation:** Test that invalid content types return proper error responses
- **Error Handling:** Test different error types return appropriate status codes
- **Security Headers:** Check that security headers are present in all responses
- **404 Handling:** Test that unmatched routes return proper 404 responses

### Checking Your Work

You start the server for this exercise with `npm run week3`.  You stop it with a Ctrl-C.  You run `npm run tdd assignment3b` to run the test for this exercise.  Also use Postman to test.  Confirm the responses in Postman and the logs in your server terminal match the expectations in the deliverables.

## Video Submission

Record a short video (3–5 minutes) on YouTube (unlisted), Loom, or similar platform. Share the link in your submission form.

**Video Content**: Answer 3 questions from Lesson 3:

1. **What is the architecture of an Express application and how do its components work together?**
   - Explain the main architectural components: app instance, middleware, route handlers, and error handlers
   - Discuss the order of middleware execution and why it matters
   - Demonstrate the difference between middleware and route handlers

2. **How do you handle HTTP requests and responses in Express?**
   - Explain the structure of HTTP requests (method, path, headers, body)
   - Show how to access request data (req.method, req.path, req.body, req.query)
   - Demonstrate response methods (res.json(), res.send(), res.status())

3. **What is REST and how does it relate to Express applications?**
   - Explain REST principles and HTTP methods
   - Show how to design RESTful API endpoints
   - Discuss HTTP status codes and proper API responses

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment3` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment3` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
- **Don't forget to include your video link in the submission form!**


