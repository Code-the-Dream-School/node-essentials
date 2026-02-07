# Notes for Lesson/Assignment 6

## About this file

This is a file created to make note of things as they pertain to the https://github.com/Code-the-Dream-School/node-essentials/issues/96 Issue, which was created for the 6th lesson. More specifically it was created to "review, test, and evaluate Lesson/Assignment 6 for accuracy and clarity."

## Specific instructions

- Make sure all examples and instructions work as expected.
- If sample answers are not available, please create and submit them.
- If sample answers exist in the mentor guidebook, test them out to confirm everything runs correctly.
- Note any issues, confusing sections, or areas that may need improvement, and provide feedback or suggested fixes in the comments.

## Scope of review

## Resources used

Two files are used for the 6th lesson/assignment. Meaning I'll be looking at

- The lesson file: https://github.com/Code-the-Dream-School/node-essentials/blob/main/lessons/06-intro-to-prisma.md
- The assignment file: https://github.com/Code-the-Dream-School/node-essentials/blob/main/assignments/06-intro-to-prisma.md

## Notes

The lesson file is well written - upon first read I didn't notice anything that should change. It flowed and appeared to be comprehensive.

<!-- TODO: migrate the thoughts below in the "Proposed text changes" section to the "./lessons/lesson6-pg-prisma.md" file. -->

## Proposed text changes

Original
From this point on, if you make a schema change, you change the model, do an npx prisma migrate dev, and then, for the test database, do the corresponding npx prisma migrate deploy.

Proposed
From this point on, if you make a schema change, first change the model, next do an npx prisma migrate dev, last, do the corresponding npx prisma migrate deploy for the test database.

Original

You do not change the schema with ordinary SQL. You'll use the deploy also with the production database you create for Internet deployment of your app in lesson 10. You never use a schema reset with the production database, for the obvious reason that it deletes all the data.

TODO: make these suggestions in the node-homework repo.

TODO: Use commands rather than "You" all the time.

```
..., it also does the following:

await prisma.$disconnect();
    console.log("Prisma disconnected");
```

It does what??? These are commands, not an explanation.

---

For the register method in usercontroller: "b. Fix Register"

Your schema: model users → Prisma client: prisma.users

Current code: prisma.user → undefined → TypeError

Fix: replace all prisma.user references with prisma.users

and

replace
res
.status(201)
.json({ name: result.rows[0].name, email: result.rows[0].email });

with
res.status(201).json({ name: user.name, email: user.email, id: user.id });

---

for "Fix the Task Index Method"

`const tasks = await prisma.task.findMany({` should be `const tasks = await prisma.tasks.findMany({` instead

---

for "Fix Task Update"

rather than

```
try {
  const task = await prisma.task.update({
    data: value,
    where: {
      id,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true }
  });
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  }
}
```

---

For "Update the Show Method"

prisma.task.findUnique() does not throw a P2025 error when no record is found. It simply returns null. The P2025 error only occurs with operations that modify data (update, delete, updateMany, etc.) when no matching record exists.

Per https://www.prisma.io/docs/orm/reference/prisma-client-reference#findunique, "By default, both operations return null if the record is not found."

<!-- TODO: remove the "Actions I took, in order" section below. -->

### Actions I took, in order

1. First command

```
node-homework % npm install prisma @prisma/client

added 24 packages, removed 1 package, changed 8 packages, and audited 575 packages in 41s

106 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

2. Second command

```
node-homework % npx prisma init
Fetching latest updates for this subcommand...

Initialized Prisma in your project

  prisma/
    schema.prisma
  prisma.config.ts

warn Prisma would have added DATABASE_URL but it already exists in .env
warn You already have a .gitignore file. Don't forget to add .env in it to not commit any private information.

Next, choose how you want to set up your database:
CONNECT EXISTING DATABASE:
  1. Configure your DATABASE_URL in prisma.config.ts
  2. Run prisma db pull to introspect your database.
CREATE NEW DATABASE:
  Local: npx prisma dev (runs Postgres locally in your terminal)
  Cloud: npx create-db (creates a free Prisma Postgres database)

Then, define your models in prisma/schema.prisma and run prisma migrate dev to apply your schema.
Learn more: https://pris.ly/getting-started
```

3. Third command `rm prisma.config.ts `

4. Fourth command `npx prisma generate`

5. Fifth command

```
node-homework % npx prisma generate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 139ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
```

6. Sixth command

`npx prisma db pull`

```
node-homework % npx prisma db pull
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "tasklist", schema "public" at "localhost"

✔ Introspected 2 models and wrote them into prisma/schema.prisma in 229ms

Run prisma generate to generate Prisma Client.
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.2 -> 7.3.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

zeus@MacBook-Air-de-Jamie node-homework %
```
