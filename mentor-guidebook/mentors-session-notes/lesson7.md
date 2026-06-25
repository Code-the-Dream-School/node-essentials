# Lesson/Assignment 7: Advanced Prisma

## Session focus

This is one of the densest weeks. Students already know basic Prisma CRUD from Lesson 6. Now they add the features that make a real API: loading related data, aggregating, grouping, transactions, bulk operations, pagination, and a little raw SQL. The goal of the session is less "cover everything" and more "give them a reason to care about each feature." For each topic, anchor it to the task app: why would the to-do app actually need this?

## Key concepts to emphasize

- **Eager loading related data** with `include` and `select`. This is how a task can come back with its user's name and email in one call.
- **Aggregation and `groupBy`** for the analytics routes (counts of tasks by priority, by completion status, etc.).
- **Transactions** with `prisma.$transaction()`: several writes that must all succeed or all fail together.
- **Bulk operations**: `createMany`, `updateMany`, `deleteMany`.
- **Pagination, filtering, and sorting** driven by query parameters (`page`, `limit`, `find`, `sortBy`, `sortDirection`, `fields`).
- **Raw SQL** with the `prisma.$queryRaw` tag, and why the tag form is safe from SQL injection while naive string building is not.

## The "why would I use this?" framing

Students do not struggle with the Prisma syntax so much as with *when* to reach for each tool. A quick mapping that helps in the session:

- "Show each task with who owns it" -> eager loading.
- "How many tasks does each user have, grouped by priority?" -> `groupBy` / aggregation.
- "Create an order plus its line items, all or nothing" -> transaction.
- "Import 50 tasks at once" -> `createMany`.
- "The task list is huge and the page is slow" -> pagination and selective fields.

## The N+1 problem and Prisma's client-side joins

Worth calling out explicitly, because it surprises people: Prisma does not do true SQL joins. When you load related data, it often issues separate queries and joins on the client side. So eager loading is convenient, but it is not free. This connects back to the Lesson 6 note that the ORM hides what SQL is really doing. If a student asks "is this efficient?", the honest answer is "not always, and that's a real tradeoff of ORMs."

## Common student issues

- Confusing `select` and `include`. `select` picks specific fields; `include` pulls in related records. Mixing them in the same query at the same level is an error.
- Relation field capitalization. The schema's relation field (e.g., `User` on a task) must match exactly in `select`/`include`. Capitalization bugs are common.
- Forgetting that query parameters arrive as **strings**. `req.query.limit` is `"10"`, not `10`, and `req.query.isCompleted` is `"true"`, not a boolean. The controller has to convert them.
- Building dynamic `where` clauses and accidentally returning everything (or nothing) when no filters are present.
- Pagination math: off-by-one errors in `skip`/`take`, and forgetting to return total counts so the front end can build page controls.
- Treating `$queryRaw` like string concatenation. Emphasize that the tagged-template form parameterizes values; concatenating user input into the query string reintroduces injection risk.

## Still using a global for the logged-in user

Remind students: in Lessons 6 and 7 the logged-in user is still tracked with `global.user_id`. That is a deliberate simplification, and it is replaced with real per-request identity (JWTs and cookies, `req.user`) in Lesson 8. If a student asks why a global is acceptable, the honest answer is that it is not for a real app; it only works because we are effectively assuming one user at a time. (See the course's data-and-identity guide for the full arc.)

## Assignment reminders

- Students work on an `assignment7` branch.
- Encourage incremental testing: get one query working in isolation before wiring up filtering, sorting, and pagination together.
- The analytics routes are a good checkpoint for whether `groupBy` and aggregation clicked.

## Next lesson

Lesson 8: authentication and back-end security. This is where `global.user_id` finally goes away.
