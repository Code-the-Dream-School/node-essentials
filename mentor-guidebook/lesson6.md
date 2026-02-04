# Lesson/Assignment 6: Using the Prisma ORM

## Stuff We Didn’t Teach You About SQL

There’s more to learn:
- Designing your schema
- Window functions in SQL
- Common Table Expressions (CTEs)
- Optimizing queries
- Extract, Transform, and Load (ETL)
- When to use NoSQL databases or other forms of storage instead

These and other topics belong to a developer domain called Data Engineering.  You don’t need to know the items above as a full stack web developer, but Data Engineering is an alternate track for finding good jobs. You should investigate that domain.

## Advantages of the ORM

- Instead of writing SQL statements, you do CRUD operations on objects, which typically has easier syntax.
- Schema management is easier, which is very important when working on a team project.
- You get database portability.  The pg package only works with PostgreSQL, not other SQL databases.

But:

- The ORM makes SQL operations more opaque and harder to understand.
- Sometimes the ORM won’t do quite what you want.
- The Prisma ORM doesn’t really do SQL joins.  When you load related data (lesson 7) it is joined on the client side: very inefficient!

## Raw Queries

For the health check, we use:

```js
await prisma.$queryRaw`SELECT 1`;
```

This is a tag, not a method, for string interpolation.  In lesson 7, you’ll do stuff like: 

```js
await prisma.$queryRaw`SELECT * WHERE id = ${id}`;
```

Looks dangerous, right? It appears that this could create an SQL injection exposure – but it doesn’t, because Prisma sanitizes the values before substitution.

## Migration

- To do Prisma CRUD operations, you need a model for each table, as stored in ./prisma/schema.prisma.  This lists rows, data types, relations with other tables, and indexes.
- You can build the Prisma schema (models) from an existing database using introspection.
- Or, you can build the models first, and then do a migration to create tables.  Subsequently, you can modify one or several models and then do a migration to update the database schema.
- Dev environment migrations record what has been done, so as to apply changes incrementally.  There are files in the prisma/migrations tree with the exact SQL.  A special table in the database keeps track of the state of migrations.  You can get these out of sync, in which case the migration fails.  Each migration also rebuilds the prisma client library.
- Test and production environment migrations (the "deploy" option) apply what has been recorded for Dev.

## Getting Migrations Out of Sync

1. You are working in branch A, with the database and Prisma client in a given state.
2. You check out branch B, which has a different migration history.  The client and database now don’t match the recorded migrations or the schema file.  Migrations will fail.  Database CRUD operations may return results that don’t work with the code in your controller.
3. You can do an npx prisma migrate reset to get back in sync – but that discards all data in the database.  Never do that with the production database!
4. In a team project, you have to be careful that each new migration builds on previous ones, so that you don’t get out of sync.

## The Prisma Methods You Will Use (all async except first)

- new PrismaClient()
- prisma.$queryRaw (a tag, not a method, usually)
- prisma.model.findUnique(), prisma.model.findFirst()
- prisma.model.findMany(), prisma.model.groupBy()
- prisma.model.create(), prisma.model.createMany()
- prisma.model.update(), prisma.model.updateMany()
- prisma.model.delete(), prisma.model.deleteMany()
- prisma.$transaction()
- prisma.$disconnect()

## Error Handling in Context VS. Global Error Handler

Sometimes you do error handling for Prisma operations within the controller, and sometimes you do it in the global error handler.  The guidelines are:

1. Give the caller a good description of why the operation failed, but
2. Don’t repeat yourself (DRY)


If the error itself does not convey enough context to give the caller good feedback, you need to do error handling in the controller – but most of the time you do it in the error handler.

## Next Lesson: More Prisma

Lesson 7: Eager load of related data, transactions, groupBy, bulk create/update/delete, pagination, and raw SQL.  You’ll also learn to use query parameters to customize these operations.

In lessons 6 and 7, the logged on user is still a global.  You’ll do proper session management with JWTs and cookies in Lesson 8.
