# Lesson/Assignment 3: HTTP, JSON, Express Concepts

## HTTP components

Request Components
- url
- protocol (HTTP or HTTPS, sometimes others), hostname, port
- method (GET, POST, PUT, PATCH, DELETE, rarely others)
- path
- URL parameters (sometimes): DELETE /tasks/423
- query parameters (sometimes) GET /tasks?isCompleted=true&orderBy=createdAt
- headers, including Cookie, Setcookie (usually)
- body (sometimes)

Response components
- result code
- body (sometimes)
- headers (usually)

## JSON

A JSON document is a JSON object or an array (ordered list)

The values in either are nested JSON objects/arrays or:
numbers (integer or float), strings, booleans, null

In JSON objects, the attribute name is always a quoted string.  

JSON strings always use double quotes

```JSON
{ "part 1": [4, 5, 11.2, false], 
"part 2": "miscellaneous",
"part 3": { "nested": null } }
```

## REST (representational state transfer protocol)

1. HTTP GET, POST, PUT, PATCH, DELETE
2. Request and response bodies are always JSON
3. The Content-Type header is always “application/json”

## Request Handlers and Middleware

1. Order Matters!  For example, the body parser middleware must come before any reference to req.body.
2. Middleware must do exactly one of these with each call:
    - res.send() or res.json()
    - throw err or next(err) – In Express 5, these work the same (except no throwing errors within callbacks!)
    - next()
3. Request handlers must do exactly one of these with each call:
    - res.send() or res.json()
    - throw err or next(err)
4. Either type of function may modify the request or set headers.
5. For request handlers, the method and path have to match exactly.  Middleware either runs on every request, or on every request with a certain path prefix.

## VSCode Debugging

1. Ctrl-Shift-P
2. Debug: Toggle Auto Attach
3. Set to Smart
4. Set your breakpoints
5. Start a terminal
6. Run the program from the terminal as usual.
7. Open the left hand panel for run and debug.

