### Class Learning Objectives

By the end of this course, students will be able to:
 - Apply fundamental Node.js programming concepts to build server-side applications.
 - Work effectively with asynchronous JavaScript, including Promises, async/await, and the event loop.
 - Utilize Node.js core modules for file system operations, HTTP servers, and process management.
 - Build RESTful APIs using Express.js with proper middleware, routing, and error handling.
 - Implement data validation and input sanitization to create secure web applications.
 - Use SQL databases with Node.js, including both raw SQL queries and ORM tools like Prisma.
 - Implement user authentication and authorization using JWT tokens and secure session management.
 - Write comprehensive automated tests for Node.js applications using Jest and Supertest.
 - Deploy Node.js applications to cloud platforms and manage production environments.
 - Apply security best practices including password hashing, CORS, rate limiting, and input validation.
 - Collaborate effectively on Node.js projects using version control and modern development practices.

| Week | Topic | Learning Objective |
|------|-------|--------------------|
| 1 | Introduction to Node | Students will gain foundational knowledge of the Node.js runtime environment, including the event loop, asynchronous programming concepts, and differences between browser-side JavaScript and server-side JavaScript. They will run Node programs from the command line, use CommonJS modules, work with Node core modules such as `fs`, `http`, and `crypto`, and practice Promises and async/await patterns. They will also learn how to use Node.js documentation and npm packages. |
| 2 | Events, HTTP Servers, and Express | Students will learn how event emitters and listeners work in Node.js, create HTTP servers with the built-in `http` module, and return JSON and HTML responses. They will practice REST-style method and path routing, read request bodies with `"data"` and `"end"` events, test POST requests with the Postman VS Code Extension, and build a basic Express app with route handlers. They will also see how Express makes routing and JSON parsing easier than raw Node HTTP. |
| 3 | Express Middleware and Error Handling | Students will learn how Express processes requests through middleware and route handlers. They will write built-in, custom, and third-party middleware; organize middleware order; modify `req` and `res`; create request IDs with Node's built-in `crypto.randomUUID()`; use temporary in-memory globals as a temporary data store; add not-found and error handling middleware; create custom error classes with status codes; choose common API status codes; return consistent error responses; and use basic debugging techniques for Express applications. |
| 4 | Security Middleware, Validation, and Password Hashing | Students will learn to protect task routes with authentication middleware, return appropriate 401 responses for unauthenticated requests, and enforce basic access control so users only work with their own tasks. They will build task CRUD routes and controllers using the temporary in-memory/global storage approach from the early lessons. They will validate user and task input with Joi schemas, including separate validation rules for create and patch operations, and they will hash passwords with Node's `crypto.scrypt` before storing them. Students will also learn why the temporary global user approach is not production-safe and why stronger session handling will be needed later. |
| 5 | Introduction to SQL and Databases | Students will gain foundational knowledge of SQL databases, learning about relational database concepts, primary and foreign keys, and basic SQL operations (SELECT, INSERT, UPDATE, DELETE). They will understand database schemas, constraints, and relationships. They will practice writing complex SQL queries including JOINs, subqueries, GROUP BY, and HAVING clauses. They will also learn to integrate PostgreSQL databases with Node.js applications using raw SQL queries, set up database connections, and perform CRUD operations with the `pg` library. |
| 6 | Prisma ORM Integration | Students will learn to transform PostgreSQL applications from raw SQL queries to using the Prisma ORM. They will set up and configure Prisma in their projects, create Prisma schemas, implement migrations, and perform CRUD operations using Prisma Client. They will understand the benefits of ORMs, learn about type-safe database operations, and implement Prisma features like relationships and error handling. They will replace raw SQL queries with Prisma methods while maintaining the same functionality. |
| 7 | Advanced Prisma and Data Modeling | Students will master Prisma ORM features including advanced querying, relationships, and data modeling. They will implement complex database operations, learn about Prisma migrations, and build analytics features. They will understand database performance considerations and learn to optimize queries. They will also implement bulk operations and advanced data retrieval patterns. |
| 8 | Authentication and Security | Students will implement comprehensive authentication and authorization systems using JWT tokens, password hashing, and secure session management. They will learn about security best practices including CORS, rate limiting, input sanitization, and protection against common vulnerabilities. They will implement user registration, login, logout, and protected routes with proper access control. |
| 9 | Automated Testing | Students will learn automated testing concepts and write comprehensive test suites using Jest and Supertest. They will write unit tests for validation schemas and controller functions, integration tests for API endpoints using Supertest, and learn testing best practices including mocking, test organization, and achieving good test coverage. They will also learn about test-driven development (TDD) principles and how to test authentication flows and protected routes. |
| 10 | Deployment and Production | Students will learn to deploy Node.js applications to cloud platforms, specifically using Render.com for hosting and Neon.tech for database services. They will understand production environment considerations, environment variables, database migrations in production, and monitoring. They will also learn to integrate their backend with a React frontend and handle CORS configuration. |
| 11 | Project Enhancement and Best Practices | Students will explore advanced Node.js concepts and project enhancement ideas. They will learn about project initialization, team collaboration workflows, and advanced features they can add to their applications. They will understand production considerations, performance optimization, and how to continue learning and growing as Node.js developers. |

### Final Project

Students will build a comprehensive Task Management application that demonstrates mastery of all course concepts.

#### Core Requirements
 - **Backend API:** Full REST API with user authentication and task management
 - **Database Integration:** PostgreSQL database with Prisma ORM
 - **Security:** JWT authentication, password hashing, input validation, and security middleware
 - **Testing:** Comprehensive test suite with Jest and Supertest
 - **Deployment:** Live deployment on Render.com with Neon.tech database
 - **Frontend Integration:** Works with provided React frontend

#### Technical Skills Demonstrated
 - Node.js and Express.js proficiency
 - Database design and ORM usage
 - Authentication and security implementation
 - Automated testing practices
 - Cloud deployment and production considerations
 - API design and documentation
 - Error handling and validation
 - Code organization and best practices
