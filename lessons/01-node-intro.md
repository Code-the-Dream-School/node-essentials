# **Lesson 1 — Introduction to Node**

## **Lesson Overview**

**Learning objective**: By the end of this lesson, you should understand what Node.js is, how it differs from browser JavaScript, how to run Node programs, how CommonJS modules work, and how asynchronous file operations work in Node.

This lesson has two parts:

- **Core Knowledge**: Required. Complete this before moving forward.
- **Advanced Knowledge**: Optional. These topics are useful, but you can skip them for now and still keep going with the course.

---

# **Part 1 — Core Knowledge**

## **1.1 What is Node?**

JavaScript was first created to run inside the browser. In the browser, JavaScript can update a page, respond to clicks, read form values, and communicate with APIs.

The browser is intentionally limited. Code from a random website should not be able to freely read files from your computer, start a server, or access private information. That protected browser environment is called a sandbox.

Node exists because of a simple idea. JavaScript already had a huge number of programmers, since it was the language of the browser. Some engineers at Google asked: what if those same programmers could also write server-side code in JavaScript, instead of learning a heavier language like Java? To make that possible, they built Node.js, a way to run JavaScript directly on a computer with no browser sandbox.

So how does Node actually run JavaScript? It uses the **V8 engine**. An engine is the program that reads your JavaScript and turns it into fast instructions the computer can run. V8 is the high-performance JavaScript engine Google originally built for the Chrome browser. Node takes that same engine *out* of the browser and wraps extra abilities around it (like file and network access). In other words, the engine that runs JavaScript inside Chrome is the same engine that runs your JavaScript in Node.

Node.js lets JavaScript run outside the browser. Node can run on your computer or on a server, so it can do things browser JavaScript normally cannot do:

- Read and write files.
- Start a web server.
- Read environment variables.
- Work with operating system services.
- Use backend libraries like Express.

Because of these abilities, Node is a popular choice for several kinds of projects:

- **Web APIs and servers** that respond to requests from browsers or other apps.
- **Command-line tools (CLIs)** you run in the terminal to automate tasks.
- **Real-time apps** such as chat or live dashboards that push updates instantly.
- **Build tools and scripts** that bundle code or process files.

Node is not a different language. It is a different environment for running JavaScript.

```text
Browser JavaScript -> works with pages, the DOM, and browser APIs
Node.js JavaScript -> works with files, processes, servers, and backend APIs
```

## **1.2 Running Node**

Node is an application you usually use from the terminal.

The terminal lets you type commands directly to your computer. When you run a Node command, you are asking Node to execute JavaScript outside the browser.

Check your Node version:

```bash
node --version
```

Start the Node REPL:

```bash
node
```

REPL stands for Read, Evaluate, Print, Loop. It lets you type JavaScript and immediately see the result.

Try this:

```js
console.log("Hello from Node");
```

The output appears in the terminal, not the browser console.

Exit the REPL with `Ctrl + C` twice, or type:

```text
.exit
```

### **Running Your First Node Program**

For this course, you will keep your work in your `node-homework` repository. For example, you might create this file inside the `assignment1` folder.

Create a file named `first.js`:

```js
console.log("My first Node program");
```

Run it:

```bash
node first.js
```

When you run this command, Node opens `first.js`, executes the JavaScript inside it, prints the message, and then exits.

You may also see files run without the `.js` extension, and you can include a folder path:

```bash
node first
node ./assignment1/first
```

## **1.3 Node.js vs Browser JavaScript**

The browser and Node both run JavaScript, but they provide different tools.

Browser JavaScript has access to:

- `window`
- `document`
- DOM elements
- browser storage
- cookies

Node does not have `window`, `document`, or the DOM.

DOM stands for Document Object Model. It is the browser's representation of the HTML page. Since Node is not running inside a page, there is no DOM for Node to change.

Here is a simple browser example. This code reaches into the web page, finds the first `<h1>` element, and changes the text the user sees:

```js
document.querySelector("h1").textContent = "Hello";
```

It does not work in Node because Node is not controlling a web page.

Node provides backend tools instead:

- File system access.
- Process information.
- Environment variables.
- Command-line arguments.
- Networking APIs.
- Built-in modules like `fs`, `http`, `path`, and `os`.

Because Node runs on the server, it can safely use secrets such as database credentials or API keys. Browser JavaScript should not store secrets because users can inspect frontend code.

## **1.4 Syntax Differences: CommonJS Modules**

Browser-side JavaScript and React often use ES Module syntax. You have probably seen imports that look like this, where the file asks for specific tools from another package or file:

```js
import { useState, useEffect } from "react";
```

In this course, we will use CommonJS syntax.

CommonJS imports code with `require()`. In this style, `require()` loads another file or package, and destructuring pulls out the specific values you want to use:

```js
const { register, logoff } = require("../controllers/userController");
```

The path inside `require()` tells Node where to look. A path that starts with `./` or `../` points to a file in your project. A name without `./` or `../`, such as `"fs"` or `"express"`, points to a built-in module or installed package.

CommonJS exports code with `module.exports`. Think of this as choosing what the current file makes available to other files:

```js
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { add, multiply };
```

If you save that file as `mathUtils.js`, another file in the same folder can import those functions. Once imported, they can be used like regular functions:

```js
const { add, multiply } = require("./mathUtils");

console.log(add(2, 3));
console.log(multiply(4, 5));
```

Node also supports ES Modules (in files that use the `.mjs` extension, or with extra configuration), but this course will use CommonJS unless told otherwise. Mixing the two styles in one project can get messy, so we will stick with CommonJS.

## **1.5 Important Node Globals**

In browser JavaScript, you often use `window` and `document`. In Node, you have different built-in values.

Important ones include:

- `process`: Information about the currently running Node process.
- `process.env`: Environment variables.
- `process.argv`: Command-line arguments passed when the program starts.
- `__dirname`: The directory where the current file lives.
- `__filename`: The full path to the current file.
- `console`: Includes `console.log()`.
- `module.exports`: Controls what the current file exports.
- `require()`: Imports built-in modules, npm packages, or local files.

Here is a small example that prints a few Node globals. You do not need to memorize the exact output, but notice that these values come from the Node runtime, not from your own code:

```js
console.log(__dirname);
console.log(__filename);
console.log(process.argv);
console.log(process.env.NODE_ENV);
```

The last line will likely print `undefined`, which is expected: `NODE_ENV` is not set by default. It is a common environment variable used later to tell apps whether they are running in development or production.

If you run the file from the terminal and pass an extra word after the filename, Node stores that word in `process.argv`:

```bash
node app.js hello
```

Then `hello` appears inside `process.argv`.

`process.argv` is an array. It includes the Node program path, the file path, and then any extra values you typed after the filename. Those extra values are called command-line arguments.

Node also has a `global` object, but you should be careful with it. This example technically works, but it creates a value that can be reached from many places, which makes the program harder to follow:

```js
global.userName = "Joan";
```

This is usually a bad practice because it makes code harder to understand and debug. Prefer `module.exports` and `require()`.

### **Check Your Understanding With AI**

You just learned about several things that exist in Node but not in browser JavaScript, and the other way around. Without scrolling back up:

1. Open your preferred AI chatbot (CTD's AI Reviewer is a good choice).
2. In your own words, explain at least three things you can do in Node that you cannot do in browser JavaScript, and why that difference exists.
3. Ask the AI to evaluate your explanation: "I just learned about the differences between Node.js and browser JavaScript. Here is my understanding of what Node can do that browsers cannot: [your explanation]. What did I get right, and what should I refine?"
4. Revise your understanding based on the feedback.

## **1.6 Node.js Documentation and Libraries**

Node has official documentation for its built-in APIs:

[https://nodejs.org/api/](https://nodejs.org/api/)

Built-in modules are tools that come with Node. You load them with `require()`, and each module gives you a different set of features:

```js
const fs = require("fs");       // File system operations
const os = require("os");       // Operating system information
const http = require("http");   // HTTP server and client
const path = require("path");   // File and directory paths
```

Built-in modules do not require `npm install`.

Node also has access to third-party packages through npm.

npm is the package manager that comes with Node. A package is code someone else published so other projects can use it.

When a tool is not built into Node, you usually install it with npm. The command below is the general shape of installing a package:

```bash
npm install package-name
```

This command downloads the package into your project so your Node code can use it.

After a package is installed, you can load it into a Node file with `require()`. The exact variable name depends on the package and how you want to use it:

```js
const packageName = require("package-name");
```

Before adding a package, check:

- Does it have clear documentation?
- Has it been updated recently?
- Is it widely used?
- Does it have unresolved security warnings?
- Does it solve a real problem in your project?

Packages can save time, but every package also adds code and risk to your project.

## **1.7 Asynchronous Programming Refresher**

Node applications often wait for slow operations:

- Reading files.
- Receiving network data.
- Querying databases.
- Calling external APIs.

If Node stopped everything while waiting, servers would feel slow.

Instead, Node uses asynchronous operations. An asynchronous operation starts now and finishes later.

Think of ordering food at a restaurant. You place the order, then the kitchen works on it while you do something else. Node starts slow work, continues running other code, and comes back when the result is ready.

### **Callbacks**

A callback is a function passed into another function so it can run later.

In this example, `readFile()` starts the file operation and receives a callback to run when the file is ready. The callback also receives an `err` value, because file operations can fail if the file is missing or the path is wrong.

```js
const fs = require("fs");

fs.readFile("./example.txt", "utf8", (err, content) => {
  if (err) {
    console.log("File read failed:", err.message);
    return;
  }

  console.log("File content:", content);
});

console.log("last statement");
```

In this example, `last statement` prints first. Node starts the file read, continues running the program, and calls the callback when the file operation finishes.

### **Promises**

A Promise represents work that will finish in the future.

You can think of a Promise as a placeholder for a value you do not have yet. The Promise is created now, and later it either succeeds with a value or fails with an error.

A Promise can be:

- **Pending**: Still waiting.
- **Fulfilled**: Completed successfully.
- **Rejected**: Failed with an error.

When you create a Promise yourself, `resolve()` means "finish successfully with this value." `reject()` means "finish with an error."

### **`async`, `await`, `try/catch`, and `.then()`**

An `async` function always returns a Promise. Inside an `async` function, you can use `await` to wait for a Promise to settle. A Promise "settles" when it either fulfills with a value or rejects with an error.

The examples below use `somePromise` as a placeholder name. In real code, that Promise might come from reading a file, making an API request, or querying a database.

This pattern lets you write asynchronous code in a way that reads from top to bottom. The `try` block handles the successful path, and the `catch` block handles errors:

```js
async function run() {
  try {
    const result = await somePromise;
    console.log(result);
  } catch (err) {
    console.log("Something went wrong:", err.message);
  }
}
```

`.then()` is another way to receive the fulfilled value of a Promise. You will see this style in documentation and older code, so it is worth recognizing even if you mostly write `async/await`:

```js
somePromise
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err.message);
  });
```

In this course, prefer `async/await` for most code because it is usually easier to read. You should still recognize `.then()` because it appears in documentation and older codebases.

## **1.8 File System Access with Async Operations**

Node lets you access the file system. The file system documentation is here:

[https://nodejs.org/api/fs.html](https://nodejs.org/api/fs.html)

File paths such as `"./example.txt"` are usually read relative to the folder where you run the Node command. If a file example does not work, the first thing to check is whether the file exists in the expected folder.

You will see synchronous file system methods in examples and documentation. The word `Sync` means Node waits for the operation to finish before moving to the next line:

```js
const fs = require("fs");

fs.writeFileSync("./message.txt", "Hello from Node");
```

Synchronous methods can be useful for small scripts, but you should avoid them in web applications. While a synchronous operation is running, your server cannot continue handling other work.

### **Callback-Based File System APIs**

The base functions of the file system package require callbacks:

```js
const fs = require("fs");

fs.open("./tmp/file.txt", "w", (err, fileHandle) => {
  if (err) {
    console.log("file open failed: ", err.message);
  } else {
    console.log("file open succeeded.  The file handle is: ", fileHandle);
  }
});
console.log("last statement");
```

What order do you think the logged lines will appear when you run this program? Test your skills using this activity:

### **Predict Before You Run**

Study this code before running it:

```js
fs.open("./tmp/file.txt", "w", (err, fileHandle) => {
  if (err) {
    console.log("file open failed: ", err.message);
  } else {
    console.log("file open succeeded.  The file handle is: ", fileHandle);
  }
});
console.log("last statement");
```

1. Predict: Which console.log will appear first — "last statement" or the one inside the callback? Why?
2. Open an AI chatbot (CTD's AI Assignment Reviewer is always a good choice!) and explain your reasoning. For example: "I'm looking at this Node.js code that uses `fs.open` with a callback, followed by a `console.log('last statement')`. I think [your prediction] will print first because [your reasoning about the event loop]. Am I right? If not, what am I misunderstanding about how async callbacks work in Node?"
3. Run the code and check your prediction.
4. If you were wrong, ask the AI to walk you through the event loop's role step by step.

#### **Result**

The answer is that you will see "last statement" printed first, followed by "file open succeeded."  The asynchronous fs.open() call tells the Node event loop to do the open and continues on to output "last statement".  Then the event loop completes the file open and does the callback.  And then you see the other message.

Now, clearly, if you were to write a line to this file, you'd have to do it in the callback, so that you have access to the file handle.  That call would also be asynchronous, with a callback.  If you want to write a second line, you'd have to do that write in the second callback.  And so on, to "callback hell".  You could keep your file legible through clever use of recursion, but it's still messy.  Now, as you know, we have promises in JavaScript.  So, one choice would be to wrap the async call in a promise, as follows:

### **Manual Promise Wrapping**

Sometimes you will need to use a function that only supports callbacks. You can wrap it in a Promise so the rest of your code can use `await` instead of nesting more callback code:

Inside the Promise, the old callback decides what happens next. If there is an error, call `reject(err)`. If the operation succeeds, call `resolve(content)`.

```js
const fs = require("fs");

function readTextFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, content) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(content);
    });
  });
}
```

Now you can use the wrapper with `await`. The code below feels like normal step-by-step code, but it is still asynchronous because `readTextFile()` returns a Promise:

```js
async function run() {
  try {
    const content = await readTextFile("./example.txt");
    console.log(content);
  } catch (err) {
    console.log("An error occurred:", err.message);
  }
}

run();
```

The callback inside your wrapper should always call `resolve()` or `reject()`. Otherwise, the Promise may stay pending forever.

### **Promise-Based File System APIs**

Most modern Node file work can use Promise-based APIs directly. This means you usually do not have to wrap callbacks yourself when reading or writing files:

```js
const fs = require("fs/promises");

async function run() {
  try {
    await fs.writeFile("./message.txt", "Hello from Node");
    const content = await fs.readFile("./message.txt", "utf8");

    console.log(content);
  } catch (err) {
    console.log("File operation failed:", err.message);
  }
}

run();
```

This is the style you will usually use for file I/O in this course.

### **`util.promisify()`**

Node also provides `promisify()` in the built-in `util` module. It converts many callback-based functions into Promise-based functions.

First, import `promisify()` from `util`:

```js
const { promisify } = require("util");
```

If a callback-based function follows the common Node pattern `(err, result)`, you can often promisify it. In this example, `fs.readFile` becomes a new `readFile` function that works with `await`:

```js
const fs = require("fs");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

async function run() {
  try {
    const content = await readFile("./example.txt", "utf8");
    console.log(content);
  } catch (err) {
    console.log("Could not read file:", err.message);
  }
}

run();
```

`promisify()` does not work for every callback-based function. It works best when the callback is the last argument and follows the `(err, result)` pattern.

## **Core Check for Understanding**
(You do not need to submit anything. This is just to check your understanding.)

1. What is Node.js?
2. What are three things Node can do that browser JavaScript cannot normally do?
3. Where does `console.log()` output appear when running Node code?
4. What are the main CommonJS syntax tools?
5. What is `process.argv` used for?
6. Why should synchronous file system methods usually be avoided in web applications?
7. What is the difference between a callback and a Promise?
8. What do `resolve()` and `reject()` do?
9. What are the two common ways to get the fulfilled value from a Promise?
10. What does `util.promisify()` do?

### **Answers**

1. Node.js is a runtime that lets you run JavaScript outside the browser, on your computer or a server.
2. Examples (any three): read and write files, start a web server, read environment variables, work with operating system services.
3. In the terminal where you ran the program, not the browser console.
4. `require()` to import and `module.exports` to export.
5. It holds the command-line arguments passed when the program started: the Node path, the file path, and any extra values you typed.
6. A synchronous method blocks the whole server while it runs, so no other requests can be handled until it finishes.
7. A callback is a function you pass in to run later when work finishes. A Promise is an object representing future work that you can `await` or chain with `.then()`.
8. `resolve()` finishes a Promise successfully with a value; `reject()` finishes it with an error.
9. `await` and `.then()`.
10. It converts a callback-based function (using the `(err, result)` pattern) into one that returns a Promise.

---

# **Part 2 — Advanced Knowledge**

This part is OPTIONAL. If you are curious, it gives you a little more background about Node.js.

## **2.1 Deeper Event Loop Model**

JavaScript runs one main thread of code at a time. If server code waited synchronously for every slow operation, all incoming requests would have to wait too.

The event loop helps Node avoid that problem. A slow operation can be started, Node can continue running other code, and the callback or Promise result can be handled later.

A simplified model:

1. JavaScript runs on the call stack.
2. Slow operations are started outside the main stack.
3. Completed async work waits in a queue.
4. The event loop moves ready work back when the stack is clear.

The call stack works like a stack of plates: last in, first out.

A queue works like a line at a bank: first in, first out.

For a deeper explanation, watch: [What the heck is the event loop?](https://www.youtube.com/watch?v=8aGhZQkoFbQ)

## **2.2 Node Performance Context**

Node is often strong for I/O-heavy work. I/O means input/output, such as network requests, file operations, and database responses.

Node is usually not the best choice for heavy CPU work, such as:

- Large numeric calculations.
- Image processing.
- Machine learning model training.
- Very CPU-heavy data analysis.

For those cases, languages or tools such as Python, C++, Rust, or Java may be better depending on the project.

The practical takeaway: Node is strong for APIs, servers, and tools that wait on external resources. It is weaker for CPU-heavy computation.

## **2.3 Streams for Large Files**

Reading an entire file into memory is fine for small files. For large files, it can be inefficient or even crash the program.

Streams let you read or write data in chunks.

In this example, Node reads the file piece by piece. The `.on()` method listens for stream events. Each chunk triggers a `data` event, the `end` event runs when there is nothing left to read, and the `error` event runs if something goes wrong:

```js
const fs = require("fs");

const readStream = fs.createReadStream("./largefile.txt", {
  encoding: "utf8",
});

readStream.on("data", (chunk) => {
  console.log("Read chunk:", chunk.length);
});

readStream.on("end", () => {
  console.log("Finished reading large file with streams.");
});

readStream.on("error", (err) => {
  console.log("Error reading file:", err.message);
});
```

The `highWaterMark` option controls the approximate chunk size. You can think of it as a setting that tells the stream about how much data to pull in at a time:

```js
const readStream = fs.createReadStream("./largefile.txt", {
  encoding: "utf8",
  highWaterMark: 1024,
});
```

You can also write with streams. Instead of building one huge string in memory, you can send smaller pieces to the output file as they are ready:

```js
const fs = require("fs");

const writeStream = fs.createWriteStream("./output.txt");

writeStream.write("First line\n");
writeStream.write("Second line\n");
writeStream.end();
```

Use streams when files or data are too large to comfortably handle all at once.

## **2.4 More on Async Functions**

The flow of control in async functions can be subtle.

An `async` function always returns a Promise, even if it appears to return a normal value.

This example looks like it returns the string `"Hello"`, but calling the function gives you a Promise that will eventually fulfill with that string:

```js
async function getMessage() {
  return "Hello";
}

const result = getMessage();

console.log(result);
```

The logged value is a Promise, not the string `"Hello"`.

To get the fulfilled value, use `await` inside another async function. `await` pauses this async function until `getMessage()` has finished:

```js
async function run() {
  const message = await getMessage();
  console.log(message);
}

run();
```

Or use `.then()`. This attaches a callback that runs after the Promise fulfills:

```js
getMessage().then((message) => {
  console.log(message);
});
```

### **Predict Before You Run**

A version of this program is in your `node-homework/assignment1` folder as `callsync.js`. Before running it, predict the log order. Pay close attention to where the normal synchronous lines run immediately and where Promise callbacks wait until later:

```js
function syncFunc() {
  console.log("In syncFunc. No async operations here.");
  return "Returned from syncFunc.";
}

async function asyncCaller() {
  console.log("About to wait.");
  const result = await syncFunc();
  console.log(result);
  return "asyncCaller complete.";
}

console.log("Calling asyncCaller.");

const promise = asyncCaller();

console.log(`Got back a value of type ${typeof promise}`);

promise.then((resolvedValue) => {
  console.log("The promise resolves to:", resolvedValue);
});

console.log("Finished.");
```

Try this activity:

1. Write down the order you think the `console.log` statements will appear.
2. Share your predicted order with an AI chatbot and explain your reasoning: "Here is a Node.js program that calls a synchronous function from inside an async function using `await`, then uses `.then()` to get the resolved value. I predict the output appears in this order: [your order], because [your reasoning]. Am I right?"
3. Run the program and compare.
4. A second version, `callsync2.js`, is the same but removes the `await` when calling `syncFunc()`. Predict how the output changes, check with the AI, then run it.

Result: `asyncCaller()` returns a Promise as soon as it reaches the first `await`, so the mainline code keeps running and prints `Finished.` before the `.then()` callback runs. An async function always returns a Promise, and a `return` inside it resolves that Promise. The two ways to read a Promise's resolved value are `await` and `.then()`. In `callsync2.js`, without the `await`, `asyncCaller()` runs all the way through before the mainline resumes, but its `.then()` callback still runs after `Finished.`

## **Advanced Check for Understanding**
(You do not need to submit anything. This is just to check your understanding.)

1. What is the event loop responsible for?
2. What is the difference between the call stack and a queue?
3. Why is Node strong for I/O-heavy applications?
4. Why is Node not always best for CPU-heavy work?
5. When should streams be considered?
6. What does an async function always return?

