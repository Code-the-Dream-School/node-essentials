# **Assignment 8 — Authentication with Passport and JWTs**

## **Assignment Instructions**

This assignment is to be created in the node-homework folder.  As usual, create your assignment8 git branch.  Then npm install the following packages:

- passport
- passport-local
- passport-jwt
- jsonwebtoken
- cookie-parser
- cors
- express-xss-sanitizer
- express-rate-limit
- helmet

You can use `npm run tdd assignment8` to run tests for this assignment.  

## **Configuring Passport for Logon**

We are going to configure two passport strategies.  Create a passport directory within node-homework.  Within that, create a passport.js file. That file should start out with the following require statements:

```js
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { verifyUserPassword } = require("../services/userService");
```

The local strategy configuration should look like this:

```js
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    }, // Note: this piece of configuration, as critical as it is, is not documented
    // in the passport documentation, which is very very bad.  This is how you tell
    // passport to extract the username (in this case the email) and the password from
    // req.body.  Remember this!
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

The first argument passed, which is optional, is nowhere documented in Passport. This is, ahem, bad. That first object tells passport which values from a req object are to be used for authentication. The defaults are "username" and "password", but we are using "email" and "password", and we have to tell passport that, a fact which the developers elected not to disclose.  So, please try to remember this for the future.  

The second argument is a callback.  You are telling the passport local strategy to call this function at authentication time, so that you can do the authentication.  Your function, which might be async, is going to be passed the email, the password, and a callback.  Inside the function, you do the actual validation, using the verifyUserPassword function created previously.  Once the validation returns, you report the result via the callback.  The first argument to the callback is the error, if one was thrown, or null otherwise.  The second argument is the user object you got back from verifyUserPassword, if the verification succeeded, or null if it didn't, in which case you can also pass back a message.

The verifyUserPassword function might throw an error, for example if the database is down. In this case, is very important to catch this error if it is thrown.  You will be in a callback from an Express route handler at this point.  An error thrown from within a callback crashes the Express server.

This is the Passport strategy you use at logon time.  

When you configure a strategy, you are telling passport what to call if you do:

```js
passport.authenticate("local", callback)
```

**Note the following point carefully.**  What does the passport.authenticate() function return, actually?  The answer is, it returns **a middleware function**, the middleware to be used for the "local" strategy.  But the actual authentication hasn't occurred yet.  It doesn't happen until that middleware is called.

We call the middleware function with a req and a res.  Passport doesn't care about most of the req.  All it's going to look at, in the case of the local strategy, is the body, and in particular, the email and password attributes of the body.  Also we need a res. Passport doesn't care about the res, so we can just pass {}.  Now suppose we have a user already registered, with email "jim@sample.com", and password "wX23-combo".  (You could run your server and do a Postman register request to set this up.)  For a little unit test, we could do the following.  Create a test folder, and within it a file called ppLocalUnitTest.js, with the following contents.

```js
require("../passport/passport");
const passport = require("passport");
const req = { body: { email: "jim@sample8.com", password: "wX23-combo" } };
const reportPassportResult = (err, user) => {
  if (err) {
    return console.log("An error happened on authentication:", err.message);
  }
  if (user) {
    return console.log("Authentication succeeded, and the user information is:", JSON.stringify(user));
  }
  console.log("Authentication Failed" )
};
const passportLocalMiddleware = passport.authenticate("local", reportPassportResult);
passportLocalMiddleware(req, {});
```

And, lo and behold, we get the user information back, just as passport got it from the database.  If we specify a bad password, we get Authentication Failed.  And if the database is down, we get an error.  By the way, this is a good trick to learn: As you develop code, write unit tests for it.

The login() function in your user controller still uses the memory store, just to keep track of who is logged in.  You can now comment out that function.  Add a new route handler, this time in passport.js.  Here is what it should do:

```js
const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, name: user.name, csrfToken: randomUUID() }; // put a csrfToken in
  req.user = payload;
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration

  // Set cookie
  res.cookie("jwt", token, {
    ...(process.env.NODE_ENV === "production" && { domain: req.hostname }), // add domain into cookie for production only
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 3600000, // 1 hour expiration.  Ends up as max-age 3600 in the cookie.
  });
};

const logonRouteHandler = async (req, res, next) => {
  let user;
  user = await new Promise((resolve, reject) => {
    passport.authenticate("local", { session: false }, (err, user) => {
      return err ? reject(err) : resolve(user);
    })(req, res);
  });
  if (!user) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication failed" });
  } else {
    setJwtCookie(req, res, user);
    res.json({ name: user.name, csrfToken: req.user.csrfToken });
  }
};
```

**There are a number of subtleties here.  Pay close attention.**  

We need to set the cookie at logon time, to establish the session.  So, we create a signed JWT cookie.  The payload must contain the user.id, because we'll need to know who the user is on subsequent requests.  If it's in the cookie, we have the information we need.  We also put the csrfToken in the cookie.  We use a cryptographically random string.  We need the csrfToken in the cookie to protect against CSRF attack.  In the code above, we put in the user's name, which is not really necessary.  You could put other stuff in too, but a cookie should be kept small.  We set the JWT to expire in one hour.  As this back end is going to be at a different URL than the front end, the cookie is a cross-site cookie.  Browsers like Chrome discard cross site cookies unless the domain is set to match the domain of the back end, the secure flag is set, and the SameSite flag is set to "None".  We don't want JavaScript on the browser side to be able to see this cookie, so it has the HttpOnly flag.  The cookie expires when the JWT does, after one hour.  We sign the cookie with the secret.  That won't work until you set the JWT_SECRET in the .env:

JWT_SECRET=yLVNRLD35rNgnswAjyxxokZpdnUOqhlB

Because no one else has the secret, no one else can create a cookie the server will honor.  There are various ways to get a good random secret.  Here is one: [https://www.random.org/strings/](https://www.random.org/strings/).  Don't use the one above, it's public, because it's in this page.

**However:** In the development environment, setting up HTTPS for your server is messy.  If you don't have HTTPS, Chrome and other browsers will discard any cookie with the secure flag set.  And if the secure flag is not set, browsers won't accept cookies with the domain set, or with SameSite: "None".  So, in the development environment, SameSite is set to "Lax", and the secure flag and the domain are not set for the cookie.  Now, if we turn these flags off, the browsers won't accept a cross-site cookie.  So, we set up the environment so that the browser doesn't know that it is a cross-site connection.  We'll use the Vite proxy for that in a later lesson.  Postman has the same limitations as the browsers do as far as what kind of cookie can be set without HTTPS.  But because Postman is not a browser, it doesn't know if a cookie is a cross-site cookie.  So that works too.

At logon time, the logon route handler calls passport.authenticate to get the middleware function for the "local" strategy.  It then calls that middleware, and provides a callback.  In the code above, that callback is wrapped in a promise.  This is one of two styles for handling callbacks.  When the passport middleware function does the callback, it might return an error, for example if the database is down.  We have to call either resolve() or reject(), else the promise is never resolved and the server hangs.  So we call reject() for the error case.  The reject causes an error to be thrown and the await to complete.  We do not have to catch this error, because it doesn't happen inside callback.  The error handler will catch it.

Style two for handling the callback is as follows:

```js
const logonRouteHandler = async (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user) => {
    if (err) {
      return next(err);  // don't throw the error!
    } else {
      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Authentication failed" });
      } else {
        setJwtCookie(req, res, user);
        res.json({ name: user.name, csrfToken: req.user.csrfToken });
      }
    }
  })(req, res);
};
```

Because the callback is not wrappered in a promise, we **must** catch the error if any is thrown.  No error can be thrown in this case, so we don't need a try/catch, but the callback might be passed an error.  If it is, we **must** call next(err) instead of throwing the error, if we are to pass the error to the error handler.  If an error is thrown from inside the callback, the server process will crash with an unhandled exception.  Note: For this style of callback handling, when `await logonRouteHandler(req, res, next);` returns, the response hasn't been sent yet.  We'll need to handle that problem when testing.  Note also that for this style, the route handler has to have a next parameter passed. 

Finally, we have to include the csrfToken in what is sent back to the front end.  For CSRF protection, the front end has to include this token in each subsequent request.  We will put it in the X-CSRF-TOKEN header.

You got all that?

## **Configuring Passport to Authenticate the Session**

You need to have a second Passport strategy.  This one validates the JWT in the cookie for every request after logon.  First, you configure the strategy:

```js
const { Strategy: JwtStrategy } = require("passport-jwt");
const cookieExtractor = (req) => req?.cookies?.jwt || null;

const jwtOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    return done(null, jwtPayload);
  }),
)
```

You are telling passport how to validate the cookie with each request.  It just checks to see if the signature is correct and if the JWT hasn't expired.  You can have a little unit test for this as well.  Create the file jwtUnitTest.js in your test directory, with this content.  Then run it.

```js
const jwt = require("jsonwebtoken");
const passport = require("passport");
require ("../passport/passport");

let token = jwt.sign(
  { name: "Frank", email: "frank@sample.com" },
    process.env.JWT_SECRET,
  { expiresIn: "1h" },
);
const req = { cookies: { jwt: token } };
const reportPassportResult = (err, user) => {
  if (err) {
    return console.log("An error happened on authentication:", err.message);
  }
  if (user) {
    return console.log("Authentication succeeded, and the user information is:", JSON.stringify(user));
  }
  console.log("Authentication Failed" )
};
const passportJWTMiddleware = passport.authenticate("jwt", reportPassportResult)
passportJWTMiddleware(req, {});
```

 And the test shows that passport does return the payload if the jwt signature is valid.  Use a bad secret to sign the jwt, and then passport reports that authentication failed, as it would also do if the token had expired.

 You now have auth() middleware to check if the user is logged on, but it just checks a value in storage, which creates the problems described at the start of the lesson.  Add more code to the passport.js file to create this middleware:

```js
const jwtMiddleware = async (req, res, next) => {
  passport.authenticate("jwt", { session: false, failWithError: false }, (err, user) => {
    if (err) {
      return next(err); // never happens!!
    }
    if (user) {
      let loggedOn = true;
      if (["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)) {
        if (req.get("X-CSRF-TOKEN") != user.csrfToken) {
          loggedOn = false;
        }
      }
      if (loggedOn) {
        req.user = user;
        return next();
      }
    }
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
  })(req, res);
};
```

This calls the passport "jwt" strategy to determine if the JWT in the jwt cookie is valid.  If it is, we get the user object back.  We put that into req.user, so that it can be used for authorization decisions within protected routes.  But we still have to check the csrfToken.  We only care about that for certain request methods.  We don't need to check on a GET request.  If the token from the X-CSRF-TOKEN header doesn't match the one in the cookie, authentication fails.  If authentication succeeds, the middleware function calls next.  The jwt strategy we defined never calls `done(err)` so we can never reach the next(err) line, but it's good to have it, in case someone changes the code in the strategy.  What passport-jwt is doing is calling `jwt.verify()` to make sure the jwt in the cookie is valid.  `jwt.verify()` might throw an error.  If the `failWithError` option is not set, passport-jwt responds with a 401 and it's own error message, and never calls the callback for `passport.authenticate()`.  We don't want that, as the error message might not be what we want. We set `failWithError` to false, which means that the callback happens, even if the jwt is bad.  If the jwt is not valid, the callback returns a null user object.  We might want to give different error messages depending on whether the jwt has a bad signature or has expired.  In that case we'd do `failWithError: true`, but we'd have to do some other kind of complicated stuff. The options, `session` and `failWithError` are nowhere documented in Passportjs.  You have to read the source code.  

**An Aside about Passport:** It is not really clear here what value Passport is providing in our scenario, especially considering that the Passport documentation is atrocious.  If you moved the code from the "local" strategy into the logonRouteHandler, you wouldn't need to call Passport there.  And if you called jwt.verify() in jwtMiddleware, you wouldn't have to call Passport there either.  If you look at usage statistics on the npm website, you'll see that many many folks use Passport and the local and jwt plugins.  Somebody's getting value out of them, I guess.

## **Other Changes to Make Authentication Work**

The jwtMiddleware won't find the cookie in req.user without a parser to parse the request for that cookie.  So you need to add the following to app.js:

```js
const cookieParser = require("cookie-parser");
app.use(cookieParser(process.env.JWT_SECRET));
```

This should be done pretty early in the chain, so that the cookie is available when it is needed.

You need to change the user router for the logon route so that it calls the logonRouteHandler above.  You need to change the app.use() for the task router so that it uses the jwtMiddleware above, instead of auth.  You need to change the register() method so that it calls setJwtCookie(req.user) after storing the user record.  That way a user who has just registered is also logged on.  The register() function must also return the csrfToken in the body of the response. Finally you need to make two changes to the logoff.  You need to unset the cookie, as follows:

```js
res.clearCookie("jwt");
```

Also, make sure that register and logoff no longer reference the memory store.

The other change for logoff is to protect the logoff route.  This is being a little fastidious.  What you are trying to ensure is that no logoff happens as a result of a cross site request forgery.  Maybe that's not very important, but it is best practice.  So, in the user router, add a call to the jwtMiddleware before you call the logoff function.

## **Testing with Postman**

You should now test `/user/register` and `/user/logon` with Postman.  You should see two differences from previous behavior.  First, you should see the csrfToken being returned in the body of the request.  Second, you should see the jwt cookie being set.  However, none of your task routes will work, nor will your logoff route, because the csrfToken is not in the X-CSRF-TOKEN header.  Try them out to make sure this is true.  

You want to catch csrfToken when it is returned from a register or logon.  Open up the logon request in postman and you see a Tests tab.  Click on that, and plug in the following code:

```js
const jsonData = pm.response.json();
pm.environment.set("csrfToken", jsonData.csrfToken);
```

Do the same for the register request.  This code stores the token in the Postman environment.  Now, in the left panel, click on the tasks request.  Go to the headers tab.  Add an entry for X-CSRF-TOKEN.  The value should be `{{csrfToken}}` which gets the value from the environment.  Do the same for the other task requests and for the logoff request.  Then test all the requests.

## **Other Security Middleware**

Add the following statements near the top of your app.js:

```js
const helmet = require("helmet");
const cors = require("cors");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
```

Then, add the following app.use() statements:

```js
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
``` 

This one should be before any other app.use() statements. You don't want to do any processing for requests coming from an ill behaved client.  Next:

```js
app.use(helmet());
```

Next comes CORS:

```js
const origins=[];
if (process.env.ALLOWED_ORIGINS) {
  const originArray = process.env.ALLOWED_ORIGINS.split(",");
  originArray.forEach((orig) => {
    orig = orig.trim();
    if (orig.length > 4) {
      origins.push(orig);
    }
  });
  app.use(
    cors({
      origin: origins,
      credentials: true,
      methods: "GET,POST,PATCH,DELETE",
      allowedHeaders: "CONTENT-TYPE, X-CSRF-TOKEN",
    }),
  );
};
```

This needs a little explaining.  You don't know what origins you are going to allow.  You have to list them in an environment variable, in this case ALLOWED_ORIGINS.  The values you permit will be in a list in that environment variable, separated by commas.  If you don't specify any, CORS won't be present, and Express won't respond to any cross-origin requests.  Postman knows nothing about origins, so Postman testing will still work.  Suppose you are testing your React application, which connects to your back end app through the Vite proxy.  If the React app is running on `http://localhost:3001`, you add that to your ALLOWED_ORIGINS environment variable, so that CORS allows in the React requests.  When you deploy to the Internet, your React app might be running on `https://my-todos.render.com`.  You would need to have that URL in the ALLOWED_ORIGINS environment variable for your back end, which would also be deployed to the Internet.  When your back end is deployed to the Internet, you may want to test from your React app on your local machine, in which case it would need `http://localhost:3001` in the list of allowed origins. Your CORS configuration has to specify whether credentials (cookies) are allowed, which headers are allowed, and which methods -- everything else is rejected.  The request might go through, but without the cookies or some of the headers.

Next, the XSS protection:

```js
app.use(xss());
```

Important: This has to come after the cookie parser and any body parsers.  The body parser you are using is `express.json()`.  The XSS protection comes after these parsers so that it can sanitize req.body.  The xss middleware does not sanitize the response, just the request, so if you have suspect data, you need to sanitize it before you send it.  The express-xss-sanitizer package exports a sanitizer function you could use.

Whew, just about done.

## **Run the TDD Test**

Run `npm run tdd assignment8` to make sure all the tests work.  Then, stop your postgresql service, and from Postman, try a logon request.  You should see an Internal Server Error reported, and you should see in your server console a log record that connection to the database failed -- but the server process should not crash.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment8` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment8` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.

