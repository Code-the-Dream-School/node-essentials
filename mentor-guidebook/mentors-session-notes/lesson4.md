# Lesson/Assignment 4: Authentication Middleware, Tasks, Validation

## Task Request Handler Methods

We need the following (the standard CRUD)
- create
- show
- index
- update
- deleteTask
Note: “delete” is a reserved word in JavaScript.  

All of these have parameters (req, res) and usually next.  Any of these may be declared as async, but we aren’t using a database yet, so we don’t need async/await in these functions yet.  Your assignment shows a closure.  Try to understand that code – it’s a good trick to know, and a standard interview question.

## Storing/modifying Tasks

We are using global.tasks for now, because we aren’t yet using a database.  This is an array.  You can add a new entry with global.tasks.push().  Each task has to correspond to a user, so we use task.userId = global.user_id.email.

Be careful how you mutate these entries.  You need to modify a task objects before passing them to res.json(), so that you don’t include the userId.  But you better not modify the ones in global.tasks.  So you need to make a copy.  On the other hand, update() modifies the task in place.  You use Object.apply().  You use global.tasks.splice() to delete a task.

## Authentication and Access Control for Tasks

Each task belongs to a user.  You need to be sure that a user is logged in before any task controller method is called, else a 401 should be sent back.  You use middleware for this.  That solves the authentication problem.

For access control, you need to be sure that no task object is accessed either for reading or writing unless it belongs to the logged on user.  

For index(), you can use global.tasks.filter().  This gives you an array of tasks – but, be careful, the entries in this list are references to tasks in global.tasks, so you have to be cautious in how these are mutated.  Every task method has to filter on userId.

This access control is completely insecure now, because once global.user_id is set, any user can access the corresponding tasks.

## Validation

You don’t want bogus entries to be stored.  You use Joi validation.  You define the schemas for create and patch.

Before you do each validation, you need to check if req.body is undefined.  If you pass undefined to Joi validation, it does not report an error, but the value that it returns is undefined – not what you want.  Your could could do:
```js
if (!req.body) req.body = {};
```
Then Joi will recognize the error.

Before you do show(), update(), or delete(), you need to get the id from req.params and convert it to a number.  So you need a check like:
```js
const id = parseInt(req.params?.id);
if (!id) { // might be NaN
  return res.status(400).json(message: “No valid id passed.”);
}
```

If Joi validation fails, you need to return a 400, an error message, and details on the failure.  You could do this in your request handler as follows:
```js
  if (error) {
    return res.status(400).json({ message: "Validation failed",
    details: error.details,
  });
```
But, this doesn’t follow the DRY principle: Don’t Repeat Yourself. You would repeat this exact code for user register and task create/update.  A better way is this:

```js
if error return next(error); // this throws it to the global error handler
```

Then, in your global error handler, you would add code like this:
```js
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed",
      details: err.details,
  });
```
Be careful with your Joi patch schema!  The default value for isCompleted is false, but you don’t want that default in your patchTaskSchema, or it will add that to each update!

## Hashing Passwords

A cryptographic hash is a one way function.  It is computationally infeasible to derive the plaintext from the hash – at least if you use strong cryptography.  But, given some plaintext, you always get the same hash.  Never store passwords, always just the hash.

The salt is a cryptographically random string, which is concatenated with the password before computing the hash.  Then the salt is concatenated with the hash and both are stored.  The process can be repeated at logon time to check the password.

Why you need the salt: In the rainbow attack, the attacker somehow gets access to all the hashed passwords.  Then they compare these hashes against hashes of the 10000 most commonly used passwords, and as often as not they’ll get a match.  The salt makes this harder.  They’d need to compute the hashes of each of the salt values concatenated with each of the 10000 most used passwords – a much more time consuming project.
