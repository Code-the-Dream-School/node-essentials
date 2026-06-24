# **Assignment 8 — Authentication with JWTs**

## **Assignment Instructions**

Create this assignment in the `node-homework` folder. As usual, create your `assignment8` git branch first.

Then install the following packages with npm:

```bash
npm install jsonwebtoken cookie-parser express-xss-sanitizer express-rate-limit helmet
```

**Package Descriptions:**
- `jsonwebtoken` - For creating and verifying JWT tokens
- `cookie-parser` - For parsing cookies from HTTP requests
- `express-xss-sanitizer` - For protecting against XSS attacks
- `express-rate-limit` - For rate limiting API requests
- `helmet` - For setting security-related HTTP headers

You can use `npm run tdd assignment8` to run the tests for this assignment.

## **Outline of the Steps**

1. Logon must verify the email and password. If that succeeds, it must:
(a) create the JWT and set it in a cookie;  
(b) return the result to the caller.  
  
We need to protect against CSRF attacks, so the response body will contain a CSRF token. The front end also needs the username, so include that in the response too.

2. Registration, when successful, must also set the cookie and include the CSRF token and username in the response.

3. Middleware must protect certain routes, including all task routes and the logoff route. Protecting logoff matters because a logoff request should not be triggered by cross-site request forgery.

The middleware checks that the cookie is present, the JWT inside the cookie is valid, and, for operations other than GET, the CSRF token inside the cookie matches the token in a request header. If all checks pass, the middleware stores the user ID in req.user so request handlers can perform access control. Then it calls next().
Otherwise it returns a 401 (unauthorized).

4. Logoff must clear the cookie.

Your app currently uses a global user id to simulate logon and access control. In this assignment, you will remove that approach.

## **What do we Need in the JWT?**

> **📚 Concept Review**: Before implementing JWT tokens, make sure you understand what they are and how they work.
> See **Lesson 8, Section 8.3** for a detailed explanation.

We need the following:

1. A cryptographic signature, so the server can trust that the JWT came from our back end. The signature relies on a secret, which is a long string that is hard to guess. Do not put this secret in the code. Put it in the `.env` file. The secret is used to sign new JWTs and verify incoming JWTs.

2. Something that uniquely identifies the user. In this app, that is the id of the user record.

3. The CSRF token.

> **📚 Concept Review**: CSRF (Cross-Site Request Forgery) attacks are explained in **Lesson 8, Section 8.4**.
> Understanding how these attacks work will help you implement proper protection.

4. A timeout, so the JWT can't be used indefinitely.

Sometimes you might put other information in the JWT, such as a user role. That can be useful when the server needs to know whether a user has special privileges. Keep the JWT small, definitely less than 4 KB, so store only what you need.

## **Setting the Cookie**

Generate a JWT secret. Because no one else has this secret, no one else can create a cookie that the server will trust.

There are several ways to get a good random secret. Here is one: [https://www.random.org/strings/](https://www.random.org/strings/).

Get a secret and store it in your `.env` file as:

`JWT_SECRET=your_secret_here`

Add the following utility routine to `controllers/userController.js`:

```js
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};
```

The JWT now has the elements we listed above, and the cookie flags can work differently in production and test.

Sometimes additional information is stored in the JWT so the back end can make additional security checks. The front end has no access to the JWT. For example, in role-based access control (RBAC), the user role might be stored in the JWT.

The `jwt.sign()` method can run synchronously, as shown above. You can also pass an optional callback so it runs asynchronously. In general, asynchronous calls are better because other requests can continue while this one is being handled. For your project, the synchronous call is good enough.

Now modify `logon()` and `register()` so they use this helper. Each one should return an appropriate body with a name, an email, and the csrfToken. They should no longer reference a global user ID.

Also modify logoff so it clears the cookie using `res.clearCookie("jwt", cookieFlags(req))`.
#### **Be careful:**
When clearing the cookie, use the same cookie flags that you used when setting it. Otherwise, the cookie may not clear correctly when you deploy to the Internet. Do not set `maxAge` when clearing the cookie.

## **The Middleware for the JWT**

You no longer need the old auth middleware. Delete it and remove references to it.

Replace it with `middleware/jwtMiddleware.js`:

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
    return send401(res);
  } 
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // using the callback here.  Of course, we could promisify instead.
    if (err) {
      return send401(res);
    }
    req.user = { id: decoded.id }; 
    // this is where the id is kept for subsequent use in access control.  We
    // don't use global.user_id any more!  
    if ( ["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)) {
    // for these operations we have to check for cross site request forgery
      if (req.get("X-CSRF-TOKEN") != decoded.csrfToken) {
        return send401(res);
      }
    }
    next(); // if the token is good
  });
};
```

This handles three 401 cases:
1. Missing cookie
2. Invalid JWT
3. Invalid or missing CSRF token (for write operations).  
  
Use this middleware to protect all task routes and logoff. The small utility function sends the 401 response.

This example uses `jwt.verify()` with a callback. Every path through the middleware either sends the 401 or calls `next()`. There should be no path where both happen.

You have seen one way to protect the task routes:

```js
app.use("/api/tasks", authMiddleware, taskRouter);
```

Another approach is to put the following statement into the taskRouter before any of the defined routes:

```js
router.use(jwtMiddleware);
```

## **Fixing Your Task Routes**

Your task routes currently use `global.user_id` for access control. Change all of those references so they use `req.user.id` instead.

This matters because `req.user.id` belongs to the current request. It fixes the problem where one user could access another logged-on user's tasks. Each user's browser has its own cookie, and each cookie contains its own JWT. That also fixes the problem where only one user could be logged on at a time.

## **Other Changes to Make Authentication Work**
 
The `jwtMiddleware` will not find the cookie in `req.cookies` unless the request has been parsed for cookies. Use the `cookie-parser` middleware so the JWT middleware can access the token and attach the decoded user data to `req.user`.

Add this to `app.js`:

```js
const cookieParser = require("cookie-parser");
app.use(cookieParser());
```

Place this early in the middleware chain so cookies are available when needed.

## **Testing with Postman**

Test `/api/users` (register) and `/api/users/logon` with Postman.

You should see:
1. The `csrfToken` returned in the response body.  
2. The `jwt` cookie being set.  

At this point, your Postman tests for task routes and `/api/users/logoff` will not work properly because the `csrfToken` is not being sent in the `X-CSRF-TOKEN` header. Try testing them to confirm the issue.

You need to capture `csrfToken` when it is returned from `register` or `logon`. Open the `logon` request in Postman and find the Tests tab. Add this code:

```js
const jsonData = pm.response.json();
pm.environment.set("csrfToken", jsonData.csrfToken);
```

This code stores the token in the Postman environment. Do the same for the `register` request.

Now, in the left panel, click a tasks request. Go to the headers tab and add an entry for `X-CSRF-TOKEN`.
The value should be `{{csrfToken}}`, which gets the value from the environment.

```X-CSRF-TOKEN: {{csrfToken}}```  

Do the same for the other task requests and for the `logoff` request. Then test all the requests. They should now work correctly.

## **Other Security Middleware**

Add the following statements near the top of your `app.js`:

```js
app.set("trust proxy", 1);
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
```
The “trust proxy” setting matters in production. On a service like Render.com, HTTPS is required for secure cookies. Your Express app itself may only receive HTTP traffic because the HTTPS connection is handled by a front-end proxy. Enabling “trust proxy” tells Express to trust that proxy connection so secure cookies work properly.

### Rate Limiting

Then, add the following `app.use()` statements:

```js
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
``` 

This one should come before any other `app.use()` statements. You do not want to spend time processing requests from a misbehaving client.

### Next Helmet:

```js
app.use(helmet());
```

### Next, the XSS protection:

```js
app.use(xss());
```

Important: This has to come after `cookieParser()` and any body parsers. The body parser you are using is `express.json()`.

The `XSS` protection comes after these parsers so it can sanitize `req.body`. The xss middleware sanitizes the request, not the response. If you have suspect data that you are about to send back, sanitize it before sending it. The `express-xss-sanitizer` package exports a sanitizer function you can use.

## **Run the TDD Test**

Run `npm run tdd assignment8` and make sure all tests pass.

Then stop your `PostgreSQL` service and try a `logon` request in Postman. You should see an **Internal Server Error** in the response and a message in your server console saying that the database connection failed. The server process should not crash.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your `node-homework` folder, do:  
```
git add  
git commit
```

for the files you have created, so that they are added to the `assignment8` branch.
- Push that branch to GitHub  
```git push origin assignment8```

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment8` branch. It should be one or several commits ahead of your `main` branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the `URL` into the **assignment submission form**.

---

## Video Submission

Record a short video (3-5 minutes) on YouTube, Loom, or a similar platform. Share the link in your submission form.

**Video Content**: Short demos based on Lesson 8:

1. **How do you implement secure authentication with JWT tokens?**
   - Show your JWT token generation and signing process
   - Walk through your middleware that validates JWT tokens
   - Show how you protect routes and access user information

2. **What security vulnerabilities does your authentication system prevent?**
   - Explain CSRF protection and show your CSRF token implementation
   - Demonstrate how HttpOnly cookies work vs localStorage
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

