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

1. **Setup**
   - You should have already done 'Getting Started' instructions, which sets up your Node-Homework Directory.
   - Work inside the `assignment1` folder for all your answers and code for this assignment.
2. **Create a branch:**
   - Create a new branch for your work on assignment 1 (e.g., `assignment1`).
   - Make all your changes and commits on this branch.
4. **Before you test:**
   - Please read the TDD Testing Guide for how to run and interpret the course-provided tests: [TDD Testing Guide](?page=test-driven-development-(tdd)-testing-guide)
   - Watch this video that goes over Test Driven Development: [How to Read Tests](https://www.youtube.com/watch?v=fxe1yNSC6H4)
3. **Run the tests:**
   - After completing the tasks, run the tests using:
     ```bash
     npm run tdd assignment1
     ```
   - Make sure all tests pass before submitting your work.

## Assignment Tasks

**Setup Note:** Before starting, make sure you have a  `sample-files` directory in your `assignment1` folder. This directory will be used for file operations in tasks 3 and 4.

**Important:** Follow the exact formatting requirements specified in each task. The automated tests expect specific console output formats, so pay attention to spacing, capitalization, and punctuation in your console.log statements.

### 1. Node.js Fundamentals
- In a markdown file (`node-fundamentals.md`), answer the following:
  - What is Node.js?
  - How does Node.js differ from running JavaScript in the browser?
  - What is the V8 engine, and how does Node use it?
  - What are some key use cases for Node.js?
  - Explain the difference between CommonJS and ES Modules. Give a code example of each.

### 2. Exploring Node Globals
- Create a script (`globals-demo.js`) that logs the following with **exact formatting**:
  - `console.log('__dirname:', __dirname);`
  - `console.log('__filename:', __filename);`
  - `console.log('Process ID:', process.pid);` 
  - `console.log('Platform:', process.platform);` 
  - A custom global variable: `global.myCustomVar = 'Hello, global!';` followed by `console.log('Custom global variable:', global.myCustomVar);`

**Important:** Use exactly one space after the colon in each console.log statement, and use the exact capitalization shown above for "Process ID" and "Platform".

### 3. Asynchronous JavaScript
- Create a script (`async-demo.js`) that:
  - Reads a file asynchronously using `fs.readFile`
  - Demonstrates a callback function and explains callback hell with a code example (in comments)
  - Converts the callback code to use Promises, then async/await
  - Uses `try/catch` for error handling
  - **Important:** For each async pattern (callback, promise, async/await), your console output should include the phrase `Hello, async world!` to match the file content and test expectations.
  - **File Setup:** In your `sample-files` directory, create a `sample.txt` file containing exactly "Hello, async world!" (without quotes) for the async demo to read.

**Console Output Examples:**
When you run your async-demo.js, you should see output like:
```
Callback read: Hello, async world!
Promise read: Hello, async world!
Async/Await read: Hello, async world!
```
#### If You Get Stuck

Converting between callbacks, Promises, and async/await can be tricky. If you hit an error or your output doesn't match what's expected, try this prompt with an AI chatbot instead of asking for the full solution:

> "I'm converting a Node.js fs.readFile callback into a Promise-based version, then to async/await. Here's my current code: [paste your code]. I'm getting this error: [paste your error]. Can you ask me 3 questions that will help me figure out what's wrong on my own?"

This keeps you in the driver's seat. The AI helps you debug, you do the fixing.

### 4. Node Core Modules
- Create a script (`core-modules-demo.js`) that:
  - Uses the `os` module to log system information (platform, CPU, memory)
  - Uses the `path` module to join two paths and log the result
  - Uses the `fs.promises` API to write and then read a file (`demo.txt`)
  - Creates a file called `largefile.txt` in your `sample-files` folder. You can do this by writing a loop that writes many lines to the file (e.g., 100 lines of any text). Demonstrate reading `largefile.txt` using a readable stream (`fs.createReadStream`). For each chunk read, log the first 40 characters (or any summary) to the console. When the stream ends, log a message like "Finished reading large file with streams." Use the `highWaterMark` option in `fs.createReadStream` to control the chunk size (e.g., set it to 1024 for 1KB chunks). You can experiment with different values to see how it affects the number of chunks and the output.

**Console Output Examples:**
When you run your core-modules-demo.js, you should see output like:
```
Platform: darwin
CPU: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz
Total Memory: 17179869184
Joined path: /path/to/sample-files/folder/file.txt
fs.promises read: Hello from fs.promises!
Read chunk: This is a line in a large file...
Finished reading large file with streams.
```

## Testing Your Work

After completing each script, run it to make sure it produces the expected output:

```bash
node globals-demo.js
node async-demo.js  
node core-modules-demo.js
```

The automated tests will check that your output matches the expected format. If a test fails, check that your console.log statements use the exact spacing and capitalization shown in the examples above.

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Answer 3 questions from Lesson 1:

1. **What is Node.js and how does it differ from running JavaScript in the browser?**
   - Explain the key differences between browser JavaScript and Node.js
   - Discuss the V8 engine and how Node uses it
   - Mention key use cases for Node.js

2. **Explain the difference between CommonJS and ES Modules.**
   - Explain when you would use each approach
   - Discuss the syntax differences (require vs import, module.exports vs export)

3. **What are the main differences between Node and browser JavaScript environments?**
   - Compare global objects (window vs global, process, __dirname, __filename)
   - Discuss file system access capabilities
   - Explain the event loop and asynchronous programming in Node

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples (when needed)
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

## To Submit an Assignment

1. Do these commands:

    ```bash
    git add -A
    git commit -m "some meaningful commit message"
    git push origin assignmentx  # The branch you are working in.
    ```
2. Go to your `node-homework` repository on GitHub.  Select your `assignmentx` branch, the branch you were working on.  Create a pull request.  The target of the pull request should be the main branch of your GitHub repository.
3. Once the pull request (PR) is created, your browser contains the URL of the PR. Copy that to your clipboard.  Include that link in your homework submission.
4. **Don't forget to include your video link in the submission form!**


