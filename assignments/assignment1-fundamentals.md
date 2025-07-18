# Week 1 Assignment: Intro to Node.js & Async JavaScript

## Learning Objectives
- Understand what Node.js is and how it differs from browser JavaScript
- Explore Node.js architecture and the V8 engine
- Use Node.js global objects (`global`, `process`, `__dirname`)
- Identify key use cases for Node.js (APIs, CLIs, real-time apps)
- Understand module systems (CommonJS vs ES Modules)
- Grasp asynchronous JavaScript concepts: blocking vs non-blocking I/O, the event loop, callbacks, promises, async/await
- Work with Node core modules: `fs`, `path`, `os`
- Use file system methods (`fs.readFile`, `fs.writeFile`, `fs.promises`), and understand why streams matter for large files

## Assignment Guidelines

1. **Clone the repository:**
   - Clone the `node-homework` repository to your local machine.
   - Work inside the `assignment1` folder for all your answers and code for this assignment.
2. **Create a branch:**
   - Create a new branch for your work on assignment 1 (e.g., `assignment1`).
   - Make all your changes and commits on this branch.
3. **Run the tests:**
   - After completing the tasks, run the tests using:
     ```bash
     npm run tdd assignment1
     ```
   - Make sure all tests pass before submitting your work.

## Assignment Tasks

### 1. Node.js Fundamentals
- In a markdown file (`node-fundamentals.md`), answer the following:
  - What is Node.js?
  - How does Node.js differ from running JavaScript in the browser?
  - What is the V8 engine, and how does Node use it?
  - What are some key use cases for Node.js?
  - Explain the difference between CommonJS and ES Modules. Give a code example of each.

### 2. Exploring Node Globals
- Create a script (`globals-demo.js`) that logs the following:
  - The value of `__dirname` and `__filename`
  - The current process ID and platform using `process`
  - A custom global variable (attach a property to `global` and log it)

### 3. Asynchronous JavaScript
- Create a script (`async-demo.js`) that:
  - Reads a file asynchronously using `fs.readFile`
  - Demonstrates a callback function and explains callback hell with a code example (in comments)
  - Converts the callback code to use Promises, then async/await
  - Uses `try/catch` for error handling
  - **Important:** For each async pattern (callback, promise, async/await), your console output should include the phrase `Hello, async world!` to match the file content and test expectations.


### 4. Node Core Modules
- Create a script (`core-modules-demo.js`) that:
  - Uses the `os` module to log system information (platform, CPU, memory)
  - Uses the `path` module to join two paths and log the result
  - Uses the `fs.promises` API to write and then read a file (`demo.txt`)
  - Create a file called `largefile.txt` in your `sample-files` folder. You can do this by writing a loop that writes many lines to the file (e.g., 100 lines of any text). Demonstrate reading `largefile.txt` using a readable stream (`fs.createReadStream`). For each chunk read, log the first 40 characters (or any summary) to the console. When the stream ends, log a message like "Finished reading large file with streams." Use the `highWaterMark` option in `fs.createReadStream` to control the chunk size (e.g., set it to 1024 for 1KB chunks). You can experiment with different values to see how it affects the number of chunks and the output.

## To Submit an Assignment

1. Do these commands:

    ```bash
    git add -A
    git commit -m "some meaningful commit message"
    git push origin assignmentx  # The branch you are working in.
    ```
2. Go to your `node-homework` repository on GitHub.  Select your `assignmentx` branch, the branch you were working on.  Create a pull request.  The target of the pull request should be the main branch of your GitHub repository.
3. Once the pull request (PR) is created, your browser contains the URL of the PR. Copy that to your clipboard.  Include that link in your homework submission.


