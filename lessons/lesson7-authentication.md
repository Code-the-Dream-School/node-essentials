# **Lesson 7 — Authentication and Passport**

## **Lesson Overview**

**Learning objective**: Students will learn basic concepts underlying authentication in browser based applications.  Students will learn best practices and potential pitfalls for authentication.  Students will learn how to use the Passport Node package for authentication.

**Topics**:

1. What is user authentication, and why is it necessary?
2. Authentication part 1: Establishing a browser session with a back end.
3. Authentication part 2: Maintaining the browser session with the back end.
4. Some potential pitfalls.
5. Passport: What it is, and how to use it.


## **7.1 What is user authentication, and why is it necessary?**

Often, web applications give access to resources, in particular read and/or write access to data.  Many resources must be protected to ensure that unauthorized entities do not gain access, sometimes to prevent read access of those unauthorized, and always to prevent write access from those unauthorized.  Before any protected operation can be performed, it is necessary to establish the identity of the person or server that is making the request, and to do so in a secure way.  You have been doing REST operations that change data on your local machine -- but you could never propagate an unprotected application to the Internet.

In the application you are building, we have three kinds of authentication:

1. Server to user: When you access a web site from your browser, you can know it is the right one only if it is HTTPS access, if the SSL certificate used to establish the SSL connection is trusted, and if the certificate matches the URL.

2. Server to server: In our case, the back end server accesses the database server on behalf of the user.  The back end is configured with a secret, in this case a database URL containing a password, which is validated with each database access.  Back end code must include authorization checks to ensure that the data requested or written is only that subset of data for which the user is authorized.

3. User to back end: We focus in this lesson on how we know who the user is who is making requests of the applcation.  Note that the user does NOT authenticate to the front end.  There is no way to make such authentication secure.

## **7.2 Authentication part 1: Establishing a browser session with a back end.**

1. Basic authentication: In the most basic scenario, the user has a userid and password, which is sent to the back end.  If these match what is stored, then the user is authenticated.

2. Distributed authentication: You might sign on using Google or Github or Facebook.  In this case, the user has a browser session with one of these sources of identity. The front end requests a token from, say, Google, and user is prompted to approve or reject sharing their identity with the back end.  If the Google identity service recognizes the back end target, and if the user approves this sharing, the Google identity service returns a token to the front end.  This is then sent to the back end.  If the back end trusts the identity service and validates the token, the user is authenticated.

3. Multifactor authentication: This is the same deal, but with additional proofs of identity, such as returning a passcode sent to a phone.

4. Client side authenticators: The back end server sends an authentication request to a trusted device, which the user is prompted to approve.

5. Many others: Public key authentication, authentication based on special hardware devices, biometric, etc.

We are only going to implement basic authentication, but we will use the Passport authentication framework. As time permits, you could add support for other authentication methods.

## **7.3 Authentication part 2: Maintaining the browser session with the back end.**

Once the user is authenticated, they will want to send requests for protected resources.  But, they don't want to enter an ID and password for every request, so they need an established session.  The inital authentication step is performed once per session, although the session typically times out after a while.  Still, each request after the initial authentication must also be authenticated, meaning that a credential must be sent with each and every request.  While there are many approaches to authentication part 1, there is only one practical and secure means of doing part 2 for browser based apps.

Once the user has proven who they are to the back end, the back end sends a Set-Cookie header for an HttpOnly cookie to the front end.  This is stored by the browser, and the front end sends this cookie as a credential with each subsequent request.  Because it is an HttpOnly cookie, front end JavaScript code has no access to it.  That's a good thing.  If there is a security hole in the front end, as is often the case, and if the credential is accessible from JavaScript, any attacker could capture the credential and do as they please, with all the authorization that the user has.

Typically the front end and back end are running on different hosts, so the authentication cookie is a cross-site cookie.  Modern browsers restrict cross-site cookies.   They are only permitted if all of the following conditions hold:

1. The connection between front end and back end is HTTPS.
2. The connection between the browser and the front end is HTTPS.
3. The cookie has the "secure" flag.
4. The cookie has the `SameSite: "None"` flag.
5. The cookie has the domain set to the domain of the back end host.
6. The Set-Cookie is sent in response to a fetch request with `credentials: 'include'`.

Setting up HTTPS connections in a development environment is a little bit complicated.  Instead, the front end communicates with the back end via a proxy in the middle.  The proxy intercepts each request to the back end, and, when it sends the back end response to the user's browser, it makes it look as if it came from the same host that the front end is running on.  In this case, when the Set-Cookie header is received, it doesn't appear to be a cross-site cookie to the browser.  In the development environment, cookie is sent without `secure` flag, without any domain, and with `SameSite: "Lax"`.  In our project, we'll use the Vite proxy for this purpose.

An HttpOnly cookie is the **only** general purpose secure approach for maintaining the authenticated session in a browser application.  An all too common practice is for the back end to send a session token to the front end in the body of a REST request.  The token is then stored in localStorage or sessionStorage for transmission with subsequent requests.  **Such an approach is bad for security.** If there is a security hole anywhere in front end code, the session token could be captured by an attacker and reused.  Do not do it this way.  Credentials and other sensitive data must never be stored in localStorage or sessionStorage.

How does this fit with distributed authentication?  If, for example, the user is doing sign on with Google, the front end receives the Google authentication token but does not store it.  That token is sent to the back end and the back end sets the HttpOnly cookie.

## **7.4 Some potential pitfalls.**

### **Cross Site Request Forgery**

The approach described above can leave a back door open.  Once the cookie is set, all browser requests to that back end with `credentials: 'include'` will send that cookie.  Suppose that while the user has a banking application browser session with the back end, they access a different application in another browser tab, one provided by an attacker.  The attacker's application can then send a request to the banking application.  The cookie will be included, so the back end will honor the request, perhaps transferring money from the user's account to the attackers.  CSRF attacks are blind.  The attacker can't get back data this way, but they can cause the back end of the attacked application to make data changes -- in fact they can do any write operations that the user could perform.

### **Cross Origin Resource Sharing**

The first line of defense against the CSRF attack is the CORS (Cross Origin Resouce Sharing) configuration.  The browser observes that the front and back end URLs are not the same, for either the request from the banking front end or the request from the attacker front end.  The front end URL is its "origin", and the back end has a different origin.  So, before the browser sends a request to the back end, it sends a "pre-flight" request, making sure that the front end URL is allowed to access the back end, and making sure not to send any cookies or headers to that back end unless they are permitted by the back end.  The back end CORS configuration includes only certain allowed origins.  

Unfortunately, CORS is not enough.  Some requests can bypass CORS.  One example is a GET request.  This is why you never want to make data changes on the back end in respond to a GET!  Even some POST requests can bypass CORS.

### **Preventing CSRF Attacks with a Token**

The standard way to defeat CSRF attacks is to provide the front end with a securely generated random token, often in the response body returned for the logon.  A copy of this token is stored in the session cookie.  The front end stores this token in localStorage, and includes it in a header with each subsequent POST/PATCH/DELETE request.  When the request is received on the back end, it is checked to make sure the token is present in the header, and that the token in the header matches the one in the cookie.  Ok, wait ... we just said that localStorage is no place for a credential.  Why is this different?  The reason is this: a CSRF attack is external to your application code.  It can cause a cookie to be sent, but it can't get to your localStorage.  On the other hand, if a cross site scripting attack captures the token, it can't do anything with it without having the cookie as well.

### **Pitfalls for the Naive**

Naive developers sometimes think that they can deviate from this pattern, using something they invent.  **Don't invent your security approach!** Security is hard.  It is very difficult to get it right.  Follow the best practices established by security experts.

One common naive idea is to configure the front end with some kind of secret that augments the security.  Maybe you want to store a credential in localStorage, so you'll encrypt it first, and you'll configure your front end with an encryption secret.  You know not to put the encryption secret into the code.  You'll put it in an environment variable.  Hah!  

There is no secure place for the front end to store a secret.  If you have a front end that uses an environment variable, take a look at the sources tab in your browser developer tools.  The value of your environment variable is there for all to see.  **There is no secure place for the front end to store a secret.**

## **7.5 Passport: What it is, and how to use it.**

Passport is an authentication framework often used with Express. **Warning:** Passport is just a framework.  For example, if you use basic authentication with user IDs and passwords, Passport will store those for you, and will check them as the user logs on ... but only if you provide the code that performs these functions.  Passport just provides a place to plug in the code you provide.  The value that Passport provides is in its support for lots of plugins, for Google, for Github, for JSON Web Tokens, etc., so that you can add those over time to enhance your application. 

You will use five packages in this lesson:

- passport
- passport-local
- passport-jwt
- jsonwebtoken
- cookie-parser

The passport package is the overall framework.  The passport-local package provides support for local authentication, and you will configure it to validate the user ID and password with what is stored in the database.  The passport-jwt package is used as middleware.  For every request on a protected route, the middleware is invoked to validate the cookie and to store information about the user in the request to be passed to request handlers.  Passport can be configured to use the express-session package.  When that is used, a secure HttpOnly cookie is created to be used as the session credential and to store session state.  You won't do it that way.  Instead, you'll use the jsonwebtoken package to create the JSON web token (JWT) to be stored in the cookie.  The JWT is signed, meaning that its contents, together with a secret, are hashed, and the hash is stored in the cookie as well as its contents.  This ensures that no attacker can spoof a cookie -- the signature is checked in the authentication middleware for every request on a protected route.

A protected route is any route behind the authentication middleware.  Some routes are not protected of course: the logon route can't be protected in this way, nor can the register route, because users need to access these before they have the session cookie established.  There may be other parts of the application that are public pages, so they don't need to be behind protected routes.

Let's see what you're going to need:

- The user model: That much you already have in the database.
- A configuration utility for passport, passport-local, and passport-jwt.
- A router for the user requests you will implemnt.  These are: /user/register, /user/logon, /user/logoff.  You need a wrapper for these routes, because they may cause an error to be thrown from an asynchronous operation, for example if database access fails.  An error thrown during an async operation is a called a rejection, and you need to wrapper the routes so that the wrapper can pass rejections on to next().
- A controller for user requests.
- Authentication middleware for the protected routes.
- A service for creating user records and validating passwords.  A Prisma service provides helper routines for a model.  You'll need them to handle cryptography for the user model.
- Requests configured in Postman to test all of this.
- CSRF attack prevention.

Ok, let's get going!