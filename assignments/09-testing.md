# **Assignment 9 — Automated Testing**

## **Assignment Instructions**

Add this assignment to `node-homework`. Create an `assignment9` branch for your work, and create it from your `assignment8` branch so you have access to your previous work.

This assignment uses the following packages. Most of them have already been installed:

- jest
- supertest
- node-mocks-http
- eslint-plugin-jest
- globals
- cookies

Run `npm install --save-dev` for each package to make sure you have them.

You have hopefully been using eslint to check your code for problems. Jest can confuse eslint because Jest tests use globals like `expect()` and `describe()` that you do not declare yourself. Add the following to `eslint.config.js` at the bottom of the `defineConfig` array to fix this problem:

```js
    {
    // update this to match your test files
    files: ['**/*.spec.js', '**/*.test.js'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
```

Create a `test` directory inside the `node-homework` folder. Then update `package.json` so the scripts stanza includes:

```json
    "test": "NODE_ENV=test jest --testPathPatterns=test/ --verbose --maxWorkers=1 --detectOpenHandles",
```
**Note: This way of setting the NODE_ENV environment variable works on Windows Native, but only if you are running the test under Git Bash.  If you are developing in Windows Native, you should use Git Bash for all development, and you should configure VSCode so that Git Bash is the default terminal program.**

This configuration runs the tests you create, but not the TDD provided with the course. You can now run `npm run test`, but it will not do anything yet because you have not created any tests.

Inside the `test` directory, create a file named `validation.test.js`. All of your test files should end with `.test.js` so `jest` will find them. This file tests your validation schema, so it should start with:

```js
const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
```

### **An Aside on JavaScript Destructuring**

You will use object destructuring often in this assignment. Be careful when you reuse variable names. This code:

```js
let {error, value} = userSchema.validate(object1)
console.log("got here")
{error, value } = userSchema.validate(object2)
```

will give an error. You can get a little further by adding parentheses:

```js
let {error, value} = userSchema.validate(object1)
console.log("got here")
({error, value } = userSchema.validate(object2))
```

But at this point, the JavaScript parser can still get confused, and your program may fail in strange ways. This version works:

```js
let {error, value} = userSchema.validate(object1)
console.log("got here");
({error, value } = userSchema.validate(object2))
```

This is one of the cases where you **need** that semicolon.

## **First Test**

Start by testing whether the user object validation accepts a trivial password.

Create a stanza as follows:

```js
describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    // expect() statement needed here
  });
});
```

If the schema is working correctly, validation should return an error, and that error should show that the password is not good enough. The returned `error` should have an array of `detail` objects. Each detail has a `context`, and one of those contexts should have a key of `password`. So we can update the code to:

```js
describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });
});
```
This test reports a failure in two cases. First, validation might return an error, but the error might not include a `detail.context` with a key of `password`. In that case, the matcher fails. Second, validation might find no problem and return a value instead of an error. In that case, `error` would be null, so `error.details` throws an error. Either way, the test fails, which is what we want. Other `it()` blocks in the file will still run.

### **Style Requirements**

When you create your tests, follow these guidelines.

1. Use only one `expect()` inside each `it()` block. You can still use objects across multiple `it()` blocks if they are declared in a scope that all of those blocks can access. Not every test suite is written this way, but for this assignment, one expectation per test helps the report show exactly what failed.

2. Number the `it()` statement with the test case number, followed by a period. The test case spec gives you the numbers to use.

These requirements allow the TDD to work, so you and your assignment reviewers can tell whether your tests are correct.

Now, run `npm run test`.  The test should succeed.

## **More Validation Tests**

Create the following additional tests inside the first describe() block. Put each one in its own it() block:

`2.` The user schema requires that an email be specified.`

`3.` The user schema does not accept an invalid email.

`4.` The user schema requires a password.

`5.` The user schema requires name.

`6.` The name must be valid (3 to 30 characters).

`7.` If validation is performed on a valid user object, error comes back falsy.

Create another describe stanza for taskSchema with these tests:

`8.` The task schema requires a title.

`9.` If an `isCompleted` value is specified, it must be valid.

`10.` If an `isCompleted` value is not specified but the rest of the object is valid, a default of `false` is provided by validation.

`11.` If `isCompleted` in the provided object has the value `true`, it remains `true` after validation.

Create another describe() stanza for patchTaskSchema.

`12.` The patchTaskSchema does not require a title.

`13.` If no value is provided for `isCompleted` this remains undefined in the returned value.

Run `npm run test` again. All tests should succeed. If a test fails, the problem might be in the code you are testing, or it might be in the test itself.

### **Testing the Tests**

Some automated tests of your tests are provided. Run them with:

```bash
npm run lesson9TDD
```

When you run the tests of the tests, mocks of the application code are run. The mocks implement the same functions, but with intentionally introduced bugs. Your tests should identify those bugs. This is not a complete test of your tests, but it gives you useful feedback.

### **Check for Understanding**

What other validation errors might happen that would not be caught by these tests?

## **Controller Testing for the Task Controller**

Next, test `controllers/taskController.js`. When you test a controller, the controller actually reads from and writes to the database. Because of that, be careful about these things:

1. You only access the test database.

2. You set the database to a known state before testing. For this assignment, we are going to delete everything, but it is also common to populate the database with known data.

3. You consider **concurrency issues.** By default, several jest test files may run at the same time. If each one changes the test database, you can get conflicts and flaky failures. In your configuration, this will not happen because the test command uses `maxWorkers=1`. That prevents concurrency, but it also slows down the test process. In larger projects, another option is to make sure each test file only reads or writes to its own subset of the database. For this project, you could use different user and task records for each test file.

Inside your test folder, create a file named `taskController.test.js`. It should start like this:

```js
require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // point to the test database!
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;
```

The call to `dotenv` is needed to get the database URLs. But **before** you load the Prisma client, and **before** you load any code that loads the Prisma client, set the environment variable so it points to the test database.

There is one confusing point about the dotenv `config()` call. The `.env` file is in the root of the project, but this test file is not. The dotenv package resolves the path using the current working directory, not the location of the current file. You run jest from the root of the project, so that is the current working directory.

Although this is a test of the task controller, you need the `register` function from the user controller so you can create users with associated tasks.

Jest provides a number of useful hooks:

- beforeAll
- beforeEach
- afterAll
- afterEach

You can place these hooks outside any `describe()` stanza. In that case, they apply to the top-level stanzas. You can also place them inside a `describe()` stanza. In that case, they apply only inside that block. Here, `beforeAll()` will empty the database and create the user records needed for the tests. The next part of the test file looks like this:

```js
beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({data: { name: "Bob", 
    email: "bob@sample.com", hashedPassword: "nonsense"}});
  user2 = await prisma.User.create({data: { name: "Alice", 
    email: "alice@sample.com", hashedPassword: "nonsense"}});
});

afterAll(() => {
  prisma.$disconnect();
})
```

Only do this when you are pointing to the test database. When you pass a function to `beforeAll()`, `it()`, or other jest functions, you can declare it as async so you can use await. It is important to call prisma.$disconnect(). If you do not, Jest may not terminate cleanly, and you might leave a zombie process.

Why do we need user records? Each task record has a foreign key, `userId`. If this is missing or does not match a real user record, the database returns a constraint violation. The `hashedPassword` values in this setup are not real hashed passwords, so you cannot log on with these users. That is okay because the tests only need users that tasks can belong to.

There are some special issues when testing route handlers and middleware functions. They receive `req`, `res`, and sometimes `next`. For `req` and `res`, use the `node-http-mocks` package. You can configure the mock req object with whatever you are testing: body, query parameters, headers, path parameters, and so on. Then call the function and check whether the result is what you expect.

A route handler or middleware function might do the following:

- Call res.send() or res.json() to send a reply.
- Call next().
- Throw an error.
- None of the above. If a route handler or middleware function does not do any of these, it is not behaving correctly, and your test should catch that.

To know what happened, call the function and check the result. The function might be async. It might also call `res.json()` or `next()` from inside a callback. Your test needs to call the function and wait for it to finish. This gets tricky when completion happens inside a callback or when the code calls `next()`. If you are writing tests first, the source code might not even exist yet.

You should use the following utility function:

```js
const waitForRouteHandlerCompletion = async (func, req, res) => {
  let next;
  const promise = new Promise((resolve, reject) => {
    next = jest.fn((error) => {
      if (error) return reject(error);
      resolve();
    });
    res.on("finish", () => {
      resolve();
    });
  });
  await func(req, res, next);
  await promise;
  return next;
};
module.exports = waitForRouteHandlerCompletion;
```

Create a file in your `/node-homework/test` directory named `waitForRouteHandlerCompletion.js`, with the code above. You will call this helper from several tests. You are about to test the create() function of the task controller. Use the helper like this:

```js
const next = await waitForRouteHandlerCompletion(create, req, res);
```

Here is what this helper does. It creates a promise that resolves when either `create()` sends the response or `create()` calls next(). The next() function is built with `jest.fn()`. If `create()` calls next(), the callback passed to `jest.fn()` runs. Response objects also emit a "finish" event when a response is sent, so the helper resolves the promise in that case too.

Then the helper awaits `create()`, awaits the promise, and returns next(). If `create()` throws an error, `waitForRouteHandlerCompletion()` throws that error, and you can catch it in your test or let Jest catch it. A useful thing about a function created with `jest.fn()` is that you can check whether it has been called:

```js
expect(next).toHaveBeenCalled()
```

When you test middleware functions, you can check whether they called next(). You can also inspect the arguments passed to next(), which helps when the tested function calls the error handler. If no exception is thrown and next() has not been called, then `res` contains the finished result after `await waitForRouteHandlerCompletion()`, and you can make assertions on it. If the function is badly behaved, the promise might not resolve, and Jest will time out. That timeout identifies the problem.

You do not have to understand every detail of this helper yet. Use it in your tests and add a require() statement for it.

### **The First Test**

Now call the task controller `create` method. That method takes `req` and `res`, so you need to simulate those objects. That is what the `node-http-mocks` package is for.

Our first test looks like this:

```js
describe("testing task creation", () => {
  it("14. Creates a task", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    // be sure you pass the event emitter class
    await waitForRouteHandlerCompletion(create,req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
})
```

Now that you have a valid task object for creation, run the test.

You will notice that the test fails. If you check the logs, you can see that req.user is undefined. In the actual application, task creation is protected by JWT middleware, which sets up req.user. Because this test invokes the controller directly, it bypasses that middleware.

This is still a valuable test case, but now it should expect and catch that specific error. Rename the test and adjust the code:

```js
   it("14. cant create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});;
    try {
      await waitForRouteHandlerCompletion(create,req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
```

If you run the test now, it will pass. However, if the code under test stops throwing an error later, the catch block will be skipped, and the test would still report success.

To make sure the test really verifies the error, add expect.assertions(1) right before the try block. This tells Jest that the test must execute exactly one expect() statement, the one inside the catch block, to be considered a true pass.

## **More Tests of the Tasks Controller**

Now you know that for the create() call to succeed, you need `req.user = { id: user1.id }`.

Create more controller tests:

`15.` You can't create a task with a bogus user id.

In this case, you trigger a database constraint violation because the foreign key is invalid. The error thrown has a name of `PrismaClientKnownRequestError`.

`16.` If you have a valid user id, create() succeeds (res.statusCode should be 201).

Save the res object you create for test 16 in saveRes so later tests can inspect what was returned.

`17.` The object returned from the create() call has the expected title.  

To do this, use `saveData = saveRes._getJSONData()`. Then test what saveData contains.

`18.` The object has the right value for `isCompleted`.

`19.` The object does not have any value for userId.

Save the id value from the object in saveTaskId. You will need it below.

**Note: Do not use the same res object for multiple controller calls. It can preserve unwanted state. Create a new one when you need to call the controller again.**

Create a new describe stanza called "test getting created tasks" and test the following.

`20.` You can't get a list of tasks without a user id.

`21.` If you use user1's id, the call returns a 200 status.

Here is some code for this:

```js
   it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});;
    await waitForRouteHandlerCompletion(index,req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
```

`22.` The returned object has a tasks array of length 1.

Here is some code for this:
```js
  it("22. The returned object has a tasks array of length 1.", async () => {
    saveData = saveRes._getJSONData(); // reusing saveRes
    expect(saveData.tasks.length).toBe(1);
  });
```

`23.` The title in the first array object is as expected.

You are checking `saveData.tasks[0].title`.

`24.` The first array object does not contain a userId.

`25.` If you get the list of tasks using the userId from user2, you get a 404.  

(This is a security test for access control. You do not want Alice to access Bob's data.)

`26.` You can retrieve the created task using show().

Hint: You have to set req.params. You want req.params.id to be a string representation of saveTaskId:
```js 
req.params = { id: saveTaskId.toString() }
```
You can just check for a 200 result code.

`27.` User2 can't retrieve this task entry. You should get a 404.

(Why test this? We do not use this operation in the app, but we still have to test it because it could be a back door.)

Create another stanza for testing the update and delete of tasks.

`28.` User1 can set the task corresponding to saveTaskId to `isCompleted: true`.

`29.` User2 can't do this.

`30.` User2 can't delete this task.

`31.` User1 can delete this task.

`32.` Retrieving user1's tasks now returns a 404.

This is a lot of tests, but larger projects often have test suites with thousands of test cases. This example shows the kinds of behavior a typical test suite needs to cover.

Run the tests and make sure all of them pass.

## **Tests of the User Controller**

Because this assignment is long, the user.controller.test.js file is **optional**. Be sure to implement the actual network operations testing that follows this section. Even if you do not implement the tests in this section, read the descriptions so you understand how they would work.

We want to test logon, but logon sets a cookie. If that cookie is not set, authentication is not working, so we need to test it. The first problem is that a res object returned by `httpMocks.createResponse()` does not keep track of cookies. So we create an enhanced mock response object. This one, created by MockRequestWithCookies, tracks 'Set-Cookie' operations.

Create another file in the test directory named `user.controller.test.js`. It should start with:

```js
require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { register, logoff, logon } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const jwt = require("jsonwebtoken");

// a few useful globals
let saveRes = null;
let saveData = null;

const cookie = require("cookie");
function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });
  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);
    let currentHeader = res.getHeader("Set-Cookie");
    if (currentHeader === undefined) {
      currentHeader = [];
    }
    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };
  return res;
}

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
});

afterAll(() => {
  prisma.$disconnect();
});

let jwtCookie;
```

Now you can create the logon test:

```js
describe("testing logon, register, and logoff", () => {
  it("33. A user can be registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(201); // success!
  });
    it("34. The user can logon.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });
})
```

You can now add later tests without sending another request. These tests just check the data and cookies. Get the response header set by the request with:

```js
const setCookieArray = saveRes.get("Set-Cookie")
```

Add the following tests:  

`35.` A string in the cookie array starts with "jwt=".

`36.` That string contains "HttpOnly;".  (This is a security test!)

`37.` The returned data from the register has the expected name.

`38.` The returned data contains a csrfToken.

`39.` You can now logoff.

`40.` The logoff clears the cookie.

Here is how you check it. After the logoff in 40, the `setCookieArray` in `saveRes` should contain a string that starts with "jwt=", and that string should contain "Jan 1970". Cookies are cleared by setting the expiration date to a time in the past. The code you need is:

```js
  it("40. The logoff clears the cookie.", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toContain("Jan 1970");
  });
```

`41.` A logon attempt with a bad password returns a 401.

`42.` You can't register with an email address that is already registered.

The following tests should be in a new stanza that starts like this:

```js
describe("Testing JWT middleware", () =>{
```

Although you are testing middleware instead of a route handler, you test it the same way. You need the req and res, then call:
```js
await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
```

`61.` jwtMiddleware Returns a 401 if the JWT cookie is not present in the req.

If you do not put a cookie in the request, you should get the 401.

`62.` Returns a 401 if the JWT is invalid.

Here's the code you need:
```js
  it("62. Returns a 401 if the JWT is invalid", async ()=>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "badToken"}, "badSecret", { expiresIn: "1h" });
    req.cookies = {jwt: jwtCookie }
    await waitForRouteHandlerCompletion(jwtMiddleware,req,saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
```
The `req.cookies` object may contain several cookies. The code above adds the jwt cookie, but it is signed with "badSecret", so it is not valid.

`63.` Returns a 401 if the JWT is valid but the CSRF token isn't.

Here, create a good cookie signed with `process.env.JWT_SECRET`. Put a `csrfToken` in the payload with value "badToken", along with `id: 5`, which represents the id of an imagined user record. Then do this:

```js
    if (!req.headers) {
      req.headers={};
    }
    req.headers["X-CSRF-TOKEN"]= "goodtoken";
```

Now the CSRF token in the header does not match the one in the cookie. Use a POST operation so the middleware checks the CSRF values and rejects them because they do not match.

`64.` Calls next() if both the token and the jwt are good.

Do the same as test 63, but make the CSRF token values in the header and the cookie match this time. Use a POST as before. Then:

```js
const next = await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
expect(next).toHaveBeenCalled();
```

`65.` If both the token and the jwt are good, req.user.id has the appropriate value.

Use the `req` object from 64. There is no need to send a new request. Your `expect()` statement should check that `req.user.id` is 5.

For the last test above, 

If you complete this optional part of the assignment, verify that "npm run test" runs all these tests successfully.

## **Testing Actual Network Operations**

At some point, you need to test real network requests. For this, use supertest. Create another file in the test directory named `user.function.test.js`. This file will call the user routes through the app. You already have this line in app.js:

```js
module.exports = { app, server }; 
```

This was added for supertest so the TDD would work. Now you will use those exports in your own tests.

The new test file should start like this:

```js
require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users 
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});
```

Here is what this code does. It loads the environment variables and makes sure the app points to the test database from the start. Because the app uses cookie-based security, the tests need to keep track of cookies. The supertest agent does that for us. We configure the agent with the app so real requests can be sent to the app. As usual, we clean the database first.

**It is very important to stop the server at the end of the test using server.close().** If this does not happen, your app can be left as a zombie process. That is why the server value is exported from your app.

Now for the first test of this type:

```js
describe("register a user ", () => {
  let saveRes = null; // we'll declare this out here, so that we can reference it in several tests
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/user/register").send(newUser);
    expect(saveRes.status).toBe(201);
  });
})
```

We are using an async/await style here, which is recommended. You may also see code like this:

```js
it('should access a restricted page after sign-in', function (done) {
    agent
        .get('/tasks')
        .expect(200) // Expect a successful response after authentication
        .end(done);
});
```

This older callback style is not recommended for this assignment.

After the await for the agent completes, you get a res object. This differs a little from the mock res used in controller tests. You have:

- res.body: the body of the response.
- res.status: the status code returned.
- res.headers: An object with headers, if any. You could get res.headers["set-cookie"], which may or may not be defined. If it is defined, it is an array of the set-cookie strings.

Run this test to make sure it works. You can run this individual test with:

```bash
npx jest test/user.function.test.js
```

Then, add the following additional tests:

`47.` Registration returns an object with the expected name.

In this case, that value is in saveRes.body.

`48.` Test that the returned object includes a csrfToken.

`49.` You can logon as the newly registered user.

`50.` Verify that you are logged in: /api/tasks should not return a 401

`51.` Verify that you can log out.

`52.` Make sure that you are really logged out: /api/tasks should now return a 401

Hint: The logoff route is protected. What do you need to put in the request header? Where can you get the needed value? Why did you not have to do this for the controller test?

Then verify that all your tests run without error. If you want to run just this test, use:

```bash
npx jest test/user.function.test.js
```

Also run the TDD, the test of the tests, if you have not run it recently. Check whether it identifies any problems with your tests.

## **On Making Tests Comprehensive**

As you go further up the stack, your tests do not have to be as granular. When you create controller function tests, you do not need to test every way a task or user object can fail validation because your validation tests already handle that. But you should test at least one validation failure so you know validation is actually being used.

The same idea applies to network tests with supertest. Supertest tests do not need to repeat everything the controller unit tests do. Comprehensive unit tests are still important. In theory, you could test every case with supertest, but then someone would have to figure out **why** the test failed and **where** in the stack the bug actually lives.

You can check code coverage as follows:

```bash
NODE_ENV=test npx jest --testPathPatterns=test/ --verbose --maxWorkers=1 --coverage
```

How far did you get towards 100%?

If your code is robust, it will handle many unlikely errors in data, requests, race conditions, and similar situations. Some of those conditions are hard to reproduce in tests, so test suites rarely reach 100% code coverage.

Even with strong code coverage, tests may still miss some failure modes. These tests definitely do not cover every possible failure.

### **Check For Understanding**

1. You should not be able to logoff if you are already logged off. Why? Do you need a test for this?

2. Suppose you want to write a function test for task operations using supertest.  How would you go about it?

3. How do you know if you have enough supertest cases?

4. Give one example of a kind of security test that was not covered in this assignment.

### **Answers**

1. Logoff is a post operation that could be triggered by cross-site request forgery. A test is needed to verify that this protection is in place. An attacker may not gain much by triggering logoff, but it is still best practice to block the attack.

2. To do a task operations functional test, first check that task operations cannot be performed without being logged on. Then log on. Then check that data-changing operations, POST, PATCH, and DELETE, cannot be done without a CSRF token. Next, test each task operation for correct responses: POST /tasks, PATCH /task/:id, GET /tasks, GET /tasks/:id, and DELETE /tasks/:id. Also check that PATCH, GET, and DELETE operations do not allow access to data that belongs to another user. This is the minimum, but it may be enough if there are strong unit tests.

3. The short answer is that you can never know for sure that you have enough supertest cases. Every operation a user might reasonably perform should be tested. For security, every known attack angle an attacker might use should also be tested.

4. One kind of attack is to put cross-site scripting sequences into stored data. The back end is not directly vulnerable to cross-site scripting because it is not running in a browser. The risk is that an attacker could insert hostile scripts into data stored by the back end, and the front end might later display that data. The sanitizer package included in the app is intended to protect against this, but there should be a test case that proves it is present and working.

## **Code Coverage**

## **Running the Test of the Tests**

To run the TDD for assignment 9, run:

```bash
npm run lesson9TDD
```

This command is different from `npm run test`.

When you run `npm run test`, you are running your tests against your real application code. Those tests should pass when your application and tests are correct.

When you run `npm run lesson9TDD`, you are testing your tests. The command runs your test files against mock versions of some JavaScript files. Those mock files have intentionally introduced bugs. Because the mock code is broken on purpose, you should expect to see some test failures.

That is the point of this command. If your tests are strong, they should fail when the mock code is wrong.

The output may look strange at first because a failure can be a good result here. For example, if a mock controller incorrectly returns a `userId`, then the test that checks that `userId` is not returned should fail. That means your test caught the bug.

At the end of the run, read the custom report. It will show sections for the required and optional parts of the assignment. In those sections, look for messages like:

- `The following tests gave correct results`
- `The following tests were not implemented`
- `The following tests did not report the expected results`
- `All implemented tests gave the expected results`

The best result is not "all Jest tests passed." The best result is that the final report says your implemented tests gave the expected results. Some expected results are passes, and some expected results are failures, because the mock files are intentionally wrong in specific ways.

If the report says a test was `not implemented`, check that the `it()` description starts with the correct test number, such as `1.`, `14.`, or `46.`. The reporter uses those numbers to match your tests to the assignment requirements.

This is not a complete test of your tests, but it gives you useful feedback about whether your tests are catching important problems.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Inside your `node-homework` folder, add and commit the files you created so they are included on the `assignment9` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment9` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.

---

## Video Submission

Record a short video (3-5 minutes) on YouTube, Loom, or a similar platform. Share the link in your submission form.

**Video Content**: Short demos based on Lesson 9:

1. **How do you write effective unit tests for validation schemas and business logic?**
   - Show your validation test file and explain the test structure
   - Demonstrate testing both valid and invalid inputs
   - Walk through a specific test case and explain the assertions
   - Show how you test edge cases and error conditions

2. **How do you test Express API endpoints with supertest?**
   - Show your API test file and explain the supertest setup
   - Demonstrate testing different HTTP methods and status codes
   - Walk through testing authentication and protected routes
   - Show how you test request/response data validation

3. **What testing strategies help ensure comprehensive coverage?**
   - Explain the different types of tests (unit, integration, API)
   - Show how you organize your test files and describe blocks
   - Demonstrate running tests and interpreting results
   - Walk through testing error scenarios and security vulnerabilities

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples 
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission
