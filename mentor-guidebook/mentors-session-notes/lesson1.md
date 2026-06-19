# Lesson/Assignment 1: Introduction to Node

## Session focus

Help students understand Node as a JavaScript runtime outside the browser, then connect that idea to the assignment tasks: globals, modules, asynchronous file work, and core modules.

## Core + advanced pacing note

The updated course materials start using a **Core + Advanced** structure. Core material is what students need in order to keep moving through the course. Advanced material is optional enrichment and should not block students from progressing.

## Key concepts to emphasize

- Node runs JavaScript outside the browser.
- Browser JavaScript is sandboxed; Node can access the local machine through modules like `fs`, `path`, and `os`.
- Node still runs JavaScript on one main call stack, so async APIs and the event loop are important.
- In this course, students use CommonJS: `require()` and `module.exports`.
- Node has built-in modules, official documentation, and third-party packages through npm.

## Suggested flow

1. Start with Node vs browser JavaScript.
2. Review the call stack, event loop, and non-blocking operations.
3. Show callback, Promise, and async/await versions of file reading.
4. Show common globals: `__dirname`, `__filename`, `process`, and `global`.
5. Connect built-in modules to Assignment 1: `fs`, `path`, and `os`.
6. Explain why streams matter for large files without going too deep.

## Common student issues

- Looking for `console.log()` output in the browser instead of the terminal.
- Forgetting that async functions return Promises.
- Mixing CommonJS and ESM syntax.
- Creating `sample.txt` manually when the assignment asks the script to create it.
- Failing tests because output formatting does not match exactly.

## Assignment reminders

Students should work in `assignment1` and run:

```bash
npm run tdd assignment1
```

Remind students that the tests expect exact strings, capitalization, and spacing.
