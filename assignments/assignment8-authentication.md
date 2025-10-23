# **Assignment 8 — Authentication with JWTs**

## **Assignment Instructions**

This assignment is to be created in the node-homework folder.  As usual, create your assignment8 git branch.  Then npm install the following packages:

```bash
npm install jsonwebtoken cookie-parser cors express-xss-sanitizer express-rate-limit helmet
```

**Package Descriptions:**
- `jsonwebtoken` - For creating and verifying JWT tokens
- `cookie-parser` - For parsing cookies from HTTP requests
- `cors` - For handling Cross-Origin Resource Sharing
- `express-xss-sanitizer` - For protecting against XSS attacks
- `express-rate-limit` - For rate limiting API requests
- `helmet` - For setting security-related HTTP headers

You can use `npm run tdd assignment8` to run tests for this assignment.  

## ** Outline of the Steps:**

1. Login will need to verify the email and password.  If this succeeds, it needs to (a) create the JWT and set it in a cookie; (b) return the result to the caller.  We have to protect against CSRF attacks, so the body of the response will contain a CSRF token.  It is convenient for the front end to know the user name, so we'll include that in the response too.

2. Registration, when successful, must also set the cookie and include appropriate information in the response, that being the CSRF token and user name.

3. A middleware routine must protect certain routes, including all the task routes and the logoff.  We protect the logoff so that a logoff can't be triggered by cross site request forgery, which might lead to spoofing attacks.  The middleware has to check that the cookie is present, that the JWT within the cookie is valid, and (for operations other than GET), that the CSRF token within the cookie matches the one in a header.  If all this succeeds, the middleware stores the ID of the user in req.user, so that request handlers can perform appropriate access control, and then it calls next().  Otherwise it returns a 401 (unauthorized).

4. Logoff must clear the cookie.

Your app currently has a global user id, to simulate a logon and access control.  You want to eliminate that.

## **What do we Need in the JWT?**

> **📚 Concept Review**: Before implementing JWT tokens, make sure you understand what they are and how they work. See **Lesson 8, Section 8.3** for a detailed explanation.

We need the following:

1. A cryptographic signature, to be sure that the JWT originates with our back end.  The signature relies on a secret, a long string that is impossible to guess.  You don't want this in the code, so you put it in the .env file.  The secret is used to sign the JWT and to verify inbound JWTs.

2. Something that uniquely identifies the user, in our case, the id of the user record.

3. The CSRF token.

> **📚 Concept Review**: CSRF (Cross-Site Request Forgery) attacks are explained in **Lesson 8, Section 8.4**. Understanding how these attacks work will help you implement proper protection.

4. A timeout, so that the JWT can't be used indefinitely.

Sometimes you might want to put other information in the JWT, such as a user role.  This can be needed to identify whether the user has special privileges.  You don't want a big JWT, definitely less than 4K, so you want to keep its contents minimal.

## **Setting the Cookie**

You need to generate a JWT secret. Because no one else has the secret, no one else can create a cookie the server will honor.  There are various ways to get a good random secret.  Here is one: [https://www.random.org/strings/](https://www.random.org/strings/). Get a secret and store it in your .env file as JWT_SECRET.

Add the following utility routine to controllers/userController.js:

```js
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
  return {
    ...(process.env.NODE_ENV === "production" && { domain: req.hostname }), // add domain into cookie for production only
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  req.user = payload; // this is a convenient way to return the csrf token to the caller.
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration

  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by login() or register()
};
```

You see that the JWT has the elements we said we needed, and that the cookie has different flags for production and test.

An aside:  The `jwt.sign()` method can be invoked synchronously (as above), or you can pass an optional callback, in which case it occurs asynchronously.  All other things being equal, asynchronous calls are better, because they allow other requests to proceed while this one is being handled.  For your project, the synchronous call is good enough.

You can now modify login() and register() so that they use this routine and to that each return an appropriate body with a name and csrfToken, and so that they no longer reference a global user ID.  You can also modify logoff to clear the cookie using `res.clearCookie("jwt", cookieFlags(req))`.  Be careful: You need to set the cookie flags when clearing the cookie to the same values used for setting it, or the cookie won't be cleared when you deploy to the Internet.  Of course, you don't want to set `maxAge` when clearing the cookie.

## **The Middleware for the JWT**

You no longer need the auth middleware.  You can delete it and remove references to it.  You replace it with `middleware/jwtMiddleware.js`, as follows:

```js
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const send401 = (res) => {
  res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: "No user is authenticated." });
};

module.exports = async (req, res, next) => {
  const token = req?.cookies?.jwt;
  if (!token) {
    send401(res);
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        send401(res);
      } else {
        req.user = { id: decoded.id };
        if (
          ["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)
        ) {
          // for these operations we have to check for cross site request forgery
          if (req.get("X-CSRF-TOKEN") == decoded.csrfToken) {
            next();
          } else {
            send401(res);
          }
        } else {
          next();
        }
      }
    });
  }
};
```

There are 3 cases where the 401 would be needed: no cookie, JWT invalid, or (for write operations), CSRF token missing or invalid.  You want this middleware to protect all task routes as well as logoff.  So a little utility routine sends the 401. Here we are using `jwt.verify()` with a callback.  You see that every path through the middleware either sends the 401 or calls next(), but there is no path where both happen.


## **Other Changes to Make Authentication Work**

The jwtMiddleware won't find the cookie in req.user without a parser to parse the request for that cookie.  So you need to add the following to app.js:

```js
const cookieParser = require("cookie-parser");
app.use(cookieParser());
```

This should be done pretty early in the chain, so that the cookie is available when it is needed.

## **Testing with Postman**

You should now test `/user/register` and `/user/logon` with Postman.  You should see two differences from previous behavior.  First, you should see the csrfToken being returned in the body of the request.  Second, you should see the jwt cookie being set.  However, none of your task routes will work, nor will your logoff route, because the csrfToken is not in the X-CSRF-TOKEN header.  Try them out to make sure this is true.  

You want to catch csrfToken when it is returned from a register or logon.  Open up the logon request in Postman and you see a Tests tab.  Click on that, and plug in the following code:

```js
const jsonData = pm.response.json();
pm.environment.set("csrfToken", jsonData.csrfToken);
```

Do the same for the register request.  This code stores the token in the Postman environment.  Now, in the left panel, click on the tasks request.  Go to the headers tab.  Add an entry for X-CSRF-TOKEN.  The value should be `{{csrfToken}}` which gets the value from the environment.  Do the same for the other task requests and for the logoff request.  Then test all the requests.

## **Other Security Middleware**

Add the following statements near the top of your app.js:

```js
app.set("trust proxy", 1);
const helmet = require("helmet");
const cors = require("cors");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
```
The "trust proxy" business does the following.  Suppose you are running in production, as you will when you deploy to Render.com.  You need HTTPS for your secure cookie.  However, your Express application will just have an HTTP connection.  It relies on a front end proxy to provide the HTTPS.  "trust proxy" asserts that the proxy is providing HTTPS, so that Express allows the secure cookie.

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
const origins=["http://localhost:3001"];

app.use(
  cors({
    origin: origins,
    credentials: true,
    methods: "GET,POST,PATCH,DELETE",
    allowedHeaders: "CONTENT-TYPE, X-CSRF-TOKEN",
  }),
);
```

The default CORS configuration accepts all origins.  That won't work with `credentials: true`.  You have to specify the list of origins that are allowed.  Postman doesn't care about origins, but in lesson 10, you'll test your code with a React front end, running at `http://localhost:3001`, so that's the one you'll need.  In the more general case,  you might want to allow other origins after deploying to the Internet, so you could put the supported list of origins in an environment variable -- but we don't need that for now.  The origin is the URL of the browser front end application.

Next, the XSS protection:

```js
app.use(xss());
```

Important: This has to come after the cookie parser and any body parsers.  The body parser you are using is `express.json()`.  The XSS protection comes after these parsers so that it can sanitize req.body.  The xss middleware does not sanitize the response, just the request, so if you have suspect data, you need to sanitize it before you send it.  The express-xss-sanitizer package exports a sanitizer function you could use.

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

---

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Short demos based on Lesson 8:

1. **How do you implement secure authentication with JWT tokens?**
   - Show your JWT token generation and signing process
   - Walk through your middleware that validates JWT tokens
   - Show how you protect routes and access user information

2. **What security vulnerabilities does your authentication system prevent?**
   - Explain CSRF protection and show your CSRF token implementation
   - Demonstrate how HttpOnly cookies work vs localStorage
   - Show your CORS configuration and explain why it's important
   - Walk through your rate limiting and input sanitization

3. **How do you handle user sessions and maintain security across requests?**
   - Show how you store user information in JWT payloads
   - Demonstrate the difference between authentication and authorization
   - Walk through your logout process and token invalidation
   - Show how you handle authentication errors and edge cases

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples 
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission

