# **Assignment 7 — Authentication with Passport and JWTs**

## **Assignment Instructions**

This assignment is to be created in the node-homwork folder.  As usual, create your assignment7 git branch.  Then npm install the following packages:

- passport
- passport-local
- passport-jwt
- jsonwebtoken
- cookie-parser

You can use `npm run tdd assignment7` to run tests for this assignment.  

## **The User Service**

Create a services folder within node-homework.  Within that folder, create a file called `userService.js`.  The top of the file should read as follows:

```js
const prisma = require("../db/prisma");
const crypto = require("crypto");
const util = require("util");

const scrypt = util.promisify(crypto.scrypt);
```

You need prisma to read/write from the database.  You do NOT store the user passwords -- ever!.  If your database were ever compromised, all the user passwords would be disclosed.  You do not need to store user passwords.  Instead, at user registration, you create a random salt, concatenate the password and the salt, and compute a secure hash.  You store the hash plus the salt.  Each user's password has a different salt.  When the user logs on, you get the salt back out, concatenate the password the user provides with the salt, hash that, and compare that with what you've stored.  You need a cryptography routine to do the hashing.  The scrypt algorithm is a good one.  Many times bcrypt is used, but it has some weaknesses, so it is passé.  Scrypt is the old callback style, so you use util.promisify to convert it to promises.

The code continues as follows:

```js
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
```

This code implements the hashing described.  You can stare at it a bit, but your typical AI helper can provide this code any time.  There's not much to learn or remember.  Now for the meat:

```js
async function createUser(data) {
  const hashed = await hashPassword(data.password);
  delete data.password;
  return await prisma.user.create({
    data: { ...data, hashedPassword: hashed },
  });
}

async function verifyUserPassword(userId, inputPassword) {
  const user = await prisma.user.findFirst({ where: { email: { equals: userId, mode: "insensitive" }}});
  if (!user) return { user: null, isValid: false };
  return {
    user,
    isValid: await comparePassword(inputPassword, user.hashedPassword),
  };
}

module.exports = { createUser, verifyUserPassword };
```

The createUser function is to be passed the information the user provides: a name, an email, and a password.  Before you call create user, you would call your validation function for the userSchema to make sure that everything is syntactically correct, that the password is not trivial, etc.  The createUser function can cause a rejection (error thrown from within an async operation), most likely because someone else already has registered a user record with that email.

The verifyUserPassword is passed a userId (email) and password at logon time.  If there is a user with that email and the password matches, that's success.

Now for a unit test: Start the node command line, and enter

```js
> const { createUser, verifyUserPassword } = require("./services/userService")
> await createUser({name: "Jim", email: "jim@sample.com", password: "magic"}}
```

This should create the user, with appropriate gobbledygook in the hashedPassword column. Next try:

```js
> await verifyUserPassword("jim@sample.com", "magic")
```

All looks correct.  Your code is working.  This is a simple way to do some manual unit testing.

## **Configuring Passport**

We are going to configure two passport strategies.  Create a passport directory within node-homework.  Within that, create a passport.js file. That file should start out with the following require statements:

```js
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { Strategy: JwtStrategy } = require("passport-jwt");
const { verifyUserPassword } = require("../services/userService");
```

The local strategy configuration should look like this:

```js
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    }, 
    async (username, password, done) => {
      try {
        const { user, isValid } = await verifyUserPassword(username, password);
        if (!isValid)
          return done(null, null, { message: "Authentication failed." });
        return done(null, user); // this object goes to req.user.
      } catch (err) {
        return done(err);
      }
    },
  ),
);
```

The first argument passed, which is optional, is nowhere documented in Passport.  This is, ahem, bad.  The defaults are "username" and "password", but we are using "email" and "password", and we have to tell passport that, a fact which the developers elected not to disclose.  So, please try to remember this for the future.  That first object tells passport which values from a req object are to be used for authentication.

The second argument is a function.  You are telling the passport local strategy to call this function at authentication time, so that you can do the authentication.  Your function, which might be async, is going to be passed the email, the password, and a callback.  Yeah, a callback.  Passport doesn't do promises.  Inside the function, you do the actual validation, using the verifyUserPassword function created previously.  Once the validation returns, you report the result via the callback.  The first argument to the callback is the error, if one was thrown, or null otherwise.  The second argument is the user object you got back from verifyUserPassword, if the verification succeeded, or null if it didn't, in which case you can also pass back a message.

This is the Passport strategy you use at logon time.  You also need a strategy to validate the JWT cookie for the session, with every protected request.  And that one looks like:

```js
const cookieExtractor = (req) => req?.cookies?.jwt || null;
const jwtOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET,
};
passport.use(
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    return done(null, jwtPayload);
  }),
);
```

You are telling the Passport JWT strategy how to get the token out of the req.  In this case, it's a cookie named "jwt", so it's at req.cookies.jwt.  You are also providing the secret that is used to sign the token, so that it can be validated.  We better put a JWT_SECRET into .env:

JWT_SECRET=yLVNRLD35rNgnswAjyxxokZpdnUOqhlB

This is the secrete used to sign the JWT, and also to verify the signature.  There are various ways to get a good random secret.  Here is one: [https://www.random.org/strings/](https://www.random.org/strings/).  Don't use the one above, it's public, because it's in this page.


At this point, a unit test might be nice.  But, hmm, we have callbacks all over the place.  Here is a unit test you might try, if you paste it into a temporary javascript file:

```js
require("dotenv").config();  // we need the JWT secret
require("./passport/passport"); // This configures the Passport strategies
const passport = require("passport");
const jwt = require("jsonwebtoken");

let myResolve;
let promise;
let req;

const errorReporter = (e) => {
  if (e) {
    console.log("error: ", e.message);
  }
};
const reportPassportResult = (err, user) => {
  if (err) {
    console.log("error returned", err.message);
  } else if (user) {
    console.log("user returned", JSON.stringify(user));
  } else {
    console.log("authentication failed, we better send a 401");
  }
  myResolve();
};

const theTest = async () => {
  console.log("for this test, passport should report back with the user info");
  promise = new Promise((resolve) => {
    myResolve = resolve;
  });
  req = { body: { email: "jim@sample.com", password: "magic" } };

  passport.authenticate("local", reportPassportResult)(req, {}, errorReporter);
  await promise;

  console.log("for this test, passport should report that authencation failed");
  promise = new Promise((resolve) => {
    myResolve = resolve;
  });
  req = { body: { email: "jim@sample.com", password: "notMagic" } };
  passport.authenticate("local", reportPassportResult)(req, {}, errorReporter);
  await promise;

  console.log("for this test, passport should return the user info");
  let token = jwt.sign(
    { name: "Frank", email: "frank@sample.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  req = { cookies: { jwt: token } };
  promise = new Promise((resolve) => {
    myResolve = resolve;
  });
  passport.authenticate("jwt", reportPassportResult)(req, {}, errorReporter);
  await promise;

  console.log(
    "for this test, passport should report that authentication failed",
  );
  token = jwt.sign(
    { name: "Frank", email: "frank@sample.com" },
    "wrongsecret",
    { expiresIn: "1h" },
  );
  promise = new Promise((resolve) => {
    myResolve = resolve;
  });
  req = { cookies: { jwt: token } };
  passport.authenticate("jwt", reportPassportResult)(req, {}, errorReporter);
  await promise;
};

try {
  theTest();
} catch (e) {
  console.log("error occurred: ", e.message);
}
```

Yeah, a little long for a unit test.  You can try it if you like. **This code is important because it shows how Passport works.**  Each time we call passport, we have to provide a callback.  The myPassportCallback is the one we use for the test, because it gives the results that Passport returns.  We want to wait on the completion of each test.  So we create a Promise each time, and the myPassportCallback resolves the promise when it completes.  Then we can just wait on the promise.  

**Note the following point carefully.**  This passport function call:

```js
passport.authenticate("local", reportPassportResult)
```

Returns what, actually?  The answer is, it returns **a middleware function**, the middleware to be used for the "local" strategy.  But the actual authentication hasn't occurred yet.  It doesn't happen until that middleware is called.  We might write:

```js
const passportMiddleware = passport.authenticate("local", reportPassportResult)
```

We call the middleware with a req, a res, and a next.  Passport doesn't care about most of the req.  All it's going to look at, in the case of the local strategy, is the body, and in particular, the email and password attributes of the body.  Also we need a res and a next. Passport doesn't care about the res, so we can just pass {}.  The next, though, is a function Passport will call if there's an error.  We can use the errorReporter function declared above, but in your actual application, the error handler for your app is invoked when Passport calls `next(err)`.  Now we can do:

```js
req = { body: { email: "jim@sample.com", password: "magic" } };
passportMiddleware(req, {}, errorReporter);
await promise;
```

And, lo and behold, we get the user information back, just as passport got it from the database.  If we specify a bad password, we get a report of authentication failure.

For the jwt side, we need a JSON web token.  That's done as follows:

```js
  let token = jwt.sign(
    { name: "Frank", email: "frank@sample.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
```

The payload is just an object.  We provide an expiration time, so that this credential will time out.  We call passport to get the middleware for the jwt strategy, specifying our callback to obtain the result.  Then we call that middleware with a req, a res, and a next.  The difference this time is that the req has the token in a cookie, as follows:

```js
 req = { cookies: { jwt: token } };
 ```

 And the test shows that passport does return the payload if the signature is valid.  Use a bad secret to sign the jwt, and then passport reports that authentication failed, as it would also do if the token had expired.

 ## **The User Controller**

 The Passport configuration and the cookie-parser middleware have to be added to app.js:

```js
require("./passport/passport");
const cookieParser = require("cookie-parser")
app.use(cookieParser())
```

 Create a file in your controllers directory called userController.js, with the following methods, each of which takes a req and a res.

 - register
 - login  (this one also needs a next parameter, because it calls Passport.  The next should be passed to the Passport middleware.)
 - logout

 If register or login completes successfully, we want the user to be logged on.  Each of those functions has to set the cookie.  

 
  Here is what they must call:

 ```js
 const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, name: user.name, csrfToken: randomUUID() };
  req.user = payload;
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";

  // Set cookie
  res.cookie("jwt", token, {
    ...((process.env.NODE_ENV === "production") && { domain: req.hostname }), // add domain into cookie for production only
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
    maxAge: 3600000,
  });
};
```

The JWT token has to include the CSRF token, to prevent against that kind of attack.

The login and register methods have to do one thing more.  They have to return the CSRF token to the front end in the body of the response, so that CSRF attacks can be avoided.  They can also return the user's name, so that the front end can show who is logged in.  After the call to setJwtCookie, that information is in req.user, so it can be extracted and sent back in the body of the response.

All that logoff does is clear the cookie and send back an empty body:

```js
const logoff = async (req, res) => {
  res.clearCookie("jwt");
  res.json({});
};
```

You have enough information that you can implement the login and register methods.  Write them now.  Hint: What function does register() call to create the user?  Hint 2: How do you check to make sure that a valid object is provided to register?

## **The User Router**

Create a file, `/routes/user.js`.  In it create a router with POST routes for logon, register, and logoff.  Export the router.  In app.js, require the router you exported.  But remember, you have to wrap the routes, to make sure you catch rejections.  Use the function exported by `/util/rejectionHanler`, and then add an app.use() statement for the wrapped route.  All of this is stuff you've done before.

Now, run your app, and: Test these new routes with Postman!  If they don't work, use the debugging techniques you've learned.

##  **Middleware For Protected Routes**

You still haven't protected anything!  The user can register and logon, but they can do all operations on tasks without logging on.  Create a file called `/middleware/auth.js`.  This middleware must do three things:

1. It must check to see if there is a JWT token.  If the token is not present, or if the signature doesn't match, it should do a 

```js
return res.status(401).json{message: "Not authorized."}
```
How do you check the JWT? That is what the Passport JWT strategy is for.

2. If the authentication succeeds, the middleware must set `req.user = {id: user.id}`.  This is so that subsequent request handlers know who is performing the operations and can apply appropriate access control.

3. The middleware must check that the CSRF token is supplied in the header, and that the value in the header matches the value in the payload of the JWT.  If not, it returns a 400, with JSON that says, "bad request", and returns.

If both the JWT and CSRF token are good, the middleware calls next().  This grants access to the protected route.

Here is the corresponding code:

```js
const passport = require("passport");
const { StatusCodes } = require("http-status-codes");

module.exports = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    req.user = user;
    if (["POST","PATCH","PUT","DELETE","CONNECT"].includes(req.method)) {
        if (req.get("X-CSRF-TOKEN") != req.user.csrfToken) {
                return res
                  .status(StatusCodes.BAD_REQUEST)
                  .json({ message: "Bad Request." });
        }
    }
    next();
  })(req, res, next);
};

```

You can't do an `app.use()` for this middleware.  That would protect every route, and no user would be able to log in.  You only put it on the routes that must be protected.  All the task routes must be protected.  You currently have something like:

```js
app.use("/tasks", wrapRoutes(taskRouter));
```

You add the middleware as follows:

```js
const auth = require("./middleware/auth");
app.use("/tasks", auth, wrapRoutes(taskRouter));
```

That does it!  Now these routes are protected.  One more route should be protected, this one inside the user router.  That's logoff.  It is best practice to protect logoff from cross site request forgery in this way.

## **Testing Protected Routes**

You have now broken many of your Postman tests, most of the ones behind the protected routes.  You need to send two things with each request on the protected routes: 

1. the cookie, which is sent automatically if you do the logon first, and 
2. the CSRF token.  

Do the logon request, and then try each of the Postman tests for protected routes.  You should get "Bad Request" reported back for everything but the GET requests.  The CSRF token is not needed for GET requests.  But for the task POST, the task PATCH, the task DELECT, and the logoff POST, you need to put the token in the header.

The token is sent in response to register and logon.  You can catch it as it is sent.  Open the Postman request for logon, and click on the Tests tab.  Add the following:

```js
const jsonData = pm.response.json();
pm.environment.set("csrfToken", jsonData.csrfToken);
```

This adds the token to the environment.  Do the same for the register test, so that you catch it at that time as well.  Then, for each of the Postman task requests and the logoff request, open the authorization tab, and add a key of X-CSRF-TOKEN with a value of `{{csrfToken}}`.  This puts the token value from the environment into the request.  Now everything should be working again! 

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment7` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment7` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
