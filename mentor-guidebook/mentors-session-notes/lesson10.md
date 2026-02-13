# lesson/assignment 10: deployment

## To Deploy:

Make the app secure, including vs. bot attacks
- Unprotected operations, such as registration, should have a Captcha
- Email addresses should be verified (we won’t do this)
- Authorization checking for all sensitive data (you should disable the stats)
- Prevent abuse by registered users (e.g. filling the database with junk)

Use a cloud resident database (we use neon.tech)

Create a cloud deployment (we use render.com)
- configure the git repository and deployment rule for your service
- configure environment variables and build command
- deploy and test

## When You Submit

Your reviewer needs to know where you have deployed.

Your reviewer also needs the recapcha site key as well as the RECAPTCHA_BYPASS.

## Comments about the front end

You need:
- URL of back end (in VITE_TARGET)
- A key for recapcha checking
- A key for google logon (not used yet)
- A proxy (we are making requests appear local to the browser, to avoid CORs issues)
- For internet deployment of the front end, you need other measures (not the proxy), e.g. CORS and a registered domain, or rewrite rules.
- credentials: “include” for protected routes (to send the cookie)
- the csrf token for protected create/update/delete routes
- keeping the csrf token in localStorage

## Thinking about the Final Project

- If you’ve done the assignments, you are in good shape.
- Try to add something extra (but nothing too hard). This is important if you want to excel.
- If you don’t have time, submit anyway.
- Be sure you convey to your reviewer what functions you add.
