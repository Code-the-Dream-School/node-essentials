# TDD Testing Guide

This guide explains how to run the Test-Driven Development (TDD) tests for each assignment and how to read and understand the test files in the `tdd/` folder.

## What are TDD Tests?

The TDD (Test-Driven Development) tests are automated tests provided by the course to verify that your assignment solutions are correct. These tests are located in the `tdd/` folder and check that your code:

- Produces the correct output
- Follows the specified requirements
- Handles edge cases properly
- Uses the correct file structure and naming conventions

**Important**: These tests are different from the tests you'll write in Assignment 9. The TDD tests are provided by the course to validate your work. In Assignment 9, you'll write your own tests.

---

## Running TDD Tests

### General Command Format

Most assignments use the following command format:

```bash
npm run tdd assignmentX
```

Replace `X` with the assignment number (e.g., `assignment1`, `assignment2`, etc.).

### Running Tests for Specific Assignments

#### **Assignment 1** (Node.js Fundamentals)
```bash
npm run tdd assignment1
```
Tests verify:
- `globals-demo.js` outputs correct global variables
- `async-demo.js` demonstrates async patterns correctly
- `core-modules-demo.js` uses Node.js core modules properly

#### **Assignment 2** (Events, HTTP, Express)
```bash
npm run tdd assignment2
```
Tests verify:
- Event emitter and listener functionality
- HTTP server endpoints
- Express application setup

#### **Assignment 3** (Middleware)
```bash
npm run tdd assignment3a    # For first part
npm run tdd assignment3b    # For second part
npm run tdd assignment3     # For complete assignment
```
Tests verify:
- Route handlers work correctly
- Middleware is properly implemented
- Error handling functions correctly

#### **Assignment 4** (Tasks and Validations)
```bash
npm run tdd assignment4
```
Tests verify:
- User registration, login, and logoff
- Task CRUD operations
- Validation schemas work correctly

#### **Assignment 5** (SQL Introduction)
```bash
npm run tdd assignment5
```
Tests verify:
- SQL queries are correctly formatted
- Database concepts are understood

#### **Assignment 6** (PostgreSQL and Prisma)
```bash
npm run tdd assignment6a    # For PostgreSQL part
npm run tdd assignment6b    # For Prisma part
```
Tests verify:
- Database connections work
- Database queries execute correctly
- Prisma setup and migrations

#### **Assignment 7** (Prisma Advanced)
```bash
npm run tdd assignment7
```
Tests verify:
- Advanced Prisma queries
- Database relationships
- Analytics endpoints

#### **Assignment 8** (Authentication)
```bash
npm run tdd assignment8
```
Tests verify:
- JWT authentication works
- Protected routes are secured
- User authentication flow

#### **Assignment 9** (Testing)
```bash
npm run lesson9TDD
```
**Note**: Assignment 9 is different! This command runs tests that validate *your own test files*. It uses mock versions of your code with intentional bugs to check if your tests catch them.

#### **Assignment 10** (Deployment)
```bash
npm run tdd assignment10
```
Tests verify:
- Deployment configuration
- Environment variables
- Production-ready code

---

## Understanding Test Results

### Successful Test Run

When all tests pass, you'll see output like:

```
PASS  tdd/assignment1.test.js
  Week 1 Assignment Solution Tests
    ✓ globals-demo.js outputs correct globals (245 ms)
    ✓ async-demo.js demonstrates async patterns (312 ms)
    ✓ core-modules-demo.js uses os, path, fs.promises, and streams (278 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Failed Test Run

When tests fail, you'll see detailed error messages:

```
FAIL  tdd/assignment1.test.js
  Week 1 Assignment Solution Tests
    ✕ globals-demo.js outputs correct globals (123 ms)
    
    Expected: contain "__dirname: /path/to/assignment1"
    Received: "__dirname: /wrong/path"
    
    Difference: Expected substring: "__dirname: /path/to/assignment1"
```

**What to do when tests fail:**

1. **Read the error message carefully** - It tells you exactly what was expected vs. what was received
2. **Check file paths** - Ensure your files are in the correct directory
3. **Verify output formatting** - Tests are sensitive to exact spacing, capitalization, and punctuation
4. **Check console.log statements** - Make sure your output matches the expected format exactly

---

## How to Read TDD Test Files

The TDD test files are located in the `tdd/` folder. Let's learn how to read and understand them.

### Test File Structure

TDD test files use **Jest** testing framework. Here's the basic structure:

```javascript
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

describe('Assignment X: Description', () => {
  const assignmentDir = path.join(__dirname, '../assignmentX');
  
  test('Test description', () => {
    // Test code here
    expect(actualValue).toBe(expectedValue);
  });
});
```

### Key Components

#### 1. **Imports and Setup**
```javascript
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
```
- `path`: Used to construct file paths correctly across different operating systems
- `fs`: Used to check if files exist, read files, etc.
- `execSync`: Used to execute your scripts and capture their output

#### 2. **describe() Blocks**
```javascript
describe('Assignment 1: Node.js Fundamentals', () => {
  // Tests go here
});
```
- Groups related tests together
- The string is a description of what this test suite is testing
- Helps organize tests logically

#### 3. **test() or it() Blocks**
```javascript
test('globals-demo.js outputs correct globals', () => {
  // Test logic
});
```
- Each `test()` or `it()` block is a single test case
- The string describes what this specific test is checking
- Contains the actual test logic

#### 4. **expect() Assertions**
```javascript
expect(actualValue).toBe(expectedValue);
expect(output).toContain('expected string');
expect(fileExists).toBe(true);
```
- `expect()` is used to make assertions about values
- `.toBe()` checks for exact equality
- `.toContain()` checks if a string contains a substring
- `.toBeTruthy()` / `.toBeFalsy()` check boolean values
- Many other matchers are available (see Jest documentation)

### Example: Reading assignment1.test.js

Let's break down a real test:

```javascript
test('globals-demo.js outputs correct globals', () => {
  const scriptPath = path.join(assignmentDir, 'globals-demo.js');
  const output = execSync(`node ${scriptPath}`).toString();
  expect(output).toContain(`__dirname: ${assignmentDir}`);
  expect(output).toContain(`__filename: ${scriptPath}`);
  expect(output).toMatch(/Process ID:/);
  expect(output).toMatch(/Platform:/);
  expect(output).toMatch(/Custom global variable: Hello, global!/);
});
```

**What this test does:**

1. **`const scriptPath = path.join(assignmentDir, 'globals-demo.js')`**
   - Constructs the full path to your `globals-demo.js` file

2. **`const output = execSync(`node ${scriptPath}`).toString()`**
   - Runs your script using Node.js
   - Captures all console output from the script
   - Converts it to a string

3. **`expect(output).toContain(...)`**
   - Checks that the output contains the expected strings
   - Tests that you logged `__dirname`, `__filename`, etc.
   - Uses regex patterns with `toMatch()` for flexible matching

**What you need to do:**

- Create `globals-demo.js` in the `assignment1` folder
- Make sure it logs the exact strings the test expects
- Pay attention to spacing and capitalization!

### Example: Reading assignment4.test.js

For controller tests (like Assignment 4), tests use `node-mocks-http`:

```javascript
const httpMocks = require("node-mocks-http");

it("You can register a user.", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: {
      email: "jim@sample.com",
      name: "Jim",
      password: "Pa$$word20",
    },
  });
  const res = httpMocks.createResponse();
  await register(req, res);
  expect(res.statusCode).toBe(201);
});
```

**What this test does:**

1. **`httpMocks.createRequest()`**
   - Creates a mock HTTP request object
   - Simulates what Express would pass to your controller
   - Includes the request body, method, etc.

2. **`httpMocks.createResponse()`**
   - Creates a mock HTTP response object
   - Allows the test to inspect the response status code, body, etc.

3. **`await register(req, res)`**
   - Calls your actual controller function
   - Passes the mock request and response

4. **`expect(res.statusCode).toBe(201)`**
   - Checks that your controller set the status code to 201 (Created)
   - Verifies the controller behaves correctly

**What you need to do:**

- Implement the `register` function in your controller
- Make sure it returns status code 201 for successful registration
- Ensure it handles the request body correctly

---

## Common Test Patterns

### Pattern 1: File Existence Check
```javascript
test('File should exist', () => {
  const filePath = path.join(assignmentDir, 'myfile.js');
  expect(fs.existsSync(filePath)).toBe(true);
});
```
**What it checks**: That you created the required file

### Pattern 2: Output Content Check
```javascript
test('Script outputs correct content', () => {
  const output = execSync(`node ${scriptPath}`).toString();
  expect(output).toContain('Expected output');
  expect(output).toMatch(/regex pattern/);
});
```
**What it checks**: That your script produces the expected console output

### Pattern 3: File Content Check
```javascript
test('File contains correct content', () => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  expect(fileContent).toContain('expected content');
});
```
**What it checks**: That files you create contain specific content

### Pattern 4: HTTP Endpoint Check
```javascript
test('GET /endpoint returns 200', async () => {
  const response = await http.get('http://localhost:3000/endpoint');
  expect(response.statusCode).toBe(200);
});
```
**What it checks**: That your API endpoints work correctly

---

## Troubleshooting Common Issues

### Issue 1: "Cannot find module" or "File does not exist"

**Problem**: Test can't find your file

**Solutions**:
- Check that you're working in the correct directory (e.g., `assignment1`, `assignment2`)
- Verify file names match exactly (case-sensitive!)
- Ensure files are in the correct location relative to your assignment folder

### Issue 2: "Expected output to contain 'X' but received 'Y'"

**Problem**: Output format doesn't match

**Solutions**:
- Check spacing - tests are very sensitive to exact formatting
- Verify capitalization matches exactly
- Make sure punctuation matches (colons, commas, etc.)
- Compare your output character-by-character with the expected output

### Issue 3: "Test timeout" or "Tests taking too long"

**Problem**: Your code might be hanging or taking too long

**Solutions**:
- Check for infinite loops
- Ensure async operations complete (use `await` or proper callbacks)
- Verify database connections close properly
- Check that servers shut down after tests

### Issue 4: "Status code expected 200, received 500"

**Problem**: Your endpoint is returning an error

**Solutions**:
- Check server console logs for error messages
- Verify database connections are working
- Ensure middleware is set up correctly
- Check that validation is passing
- Make sure required environment variables are set

### Issue 5: "Cannot read property of undefined"

**Problem**: Code is trying to access properties that don't exist

**Solutions**:
- Add error handling for missing data
- Verify request body parsing works correctly
- Check that middleware is running before route handlers
- Ensure database queries return expected data structure

---

## Tips for Success

1. **Run tests frequently**: Don't wait until the end! Run tests as you complete each task.

2. **Read the test file first**: Before starting an assignment, read the corresponding test file to understand what's expected.

3. **Match formatting exactly**: Pay attention to spacing, capitalization, and punctuation in console.log statements.

4. **Check error messages carefully**: Jest provides detailed error messages - use them to understand what's wrong.

5. **Test incrementally**: Complete one test at a time rather than trying to pass all tests at once.

6. **Use the sample answers**: Check `mentor-guidebook/sample-answers/` for reference implementations (but try to solve it yourself first!).

7. **Ask for help**: If tests consistently fail and you can't figure out why, ask your mentor or check the course discussions.

---

## Next Steps

- After running TDD tests and seeing them pass, you know your assignment meets the requirements
- Don't forget to commit your work frequently
- Create a pull request when you're ready to submit
- For Assignment 9, you'll learn to write your own tests similar to these!

---

## Summary

- **To run tests**: `npm run tdd assignmentX` (or `npm run lesson9TDD` for Assignment 9)
- **Test files are in**: `tdd/` folder
- **Tests use**: Jest framework
- **Key functions**: `describe()`, `test()`, `expect()`
- **Read tests first**: Understand what's expected before coding
- **Format matters**: Exact spacing and capitalization are required

Happy testing! 🧪

