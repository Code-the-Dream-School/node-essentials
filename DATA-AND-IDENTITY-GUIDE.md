# **How Data and Identity Evolve Across the Course**

This course builds one application over many weeks. Two parts of that application change shape more than any other: **where your data lives** and **how the app knows who is logged in**. Each change is deliberate. We start with the simplest version of an idea so you can focus on one new concept at a time, and then we replace it with something closer to a real application.

If you ever feel like "wait, didn't this work differently last week?", you are right. This guide gives you the big picture so the changes feel like a planned path instead of a surprise.

## **Why Things Keep Changing**

Real applications are made of many moving parts. If we introduced all of them at once, every assignment would be overwhelming. Instead, we hold most parts steady and change one thing at a time.

Think of it like learning to cook. First you learn to use the stove with a single pan. Later you add more pans, then timing, then plating. Each step builds on the last. The early simplifications are not wrong. They are scaffolding that we remove once you no longer need it.

## **Part 1 — Where Your Data Lives (Storage)**

Your app stores two main things: users and each user's tasks. Where those live changes four times.

### **Stage 1: In Memory (Lessons 1–4)**

At first, your data lives in plain JavaScript variables, often on the `global` object, such as `global.users` and `global.tasks`.

This is the simplest possible storage. It lets you focus on routes, middleware, and validation without worrying about databases.

The big limitation: **memory does not survive a restart.** Every time you stop and start your server, all users and tasks are gone. This is fine for learning, but no real app works this way.

### **Stage 2: PostgreSQL with Raw SQL (Lesson 5)**

In Lesson 5, you replace the in-memory globals with a real PostgreSQL database. You write SQL statements yourself and run them through the `pg` library.

Now your data persists. When you restart the server, your users and tasks are still there, because they live in the database, not in memory.

This is also where you start using environment variables and a `.env` file to hold your database connection string. See the [Environment Variables and Secrets guide](./ENVIRONMENT-VARIABLES-GUIDE.md) for the details.

### **Stage 3: Prisma, an ORM (Lessons 6–7)**

In Lesson 6, you keep PostgreSQL but stop writing raw SQL. Instead you use **Prisma**, an Object-Relational Mapper (ORM). You describe your tables in a schema file, and Prisma gives you methods like `prisma.task.findMany()` instead of hand-written SQL.

The database is the same. What changes is how your code talks to it. Lesson 7 then adds advanced Prisma features: loading related data, aggregation, transactions, bulk operations, and pagination.

### **Stage 4: A Cloud Database (Lesson 10)**

In Lesson 10, you deploy your app. Your code still uses Prisma, but the database moves from your laptop to a cloud provider (we use Neon). Your deployed app reads a different connection string so it talks to the cloud database instead of your local one.

### **Storage at a Glance**

| Lessons | Where data lives | How your code reads/writes it |
| --- | --- | --- |
| 1–4 | In memory (`global.users`, `global.tasks`) | Plain JavaScript |
| 5 | Local PostgreSQL | Raw SQL via the `pg` library |
| 6–7 | Local PostgreSQL | Prisma ORM methods |
| 10 | Cloud PostgreSQL (Neon) | Prisma ORM methods |

The headline: the *place* your data lives changes, but from Lesson 6 onward, the *way your code talks to it* (Prisma) stays the same.

## **Part 2 — How the App Knows Who Is Logged In (Identity)**

Almost every route needs to answer one question: "who is making this request?" The way your app answers that question changes once, and it is a big change.

### **Stage 1: A Global Variable (Lessons 4–7)**

In the early weeks, when a user logs in, your code stores the logged-in user in a single global variable named `global.user_id`. Your auth middleware then just checks whether that global is set:

```js
if (!global.user_id) {
  return res.status(401).json({ message: "Unauthorized" });
}
```

What `global.user_id` actually holds changes once your data moves into a database, and this trips people up:

- **Lesson 4 (in-memory):** `global.user_id` holds the whole logged-in **user object**, and each task records its owner by **email**. So a controller checks ownership with something like `task.userId === global.user_id.email`.
- **Lessons 5–7 (database):** once users live in PostgreSQL, each user has a numeric `id`, so `global.user_id` holds that **integer id**, and tasks record ownership with an integer `userId` foreign key.

In both cases the *idea* is the same: a single global variable that says "this is who is logged in." Only the value inside it changes (a user object first, then an id).

You may also see this idea written as a `loggedOnUser` variable in general examples. In this course project, the actual variable name is `global.user_id`.

This is intentionally simple, and it has a serious flaw: **a global variable can only hold one value.** If two people used your app at the same time, they would overwrite each other's identity. That is unacceptable for a real app, but it lets you learn routes, validation, and databases before tackling authentication.

### **Stage 2: Per-Request Identity with JWTs and Cookies (Lesson 8 onward)**

In Lesson 8, you replace the global with real authentication. When a user logs in, the server creates a **JSON Web Token (JWT)** and sends it back in an **HttpOnly cookie**. On every later request, the browser sends that cookie automatically. Your auth middleware verifies the token and attaches the user to the request:

```js
req.user = { id: payload.id, ... };
```

Controllers now read `req.user.id` instead of `global.user_id`.

The key difference: `req` is a **separate object for every request**, so each request carries its own identity. Many different users can now use your app at the same time without stepping on each other. This is why the global approach had to go.

### **Identity at a Glance**

| Lessons | How identity is stored | What the global holds | How controllers read it |
| --- | --- | --- | --- |
| 4 (in-memory) | One global variable, set at login | The logged-in user **object** | `global.user_id.email` for ownership |
| 5–7 (database) | One global variable, set at login | The user's integer **id** | `global.user_id` |
| 8+ | JWT in an HttpOnly cookie, verified per request | (no global) | `req.user.id` |

If you see `global.user_id` in older lesson code and `req.user.id` in later code, that is exactly the transition described here. When you reach Lesson 8, expect to search your controllers for `global.user_id` and replace it.

## **Part 3 — One Database Becomes Three**

Once your data lives in a database, you are actually juggling more than one: a **development** database you work in by hand, a separate **test** database the automated tests delete and re-create, and later a **production** database in the cloud for real users. Keeping them straight is one of the most common sources of confusion in the course.

The full explanation, which connection string is which, why test must be separate, and what you must never run against production, lives in the [Environment Variables and Secrets guide](./ENVIRONMENT-VARIABLES-GUIDE.md).

## **The One-Paragraph Summary**

Your data starts in memory (Lessons 1–4), moves to a local PostgreSQL database you query with raw SQL (Lesson 5), then with Prisma (Lessons 6–7), and finally to a cloud database when you deploy (Lesson 10). Your app's sense of "who is logged in" starts as a single global variable (Lessons 4–7) and becomes real per-request authentication with JWTs and cookies in Lesson 8. Along the way you maintain three separate databases, development, test, and production, and most mysterious bugs come down to being connected to a different one than you thought.
