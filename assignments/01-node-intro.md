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

NOTE: The AI review tool (known as AirHub) can check code and structure, but it does not run your code in a server environment to verify that aspect runs properly.  We will have human reviewers checking this aspect, so you may receive a passing assignment from AirHub that could still need revisions after a human has checked that your work runs properly in the correct environment. If your AI and human reviewer feedbacks don't match, trust the human review.

1. **Setup**
   - You should have already done 'Getting Started' instructions, which sets up your Node-Homework Directory.
   - Work inside the `assignment1` folder for all your answers and code for this assignment.
2. **Create a branch:**
   - Create a new branch for your work on assignment 1 (e.g., `assignment1`).
   - Make all your changes and commits on this branch.
3. **Before you test:**
   - Please read the TDD Testing Guide for how to run and interpret the course-provided tests: [TDD Testing Guide](?page=test-driven-development-(tdd)-testing-guide)
   - Watch this video that goes over Test Driven Development: [How to Read Tests](https://www.youtube.com/watch?v=fxe1yNSC6H4)
4. **Run the tests:**
   - This assignment has a **Core** part (required) and an **Advanced** part (optional), matching the lesson.
   - Run the core tests with:
     ```bash
     npm run tdd assignment1a
     ```
   - If you finish the optional advanced part, also run:
     ```bash
     npm run tdd assignment1b
     ```
   - Make sure the core tests pass before submitting your work. The advanced tests are optional.

## Assignment Tasks

**Setup Note:** Before starting, make sure you have a  `sample-files` directory in your `assignment1` folder. This directory is used for file operations in the core file tasks (3 and 4) and the optional advanced streams task (5).

**Important:** Follow the exact formatting requirements specified in each task. The automated tests expect specific console output formats, so pay attention to spacing, capitalization, and punctuation in your console.log statements.

## Core Tasks (Required)

These tasks are required. The core tests run with `npm run tdd assignment1a`.

### 1. Node.js Fundamentals
- A `node-fundamentals.md` file is already in your `assignment1` folder, with the questions below and `Answer here..` placeholders. Open it and write your answers in your own words (replace each placeholder):
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
  - **File Setup :** Do **not** manually create `sample.txt` ahead of time. Your `async-demo.js` should create `sample-files/sample.txt` programmatically with exactly `Hello, async world!`, then read that file in the callback, promise, and async/await examples.

**Console Output Examples:**
The first line of this example output is from running the callback async pattern, the second from the promise async pattern, and the third from the async/await async pattern.
```
Hello, async world!
Hello, async world!
Hello, async world!
```
#### If You Get Stuck

Converting between callbacks, Promises, and async/await can be tricky. If you hit an error or your output doesn't match what's expected, try this prompt with an AI chatbot instead of asking for the full solution:

> "I'm converting a Node.js fs.readFile callback into a Promise-based version, then to async/await. Here's my current code: [paste your code]. I'm getting this error: [paste your error]. Can you ask me 3 questions that will help me figure out what's wrong on my own?"

This keeps you in control. The AI helps you debug, you do the fixing.

### 4. Node Core Modules
- Create a script (`core-modules-demo.js`) that:
  - Uses the `os` module to log system information (platform, CPU, memory)
  - Uses the `path` module to join two paths and log the result
  - Uses the `fs.promises` API to write and then read a file (`sample-files/demo.txt`). Be sure to write it inside the `sample-files` folder so the tests can find it.

**Console Output Examples:**
Example — your platform, CPU, memory, and path will differ; this shows the expected types of information only.
```
Platform: darwin
CPU: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz
Total Memory: 17179869184
Joined path: /path/to/sample-files/folder/file.txt
fs.promises read: Hello from fs.promises!
```

That completes the core tasks. Run the core tests with `npm run tdd assignment1a`.

## Stretch Goals (Optional)

This part is optional, just like the Advanced section of the lesson. You can skip it and still continue the course, but it is good extra practice.

### 5. (Optional) Streams for Large Files
- In your `core-modules-demo.js` script, add streaming:
  - Create a file called `largefile.txt` in your `sample-files` folder. You can do this by writing a loop that writes many lines to the file (e.g., 100 lines of any text). Demonstrate reading `largefile.txt` using a readable stream (`fs.createReadStream`). For each chunk read, log a line that starts with `Read chunk:` (for example, the first 40 characters of the chunk). When the stream ends, log exactly `Finished reading large file with streams.` Use the `highWaterMark` option in `fs.createReadStream` to control the chunk size (e.g., set it to 1024 for 1KB chunks). You can experiment with different values to see how it affects the number of chunks and the output.

**Important:** The test looks for the exact prefix `Read chunk:` on your chunk lines and the exact phrase `Finished reading large file with streams` for the end message. (This is the same wording used in the streams example in Lesson 1's Advanced section.)

**Console Output Examples:**
Example -- the words that follow `Read chunk:` will vary, but `Read chunk:` and the second line should appear in your output as stated above
```
Read chunk: This is a line in a large file...
Finished reading large file with streams.
```

If you complete this optional part, run the advanced tests with `npm run tdd assignment1b`.

---

## Testing Your Work

After completing each script, run it to make sure it produces the expected output:

```bash
node globals-demo.js
node async-demo.js  
node core-modules-demo.js
```

Then run the course tests:

```bash
npm run tdd assignment1a   # core (required)
npm run tdd assignment1b   # advanced (optional)
```

The automated tests will check that your output matches the expected format. If a test fails, check that your console.log statements use the exact spacing and capitalization shown in the examples above.

---

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

---

<details>
<summary>Rubric (for AirHub reviewer and mentors)</summary>

### Required Deliverables/Tasks

- **Task 1 — Node.js Fundamentals** — `node-fundamentals.md` filled in with the student's own answers (not the `Answer here..` placeholders) to all five questions, including a CommonJS example and an ES Modules example.
- **Task 2 — Exploring Node Globals** — `globals-demo.js` logs `__dirname`, `__filename`, `process.pid`, `process.platform`, and a custom global variable. `Use exactly as written (later tasks depend on these names)`: the exact `console.log` label text, capitalization ("Process ID", "Platform"), and one space after each colon, as specified in the task.
- **Task 3 — Asynchronous JavaScript** — `async-demo.js` programmatically creates `sample-files/sample.txt` with the content `Hello, async world!`, then reads it via callback, Promise, and async/await, with try/catch error handling and callback-hell explained in comments. `Use exactly as written`: the phrase `Hello, async world!` must appear in the output for each of the three patterns. The sample console output block is `Example — illustrative formatting only`.
- **Task 4 — Node Core Modules** — `core-modules-demo.js` uses `os` to log platform/CPU/memory, uses `path` to join and log two paths, and uses `fs.promises` to write and read `sample-files/demo.txt`. The console output example is `Example — adapt to your own system`: platform, CPU, memory, and path values will differ per machine; only the types of information logged should match, not the literal values.
- **Video submission** — a 3–5 minute video answering the three listed questions about Node.js vs. browser JS, CommonJS vs. ES Modules, and Node/browser environment differences.
- **Submission** — work pushed to an `assignment1`-style branch with a pull request against main; PR link and video link included in the submission form.

### Optional Deliverables/Tasks

Signaled in the assignment as "Stretch Goals (Optional)." **Do not fail a student for omitting these.**

- **Task 5 — (Optional) Streams for Large Files** — adds streaming to `core-modules-demo.js`: creates `sample-files/largefile.txt`, reads it with `fs.createReadStream` using a `highWaterMark` option, logs lines starting with `Read chunk:` for each chunk, and logs `Finished reading large file with streams.` when done. `Use exactly as written`: the `Read chunk:` prefix and the exact end-of-stream message. `Example — adapt to your own content`: the text that follows `Read chunk:` will vary based on the file's contents.

</details>

