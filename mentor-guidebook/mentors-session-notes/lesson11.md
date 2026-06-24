# Lesson/Assignment 11: Extras and the Final Project

## Session focus

There is very little new material this week. If a student has completed Assignments 1 through 10, they already have a working final project. The session is mostly about three things: encouraging one extra back-end feature, helping students prepare a good presentation, and making sure the submission and redeploy steps go smoothly. Manage anxiety here. Several students will worry their project "isn't enough." Remind them that a complete, working app from the assignments is a passing final project.

## What "done" looks like

The baseline final project is the app they have already built: registration and login, hashed passwords, protected routes, task CRUD, and a deployed back end on Render with a cloud database on Neon. If that works, they are done. Anything beyond that is bonus.

## Encouraging an extra feature (without scope creep)

The assignment asks students to add one extra back-end feature if time permits. Steer them toward something small and back-end only, so they are not pulled into React work. Good candidates:

- Pagination or filtering on a route that doesn't have it yet.
- Role-based access control (e.g., an admin who can see all tasks).
- Swagger / OpenAPI documentation for their API.
- A new analytics or reporting endpoint.

Push back gently on anything that requires significant front-end work or a brand-new integration the week before the deadline. "Submit something working" beats "submit something ambitious and broken."

## The presentation

Students record a 3-5 minute presentation following the final-project rubric. Common coaching points:

- It is a tour, not a code read-through. Show the app doing things.
- Make sure they actually demonstrate CRUD: create, read, update, and delete real data live.
- Make sure they show registration/login and name the security protections (hashed passwords, protected routes, secure auth handling).
- If they added an extra feature, they must show it and explain it.
- The rubric also asks for a technical challenge they solved, what they learned, and what they'd do next. Encourage them to actually answer these; they are easy points and good interview practice.

## Submission and redeploy gotchas

This week's submission flow is slightly different from earlier weeks, and it trips people up:

- Students merge their own `assignment11` pull request. They do **not** wait for a reviewer, unlike normal assignments.
- After merging, they must do a **manual deploy of the main branch** on Render.
- **If their extra feature changed the Prisma schema**, the Render build command has to regenerate the client and apply migrations: `npm install --production && npx prisma generate && npx prisma migrate deploy`. Schema changes that aren't migrated to the production database are a classic "works locally, broken on Render" bug.
- They should describe any added feature and any new/changed APIs in `project-summary.txt` (path, method, query params, request body) so the reviewer can actually try them.

## Common student issues

- Final project works locally but fails on Render, usually a missing migration on the production database, or a missing/incorrect environment variable in the Render dashboard.
- Forgetting that the production database is separate and must be migrated. Never run `prisma migrate reset` against it.
- Presentation that talks about the code but never demonstrates the running app.
- Running out of time on an over-ambitious extra feature. Remind them early: submit the working baseline no matter what.

## Wrap-up

This is the end of the course. It's worth taking a few minutes to point students at where they go next: real cross-origin/CORS setups, logging and monitoring, email verification and password reset, and the data-engineering and security topics flagged in earlier mentor notes as out of scope. They've built a real, deployed, secured Node/Express API. That's the headline.
