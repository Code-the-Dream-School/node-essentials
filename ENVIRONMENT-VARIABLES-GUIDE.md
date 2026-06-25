# **Environment Variables and Secrets**

Starting in Assignment 5, your app needs configuration that does not belong in your code: a database connection string that includes a password, and later a JWT secret and third-party API keys. This guide explains how to store those values safely. You will use this same setup again in the authentication and deployment assignments, so it is worth understanding once, here.

## **Why Not Just Put It in the Code?**

If you paste a database connection string (which contains a password) directly into a `.js` file and push it to GitHub, you have just published your password to the world. Anyone who can see the repository can read it. Secrets and configuration that change between machines do not belong in source code.

## **What an Environment Variable Is**

An **environment variable** is a value that lives outside your code, in the environment where the program runs. Your code reads it through `process.env`. You already saw `process.env` back in Lesson 1.

Reading one looks like this:

```js
const dbUrl = process.env.DATABASE_URL;
```

The value is not written in your code. It comes from the environment, which means you can use different values on your laptop and on a deployed server without changing a single line.

## **The `.env` File**

In development, the easiest way to set environment variables is a `.env` file in the root of your project. It is a plain text file where each line is a `NAME=value` pair:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/node_dev
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/node_test
```

The [`dotenv`](https://www.npmjs.com/package/dotenv) package reads that file and copies each value into `process.env` when your app starts. That is why you install `dotenv` and call it near the top of your database connection file, before you read any values:

```js
require("dotenv").config();
```

After that line runs, `process.env.DATABASE_URL` returns the connection string from your `.env` file.

## **Two Rules to Follow From the Start**

1. **Never commit `.env` to git.** Add `.env` to your `.gitignore` file so it is never pushed to GitHub. A typical `.gitignore` includes:

```text
node_modules
.env
```

If a secret is ever committed by accident, treat it as compromised: rotate (change) it, do not just delete the file in a later commit. Git keeps history.

2. **Do not invent your own secret-sharing scheme.** Keep secrets in `.env` locally and in your hosting provider's environment settings in production (you will do this in the deployment assignment). Do not email them, paste them into chat, or hard-code them "just for now."

## **You Will Use More Than One Database**

This is one of the most common sources of confusion in the course, so name it clearly. You are juggling more than one database connection string:

- **`DATABASE_URL`** — your **development** database, the one you work in by hand. Your Postman experiments and everyday data live here.
- **`TEST_DATABASE_URL`** — a **separate test** database used only by the automated tests. The tests delete and re-create data freely, so it **must** point at a different database than your development one. If a test ever wipes data you cared about, this is usually why.
- **A production database** — added in the deployment assignment (Lesson 10). It lives in the cloud and serves real users. Be extremely careful with it. Commands that reset a database, like `npx prisma migrate reset`, must never be run against production.

Whenever something behaves in a way you cannot explain, ask the most useful debugging question first: **"Which database am I actually connected to right now?"** A surprising amount of confusion comes from running against the wrong one.

For the bigger picture of how storage and these databases evolve across the course, see the [Data and Identity guide](./DATA-AND-IDENTITY-GUIDE.md).

## **Where This Started**

You created your databases and your `.env` file back in Assignment 0. Assignments that use a database assume both already exist. If you skipped or lost that setup, revisit Assignment 0 before continuing.
