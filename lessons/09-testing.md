# **Lesson 9 — Automated Testing**

## **Lesson Overview**

**Learning objective**: By the end of this lesson, you should understand what automated testing is, why developers use it, and why writing tests is an important professional skill. You will also learn the basic ideas behind automated testing and how to write Express application tests with the `jest` and `supertest` packages.

**Topics**:

1. Introduction to Automated Software Testing.
2. Why You Should Learn to Write Automated Tests.
3. Concepts in Automated Software Testing.
4. The `jest` and `supertest` Packages.

## **9.1 Introduction to Automated Software Testing**

When software is provided to a customer or end user, there is an implied promise:

- The results returned by the software are correct.
- The software stores information as needed and does not lose the data it stores.
- The software is secure, and does not divulge sensitive information.
- The software will not be broken as it is maintained or enhanced.
- The software is robust and does not fail under normal use, or even under hostile attack.

Testing helps you keep that promise.

Until this point in the course, you have used two kinds of testing. First, the `node-homework` repository provides automated tests. Those tests support test driven development by showing what you need to build and whether it is mostly working. Second, you have manually tested REST APIs with Postman.

Now you will learn how to write tests yourself.

## **9.2 Why You Should Learn to Write Automated Tests**

Writing automated tests is a required development skill. Manual testing becomes slow and error-prone as projects grow. Reliable continuous integration depends on automated testing.

In some jobs, your first development work may involve writing tests. Some teams write test cases before product code, based on the project specification. Developers then write code that passes those tests. In many teams, if you submit a PR that adds or changes behavior, you also need to submit a test for that change.

In test driven development, a bug usually means two things: the product code has an error, and the behavior was not covered by a test. Both the product code and the tests need to be fixed. Automated tests are also included in continuous integration pipelines, such as GitHub checks. A PR may be blocked until the automated regression tests pass. Deployment can also be blocked until the test suite passes.

Good testing includes tests written by someone other than the developer **and** tests written by the developer. The developer may understand failure cases that an outside tester does not know about. At the same time, developers often miss cases that another tester catches.

Good testing also includes security testing. Test suites can include security tests, and teams may also run third-party security tools. These include "black box" tests, which probe running software for security holes, and "white box" tests, which scan source code for security problems.

How can you know whether testing is comprehensive? One tool is code coverage. Code coverage tells you which code ran during the test suite. If some code does not run during tests, it may be dead code. If it is not dead code, then that path has not been tested and may contain bugs.

Strive for 100% code coverage. Even with 100% coverage, bugs can still exist because the tests may not check every failure mode. Some bugs only appear under heavy load, with large data sets, or with unexpected data content. Packages such as `@faker-js/faker` can generate large amounts of simulated data. For some math or logic-heavy functions, teams may use mutation testing with a package such as Stryker. Stryker changes behavior in different ways to help identify missing test cases.

## **9.3 Concepts in Automated Software Testing**

Read [this summary of the concepts](https://www.functionize.com/automated-testing). Here are the key terms you need for this assignment:

- **Unit test**: Tests one small piece of code, such as a validation schema or helper function. In Assignment 9, your validation tests are unit tests.
- **Integration test**: Tests how multiple pieces work together. A controller test that uses Prisma and the test database is closer to an integration test because it checks the controller and database behavior together.
- **End-to-end test**: Tests a full user flow through the app, usually from the outside. In a full-stack app, this might involve the browser, front end, back end, and database.
- **API or functional test**: Sends real HTTP requests to your Express app and checks the response. In Assignment 9, your Supertest tests are API tests.
- **Regression test**: Protects against a bug coming back. When a bug is fixed, teams often add a test for that exact behavior.
- **Mock**: A fake version of code or data used during a test. Mocks help you test one part of the system without depending on every real dependency.
- **Code coverage**: A measurement of which lines or branches of your code ran during the test suite. High coverage is useful, but it does not guarantee that every possible bug has been tested.

In this assignment, you will start with focused unit tests for validation. Then you will test controller functions with mock request and response objects. Finally, you will use Supertest to send real HTTP requests to your Express app.

### **Check for Understanding**

1. During the software development process, what are different times when a test will be developed or modified?

2. During the software development process, when will test cases be run?  (Hint: There are more instances to list than have been discussed so far in the lesson.)

3. What are the different kinds/levels of automated testing?


### ***Answers***

1. Tests will be developed or modified at the following times:

   - If the development shop has a test driven development methodology, the tests may be written before any code is written.
   - Test cases will be written for every implementation of function and for every functional addition or change to the product.
   - Test cases will be written or modified whenever a bug is found that had been missed by previous tests.
   - A project owner or customer may also write user acceptance tests.

2. Test cases will be run:

   - As the code is written.  These may be provided ahead of time, if the shop uses a test driven development approach, but each developer of the product code will also write and run additional tests, especially unit tests.
   - As the code is submitted for a PR.  The continuous integration process may block the PR until tests pass.
   - As the PR is reviewed.  The reviewer will check to see that the provided tests are adequate and that they pass.
   - As the change is integrated into the product code.
   - Before each deployment.
   - After each deployment, to validate the deployment process itself.  These will be more limited tests.

## **9.4 The `jest` and `supertest` Packages**

Different projects use different testing packages depending on the language and framework. You are using JavaScript, React, and Express. The `jest` package [here](https://www.npmjs.com/package/jest) is commonly used for this kind of project.

A Jest test runs product code and checks the result. For a plain function, the test usually imports the module that contains the function, calls the function, and then uses `expect()` to check the returned value.

Tests can be grouped with `describe()`. Individual test cases use `it()` or `test()`. Each group and test gets a title, which helps you see what passed or failed. A test can fail when an `expect()` assertion fails or when an error is thrown. Either way, Jest stops that test and moves on to the next one.

Jest can also test React front ends, but this assignment focuses on back end testing. A Jest test file should end with `.test.js`, and might look something like this:

```js
const {fnA, fnB} = require("../codeFolder/someModule"); // The module to test

describe("Tests for someModule", ()=>{
   it("should return false when fnA is passed 'thisValue'", () => {
      expect(fnA("thisValue")).toBe(false);
   });
   it("should return an object with {name: `Lakshmi`,isEnrolled: { boolean }} when fnB is called, with no error", async () => {
      const retValue = await fnB(437);
      expect(retValue.name).toBe("Lakshmi");
      expect(retValue.error).not.toBeDefined();
      expect(typeof retValue.isEnrolled).toBe('boolean');
   });
});
```

In the example above, `toBe()`, `toBeDefined`, and `toEqual()` are matchers. Matchers are Jest methods that check expected values. Jest documents them [here](https://jestjs.io/docs/expect). Some common matchers are:

- `toBe()` Equality, but only for primitive types, not for objects.
- `toEqual()` Equality for objects.  All values of the attributes and the class, if any, must match.
- `toMatchObject()` A partial match.  The included values must match, but the object tested may have other attributes.
- `toBeDefined()`
- `toBeInstanceOf()`
- `toBeTruthy()`
- `toBeNull()`
- `toBeLessThan()`

In the test for `fnB` above, the check for `retValue.name` could throw an error if `retValue` is null. Or the `expect()` for `retValue.name` could fail. In either case, that test reports a failure, and later statements in that same test do not run. Other tests in the file still run.

The homework will also cover `expect.assertions()`.

To test a web API, you also need to send HTTP requests. The `supertest` package [here](https://www.npmjs.com/package/supertest) helps with this. Supertest can send requests to your Express application as if they came from a front end. You do this inside a Jest `it()` statement, then use `expect()` statements to check the response.

Here is a small Supertest example. This assumes your `app.js` exports `app` and `server`, which lets the test send requests to the Express app and close the server afterward:

```js
const request = require("supertest");
const { app, server } = require("../app");

afterAll(() => {
  server.close();
});

describe("GET /", () => {
  it("returns a successful response", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
  });
});
```

The important idea is that Supertest gives you a `res` object. You can check `res.status`, `res.body`, and `res.headers`. In Assignment 9, you will also use a Supertest agent so cookies are saved across requests, which matters for login and protected routes.

### **Testing Your Tests**

Test Driven Development tests are provided for the assignment. Here is how that works.

First, we require only one `expect()` per test case. This is a limitation for the assignment so the TDD checks can evaluate your tests more easily. In real projects, you may sometimes use more than one assertion in a test.

Second, we provide `mocks`. Mocks are fake versions of code that stand in for the project code you write. These mocks intentionally return incorrect results that your tests should catch.

Third, Jest has a reporter function. We provide an interceptor for that reporter, so we can tell if your test reports success when it should not. The TDD checks will not catch every missing test case, but they will help you get started.
