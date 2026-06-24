# **Lesson 8 — Authentication and Security**

## **Lesson Overview**

**Learning objective**: By the end of this lesson, you should understand the basic ideas behind authentication in browser-based applications. You will learn why authentication matters, what can go wrong, how password login works, how JSON web tokens can be stored in cookies, and how to reduce several common security risks.

**Topics**:

1. What is user authentication, and why is it necessary?
2. Authentication part 1: Establishing a browser session with a back end.
3. Authentication part 2: Maintaining the browser session with the back end.
4. Some potential challenges.
5. NPM packages you need.
6. Other security problems to address.

### **The Big Picture**

This lesson has a lot of security vocabulary, but the flow you are building is straightforward:

```text
register or logon
  -> back end verifies the user
  -> back end creates a JWT
  -> back end stores the JWT in an HttpOnly cookie
  -> browser sends that cookie on later requests
  -> JWT middleware checks the cookie
  -> protected routes use req.user.id instead of global.user_id
```

For write operations such as POST, PATCH, DELETE, and logoff, there is one more check:

```text
browser sends CSRF token in a header
  -> middleware compares header token to token inside the JWT
  -> request continues only if they match
```

### **Vocabulary You Need**

- **Authentication**: Proving who the user is.
- **Authorization**: Deciding what that authenticated user is allowed to access.
- **Session**: The period of time after login when the user can keep making authenticated requests.
- **Credential**: A value that proves the request belongs to an authenticated user.
- **JWT**: A signed token that can store small pieces of trusted session data, such as the user id and CSRF token.
- **Cookie**: A browser-managed value sent with requests to the matching server.
- **HttpOnly cookie**: A cookie that browser JavaScript cannot read.
- **CSRF**: Cross Site Request Forgery, an attack where another site causes the browser to send a request with the user's cookie.
- **CORS**: Cross Origin Resource Sharing, browser rules and server settings for requests between different origins.

### **What You Will Build in Assignment 8**

In the assignment, you will:

1. Install authentication and security packages.
2. Create and sign a JWT during register and logon.
3. Store that JWT in an HttpOnly cookie.
4. Return the user's name, email, and CSRF token in the response body.
5. Replace the old global user id approach with `req.user.id`.
6. Add JWT middleware to protect task routes and logoff.
7. Require a matching CSRF token for write operations.
8. Add `cookie-parser`, rate limiting, XSS sanitizing, and Helmet.
9. Test the flow with Postman and the assignment tests.

Keep this checklist in mind as you read. The details below explain why each step exists.


## **8.1 What Is User Authentication, and Why Is It Necessary?**

Many web applications let users read or write data. That data often needs protection. Some users should not be able to read certain data, and unauthorized users should never be able to change protected data.

Authentication is the process of securely identifying who is making a request. Before your app performs a protected operation, it needs to know who is asking. Your application must handle this securely before you deploy it to the Internet.

There are two problems in your application in its current state.

1. Only one user can be logged on at a time.
2. When one user is logged on, anyone else can get to that user's data.

You will fix both problems in the assignment.

In Assignment 8, the fix is to stop storing the current user in one global variable. Instead, each browser receives its own signed cookie. When a request arrives, middleware reads that cookie and stores the current user's id on `req.user.id`. That makes the user identity specific to the request. This is the final step in how the app tracks the logged-in user; the [Data and Identity guide](../DATA-AND-IDENTITY-GUIDE.md) shows the full progression from the temporary global to per-request `req.user`.

In the application you are building, there are three authentication relationships to think about:

1. Front end server to user: When you access a web site from your browser, HTTPS helps prove that you reached the real site. The SSL certificate must be trusted and must match the URL. The browser performs these checks.

2. Server to server: In this course, the back end accesses the database server on behalf of the user. When you deploy your application, the back end will use a secret database URL that includes a password. The back end code must also check authorization, so users can only read or write data they are allowed to access. The back end also communicates with the front end over HTTPS.

3. User to back end: This lesson focuses on identifying the user making requests to the back end. The user does **not** authenticate to the front end. There is no secure way to rely on the front end alone for authentication.

### **Pause and Check**

1. What is the difference between proving who the user is and deciding which data that user can access?
2. Why is one global user id not enough when multiple users may use the app at the same time?

## **8.2 Authentication Part 1: Establishing a Browser Session with a Back End**

1. Basic authentication: In the simplest case, a user provides an ID and password. The back end checks those values against what is stored. If they match, the user is authenticated.

2. Distributed authentication: A user might sign in with Google, GitHub, or Facebook. In that case, the user already has a browser session with one of those identity providers. The front end requests a token from the provider, and the user approves or rejects sharing their identity. If the provider recognizes the app and the user approves, the provider returns a token. The front end sends that token to the back end. If the back end trusts the provider and validates the token, the user is authenticated.

3. Multifactor authentication: Adds additional verification, such as a passcode sent to a phone. 

4. Client side authenticators: The back end server sends an authentication request to a trusted device, which the user is prompted to approve.

5. Many others: Public key authentication, special hardware devices, biometrics, and more.

In this course, you will implement basic authentication. If time permits, you might add Google authentication in Assignment 11, but that is optional.

For this app, basic authentication happens in the register and logon routes. When either route succeeds, the back end should create a JWT, set it in a cookie, and return the user information the front end needs.

Assignment 8 also returns a CSRF token in the response body. The front end or Postman will send that token back in a header for write operations.

## **8.3 Authentication Part 2: Maintaining the Browser Session with the Back End**

Once a user is authenticated, they will want to make requests for protected resources. They should not have to enter their ID and password for every request. Instead, the app establishes a session.

The initial authentication step happens once per session, although sessions usually expire after some time. After that, each protected request still needs proof that it belongs to the authenticated user. That means a credential must be sent with each request.

Once the user has proven who they are, the back end sends a Set-Cookie header for an HttpOnly cookie. The browser stores the cookie and sends it with later requests. Because it is an HttpOnly cookie, front end JavaScript cannot read it.

That is important. If the front end has a security hole and the credential is available to JavaScript, an attacker may be able to capture the credential and act with that user's permissions.

In Assignment 8, the cookie is named `jwt`. The JWT inside it should contain:

- the user's database id
- a CSRF token
- an expiration time
- a cryptographic signature created with `JWT_SECRET`

The signature matters because it lets the back end reject tokens that were not created by your server.

The front end and back end are sometimes on different hosts. That makes cookie-based security tricky. The browser will not send a cookie to the back end unless the cookie domain matches the back end's domain. There is a right way and a wrong way to handle this.

The wrong way: The back end sends a cookie, sets the cookie domain to the back end's domain, and sets `sameSite: "None"`. That makes it a cross-site cookie, and the front end will send it on later requests to the back end domain. This is not ideal because cross-site cookies cause privacy and tracking problems. Many users disable them, and browsers are reducing support for them over time.

The right way: You register a domain, such as `something.tech`. Then you configure the front end and back end on subdomains of that domain, such as `todos.something.tech` and `api.something.tech`. The back end sets a cookie for the `something.tech` domain and uses `sameSite: "Strict"`. Because the front end and back end are both under `something.tech`, this is not a cross-site cookie. Note that you cannot use `onrender.com`, even if both apps are deployed to Render, because that domain belongs to Render.

Our way: Registering a domain is not practical for this class, so we will use a workaround. When the front end makes a REST request to the back end, it will use a relative URL, such as `/remote-api/api/users/register`. Then we configure the front end so this request is rerouted to the back end. In development, we use the Vite proxy. For Internet deployment of the front end, we can configure rewrite rules. With this approach, the browser treats the request as local. The back end does not set a domain in the cookie, so it is a host-only cookie, but the browser still forwards it because the request appears local.

Still another way: The back end and front end do not have to run on different hosts. Your React build process can deliver files to the `./public` directory of the Express application, and Express can serve those files. A cookie is still used for authentication, and you still need CSRF protection.

We use the cookie flag `sameSite: "Strict"` to limit when the browser sends the cookie. If HTTPS is used, we also set `secure: true`. You usually do not configure HTTPS for your back end while it is running on localhost.

An HttpOnly cookie is the **only** general-purpose secure approach for maintaining an authenticated session in a browser application. A common but risky pattern is for the back end to send a session token to the front end in the body of a REST response. The front end then stores the token in localStorage or sessionStorage and sends it with later requests.

**This approach creates security challenges.** If there is a security hole anywhere in the front end code, an attacker may be able to capture and reuse the session token. Some existing applications still store credentials this way, and there are ways to reduce the risk, but none are bulletproof. Our recommendation is: do not do it this way.

How does this fit with distributed authentication? If the user signs in with Google, the front end receives the Google authentication token but does not store it. The front end sends that token to the back end, and the back end sets the HttpOnly cookie.

### **Pause and Check**

1. Why is an HttpOnly cookie safer than storing a session token in localStorage?
2. What does the back end need from the JWT in order to set `req.user.id`?
3. Why does the JWT need a signature?

## **8.4 Common Challenges**

### **Cross Site Request Forgery**

The cookie approach described above can leave a back door open if you do not add more protection. Once the cookie is set, browser requests to that back end with `credentials: 'include'` will send the cookie.

Suppose a user has a banking application open in one browser tab. In another tab, they visit an attacker's site. The attacker's site can try to send a request to the banking application. The browser may include the cookie, so the back end may honor the request, possibly transferring money from the user's account to the attacker. This attack is called cross site request forgery, or CSRF. CSRF attacks are blind. The attacker cannot read the response, but they can cause the attacked back end to perform write operations the user is allowed to perform.

### **Cross Origin Resource Sharing**

Because we use the Vite proxy in development and the Vercel rewrite approach when deploying, we are not making Cross Origin requests. This is not typical for many production applications. In the earlier example, where the front end is at `todos.something.tech` and the back end is at `api.something.tech`, the front end and back end do not have the same origin. Browsers do not automatically trust cross-origin requests. The browser first sends a "pre-flight" request to the back end to see whether the back end will accept the request.

The first line of defense against CSRF is CORS, which stands for Cross Origin Resource Sharing. The back end would use the npm CORS package with an `app.use()` statement. The CORS configuration would allow only certain origins and possibly only certain operations. We will not use CORS in this project, but you should understand what it does.

Unfortunately, CORS is not enough by itself. Some requests can bypass CORS. One example is a GET request. This is why you should never make data changes on the back end in response to a GET. CSRF attacks are blind, so GET requests are less useful to attackers if GET routes only read data. But some POST requests can also bypass CORS. Some back ends only accept the `"application/json"` content type and rely on CORS for CSRF protection. That can be acceptable, but it is better to add the protection described below. If the back end accepts form-posted data with the `"application/x-www-form-urlencoded"` content type, CSRF protection is essential.

In this course, we are using proxy configuration. That means we do not use CORS, and we do not get the protections CORS would provide.

### **Preventing CSRF Attacks with a Token**

The standard way to prevent CSRF attacks is to give the front end a securely generated random token, often in the response body returned after login. A copy of this token is also stored in the session cookie. The front end stores the token in localStorage and sends it in a header with each later POST, PATCH, or DELETE request.

When the back end receives the request, it checks two things: the token must be present in the header, and the token in the header must match the token in the cookie.

You may be wondering why localStorage is okay here, since we just said not to store credentials there. The difference is that the CSRF token is not enough by itself. A CSRF attack is external to your application code. It can cause a cookie to be sent, but it cannot read your localStorage. If a cross-site scripting attack captures the token, the token still does not work without the cookie.

For Postman testing, this means register and logon should save the returned `csrfToken` into the Postman environment. Then task requests and logoff requests should send that value in the `X-CSRF-TOKEN` header.

### **Pause and Check**

1. Why do GET requests usually not need the CSRF token check?
2. Why do POST, PATCH, DELETE, and logoff need the CSRF token check?
3. Why does Postman need to send `X-CSRF-TOKEN` after logon?

### **Security Challenges**

Some developers create their own security approach instead of following established patterns. **Do not do this.** Security is very difficult to get right. Follow best practices established by security experts.

Another pitfall is configuring the front end with a secret that augments the security.  For example, imagine this insecure scenario:

> A developer wants to store a credential in localStorage, so they encrypt it first, and then configure the front end with an encryption secret. They know not to put the encryption secret into the code, so they put it in an environment variable. 

The problem is that **there is no secure place for the front end to store a secret.** If you have a front end that uses an environment variable, look at the Sources tab in your browser developer tools. The value of that environment variable is visible.

## **8.5 The NPM Packages You Will Use**

You will use five packages in this lesson:

- jsonwebtoken
- cookie-parser
- express-xss-sanitizer
- express-rate-limit
- helmet

Most of these packages are middleware. They require only a small amount of configuration and an `app.use()` statement.

Here is how those packages connect to Assignment:

- `jsonwebtoken` creates and verifies the JWT.
- `cookie-parser` reads the incoming cookie so middleware can access `req.cookies.jwt`.
- `express-xss-sanitizer` sanitizes incoming request data.
- `express-rate-limit` slows down clients that send too many requests.
- `helmet` sets helpful security-related HTTP headers.

### **A Word About Passport**

Passport is a widely used authentication framework. It is useful when you need several types of authentication and want plug-ins for each one. We do not include Passport in this lesson because local authentication, meaning password authentication against a value stored on the back end, does not need that much machinery here. Passport would add complexity without much benefit for this course. Its online documentation also leaves out some details.

### **What You will do Instead**

You will use the jsonwebtoken package to create the JSON web token, or JWT, that is stored as a cookie. The JWT is signed. That means its contents, together with a secret, are hashed, and the hash is stored in the cookie along with the contents. This prevents an attacker from spoofing the cookie. The authentication middleware checks the signature on every request to a protected route. We do not encrypt the JWT or the cookie, although we could. The information in the cookie can be seen with browser developer tools, but that is acceptable for our use case.

A protected route is any route behind the authentication middleware. Some routes are not protected. For example, the logon route cannot be protected this way, and neither can the register route, because users need to access them before they have a session cookie. Other public pages may also stay outside protected routes.

In this app, protect all task routes and the logoff route. The logon and register routes stay unprotected because they are how the user starts a session.

The middleware should have only two successful outcomes:

- It rejects the request with `401` when authentication fails.
- It sets `req.user.id` and calls `next()` when authentication succeeds.

There should not be a path where the middleware both sends a response and calls `next()`.

## **8.6 Other Security Problems to Address**

Authentication is not the only security issue to worry about. You also need to reduce the risk from these attacks:

1. Injection attacks: An injection attack sends program instructions, often scripts embedded in data. A cross site scripting attack (XSS) embeds a script in a web page or URL. The script runs when the page is displayed. A back end is not directly vulnerable to XSS in the same way as a front end, because it does not serve browser pages in this project. But the risk still matters. A back end might store data containing a script. Later, the front end might retrieve and display that data, triggering the exploit. Another injection attack is SQL injection, where SQL statements are embedded in data and cause damage when they run. Your application uses Prisma for database access, and Prisma provides strong SQL injection protection by sanitizing the statements that are executed.

2. Denial of service attacks (DOS). This is when a bot sends a flood of requests to overload the server. Distributed denial of service attacks (DDOS) are similar, but the flood comes from many bots.

3. Cross origin attacks: These happen when requests come from a hostile front end. We have already mentioned CORS. If Express runs without the CORS package, browser requests that use the CORS protocol fail. The CORS package grants limited access to specific front end origins. In this project, we rely on the CSRF protection we are implementing because we are not using CORS.

4. Attacks on the front end: Security is also the front end developer's responsibility. Many Internet security attacks involve the front end. React provides some protection, but not enough by itself. This course does not cover front end security in depth, but [this React security reference](https://relevant.software/blog/react-js-security-guide/) is worth bookmarking.

For injection attacks, you will use middleware from the `express-xss-sanitizer` package. This package sanitizes the URL and request body by adding escape characters that disable scripts.

For denial of service, you will use middleware from the `express-rate-limit` package. It slows down requests when too many arrive too quickly from one source.

You will also use the `helmet` package. Helmet provides useful protections for back end servers, including some defense against cross-origin attacks. Helmet also provides many protections for front end servers, which is not what we are building here. When you deploy a React application to the Internet, you can configure your hosting service with protections similar to what Helmet provides. We will not do that in this class.
