# Lesson/Assignment 8: Authentication and Back End Security

## Concepts:

- authentication
- authorization
- browser session
- httpOnly cookies
- cookie flags
- cross-site cookies
- cross-origin requests
- CORS protocol
- Injection attacks
- Cross site scripting
- Cross site request forgery
- Denial of Service
- JSON Web Tokens
- protected vs. unprotected routes
- basic authentication
- distributed authentication
- two factor authentication
- client side authenticators
- multifactor authentication
- server-to-server authentication
- cookie domain
- server-to-client authentication
- localStorage, sessionStorage

## What back end security issues are not mentioned above?

- library security vulnerabilities
- Making SSL (HTTPS) secure
- Trusting your cloud provider
- Other trust relationships
- spoofing attacks
- logging and auditing of data access
- database security

## Some interesting points:

1. What conveys the domain of the request? Who uses this information?
    Answer: This is in the URL of the request target.  It is used two ways.  First, the domain has to match the domain of the SSL certificate, else the SSL connection is refused.  Second, the browser only sends cookies with the request if credentials: “include” is used and if the target domain matches the domain of the cookie.
2. Who keeps track of the origin of the request?  How is this used?
    Answer: The browser records the URL of the front end.  If a request to a back end is sent, and that is on a different host, the browser knows the request is a cross-origin request.  The browser does set the origin header, but the back end can’t rely on this header for security information, as it can be spoofed.
3. What special things does the browser do for a cross-origin request?
    Answer: For most requests the browser sends a pre-flight request to the target, before sending the actual request.  The back end responds according to its CORS configuration, telling the browser if the actual request is permitted, and whether to send cookies.  Some requests (GET or POST with form data) can be sent in NO-CORS mode, so the back end can’t rely on CORS for complete protection.
4. When is a request a cross-site request?
    Answer: When the target domain doesn’t match the origin domain.  In this case, the browser might not send any cookies, depending on browser configuration.
5. Can you read the contents of the JWT?
    Answer: Yes.  They are Base64URL encoded, but not encrypted.  You can get the contents using, for example, the developer tools of your browser, and you can then decode the JWT using various tools.  You can choose to encrypt the cookie that holds the JWT, so as to make the JWT inaccessible.  If you don’t encrypt the cookie, don’t put secrets in the JWT.
6. Why are httpOnly cookies used?
    Answer: So that, if the front end has a security vulnerability, the attacker can’t get to the cookie.  Cookies with the httpOnly flag can’t be accessed by the JavaScript of the front end.
7. Why should the back end care about cross site scripting?
    Answer: If the back end serves up data with embedded scripts, the front end might run them when the data is displayed.  The back end should have protection so it doesn’t store such scripts.
8. What are the cookie flags?
    Answer: httpOnly, domain, secure, expires, max-age, sameSite, path.
9. Where are these flags read?
    Answer: The browser checks each of these to see if the cookie should be sent, or in the case of httpOnly, whether the front end JavaScript can read them.  An Express back end does check the secure flag, and only sends a secure cookie over HTTPS or if “trust proxy” is set.
10. What does sameSite do?
    Answer: A cross-site cookie has to have sameSite=”None”.  (It also has to have the domain flag set, and except for localhost it has to have secure=true.) Support for cross-site cookies is going away.  For sameSite=”Strict”, the cookie is only sent if the domain of the cookie matches the domain of the target, or if the target is on the same host as the front end.  The other setting is sameSite=”Lax”, which sends the cookie for cross-site requests caused by top-level navigation, e.g. clicking on a link.  The lax setting is used so that a user can log on to one site and remain logged on when navigating to a different site that is part of the same application.

## Cross-origin vs. cross-site:

A request is cross origin if the protocol, host, or port of the URL is different from the one for the front end.  For example, https://this.that.com:3000 is a different origin from https://this.that.com, or http://this.that.com:3000.

A request is cross-site (really cross-domain) if the domain doesn’t match.  For example, https://www.that.com and https://back-end.that.com are on subdomains of the same domain, so they can share cookies.  A request from the first to the second is not cross-domain, although it is cross-origin.
