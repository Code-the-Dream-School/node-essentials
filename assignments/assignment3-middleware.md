# NodeJS - Middleware: The Good Boys and Girls Club

## Learning Objectives

* Understanding types of middleware (built-in and custom)
* Modify the request/response lifecycle using middleware

## Introduction

You're volunteering for a local dog rescue, **The Good Boys and Girls Club**, to help them upgrade their adoption site.

They’ve already built the main API routes, but their middleware is a mix of broken and missing. Your job is to clean things up and ensure the app behaves, just like all their dogs!

The site serves adorable images of adoptable dogs, accepts applications from potential adopters, and includes a test route for simulating server errors. It just needs your help to become a robust, production-ready app using Express middleware the right way.

You'll be implementing middleware that handles things like:

* Logging and request tracking
* Request validation and parsing
* Serving dog images as static files
* Gracefully handling unexpected errors

The dogs are counting on you.

### Setup

1. Create a new branch:
  
   ```sh
   git checkout main
   git pull
   git checkout -b week-3-middleware
   ```

2. To run the provided framework enter "npm run week3".  You do this before you start Postman testing.

3. To run the test, enter "npm run tdd assignment3".  Your task is to make the tests pass.

4. In **Postman**, set up the following routes:

   * `GET {{host}}/dogs`
   * `GET {{host}}/images/dachshund.png`
   * `GET {{host}}/error`
   * `POST {{host}}/adopt`
     * Body:

       ```json
       {
         "name": "your name",
         "address": "123 Sesame Street",
         "email": "yourname@codethedream.org",
         "dogName": "Luna"
       }
       ```
  Here `{{host}}` is a Postman environment variable you should configure.  It should be set to `http://localhost:/3000`.  You'll do manual testing with Postman.

5. Get coding!

### Deliverables

Your work will involve editing `app.js` to add the expected middleware. Do **not** modify the existing route logic in `routes/dogs.js`.

1. **Built-In Middleware**  

   * The `POST /adopt` endpoint doesn’t seem to be processing requests as expected. This route expects a `name`, `email`, and `dogName`, but the controller keeps erroring. Implement the appropriate middleware to parse JSON requests on this endpoint.  
   * The images for adoptable dogs are not being served on  `GET /images/**` as expected. Implement the appropriate middleware to serve the images of adoptable dogs from the `public/images/..` directory on this endpoint.  

2. **Custom Middleware**  

   * The following middleware should be chained and applied globally to all routes:  
     * We would like to add a unique request ID to all incoming requests for debugging purposes. Using the `uuid` library to generate the unique value, write a custom middleware that:
       * Adds a `requestId` to all requests in the application
       * Injects this value as an `X-Request-Id` in the response headers
     * We would like to output logs on all requests. These logs should contain the timestamp of the request, the method, path, and request ID. They should be formatted as:

       ```js
       `[${timestamp}]: ${method} ${path} (${requestID})`
       ```

3. **Custom Error Handling**  

* Catch any uncaught errors and respond with a `500 Internal Server Error` error status and a JSON response body with the `requestID` and an error message. You can test this middleware with the `/error` endpoints

## Checking Your Work

As you work, use Postman to check your work:

1. Start the server

    ```sh
    npm start
    ```

2. Make requests in Postman using the ones you set up at the beginning of the assignment.

   Confirm the responses in Postman and the logs in your server terminal match the expectations in the deliverables.

## Submitting Your Assignment

Before you can turn in your work, you need to make sure your tests are passing.

Run the test suite and address any errors before making any commits:

```sh
npm test
```

Once all your tests are passing, you may commit your changes, publish your branch, and open a pull request.

> REMEMBER: Commit messages should be meaningful. `Week 3 assignment` is not a meaningful commit message summary. Review the Guide to Commits and Pull Requests for more information.
