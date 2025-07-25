# **Lesson 1 — Introduction to Node**

## **Lesson Overview**

**Learning objective**: Students will gain foundational knowledge of the Node JavaScript environment.  They will learn about the Node event loop.  Students will gain some familiarity with the Node capabilities that are not present in browser side JavaScript, such as file system access and HTTP servers.  A refresher on asynchronous programming is included.

**Topics**:

1. What is Node?
2. Running Node
3. Syntax differences between Node and browser side JavaScript
4. Other Important Differences between Node and Browser JavaScript
5. File System Access with Async Operations
6. More on Async Functions

## **4.1 What is Node**

The JavaScript language was created to run inside the browser, so as to create rich and responsive web applications.  It is an interpreted language that is platform independent, running on Mac, Linux, Windows, and other platforms.  Browser side JavaScript runs in a sandbox.  The code you run in the browser is loaded from the Internet and can't be trusted, so there are things that JavaScript isn't allowed to do when running in the browser, like accessing the local file system or opening a server side socket. To provide security protections, browser side JavaScript runs in a sandbox, a protected area that blocks off various functions.

A while back, some folks at Google had the thought: There are a lot of JavaScript programmers.  Wouldn't it be nice if they could write server side code in JavaScript? Wouldn't it be nice if they could develop web application servers in JavaScript?  At the time, the other leading platform independent language was Java, a far more complicated language.

So, they created a version of JavaScript that runs locally on any machine, instead of in the browser. They created Node, short for Node.js.  This version of JavaScript has no sandbox. In Node, you can do anything that one could do in other programming languages, subject only to the security protections provided by the operating system.

But, there was a problem. JavaScript is single threaded. So, if code for a web application server were doing an operation that takes time: file system access, reading stuff from a network connection, accessing a database, and so on, all the web requests would have to wait.  The solution is the event loop.  If a "slow" operation is to be performed, the code makes the request, but does not wait for it to complete. Instead, it provides a callback that is called when the operation does complete, and continues on to do other stuff that doesn't depend on the outcome of the request.  There is a good video that gives the details here: [What the heck is the event loop?](https://www.youtube.com/watch?v=8aGhZQkoFbQ).  That video may give more information than you want or need now, but check it out at your leisure.  The stuff is good to know.  When you call an asynchronous API in the event loop, you are calling into an environment that is written in C++, and that environment **is** multithreaded.  Your request is picked up from the queue, and handed off to a thread, and that thread does the work, perhaps blocking for a time, but eventually issuing the callback. The event loop is present in both browser based JavaScript and Node, but there are more capabilities in the Node version.

Because of this approach, web application servers written in JavaScript are faster than those written in Python or Ruby. Those languages don't do as much in native code, at least for asynchronous operations, so web application servers in these languages have to be multithreaded, at a significant performance cost.  Web application servers in Node are pretty fast, though not quite as fast as those in C++ or Rust.  Java is also faster than Node in some scenarios, such as those where multiprocessing can be leveraged to advantage.  There are still some kinds of functions for which JavaScript is not a good choice, such as intensive numerical calculations.

Here is a basic video summary of node capabilities: [What is Node.js?](https://youtu.be/uVwtVBpw7RQ)

## **4.2 Running Node**

At your terminal, type `Node`.  (You should have completed the setup assignment.  If this command doesn't do anything, go back and do the setup.)  This starts the environment, and you can enter and run JavaScript statements.  Try a console.log().  You may notice one difference from the browser environment.  Where does the output appear?  It appears in your terminal.  Obvious, right?  If you open up the console in your browser developer tools, you will not see the output for Node console.log() statements.  We have had some folks fresh from the React class who develop a Node/Express application, put console.log() debugging statements in, and go to the browser console to see them.

You should have set up your `node-homework` repository and folder.  In the terminal, cd to that folder and start VSCode.  Create a first.js file in the assignment1 directory, with a console.log() statement in it.  Start a VSCode terminal, and type "node ./assignment1/first".  This is how you tell Node to start a program you write.  You do not have to give the `.js` extension.  Ok, so much for the very simple stuff.

## **4.3 Syntax Differences between Node and Browser Based JavaScript**

There are a couple of syntax differences in Node.  Browser side JavaScript follows the ESM standard for importing and exporting functions and objects to/from other modules.  In browser side JavaScript, you load other modules as follows:

```js
import { useState, useEffect } from 'react';
```

Node does this CJS style.  In Node, you would do an equivalent like:

```js
const { register, logoff } = require("../controllers/userController");
```

In ESM JavaScript, you typically do named exports, like:

```js
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b
}
```

Or, alternately, you could do a default export, as follows:

```js
export default { add, multiply }
```

Whereas in CJS, you'd do:

```js
module.exports = { add, multiply }
```

The ESM syntax is also supported in Node.  In that case, you use files with extension `.mjs`.  However, **we will use CJS in this course.**  So get used to doing `require`.  By the way, combining ESM and CJS in one project is a messy business, but it can be done.  We won't be doing that.

## **4.4 Other Important Differnces between Node and Browser JavaScript**

In browser side JavaScript, you always have access to the window and document objects, and through them, you have access to the DOM.  For Node, there is no window, no document, and no DOM.

What you have instead in Node is a global object. This includes the following attributes and functions:

- process: This has information about the currently running process, including, in particular, all the environment variables, which are key-value pairs in `process.env`.  `process.argv` contains the arguments that were passed when Node started this program from the command line.  `[process.argv[0]` has the fully qualified filename of the node program.  When node starts a program you specify, `process.argv[1]` has the fully qualified name of that program. If other arguments are passed when the program is started, they show up as subsequent entries in the `process.argv` array.
- __dirname: The directory where the current module resides.
- __filename: The fully qualified filename of the current module.
- console: console.log() is available, just as it is in client side JavaScript.
- module: This is not actually a global, because each module in the program has a different module object. The fully qualified filename of the current module is in `module.name`.  `module.exports` contains the variable from the module that is exported and is returned when another module does a require() for this one. This might be a function, a value, or, often, an object with various functions and/or values. 
- require(): Used to get access to exports from other modules.  If a module calls `require("http")`, it is loading the library called http from Node or from one of the packages installed using npm.  If a module calls `require("../utils/parser")`, it is loading the `../utils/parser.js` module, where the pathname is relative to the current module.  Also, if `require.name` equals the current module, the current module is the one that was started by node.

The variables you declare inside of a node module are available only within that module, unless you export them, or unless you attach them to the global object, like:

```js
global.userName = "Joan";
```

The latter is usually a bad practice.  Don't export non-constant values from a module.  If these values change, the modules that access them via require() won't get the new values.  On the other hand, if you export a constant object, any module with access can mutate that object, and all other modules do see the new values within the object.  The same is true if you export a constant array.

On the Node side: You also have file system access, process information and control, local operating system services, and networking APIs.  The last is important.  You can open a web server socket in Node.  You can't do these things in browser side JavaScript, because they are forbidden by the browser sandbox protections, and because the APIs don't exist there.  You can also start Node programs with command line arguments.  You can also read input from and write output to a terminal session.  There are an extensive series of publicly available libraries for Node, such as Express, and many others you will use in this class.  For example, there is NodeGui, which allows you to write native graphical user interfaces without any involvement of a browser -- but we won't use that one in this class.

Because Node runs on a server, and not on the browser, you can safely store secrets.  It is quite possible to do database access from a browser front end, but you'd rarely want to do this.  To access a database you need a credential.  There is no place to securely store a credential on a browser front end. The same applies to any network service protected by a credential.  Node processes can access them securely, but JavaScript in the browser can't.

Node provides a REPL, which stands for Read Evaluate Print Loop.  It is just a terminal session with Node, into which you can type JavaScript statements, and they'll execute.  You start it by just typing `Node`.

You have used npm to do package management for your React project.  We will also use npm to do package management for your Node project.

## **4.5 File System Access with Async Operations**

As we've said, Node let's you access the file system.  The functions you use are documented here: [https://nodejs.org/api/fs.html](https://nodejs.org/api/fs.html).  You will see some synchronous file access functions.  You could, for example, do:

```js
const fileHandle = fs.openSync("./tmp/file.txt", "w);
```

You might call such functions if you are doing some scripting on the server.  But you would never do this in a web application.  While the synchronous call is occurring, not only would the originator of the HTTP request have to wait, all requests coming to your application server would have to wait, which is not acceptable.

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

What order do you think the logged lines will appear when your run this program?  The answer is that you will see "last statement" printed first, followed by "file open succeeded."  The asynchronous fs.open() call just tells the Node event loop to do the open and continues on to output "last statement".  Then the event loop completes the file open and does the callback.  And then you see the other message.

Now, clearly, if you were to write a line to this file, you'd have to do it in the callback, so that you have access to the file handle.  That call would also be asynchronous, with a callback.  If you want to write a second line, you'd have to do that write in the second callback.  And so on, to "callback hell".  You could keep your file legible through clever use of recursion, but it's still messy.  Now, as you know, we have promises in JavaScript.  So, one choice would be to wrap the async call in a promise, as follows:

```js
const fs = require("fs");

const doFileOperations = async () => {
  // we need this separate function because you can't do an await 
  // statement in mainline JavaScript code
  filehandle = await new Promise((resolve, reject) => {
    fs.open("./tmp/file.txt", "w", (err, filehandle) => {
      return err ? reject(err) : resolve(filehandle);
    });
  });
};

try {
  doFileOperations();
} catch (err) {
  console.log("an error occurred.");
}
```

Please look carefully at how this is done.  You will need to do it from time to time, because some functions that you will need to use only support callbacks.  The wrappering isn't very hard.  Every time you do the wrapper, it looks just the same.  You do need the try/catch once you wrapper the function.  Of course, the advantage is that subsequent file operations, also wrappered the same way, could be added without having to create a nested series of callbacks.  Be careful when you create such a wrapper.  The callback inside your wrapper must always call resolve() or reject(), or your process hangs.

Fortunately, most Node functions do support promises.  There are promise based versions of all the file system functions.  So, you can do:

```js
const fs = require("fs/promises"); // get the promise enabled version of the API

const doFileOperations = async () => { // you can't use await in mainline code, so you need this
  const fileHandle = await fs.open("./tmp/file.txt", "w");
}

try {
  doFileOperations();
} catch (err) {
  console.log("an error occurred.");
}
```

This is the way you'll do file I/O for the most part.  Once you have the fileHandle, you can do `fileHandle.read()`, `fileHandle.write()`, and `fileHandle.close()`, all of them async functions you call with await.

### **util.promisify()**

In the `util` package, which is part of the node base, there is a slick way to wrapper functions that use callbacks to convert it to a function that returns a promise.  Many functions have a signature like:

```js
function fnWithCallback(arg1, arg2, arg3, (err, return)) {

}
```

The arguments may be required or optional, but the last argument is required.  That's for the callback, and it has to pass err as the first parameter and the return value as the second parameter.  You can do:

```js
const { promisify } = require("util");
const fnWithPromise = util.promisify(fnWithCallback);
```

From an async function, you can now call `fnWithPromise` with an await:
```js
const result = await fnWithAsync(arg1, arg2, arg3);
```

If the original function returns an error in the callback, the wrapper does a reject(err) for the promise, which you can catch of you call `fnWithAsync` in a try/catch block.

The promisify function doesn't work in all cases.  For example, `setTimeout((cb), interval)` doesn't have the right function signature.

## **4.6 More on Async Functions**

The flow of control in async functions has certain traps for the unwary, so it is wise to understand it fully.  In your `node-homework/assignment1` folder are two programs called `callsync.js` and `callsync2.js`.  Here is the first of these:

```js
function syncfunc() {
    console.log("In syncfunc.  No async operations here.")
    return "Returned from syncfunc."
}

async function asyncCaller() {
    console.log("About to wait.")
    const res = await syncfunc()
    console.log(res)
    return "asyncCaller complete."
}

console.log("Calling asyncCaller.")
const r = asyncCaller()
console.log(`Got back a value from asyncCaller of type ${typeof r}`)
if (typeof r == "object") {
    console.log(`That object is of class ${r.constructor.name}`)
}
r.then(resolvesTo => {
    console.log("The promise resolves to: ", resolvesTo)
})
console.log("Finished.")
```

See if you can guess which order the statements will appear in the log.  Then run the program.  Were you right?

The asyncCaller() method calls syncfunc(), which is a synchronous function, with an await.  This is valid, and the await statement returns the value that syncfunc() returns.  But asyncCaller() is an async function, so it returns to the mainline code at the time of the first await statement, and what it returns is a promise.  Processing continues in asyncCaller only after the `Finished` statement appears, because that is the point at which the event loop gets a chance to return from await.  The subsequent `return` statement in asyncCaller is different from a `return` in a synchronous function.  A return statement in an async function does something extra: It resolves the promise returned by the async function to a value.  

There are two ways to get the value a promise resolves to, those being, `await` and `.then`.  We can't do `await` in mainline code, so we use `.then` in this case.  The `.then` statement provides a callback that retrieves the value.  But the mainline code doesn't wait for the `.then` callback to complete.  Instead it announces `Finished.`, and only when the callback completes do we see what the promise resolves to.  In general, you don't want to use `.then` in your code because `.then` requires a callback, and that takes you straight back to callback hell.

The other program, `callsync2.js`, is slightly different, and if you run it, you see that the order the logged statements appear in is slightly different.  The only functional change is that asyncCaller() does not do an await when it calls syncfunc(), so it runs all the way to the end of the function before the mainline code resumes.  But what asyncCaller returns is still a promise, and the `.then` for that promise still doesn't complete until after the mainline code reports the `Finished.`  Run this program to see the difference.  Async functions always return a promise.  You can use the `await` statement to call a synchronous function, or to resolve a promise, or to resolve a `thenable` which is an object that works like a promise, but may have additional capabilities.

### **Check for Understanding**

1. What advantages does Node have over other server side languages?

2. What are three things you can do in Node that you can't do in browser side JavaScript?

3. What would you not want to do in Node?

4. What are the two ways to obtain the value resolved from a Promise?

5. What are the principal syntactic differences between Node JavaScript and browser side JavaScript?

### **Answers**

1. Node is far simpler to learn than Java or Rust.  Many developers already know JavaScript because it is the native language for the browser front end.  C++ code is also more complex, and it is subject to dangerous memory reference errors.  Node's combination of a single threaded language with an event loop for asynchronous operations is highly performant.

2. In browser side JavaScript, you can't start a process, or start a server socket, or access the file system.  In browser side JavaScript, you have no access to hardware resources like the screen and the file system.

3. Node is not good for compute intensive operations, like numerical calculation.  For that, you'd want C++ or Python.

4. You can get the value resolved from a Promise using `await` or `.then`.

5. Most Node programs are written to the CJS standard, which uses require() instead of import.  The syntax for module exports is also different in the two languages.