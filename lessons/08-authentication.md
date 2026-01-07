# **Lesson 8 — Authentication and Security**

## **Lesson Overview**

**Learning objective**: Students will learn basic concepts underlying authentication in browser based applications.  Students will learn best practices and potential pitfalls for authentication.  Students will learn how to use the basic authentication with passwords and JSON web tokens in cookies for authentication.  Students will also learn how to mitigate other types of security risks.

**Topics**:

1. What is user authentication, and why is it necessary?
2. Authentication part 1: Establishing a browser session with a back end.
3. Authentication part 2: Maintaining the browser session with the back end.
4. Some potential pitfalls.
5. NPM packages you need.
6. Other security problems to address.


## **8.1 What is user authentication, and why is it necessary?**

Often, web applications give access to resources, in particular read and/or write access to data.  Many resources must be protected to ensure that unauthorized entities do not gain access, sometimes to prevent read access of those unauthorized, and always to prevent write access from those unauthorized.  Before any protected operation can be performed, it is necessary to establish the identity of the person or server that is making the request, and to do so in a secure way.  Your application must be secure before you promote it to the Internet.

As you know, you have two teensy weensy problems in your application in its current state.

1. Only one user can be logged on at a time.
2. When one user is logged on, anyone else can get to that user's data.

You'll fix them in the assignment.

In the application you are building, there are three kinds of authentication:

1. Front end server to user: When you access a web site from your browser, you can know it is the right one only if it is HTTPS access, if the SSL certificate used to establish the SSL connection is trusted, and if the certificate matches the URL.  The browser performs these checks.

2. Server to server: In our case, the back end server accesses the database server on behalf of the user.  When you promote your application to the Internet, you will configure it with a secret, in this case a database URL containing a password, which is validated with each database access.  As this access occurs, the back end code must include authorization checks to ensure that the data requested or written is only that subset of data for which the user is authorized.  The back end server also authenticates to the front end server, via HTTPS.

3. User to back end: This lesson focuses on identifying the user making requests to the application.  Note that the user does NOT authenticate to the front end.  There is no way to make such authentication secure.

## **8.2 Authentication part 1: Establishing a browser session with a back end.**

1. Basic authentication: In the most basic scenario, a user provides a user ID and password, which are sent to the back end.  If these match what is stored, then the user is authenticated.

2. Distributed authentication: You might sign on using Google or GitHub or Facebook.  In this case, the user has a browser session with one of these sources of identity. The front end requests a token from, say, Google, and user is prompted to approve or reject sharing their identity with the back end.  If the Google identity service recognizes the back end target, and if the user approves this sharing, the Google identity service returns a token to the front end.  This token is then sent to the back end.  If the back end trusts the identity service and validates the token, the user is authenticated.

3. Multifactor authentication: Adds additional verification, such as a passcode sent to a phone. 

4. Client side authenticators: The back end server sends an authentication request to a trusted device, which the user is prompted to approve.

5. Many others: Public key authentication, authentication based on special hardware devices, biometric, etc.

We are only going to implement basic authentication. As time permits, you might add support for Google authentication in assignment 11, but that's optional.

## **8.3 Authentication part 2: Maintaining the browser session with the back end.**

Once the user is authenticated, they will want to send requests for protected resources.  But, they don't want to enter an ID and password for every request, so they need an established session.  The initial authentication step is performed once per session, although the session typically times out after a while.  Still, each request after the initial authentication must also be authenticated, meaning that a credential must be sent with each and every request.  While multiple approaches exist for initial authentication, only one practical and secure method exists for maintaining browser sessions.

Once the user has proven who they are to the back end, the back end sends a Set-Cookie header for an HttpOnly cookie to the front end.  This is stored by the browser, and the front end sends this cookie as a credential with each subsequent request.  Because it is an HttpOnly cookie, front end JavaScript code has no access to it.  That's a good thing.  If there is a security hole in the front end, as is often the case, and if the credential is accessible from JavaScript, any attacker could capture the credential and do as they please, with all the authorization that the user has.

Typically the front end and back end are running on different hosts, so the authentication cookie is a cross-site cookie.  Modern browsers restrict cross-site cookies.   They are only permitted if all of the following conditions hold:

1. The connection between front end and back end is HTTPS.
2. The connection between the browser and the front end is HTTPS.
3. The cookie has the "secure" flag.
4. The cookie has the `SameSite: "None"` flag.
5. The cookie has the domain set to the domain of the back end host.
6. The Set-Cookie is sent in response to a fetch request with `credentials: 'include'`.

Setting up HTTPS connections in a development environment is a little bit complicated, so we don't bother.  Instead, the front end communicates with the back end via a proxy in the middle.  The proxy intercepts each request to the back end, and, when it sends the back end response to the user's browser, it makes it look as if it came from the same host that the front end is running on.  In this case, when the Set-Cookie header is received, it doesn't appear to be a cross-site cookie to the browser.  In the development environment, the cookie is sent without `secure` flag, without any domain, and with `SameSite: "Lax"`.  In our project, the Vite proxy will handle cross-origin requests in development.

An HttpOnly cookie is the **only** general purpose secure approach for maintaining the authenticated session in a browser application.  An all too common practice is for the back end to send a session token to the front end in the body of a REST request.  The token is then stored in localStorage or sessionStorage for transmission with subsequent requests.  **Such an approach is bad for security.** If there is a security hole anywhere in front end code, the session token could be captured by an attacker and reused.  Despite the risk, storing the credential in localStorage or sessionStorage is not an uncommon practice for existing applications, and there are some measures one can take to reduce the risk, though none of them are bulletproof. Our recommendation is: Do not do it this way.

How does this fit with distributed authentication?  If, for example, the user is doing sign on with Google, the front end receives the Google authentication token but does not store it.  That token is sent to the back end and the back end sets the HttpOnly cookie.

## **8.4 Some potential pitfalls.**

### **Cross Site Request Forgery**

The approach described above can leave a back door open.  Once the cookie is set, all browser requests to that back end with `credentials: 'include'` will send that cookie.  Suppose that while the user has a banking application browser session with the back end, they access a different application in another browser tab, one provided by an attacker.  The attacker's application can then send a request to the banking application.  The cookie will be included, so the back end will honor the request, perhaps transferring money from the user's account to the attackers.  This attack is called cross site request forgery (CSRF). CSRF attacks are blind.  The attacker can't get back data this way, but they can cause the back end of the attacked application to make data changes -- in fact they can do any write operations that the user could perform.

### **Cross Origin Resource Sharing**

The first line of defense against the CSRF attack is the CORS (Cross Origin Resource Sharing) configuration.  The browser observes that the front and back end URLs are not the same, for either the request from the banking front end or the request from the attacker front end.  The front end URL is its "origin", and the back end has a different origin.  So, before the browser sends a request to the back end, it sends a "pre-flight" request, making sure that the front end URL is allowed to access the back end, and making sure not to send any cookies or headers to that back end unless they are permitted by the back end.  The back end CORS configuration includes only certain allowed origins.  

Unfortunately, CORS is not enough.  Some requests can bypass CORS.  One example is a GET request.  This is why you never want to make data changes on the back end in response to a GET!  CSRF attacks are blind -- the attacker has no access to the response -- so this doesn't matter so much, but even some POST requests can bypass CORS.  Some back ends, if they only accept the "application/json" content type, may rely on CORS to protect against CSRF, and technically that should suffice, but it's best to add the protection described below.  If the back end accepts data that has been posted in a form, the content type is "application/x-www-form-urlencoded", and in this case CSRF protections are essential, as such requests can bypass CORS.

### **Preventing CSRF Attacks with a Token**

The standard way to defeat CSRF attacks is to provide the front end with a securely generated random token, often in the response body returned for the logon.  A copy of this token is stored in the session cookie.  The front end stores this token in localStorage, and includes it in a header with each subsequent POST/PATCH/DELETE request.  When the request is received on the back end, it is checked to make sure the token is present in the header, and that the token in the header matches the one in the cookie.  Ok, wait ... we just said that localStorage is no place for a credential.  Why is this different?  The reason is this: a CSRF attack is external to your application code.  It can cause a cookie to be sent, but it can't get to your localStorage.  On the other hand, if a cross site scripting attack captures the token, it can't do anything with it without having the cookie as well.

### **Pitfalls for the Naive**

Naive developers sometimes think that they can deviate from this pattern, using something they invent.  **Don't invent your security approach!** Security is hard.  It is very difficult to get it right.  Follow the best practices established by security experts.

One common naive idea is to configure the front end with some kind of secret that augments the security.  Maybe you want to store a credential in localStorage, so you'll encrypt it first, and you'll configure your front end with an encryption secret.  You know not to put the encryption secret into the code.  You'll put it in an environment variable.  Hah!  

There is no secure place for the front end to store a secret.  If you have a front end that uses an environment variable, take a look at the sources tab in your browser developer tools.  The value of your environment variable is there for all to see.  **There is no secure place for the front end to store a secret.**

## **8.5 The NPM Packages You Will Use**

You will use five packages in this lesson:

- jsonwebtoken
- cookie-parser
- cors
- express-xss-sanitizer
- express-rate-limit
- helmet

Most of these packages are middleware, requiring minimal configuration and an app.use() statement.

### **A Word About Passport**

The Passport package is a widely used overall authentication framework.  If you are doing a variety of types of authentication, for which you want plug points, Passport provides this, and there are many plug-ins that you can add.  We do not include Passport in this lesson, because for "local" authentication, that is, authentication with a password that compares it against a value stored on the back end, Passport doesn't give much value, but adds complexity.  Also, the Passport online documentation has many annoying omissions.

### **What You will do Instead**

You'll use the jsonwebtoken package to create the JSON web token (JWT) to be stored as a cookie.  The JWT is signed, meaning that its contents, together with a secret, are hashed, and the hash is stored in the cookie as well as its contents.  This ensures that no attacker can spoof the cookie.  The signature is checked in the authentication middleware for every request on a protected route.  We don't encrypt the JWT or the cookie, although we could. The information in the cookie is accessible, for example using browser developer tools, but it doesn't matter for our use case.

A protected route is any route behind the authentication middleware.  Some routes are not protected of course: the logon route can't be protected in this way, nor can the register route, because users need to access these before they have the session cookie established.  There may be other parts of the application that are public pages, so they don't need to be behind protected routes.

## **8.6 Other Security Problems to Address**

Authentication is not the only security issue to worry about.  You also need to mitigate the following types of attacks:

1. Injection attacks: An injection attack sends program instructions, often scripts embedded in data.  A cross site scripting attack (XSS) involves embedding a script in a web page or URL.  The script runs as the page is displayed.  A back end is not directly vulnerable to an XSS attack, because it doesn't serve up pages for browser display.  But the vulnerability is still to be taken seriously, even for a back end.  A back end might be used to store data containing a script that is subsequently retrieved and displayed by the front end, triggering the exploit.  Another kind of injection attack is SQL injection, where SQL statements are embedded in data and cause damage when they run.  Your application accesses the database using Prisma, and Prisma provides comprehensive protections against SQL injection, by sanitizing the statements that are actually executed.

2. Denial of service attacks (DOS).  This is where a bot sends a flood of requests to overload the server.  There are also distributed denial of service (DDOS) attacks, where the flood of requests originate from a collection of bots.

3. Cross origin attacks: These are when requests come from a hostile front end.  We have mentioned CORS.  If Express is run without the CORS package, all browser requests that use the CORS protocol fail.  The CORS package grants limited access to a limited number of front end origins.

4. Attacks on the front end: Security is the business of the front end developer too.  Many, in fact the majority, of security attacks on the Internet involve the front end.  React offers some level of protection, but not enough.  This course doesn't cover front end issues, but [here is a reference](https://relevant.software/blog/react-js-security-guide/) you may want to bookmark on React security.

For injection attacks, you will use middleware from the `express-xss-sanitizer` package.  This package sanitizes the URL and the body of the request, putting escape characters in to disable scripts.

For denial of service, you will use middleware from the `express-rate-limit` package, which puts the brakes on if too many packets come too fast from a particular source.

You'll use the `cors` package, not to provide additional protection, but to grant limited access.  Your front end and back end will run on different origins, so this package is necessary to make things work.

You'll also use the `helmet` package. Helmet provides subtle protections for back end servers, including some defense against cross-origin attacks. The helmet package provides a lot of protection for a front end server, which is not what we're building.  When you deploy your React application to the Internet, you can configure your Internet service with protections like what helmet provides.  We won't do that in this class.
