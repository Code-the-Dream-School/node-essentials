# Lesson 6a: PostgreSQL and Node.js Integration

## Why and When to Use a Database

When building apps, you often need to store and manage data. At first, you might use variables or arrays in your code (in-memory data). But this approach has big limitations:
- **Data disappears when your app stops or restarts.**
- **You can't easily share data between different users or computers.**
- **Searching, updating, or organizing lots of data becomes slow and complicated.**

**Databases solve these problems:**
- They store data permanently, even if your app or server restarts.
- Multiple users and programs can access the same data safely.
- They make it easy to search, update, and organize large amounts of information.

**Why PostgreSQL?**
- It's free and open-source, with a strong community.
- It's reliable and trusted by many companies for important data.
- It supports advanced features (like complex queries, data types, and extensions) but is still easy to start with.
- Works well with Node.js and many other languages.

**Basic Database Concepts:**
- **Table:** Like a spreadsheet; organizes data into rows and columns.
- **Row:** A single record (like one task, user, or product).
- **Column:** A property or field for each record (like 'title', 'completed', or 'id').
- **Schema:** The structure or blueprint of your tables (what columns exist, what type of data they hold, and any rules).

---

## The Request-Response Cycle (How APIs Work)

Before we dive into code, let's see how your app will work behind the scenes:

1. **Client sends an HTTP request:**
   - This could be your browser, Postman, or another app asking for data or sending new data (like creating a new task).
2. **Server receives and handles the request:**
   - Your Node.js server listens for these requests. When one comes in, it figures out what to do based on the URL and method (GET, POST, etc.).
3. **Controller decides what happens:**
   - Controllers are special functions in your code that decide what to do when an API endpoint is called (for example, what to do when someone asks for all tasks or wants to add a new one).
4. **Database command is sent:**
   - Inside the controller, `pool.query()` is used to send commands (like SELECT, INSERT, UPDATE, DELETE) to your PostgreSQL database.
5. **Server sends a response:**
   - After getting the result from the database, the server sends a response back to the client (like a list of tasks, a success message, or an error).

**In summary:**
- Client → HTTP request → Server → Controller → pool.query() → Database → Server → HTTP response → Client

---

## 1. Introduction to PostgreSQL

PostgreSQL is a powerful, open-source object-relational database system known for its reliability, feature set, and performance. It is widely used in production environments for web, mobile, and analytics applications.

**Key Features:**
- Open source and free
- ACID compliant (ACID compliance refers to a set of properties that guarantee reliability and consistency in database transactions.)
- Supports advanced data types and indexing
- Extensible with custom functions and plugins

## 2. Setting Up Your Project and Database

### a. Check if PostgreSQL is Installed
Open your terminal and run:
```bash
psql --version
```
If you see a version number, PostgreSQL is installed. If not, follow the [official installation guide](https://www.postgresql.org/download/) for your OS.

### b. Create a New Node.js Project (if you haven't already)
```bash
mkdir week-6-postgreSQL
cd week-6-postgreSQL
npm init -y
```

### c. Install Required Packages
```bash
npm install express pg dotenv
```

### d. Set Up Your Database Connection
Create a `.env` file in your `week-6-postgreSQL` folder with the following content (replace with your actual credentials):
```
DATABASE_URI=postgresql://postgres:yourpassword@localhost:5432/yourdatabase
PORT=3000
```

### e. Create the Tasks Table
Create a file called `tasks-schema.sql` in your `week-6-postgreSQL` folder with this content:
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);
```
Run this SQL in your PostgreSQL database (using `psql` or a GUI like DBeaver or TablePlus) to create the table.
```bash
psql "postgresql://postgres:yourpassword@localhost:5432/yourdatabase" -f week-6-postgreSQL/tasks-schema.sql
```
---

## 3. Building a Task API with Node.js and PostgreSQL

### a. Create the Folder and File Structure
- `week-6-postgreSql/`
  - `app.js` (main server file)
  - `db.js` (exports the shared PostgreSQL pool)
  - `taskController.js` (handles task CRUD logic)
  - `taskRoutes.js` (Express routes for tasks)
  - `tasks-schema.sql` (your table schema)
  - `.env` (your environment variables)

### b. Create the Database Pool in db.js
In `db.js`:
```js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

### c. Create the Task Controller
In `taskController.js`:
```js
const pool = require('./db');

exports.getTasks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTask = async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { completed, title } = req.body;
  try {
    let result;
    if (title !== undefined) {
      result = await pool.query(
        'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
        [title, completed, id]
      );
    } else {
      result = await pool.query(
        'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
        [completed, id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### d. Create the Task Routes
In `taskRoutes.js`:
```js
const express = require('express');
const router = express.Router();
const taskController = require('./taskController');

router.get('/tasks', taskController.getTasks);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

module.exports = router;
```

### e. Set Up the Express Server
In `app.js`:
```js
const express = require('express');
const pool = require('./db');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

const taskRoutes = require('./taskRoutes');
app.use('/api', taskRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## 4. Testing Your Task API

Now it's time to try out your API!

**What are Postman and curl?**
- **Postman** is a free app that lets you easily send requests to your API and see the responses. It's great for testing and debugging your server without needing to build a front-end first. You can set the request type (GET, POST, etc.), add headers, and send data in different formats.
- **curl** is a command-line tool (built into most computers) that lets you send HTTP requests from your terminal. It's useful for quick tests or scripting.

**How do you send JSON in requests?**
- **With Postman:**
  1. Choose the request type (e.g., POST or PUT).
  2. Go to the "Body" tab, select "raw", and choose "JSON" from the dropdown.
  3. Type your JSON data (e.g., `{ "title": "My Task" }`).
  4. Postman will automatically set the `Content-Type: application/json` header.
- **With curl:**
  - Use the `-H` flag to set the header and `-d` to send data. For example:
    ```bash
    curl -X POST http://localhost:3000/api/tasks \
      -H "Content-Type: application/json" \
      -d '{"title": "My Task"}'
    ```

1. **Start your PostgreSQL database** and make sure the `tasks` table exists.
2. **Start your Node.js server:**
   ```bash
   npm run week6a
   ```
3. **Test your API endpoints** using [Postman](https://www.postman.com/) or curl:
   - `GET /api/tasks` – Get all tasks
   - `POST /api/tasks` – Create a new task (send JSON body: `{ "title": "My Task" }`)
   - `PUT /api/tasks/:id` – Update a task (send JSON body: `{ "completed": true }`)
   - `DELETE /api/tasks/:id` – Delete a task
4. **Check the responses** to make sure your CRUD operations work as expected.

---

**Tips:**
- Double-check your `.env` file for typos and correct credentials.
- If you get a connection error, make sure PostgreSQL is running and your `DATABASE_URI` is correct.
- Use `console.log` statements to debug your code if something isn’t working.
- If you change your schema, rerun the SQL in your database.
- Ask for help if you get stuck!
