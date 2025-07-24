# Lesson 6b: PostgreSQL and Node.js Integration with Prisma ORM

## 1. Introduction to Prisma

Prisma is a modern ORM (Object-Relational Mapping) for Node.js and TypeScript. It provides a type-safe, auto-completing, and developer-friendly way to interact with your database, compared to writing raw SQL or using the `pg` library directly.

**Key Features:**
- Type-safe database queries
- Auto-generated client based on your schema
- Built-in migrations and schema management
- Easy integration with PostgreSQL and other databases

---

## 2. Setting Up Your Prisma Project

### a. Create a New Project
```bash
mkdir week-6-prisma
npm install prisma @prisma/client
cd week-6-prisma
npx prisma init
cd ..
```
This creates the following structure:
```
project-root/
├── .env
├── package.json
└── week-6-prisma/
    ├── prisma/
    │   ├── schema.prisma
    │   └── db.js
    ├── app.js
    ├── taskController.js
    └── taskRoutes.js
```
- Place your `.env` file in the project root (not inside week-6-prisma).
- Your Prisma schema is at `week-6-prisma/prisma/schema.prisma`.
- Your main app and related files go in `week-6-prisma/`.

---

## 3. Modeling the Schema with Prisma

Edit `week-6-prisma/prisma/schema.prisma` to define your `Task` model:
```prisma
model Task {
  id        Int     @id @default(autoincrement())
  title     String
  completed Boolean @default(false)
}
```

To create the table in your database, run this command from the project root:
```bash
npx prisma migrate dev --name init --schema=week-6-prisma/prisma/schema.prisma
```

---

## 4. Generating the Prisma Client
After running the migration, Prisma will generate a type-safe client for you. You can now use this client in your Node.js code in `week-6-prisma/`.

---

## 5. Implementing the API with Prisma

Create the following files inside `week-6-prisma/`:
- `app.js` (main Express app)
- `taskController.js` (controller logic)
- `taskRoutes.js` (Express routes)
- `prisma/db.js` (Prisma client instance)

Below are the full code examples for each file. You can copy and use them directly:

### prisma/db.js
```js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = prisma;
```

### app.js
```js
const express = require('express');
require('dotenv').config();

const taskRoutes = require('./taskRoutes');
const prisma = require('./prisma/db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Prisma server running on port ${port}`);
});
```

### taskController.js
```js
const prisma = require('./prisma/db');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTask = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const task = await prisma.task.create({ data: { title } });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: { title, completed },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### taskRoutes.js
```js
const express = require('express');
const router = express.Router();
const taskController = require('./taskController');

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
```

---

## 6. Comparing Prisma and pg Approaches

| Feature                | pg (SQL/Pool)                | Prisma ORM                        |
|------------------------|------------------------------|-----------------------------------|
| Query style            | Raw SQL strings              | Type-safe JS/TS API               |
| Schema management      | Manual SQL/migrations        | Prisma schema + migrations        |
| Type safety            | None (unless using TS types) | Built-in                          |
| Autocomplete           | No                           | Yes (in editors with Prisma ext.) |
| Error handling         | Manual                       | Built-in                          |
| Relations              | Manual JOINs                 | Declarative in schema             |
| Refactoring            | Tedious                      | Easier (schema-driven)            |
| Learning curve         | Lower (for SQL users)        | Slightly higher, but modern       |

---

## 7. Shifting from pg to Prisma: Migration Guide

- Move your connection string to `.env` as `DATABASE_URI`.
- Model your tables in `schema.prisma`.
- Run `npx prisma migrate dev` to sync your DB.
- Replace raw SQL queries with Prisma Client methods (see API example above).
- Enjoy type safety, autocompletion, and easier refactoring!

---

## 8. Tips:
- Prisma is great for rapid development and type safety.
- You can always drop down to raw SQL if needed (`prisma.$queryRaw`).
- Use the [Prisma docs](https://www.prisma.io/docs/) for more advanced features.
- If you get stuck, compare your Prisma API to your previous pg-based API to see the differences.

