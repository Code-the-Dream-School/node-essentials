# **Assignment 3 — Extending Your Express App, and a Middleware Debugging Exercise**

This assignment is to be done in the node-homework folder.  Within that folder, create an assignment3 git branch for your work.  As you work on this assignment, add and commit your work to this branch periodically.

> REMEMBER: Commit messages should be meaningful. `Week 3 assignment` is not a meaningful commit message.

## **Task 1: A Route Handler for User Registration, Logon, and Logoff**

You have started work on the application you'll use for your final project.  You now start adding the main functions.

For your final project, you'll have users with todo lists.  A user will be able to register with the application, log on, and create, modify, and delete tasks in their todo lists.  You'll now create the route that does the register.  That's a POST operation for the '/user' path.  Add that to app.js, before the 404 handler.  For now, you can just have it return a message.

You can't test this with the browser.  Browsers send GET requests, and only do POSTs from within forms.  Postman is the tool you'll use.  Start it up.  On the upper left hand side, you see a `new` button.  Create a new collection, called `node-homework`.  On the upper right hand side, you see an icon that is a rectangle with a little eye.  No, it doesn't mean the Illumnati.  This is the Postman environment.  Create an enviroment variable called host, with a value of `http://localhost:3000`.  This is the base URL for your requests.  When it comes time to test your application as it is deployed on the internet, you can just change this environment variable.

Hover over the node-homework collection and you'll see three dots. Click on those, and select 'add request'.  Give it a name, perhaps `register`.  A new request, by default, is a GET, but there is a pulldown to switch it to POST.  Save the requestn, and then send it.  If your Express app is running, you should see your message come back.  Of course, to create a user record, you need data in the body of the request.  So, click on the body tab for the request.  Select the `raw` option.  There's a pulldown to the right that says `Text`.  Click on that, and choose the JSON option.  Then, put JSON in for the user you want to create.  You need a name, an email, and a password.  Remember that this is JSON, not a JavaScript object, so you have to have double quotes around the attribute names and string values.  Save the request again, and then send it.  The result is the same of course -- the request handler doesn't do more than send a message at the moment.

Go back to app.js.  You need to be able to get the body of the request.  For that you need middleware, in this case middleware that Express provides.  Add this line above your other routes:

```js
app.use(express.json({ limit: "1kb" }));
```

This tells Express to parse JSON request bodies as they come in.  The express.json() middleware only parses the request body if the Content-Type header says "application/json". The resulting object is stored in req.body.  Of course, any routes that need to look at the request body have to come after this app.use().

Make the following change to the request handler:

```js
app.post("/user", (req, res)=>{
    console.log("This data was posted", JSON.stringify(req.body));
    res.send("parsed the data");
});
```

Then try the Postman request again.  You see the body in your server log, but you are still just sending back a message.  What you should do for this request is store the user record.  Eventually you'll store it in a database, but we haven't learned how to do that yet.  So, for the moment, you can just store it in memory.  Create a directory called util, and a file within it called memoryStore.js.  There's not much to this file:

```js
const storedUsers = [];

let loggedOnUser = null;

const setLoggedOnUser = (user) => {
  loggedOnUser = user;
};

const getLoggedOnUser = () => {
  return loggedOnUser;
};

module.exports = { storedUsers, getLoggedOnUser, setLoggedOnUser };
```

Now, in app.js, above your app.post(), add this statement:

```js
const { storedUsers, setLoggedOnUser } = require("./util/memoryStore");
```

And then, change the app.post() as follows:

```js
app.post("/user", (req, res)=>{
    const newUser = {...req.body}; // this makes a copy
    storedUsers.push(newUser);
    setLoggedOnUser(newUser);  // After the registration step, the user is set to logged on.
    delete req.body.password;
    res.status(201).json(req.body);
});
```

Test this with your Postman request.

### **Why the Memory Store is Crude**

Let's list all the hokey things you just did.

1. No validation.  You don't know if there was a valid body.  Hopefully your Postman request did send one.

2. You stored to memory.  When you restart the server, the data's gone.  Your users will not be happy.

3. You don't know if the email is unique.  You are going to use the email as the userid, but a bunch of entries could be created with the same email.

4. You stored the plain text password, very bad for security.

5. Only one user can be logged on at a time.

Well ... we'll fix all of that, over time.

### **Keeping Your Code Organized: Creating a Controller**

You are going to have to create a couple more post routes.  Also, you are going to have to add a lot of logic, to solve problems 1 through 5 above.  You don't want all of that in app.js.  So, create a directory called controllers. Within it, create a file called userController.js.  Within that, create a function called register.  The register() function takes a req and a res, and the body is just as above.  You can move the require() statement for the memoryStore over there (but you have to use a relative path).  You should also do a require for http-status-codes, and instead of using 201, you use StatusCodes.CREATED.  Then, you put register inside the module.exports object for this module.

### **On Naming**

In the general case, you can name modules and functions as you choose.  However, we are providing tests for what you develop, and so you need to use the names specified below, so that the tests work:

```
/controllers/userController.js with functions login, register, and logoff
/controllers/taskController.js with functions index, create, show, update, and deleteTask.
```  

The show function returns a single task, and the index function returns all the tasks for the logged on user (or 404 if there aren't any.)

### **Back to the Coding***

When creating a new record, it is standard practice to return the object just created, but of course, you don't want to send back the password.

Change the code in for the route as follows:

```js
const { register } = require("./controllers/userController");
app.post("/user", register);
```

Test again with Postman to make sure it works.

### **More on Staying Organized: Creating a Router**

You are going to create several more user post routes, one for logon, and one for logoff.  You could have app.post() statements in app.js for each.  But as your application gets more complex, you don't want all that stuff in app.js.  So, you create a router.  Create a folder called routes.  Within that, create a file called user.js.  It should read as follows:

```js
const express = require("express");

const router = express.Router();
const { register } = require("../controllers/userController");

router.route("/").post(register);

module.exports = router;
```

Then, change app.js to take out the app.post().  Instead, put this:

```js
const userRouter = require("./routes/user");
app.use("/user", userRouter);
```

The user router is called for the routes that start with "/user".  You don't include that part of the URL path when you create the router itself.

All of the data sent or received by this app is JSON.  You are creating a back end that just does JSON REST requests.  So, you really shouldn't do res.send("everything worked.").  You should always do this instead:

```js
res.json({message: "everything worked."});
```

At this time, change the res.send() calls you have in your app and middleware to res.json() calls.

### **The Other User Routes**

Here's a spec.

1. You need to have a `/user/logon` POST route.  That one would get a JSON body with an email and a password.  The controller function has to do a find() on the storedUsers array for an entry with a matching email.  If it finds one, it checks to see if the password matches.  If it does, it returns a status code of OK, and a JSON body with the user name.  The user name is convenient for the front end, because it can show who is logged on.  The controller function for the route would also set the value of loggedOnUser to be the entry in the storedUsers array that it finds.  (You don't make a copy, you just set the reference.)  If the email is not found, or if the password doesn't match, the controller returns an UNAUTHORIZED status code, with a message that says Authentication Failed.

2. You need to have a `/user/logoff` POST route.  That one would just set the loggedOnUser to null and return a status code of OK.  You could do res.sendStatus(), because you don't need to send a body.

3. You add the handler functions to the userController, and you add the routes to the user.js router, doing the necessary exports and requires.

4. You test with Postman to make sure all of this works.

For the rest of this assignment, you'll set your app aside for a moment, and learn some debugging skills.git s

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

2. To run the provided framework enter "npm run week3".  You do this before you start Postman testing.

3. To run the test, enter "npm run tdd assignment3".  Your task is to make the tests pass.

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
  Here `{{host}}` is a Postman environment variable you should configure.  It should be set to `http://localhost:/3000`.  You'll do manual testing with Postman.

5. Get coding!

### Deliverables

Your work will involve editing `app.js` to add the expected middleware. Do **not** modify the existing route logic in `routes/dogs.js`.

1. **Built-In Middleware**  

   * The `POST /adopt` endpoint doesn’t seem to be processing requests as expected. This route expects a `name`, `email`, and `dogName`, but the controller keeps erroring. Implement the appropriate middleware to parse JSON requests on this endpoint.  
   * The images for adoptable dogs are not being served on  `GET /images/**` as expected. Implement the appropriate middleware to serve the images of adoptable dogs from the `public/images/..` directory on this endpoint.  

2. **Custom Middleware**  

   * The following middleware should be chained and applied globally to all routes:  
     * We would like to add a unique request ID to all incoming requests for debugging purposes. Using the `uuid` library to generate the unique value, write a custom middleware that:
       * Adds a `requestId` to all requests in the application
       * Injects this value as an `X-Request-Id` in the response headers
     * We would like to output logs on all requests. These logs should contain the timestamp of the request, the method, path, and request ID. They should be formatted as:

       ```js
       `[${timestamp}]: ${method} ${path} (${requestID})`
       ```

3. **Custom Error Handling**  

* Catch any uncaught errors and respond with a `500 Internal Server Error` error status and a JSON response body with the `requestID` and an error message. You can test this middleware with the `/error` endpoints

### Checking Your Work

You start the server for this exercise with `npm run week3`.  You stop it with a Ctrl-C.  You run `npm run tdd week3` to run the test for this exercise.  Also use Postman to test.  Confirm the responses in Postman and the logs in your server terminal match the expectations in the deliverables.

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


