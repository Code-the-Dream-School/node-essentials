# **Assignment 9: Automated Testing**

## **Assignment Instructions**

This assignment is to be added to node-homework.  Be sure to create an assignment9 branch for your work, and to create it from your assignment10 branch, so that you have access to your previous work.  This assignment requires the following packages, most of which have already been installed:

- jest
- supertest
- node-mocks-http
- eslint-plugin-jest
- globals
- cookies

Do an `npm install --save-dev`  of each of them, to make sure you have them.  You have, we hope, been using eslint to check your code for problems.  Jest confuses eslint, because when you run a jest test, you have various globals like `expect()` and `describe()` that you don't declare anywhere.  Add the following to your `eslint.config.js` at the bottom of the `defineConfig` array to fix this problem:

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

Create a `test` directory inside of the `node-homework` folder.  Then update your `package.json` so that the scripts stanza includes:

```json
    "test": "NODE_ENV=test jest --testPathPatterns=test/ --verbose --maxWorkers=1",
```
**Note: This way of setting the NODE_ENV environment variable works on Windows Native, but only if you are running the test under Git Bash.  If you are developing in Windows Native, you should use Git Bash for all development, and you should configure VSCode so that Git Bash is the default terminal program.**

This configuration runs the tests you create, but not the TDD provided with the course.  You can now do `npm run test` but it won't do anything, of course, because you don't have any tests.

Within the tests directory, create a file called `validation.test.js`.  All of your test files should end with `.test.js` so that `jest` will find them.  This test file is for testing your validation schema. Accordingly, it should start:

```js
const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
```

### **An Aside on JavaScript Destructuring**

You will do a good bit of object destructuring in this assignment, but you have to be careful when reusing variable names. The following code:

```js
let {error, value} = userSchema.validate(object1)
console.log("got here")
{error, value } = userSchema.validate(object2)
```

will give an error.  You can get a little further by adding parentheses:

```js
let {error, value} = userSchema.validate(object1)
console.log("got here")
({error, value } = userSchema.validate(object2))
```

But you'll find, at this point, that the JavaScript language parser is completely confused, and your program won't run, failing in peculiar ways.  But this will work:

```js
let {error, value} = userSchema.validate(object1)
console.log("got here");
({error, value } = userSchema.validate(object2))
```

This is a case where you **need** that semicolon.  If you already knew about this, forgive the digression.

## **First Test**

We want to test whether the user object validation will accept a trivial password.

Create a stanza as follows:

```js
describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    // expect() statement needed to
  });
});
```

If the schema is working right, the test should return an error, and the error should flag the fact that the password is inadequate.  The `error` returned should have a array of `detail` objects , each having a `context`, and there should be one with a key of `password`.  So we can modify the above code to read:

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
This test will report a failure in two cases.  First, the error might be returned, but without a detail.context with a key of password.  In this case, the matcher flags a test failure.  The second failure case is that the validation call found no problems with the object, and returned a value instead of an error.  In this case, the reference to `error.details` throws an error, because `error` would be null.  In either case, no further statements within the it() block run, and we get the result we need: a test failure is reported.  If there are other `it()` blocks within the `describe()` or elsewhere in the file, they'll still run in either case.

### **Style Requirements**

In creating your tests, follow these guidelines.

1. Do only one `expect()` within each `it()` block.  Note that you could have objects that are used within multiple `it()` blocks, provided that they are declared in a way that keeps them in scope.  Test cases are not always written this way, but if you have multiple expect() statements in one test, the test report may not show all the reasons for the failure.

2. Number the `it()` statement with the number of the test case, followed by a period.  The test case spec will give the numbers you should use.

These requirements are to allow the TDD to work, so that you and your assignment reviewers can know if your work is correct.

Now, run `npm run test`.  The test should succeed.

## **More Validation Tests**

Create the following additional tests within the first describe() block, each in its own it() block:

2. The user schema requires that an email be specified.

3. The user schema does not accept an invalid email.

4. The user schema requires a password.

5. The user schema requires name.

6. The name must be valid (3 to 30 characters).

7. If validation is performed on a valid user object, error comes back falsy.

Create another describe stanza for taskSchema, with the following tests:

8. The task schema requires a title.

9. If an `isCompleted` value is specified, it must be valid.

10. If an `isCompleted` value is not specified but the rest of the object is valid, a default of `false` is provided by validation.

11. If `isCompleted` in the provided object has the value `true`, it remains `true` after validation.

Create another describe() stanza for the patchTaskSchema.

12. The patchTaskSchema does not require a title.

13. If no value is provided for `isCompleted` this remains undefined in the returned value.

Do another `npm run test`.  All tests should succeed.  If a test fails, the error might be in the code you are testing, and it might be in the test.

### **Testing the Tests**

Some automated tests of your tests are provided.  You can run these now, with the following command:

```bash
npm run lesson9TDD
```

When you run the tests of the tests, it causes "mocks" of the application code to be run.  The mocks implement all the same function, but with some intentionally introduced bugs.  Your tests should identify these bugs.  This is in no way a complete test of your tests.

### **Check for Understanding**

What other validation errors might occur that wouldn't be caught by these tests?

## **Controller Testing for the Task Controller**

Next, you need to test `controllers/taskController.js`.  When you test a controller, the controller actually reads from and writes to the database.  Therefore, you have to be careful about two things:

1. You only access the test database.

2. You set the database to a known state before testing.  We are just going to delete everything, but it is more common to populate it with known data.

3. You consider **concurrency issues.**  By default, several jest test files may be run concurrently.  If each of them changes the test database, there will be conflicts and flaky test failures.  In your configuration, this won't happen, because you are starting the test with `maxWorkers=1`, so there is no concurrency.  However, this slows the test process, so it is not a good idea if there are lots of tests.  To avoid concurrency issues, you ensure that each test file only reads or writes to a subset of the database.  For this project, you could use different sets of user and task entries for each test file.

Within your test folder, create a file called `taskController.test.js`.  This should start as follows:

```js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { createUser } = require("../services/userService");
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

The call to `dotenv` is needed to get the database URLs.  But **before** you load the Prisma client, and **before** you load any code that loads the Prisma client, you have to set the environmnet variable to point to the test database.  

There is a confusing point about the dotenv `config()` call.  The `.env` file is in the root of the project, but this file is not.  The dotenv package resolves the path using the current working directory, not the location of the current file.  You run jest from the root of the project, so that is always the current working directory.

You use the `createUser()` function from your user service.  You use this to create the user records you need in the database, because if you call the Prisma client directly, the password is not hashed.

Jest provides a number of useful hooks:

- beforeAll
- beforeEach
- afterAll
- afterEach

You could specify these outside any `describe()` stanza, in which case they apply to the top level stanzas.  You could also specify these inside a `describe()` stanza, in which case they apply to the stanzas inside that `describe()` block. In this case, the `beforeAll()` hook will be used to empty the database and to create the user records needed.  The next part of the test file looks like this:

```js
beforeAll(async () => {
  // clear database
  const prisma = new PrismaClient();
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await createUser({
    email: "bob@sample.com",
    password: "Pa$$word20",
    name: "Bob",
  });
  user2 = await createUser({
    email: "alice@sample.com",
    password: "Pa$$word20",
    name: "Alice",
  });
  prisma.$disconnect();
});
```

Clearly you would not want to do this step unless you are pointing to the test database.  When you pass a function to `beforeAll()` or `it()` or other jest functions, you can declare it as async so that you can use await.  It is important to do the prisma.$disconnect().  If not, Jest may not terminate cleanly, and you might have a zombie process.

Why do we need the user records? Each task record has a foreign key, the userId.  If this is not provided or if it doesn't correspond to a real user record, you get a constraint violation from the database.

There are some special issues when testing route handlers and middleware functions.  They take the parameters `req`, `res`, and sometimes `next`.  For the req and res, we use the `node-http-mocks` package.  You can configure the mock req object with the content you are testing: body, query parameters, headers, path parameters, whatever.  Then you call the function to be tested, to see if the result is as you expect.

A route hander or middleware function migth do the following:

- Call res.send() or res.json() to send a reply.
- Call next().
- Throw an error.
- None of the above.  If a route handler or middleware function doesn't do any of these, it is ill behaved, and your test should catch this.

To know what happened, you have to call the function and check what is returned.  The function might be async.  Or, it might do the res.json() or the call to next() from within a callback.  Your test needs to call the function, and wait for the completion.  When the completion within a callback, or if the code to be tested calls next(), that's a little tricky.  If it's your job to write the tests, you may have no access to the source code of the function.  If your team uses test first development, that source code might not even be written yet.  

You should use the following utility function:

```js
const waitForRouteHandlerCompletion = async (func, req, res) => {
  let next;
  const promise = new Promise((resolve) => {
    next = jest.fn(() => resolve());
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

Create a file in your /node-homework/test directory called waitForRouteHandlerCompletion.js, with the code above.  You'll call this function from several of the tests you create.  You are about to test the create() function of the task controller. You use the utility routine as follows as follows:

```js
const next = await waitForRouteHandlerCompletion(create, req, res);
```

Let's explain this.  The utility function creates a promise that is resolved by either of two things: `create()` sends the response in the res, or `create()` calls next().  The next() function is built by the jest.fn() call.  When the next() is created, a callback is passed.  That callback is called if create() calls next(). Res objects post a "finish" event when the response is sent, so the utility function resolves the promise if that happens. (Sometimes you listen for the "finish" event in product code too.)  Then the utility function awaits the create().  Then the utility function awaits the promise.  And then it returns the next().  If the create() throws an error, the waitForRouteHandlerCompletion() throws that error, and you can catch it in your test or let Jest catch it.  The other nice thing about a function created with jest.fn() is you can find out if it has been called, like so:

```js
expect(next).toHaveBeenCalled()
```

When you test middleware functions, you can see if they called next().  You can also get the parameters next() was called with, in case the tested function calls the error handler.  If no exception is thrown, and if next() has not been called, then you know that res contains your finished result after await waitForRouteHandlerCompletion(), and you can do expect() assertions on it.  If the function you are testing is ill-behaved, the promise might not resolve, and then Jest times out, so your test identifies the problem.

You don't have to understand this fully.  Just use this utility in your tests.  You'll need to add a require() statement for it.

### **The First Test**

We want to call the task controller `create` method.  That method takes two parameters, the `req` and the `res`.  We need to simulate those.  To that end, we have the `node-http-mocks` package.  

Our first test looks like this:

```js
describe("testing task creation", () => {
  it("14. create a task", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter}); // be sure you create the event emitter
    await waitForRouteHandlerCompletion(create,req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
})
```

OK, all looks good.  This is a valid task object for creation.  So, run the test.  Whoa! That failed.  Have a look at the log to figure out why.  What do you see?  Ah, of course, `req.user` is not set!  In the app, task creation is behind the jwt middleware, and that is what sets up req.user.  We aren't going through that route when the controller is invoked directly.  So, we still have a valid test, but we need to rename it and catch the error, as follows:

```js
   it("14. cant create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.httpMocks.createResponse({eventEmitter: EventEmitter});;
    try {
      await waitForRouteHandlerCompletion(create,req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
```

Now run the test again.  Ah, that's better! But, the test case still isn't right.  If the error is not thrown, the test case would not identify the problem.  You definitely want the error to be thrown, and the test should make sure that it is.  This is done with the `expect.assertions(1)` method.  In this case, we expect that one assertion, meaning one expect() statement, will be satisfied, and we want the test to fail if that doesn't happen.  So, add that statement.  It should be before your try block.

## **More Tests of the Tasks Controller**

Now you know that for the create() call to succeed, you need to have `req.user = { id: user1.id }`.  

Create more controller tests:

15. You can't create a task with a bogus user id.

In this case, you trigger a database constraint violation, because the foreign key is invalid.  The error thrown has a name of `PrismaClientKnownRequestError`.

16. If you have a valid user id, create() succeeds (res.statusCode should be 201).

The res object you create for test 16 should be saved in saveRes, so that you can do subsequent tests on what is stored.

17. The object returned from the create() call has the expected title.  

To do this, you need to do `saveData = saveRes._getJSONData()`.  Then you can test what saveData contains.

18. The object has the right value for `isCompleted`.

19. The object does not have any value for userId.

Save the id value from the object in saveTaskId.  You'll need it below.

**Note: You should not use the same res object for multiple controller calls, because there will be unwanted state preserved inside of the res.  Create a new one when you need to call the controller again.**

Create a new describe stanza called "test getting created tasks" and test the following.

20. You can't get a list of tasks without a user id.

21. If you use user1's id, the call returns a 200 status.

22. The returned JSON array has length 1.

23. The title in the first array object is as expected.

24. The first array object does not contain a userId.

25. If you get the list of tasks using the userId from user2, you get a 404.  

(This is a security test for access control!  You do not want Alice to access Bob's data!)

26. You can retrieve the created object using show().

Hint: You have to set req.params.  You want req.params.id to be a string representation of saveTaskId: req.params = { id: saveTaskId.toString() }

27. User2 can't retrieve this task entry. 

(Why test this? We don't use this operation in the app -- but we have to test it, as it could be a back door.)

Create another stanza for testing the update and delete of tasks.

28. User1 can set the task corresponding to saveTaskId to `isCompleted: true`.

29. User2 can't do this.

30. User2 can't delete this task.

31. User1 can delete this task.

32. Retrieving user1's tasks now returns a 404.

Lots of tests, eh?  A complicated project will often have a test suite of thousands of test cases.  This example is to show you all the things you need to test in a typical test suite.

Run the tests, and make sure all of them pass.

## **Tests of the User Controller**

Because of the length of this assignment, the user.controller.test.js file is **optional**.  Be sure you do implement the network testing that follows this section.

We want to test logon.  But, we have a problem.  The login method sets a cookie.  If that cookie is not set, things aren't working, so we have to test this.  The first problem is that a res object returned by `httpMocks.createResponse()` doesn't keep track of cookies. So, we create an enhanced version of the mock res object.  This one, created by MockRequestWithCookies, keeps track of 'Set-Cookie' operations.

Create another file in the test directory called `user.controller.test.js`.  This should start:

```js
require("dotenv").config();
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const { PrismaClient } = require("@prisma/client");
const { createUser } = require("../services/userService");
const httpMocks = require("node-mocks-http");
const { register, logoff } = require("../controllers/userController");
const { logonRouteHandler, jwtMiddleware } = require("../passport/passport")

// a few useful globals
let saveRes = null;
let saveData = null;

const cookie = require("cookie");
function MockResponseWithCookies({eventEmitter: EventEmitter}) {
  const res = httpMocks.createResponse();
  res.cookie = (name, value, options = {}) => { // this adds the function to the res, so that it stores cookies
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
  const prisma = new PrismaClient();
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  await createUser({
    email: "bob@sample.com",
    password: "Pa$$word20",
    name: "Bob",
  });
  prisma.$disconnect();
});
let jwtCookie;
```

Now you can create the logon test:

```js
describe("testing logon, register, and logoff", () => {
  it("33. The user can be logged on", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logonRouteHandler, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });
})
```

One can now add some subsequent tests, without sending another request.  These tests just check the data and cookies.  The response header set by the request is obtained via:

```js
const setCookieArray = saveRes.get("Set-Cookie")
```

Add the following tests:  

35. A string in that array starts with "jwt=".

36. That string contains "HttpOnly;".  (This is a security test!)

37. The returned data has the expected name.

38. The returned data contains a csrfToken.

39. A logon attempt with a bad password returns a 401.

40. You can't register with an email address that is already registered.

41. You can register an additional user.

42. You can logon as that new user.

43. You can now logoff.

45. The logoff clears the cookie.

61. jwtMiddleware Returns a 401 if the JWT cookie is not present in the req.

62. Returns a 401 if the JWT is invalid.

Hint: Create a signed JWT cookie, but sign it with a bogus secret.  Put that in req.cookies.jwt.

63. Returns a 401 if the JWT is valid but the token isn't.

Hint: req.cookies.jwt should have a JWT cookie with a csrfToken in the payload (any string).  Put an X-CSRF-TOKEN header in the req, but use a different string.

64. Calls next() if both the token and the jwt are good.

65. If both the token and the jwt are good, req.user.id has the appropriate value.

Hint: The jwt payload has to have id: 5, or some other integer, and req.user.id should have the same integer.

For the last test above, when you retrieve the setCookieArray from saveRes, it should contain a string starting with "jwt=", and that string should contain "Jan 1970".  Cookies are cleared by setting the expiration date to some time in the past.

If you have done this optional part of the assignment, verify that "npm run test" runs all these tests successfully.

## **Testing Actual Network Operations**

At some point, you need test real network requests. For this, we use supertest.  Create another file in the test directory called `user.function.test.js`.  This is to call the user functions.  You have the following line in app.js.

```js
module.exports = { app, server }; 
```

This was for supertest, so that your tdd would work, but you use those exports now.

The new test file should start out as follows:

```js
require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
let agent;
let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  const prisma = new PrismaClient();
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  prisma.$disconnect();
  agent = request.agent(app);
});

afterAll(async () => {
  server.close();
});
```

Let's explain this code.  As usual, we load the environment variables we need, and make sure we are pointing to the test database from the start.  We are using cookie based security, so we have to keep track of the cookies.  Fortunately, the supertest agent does that for us.  We configure the agent with the app so that the actual operations can be sent to the app.  As usual, we clean the database.

**It is very important to stop the server at the end of the test.**  If this doesn't occur, your app could be left as a zombie process, and that's a mess.  That's why the server value is exported from your app.

Now for the first test of this type:

```js
describe("register a user ", () => {
  let res = null // we'll declare this out here, so that we can reference it in several tests
  it("46. it creates the user entry", async () => {
describe("register a user ", () => {
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

We are using a particular async/await style here, which is what I recommend.  You can instead do things like:

```js
it('should access a restricted page after sign-in', function (done) {
    agent
        .get('/tasks')
        .expect(200) // Expect a successful response after authentication
        .end(done);
});
```

But, that's old style: not recommended!

After the await for the agent completes, you get a res object.  This differs a little from the mock res for the controller tests.  You have:

- res.body: the body of the response.
- res.status: the status code returned.
- res.headers: An object with headers, if any.  You could get res.headers["set-cookie"], which may or may not be defined.  If it is defined, it is an array of the set-cookie strings.

Run this test to make sure it works.  You can run this individual test as follows: 

```bash
npx jest test/user.function.test.js
```

Then, add the following additional tests:

47. Registration returns an object with the expected name.  In this case, that's in saveRes.body.

48. Test that the returned object includes a csrfToken.

49. You can logon as the newly registered user.

50. You can logoff.

Hint: The logoff route is protected.  What do you need to put in the request header?  Where can you get the needed value? Why didn't you have to do this for the controller test?

Then verify that all your tests run without error.  If you want to run just this test, you can do:

```bash
NODE_ENV=test npx jest test/user.function.test.js
```

Also, run the TDD (test of the tests) command, if you haven't recently, to see if it identifies any problems with your tests.

## **On Making Tests Comprehensive**

As you go further up the stack, your tests don't have to be quite as granular.  When you create your controller function tests, you don't have to test all the ways that a task or user object might not pass validation, because your validation tests handle that.  But, you probably ought to test at least one way in which the validation should fail, so that you know that the validation is actually being performed.  Similarly, when you test the actual network tests with supertest, you don't have to test all the things that the controller unit tests do.  On the other hand, it is very important to have comprehensive unit tests.  In theory, you could test every case with supertest -- but then someone would have to analyze **why** the test failed, and **where** in the whole stack the actual bug resides.

You can check code coverage as follows:

```bash
NODE_ENV=test npx jest --testPathPatterns=test/ --verbose --maxWorkers=1 --coverage
```

How far did you get towards 100%?

If your code is robust, it will handle lots of unlikely errors in data or requests or race conditions or the like.  However, some of these conditions may be hard to duplicate in test -- so a test suite with 100% code coverage is rarely achieved.

Even when you do have comprehensive code coverage, the tests may be, and this case definitely are, inadequate to test every failure mode.

### **Check For Understanding**

1. You shouldn't be able to logoff if you are already logged off.  Why?  Do you need a test for this?

2. Suppose you want to write a function test for task operations using supertest.  How would you go about it?

3. How do you know if you have enough supertest cases?

4. Give one example of a kind of security test that was not covered in this assignment.

### **Answers**

1. Logoff is a post operation that could be triggered by cross site request forgery.  A test is needed to verify that this protection is in place. I don't know why an attacker would bother to trigger a logoff, but it is best practice to avoid the attack.

2. To do a task operations functional test, one would first check that none of the task operations can be performed without being logged on.  Then, one would do a logon.  Then, one would check that none of the task operations that change data, those being POST, PATCH, and DELETE, can be done without a CSRF token.  Then, each of the task operations: POST /tasks, PATCH /task/:id, GET /tasks, GET /tasks/:id, and DELETE /tasks/:id, should be tested for correct responses.  One should also check that PATCH, GET, and DELETE operations don't give access to data that doesn't belong to the currently logged on user.  This is the minimum, but might suffice if there are adequate unit tests.

3. The short answer is, you can never know for sure that you have enough supertest cases, but every operation that a user might reasonably perform should be tested.  Also, for security, every known attack angle that an attacker might use should be tested.

4. One kind of attack is to try to put cross site scripting sequences into the stored data.  The back end is not vulnerable to cross site scripting, because it isn't running in a browser.  The risk is that an attacker could insert hostile scripts into data stored by the back end that the front end subsequently displays.  The sanitizer package included in the app is intended to protect against this, but there should be a test case that it is actually present and working.

## **Code Coverage**

## **Runnng the Test of the Tests**

To be done.  Not sure if I'll really do this.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment11` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment9` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
