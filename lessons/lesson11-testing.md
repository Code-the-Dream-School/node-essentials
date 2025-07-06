# **Lesson 11 — Automated Testing**

## **Lesson Overview**

**Learning objective**: Students will learn what automated testing of software is, how it is used in typical development processes, and why they should learn to write automated tests.  Students will learn the basic concepts of automated software testing.  They will then learn how to write tests of Express applications using the jest and supertest packages.

**Topics**:

1. Introduction to Automated Software Testing.
2. Why You Should Learn to Write Automated Tests.
3. Concepts in Automated Software Testing.
4. The `jest` and `supertest` Packages.

## **11.1 Introduction to Automated Software Testing**

Until this point in the course, you have been doing two kinds of testing.  Automated testing is provided to you in your node-homework repository.  This assists you by allowing you to do test driven development, letting you know what you must develop and, more or less, whether it is working properly. You have also been doing manual testing of your REST APIs using Postman.  Now you will learn how to write tests.

## **11.2 Why You Should Learn to Write Automated Tests**

The ability to write automated tests is a required development skill.  Manual testing for any complicated project is slow and error prone.  For this reason, it is not possible to have reliable continuous integration without automated testing.

In some cases, your starting role in a job may be to write such tests.  In some development shops, the test cases are written first, according to the project specification.  The developers then write code that can pass the test.  In many cases, if you submit a PR to add or change code, you must also submit a test case for the change.  In shops with test driven development, if a bug is found, that means that there was an error in the product code, but also a behavior that was not tested, so both the production code and the test cases must be fixed.  Even in shops with test driven development, developers may need to provide additional tests with their code.  Automated tests are then included in the continuous integration pipeline, for example as part of the Github configuration for the project, so that a PR may be blocked if it does not complete an automated regression test.  The deployment process may also be blocked until comprehensive automated tests are completed.

Good testing includes both test cases written by someone who is not the developer of the code to be tested **and** code written by the developer.  The developer may understand some possible failure conditions not known to the testerr, but developers often miss things that a test case developer finds.  Good testing also must include security testing.

How can you know if the testing is comprehensive?  One way is to measure the code coverage of the test suite.  If some code is not run during the test, it may be dead code, in which case it doesn't belong in the project, but if not, that code path has not been tested, and may contain bugs.  One should strive for 100% code coverage.  Even if you do have 100% code coverage, there may be bugs that the test doesn't find, because the possible modes of failure were not all checked.  There may also be race conditions that only occur when the application is under significant load, or that are caused by data size or unexpected data content.  There are packages such as `@faker-js/faker` that can provide simulated data in volume.  For some kinds of functions, such as math or logic oriented functions, one can do mutation testing with a package such as Stryker.  Stryker returns failures in various combinations, in an effort to explore different failure modes, so as to identify missed test cases.

## **11.3 Concepts in Automated Software Testing**

Read [this summary of the concepts](https://www.functionize.com/automated-testing).

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

   - As the code is written.  These may be provided ahead of time, if the shop uses a test driven development approach, but the developer of the project code will write and run additional tests.
   - As the code is submitted for a PR.  The continuous integration process may block the PR until the test case passes.
   - As the PR is reviewed.  The reviewer will check to see that the provided tests are adequate and that they pass.
   - As the change is integrated into the product code.
   - Security tests will be included in test suites, but third party testing tools may also be run to evaluate code security.  These include "black box" tests, which probe the running software for security holes, and "white box" tests, that scan the source code for security problems.
   - Before deployment.
   - Basic tests will also occur after deployment, to validate the deployment process itself.

## **11.4 The `jest` and `supertest` Packages**

Depending on the languages and frameworks used by the project, different testing packages may be used.  You are developing in JavaScript, React, and Express.  The `jest` package is commonly used for this kind of project.  

A Jest test invokes product code in various ways, typically by requiring the module that contains the function to be tested and then invoking that function.  The `expect()` function is used to evaluate whether the correct result is returned.  Test cases may be grouped using the `describe()` afunction, which may group invocations to the `it()` or `test()` methods.  Each of these tests and groups is given a title, so that it is evident what has been tested or what failed.  Test cases can fail two ways: An `expect()` assertion may fail, or an error may be thrown.  If an assertion fails, the test will still proceed to check other assertions, but if an error is thrown, that ends the processing for that test.  Jest can also test a React front end, to see that user interaction with that front end gives the desired results.  We won't do front end testing for this assignment.

For function testing of a web API, one must also send real network requests.  To do so, `supertest` may be used.  The Express application is started, and REST requests are sent as they would be by an application front end in production.

### **Testing Your Tests**

Test Driven Development tests are provided for the assignment.  How do we do that?  First, we require that you only do one expect() per test case.  This is a limitation to facilitate TDD -- you wouldn't necessarily do that for all test cases.  Second, we provide `mocks`.  Mocks are fake versions of the code that you write.  These are written to return incorrect results that your tests should find.  Third, `jest` has a reporter function.  We provide an interceptor for that, so that we can tell if your test reports a success when it should not.  The TDD won't catch every omission in your test suite, but it will get you started.
