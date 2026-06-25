# Lesson/Assignment 9: Automated Testing

## Why Automated Testing

A production app or program may have thousands of lines of code.  That’s thousands of behaviors to test.
Each test has to be repeated every time a feature is added or a bug is fixed, to know that the added feature works, but also to know that it doesn’t break what was there before.

You will write test cases in your job.  Note that AI can help you with this … with the usual limitations.  The AI does not really understand code intent, and may create test cases that blithely pass when the code is faulty.
See https://spectrum.ieee.org/ai-coding-degrades for some cautionary tales.

## The Tools We Use in This Class

Jest runs the test, and provides the implementation of various assertions (expect statements) to let you know if you got the right result.

Supertest combines with Jest.  It adds the ability to send actual REST requests to your app, to see whether they are handled correctly.

The next course cohort will see some changes.  We are using CJS modules.  The future is ESM for Node programs, meaning you use “include” instead of “require”, but meaning also that modules have a different internal structure.  Jest is clumsy to use with ESM – ESM support is currently experimental in Jest – so the next course cohort will use Vitest.

## Unit Tests are Simple to Write When …

1. You call the function and check the return value.  
2. There is no change to global state, so you don’t have to worry about side effects.
3. The arguments and return values are simple types or simple objects.

## Request Handlers and Middleware are Harder to Test

1. The return value has no meaning.  You are instead testing changes to global state:
    - changes to the database
    - the result code
    - the returned body
    - the headers

2. The operation may not be complete when the function returns, because there may be callbacks in the code.

3. The parameters (res, req, next) are complicated objects.

## Understand This Helper Function

```js
const waitForRouteHandlerCompletion = async (func, req, res) => {
  let next;
  const promise = new Promise((resolve, reject) => {
    next = jest.fn((error) => {
      if (error) reject(error);
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

## Key Points about this Helper

- We have to await the route handler or middleware, as it is probably asynchronous.
- We have to provide a next() function.  We use jest.fn() to create that, because Jest keeps track of whether next() is called, and what parameters next() is called with.  
- We have to use a promise to report completion, because the route handler or middleware might call next() or  res.json() within a callback.
- We have to know when to resolve the promise. We provide an event handler, so that when the res.json() occurs, we can receive an event and resolve the promise.  For middleware, if next() is called, we resolve the promise.  But if next(error) is called, we reject the promise.

Any idea why we return next? Answer: Because next was created using jest.fn(), we can check if it was called with expect(next).toHaveBeenCalled().  This is useful for testing middleware.  You can also check which parameters were passed.

## Other Somewhat Tricky Stuff

- node-mocks-http to create mock req and res objects
- Addition of cookie handling to the mock res object
- Pointing at the test database, not dev or production.  Note that we use a single Prisma client, which is shared with the app.
- before hooks to clean up the database and initialize data
- after hooks to shut things down correctly
- For supertest, a request agent to connect to the app, route the actual HTTP operations, and keep state such as cookies.

Any question about any of these?