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

## Questions to address

1. [Here](https://github.com/Code-the-Dream-School/node-essentials/blob/efd3026e9b84fa7578d3c74b26d8486444307c04/assignments/06-intro-to-prisma.md?plain=1#L204) it says `Then, change the shutdown so that as well as ending the pg pool, it also does the following:`.

   What exactly is "it also does the following:" referring to? Because immediately after that statement there are two lines of code and no explanation.

   The code that follows the quoted statement above:

   ```javascript
   await prisma.$disconnect();
   console.log("Prisma disconnected");
   ```

## Notes to raise

1. I updated the instructions pertaining to "Update the Show Method"

   prisma.tasks.findUnique() does not throw a P2025 error when no record is found. It simply returns null.

   The P2025 error only occurs with operations that modify data (update, delete, updateMany, etc.) when no matching record exists.

   Per the Prisma [documentation](https://www.prisma.io/docs/orm/reference/prisma-client-reference#findunique), "By default, both operations return null if the record is not found."

   It is also already addressed in the curriculum [lesson](https://github.com/Code-the-Dream-School/node-essentials/blob/0f0a113e0d7bd61bc17e96cf912b8ffa4be61358/lessons/06-intro-to-prisma.md?plain=1#L189).

2. Multiple times I had to use `user_id` in place of `userId`. And `is_completed` in place of `isCompleted`.

   I THINK this is contrary to the instructions in the [assignment](https://github.com/Code-the-Dream-School/node-essentials/blob/main/assignments/06-intro-to-prisma.md).

   I was able to successfully use the app via Postman. See my [controllers/taskController.js](https://github.com/JamieBort/node-homework/blob/assignment6/controllers/taskController.js) file.

3. Every time we're instructed to use `await prisma.task.<some_method>` in the [assignment](https://github.com/Code-the-Dream-School/node-essentials/blob/main/assignments/06-intro-to-prisma.md), I had to use `await prisma.tasks.<some_method>` instead.

   On account of my schema.prisma file had `tasks` rather than `task`:

   ```
   model tasks {
     id           Int      @id @default(autoincrement())
     title        String   @db.VarChar(255)
     is_completed Boolean  @default(false)
     user_id      Int
     created_at   DateTime @default(now()) @db.Timestamp(6)
     users        users    @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)

     @@unique([id, user_id], map: "task_id_user_id_unique")
   }
   ```

   Likewise for `const user = await prisma.users.findUnique(` for the same reason.

   For what it is worth, the instructions to create the SQL database is found [here](https://github.com/Code-the-Dream-School/node-essentials/blob/0f0a113e0d7bd61bc17e96cf912b8ffa4be61358/assignments/05-intro-to-sql-and-postgresql.md?plain=1#L158) in the repo (in Assignment 5). There the tables `users` and `tasks`.
