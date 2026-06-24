# **Lesson 11 — Creating a Project, Ideas for Enhancement**

## **Lesson Overview**

**Learning objective**: By the end of this lesson, you should understand the basic steps for starting a Node project and the basic workflow for working on a Node project with a team. You will not perform those setup steps right now. You will also review ideas for extra back end features you can add to your final project.

**Topics**:

1. Creating Your Own Node Project
2. Working on a Project as a Team
3. Enhancement Ideas for your Node Back End

After you successfully complete this class, you may begin a practicum. The practicum gives you more practice with the Node and React skills you have learned. It also asks you to create a project from the beginning and follow team procedures for shared code.

You will learn more of those steps when you start the practicum. For now, they are outlined below. **Do not do any of these procedures now,** but read through them so the workflow is familiar.

Then go to the enhancement ideas section. If you have completed all the assignments so far, you have a working final project. To make your final project stand out, add one or more of the enhancements below, or choose another back end enhancement of your own.

## **11.1 How to Begin Your Own Node Project**

You began this project by cloning the `node-homework` repository. If you want to create your own Node project later, the process starts differently. You do not need to do this now, but these are the steps you might use in the future:

1. Create a repository on GitHub. Use the plus button in the upper right of GitHub. Give the repository a title, choose visibility, add a README, and perhaps add a license. Copy the URL for the new repository.

2. Clone the repository to your laptop. Do not clone it from inside another Git repository. Nested repositories can cause version control conflicts.

3. Change into the directory created by the clone. Start VSCode. Create a `.gitignore`, typically with these files, and sometimes others:

   ```
   node_modules/
   tmp/
   .env
   .DS_Store
   ```

4. Run `npm init`. You can accept the defaults or change them.

5. Install the packages you know you will need. You will probably add more over time. Look at the packages in `node-homework`'s `package.json`; many of them are useful for other projects. Use `--save-dev` for packages that are only needed during development.

6. Run `git add`, commit what you have done so far, and push it to your GitHub repository. At this point, you still have only the main branch.

7. Go back to the repository on GitHub. Open Settings -> Rules -> Rulesets and create a new branch ruleset. Call it "protect default branch". Add a branch target for the default branch, which is main. Restrict deletions, block force pushes, and **require a pull request before merging**. This helps make sure you do not push directly to main. When you work on a project, create a branch, make changes on that branch, run `git add`, commit, push the branch, and create a pull request. These are good habits.

These are only the basics. You can also configure GitHub with workflow steps such as automated tests, syntax checks, and code formatting checks. Teams often also create a pull request template.

## **11.2 Working on a Project as a Team**

Most projects involve multiple developers contributing code to the same Git repository. The repository and development process need structure so this works smoothly. Here are some common pieces:

1. The repository README, or perhaps another file called CONTRIBUTING.md, must contain some key information:
   - What the project is intended to do
   - What prerequisites must be installed. In your case, they were Node, NPM, and Postgres.
   - How to set up the project for development: Other team members will clone the repository and run an NPM install. They will need instructions for creating a `.env` file, but those instructions cannot disclose secrets. They will also need instructions for configuring prerequisites. In your case, that included creating Postgres databases. They may also need build steps, such as running a Prisma migration to load the schema.

2. In a team environment, each pull request should be reviewed by one or more team members before it is merged. The online repository should enforce that rule and may enforce other workflow rules too.

3. Usually, there are several special Git branches, each with protection rules. One common approach is:
   - The **dev** branch is the default branch. Each team member pulls from this branch, creates a feature branch from it, pushes the feature branch to Github when the feature is ready, and creates a pull request, where the target of the PR is the dev branch.
   - The **staging** branch is used to promote code from the dev branch when the dev branch is well tested and stable. Additional testing is then performed, and user acceptance testing by the project owner may occur. The staging test environment is made to match the production environment as closely as possible. Practicum teams sometimes omit this one for simplicity.
   - When all is good in staging, the code is promoted to the **production** branch, which is sometimes main.

   Each of these branches, including feature branches, may have workflows that perform automated deployment for testing, possibly to a cloud service. The main branch is deployed for public use, not for testing.

4. The team will usually have a project board that tracks the work backlog and the team member assigned to each task.

5. The team will usually follow a development process, often called Agile. This organizes team communication. The team will also have design documents that describe the planned appearance and flow of the application, the APIs, and the data model.

6. Since multiple team members contribute to the same repository, you need to understand how to avoid merge conflicts and how to resolve them when they happen. A merge conflict can occur when several people make overlapping changes to the same files.

## **11.3 Enhancement Ideas for Your Node Back End**

As part of the final project rubric, you need to add something extra. The ideas below are possible additions. This is not a complete list, and you may choose a different idea.

Make changes only to the back end, not the React front end. This keeps your focus on Node, Express, and SQL. For the items listed here, you do not have to follow the exact approach described. These are outlines, so you will still need to figure out the exact steps.

You don't need to implement all of these — one or two additions, or an idea of your own, is sufficient.

For most of these ideas, you will need to modify the database schema with Prisma. You will also add routes or add parameters to existing routes. Then you will test with Postman. Except for the OAuth idea, the provided front end does not support the extra function you add.

Be careful about authorization for any route you add. One user should not be able to read or change records that belong to another user.

**Important deployment note:** If your extra feature adds or changes columns in your Prisma schema, Render needs both the migration and a newly generated Prisma Client. Locally, `npx prisma migrate dev` usually runs `npx prisma generate` for you, so you may not notice this step. On Render, add both commands to your build command:

```bash
npm install --production && npx prisma generate && npx prisma migrate deploy
```

If you deploy the migration but do not regenerate the Prisma Client, you may see a confusing error like `Unknown argument 'yourField'`, even though the column exists in the database.

Optional: When you add a function, consider creating a Jest unit test for it.

All changes should be in a `lesson11` branch. You will submit your assignment as usual, but read the assignment instructions carefully because there are a couple of extra steps. You can show what you add during your presentation.

### **11.3.1 OAuth Authentication with Google**

**What is OAuth?**

OAuth, which stands for Open Authorization, lets applications authenticate users without asking them to share their actual passwords with your app. Instead, it uses tokens to grant access to user data and resources.

**How OAuth Works Between Frontend, Backend, and Google**

The OAuth flow involves three main parties:

1. **Your Frontend (React App)** - The application requesting access
2. **Your Backend (Node.js/Express)** - Your server that handles authentication
3. **Google (OAuth Provider)** - The service that verifies the user's identity

**The OAuth Flow Process**

```
User clicks "Login with Google"
    ↓
Frontend redirects to Google's OAuth page
    ↓
User logs into Google and grants permissions
    ↓
Google redirects back to your app with an authorization code
    ↓
Frontend sends the code to your backend
    ↓
Backend exchanges code for access token with Google
    ↓
Backend verifies the token and creates/updates user record
    ↓
Backend sets JWT session cookie and returns user info
    ↓
User is now authenticated in your app
```

**Implementation Steps**

1. Your sample front end includes a Google logon button. If you click it now, you get an error because you have not implemented the back end route it calls. That route is `/users/googleLogon`, and the front end sends a POST with a body of `{authorizationCode: xxxxx}`, where `xxxxx` is the authorization code from Google. You need to add support for this route in your back end.

2. You need to use a Google-provided back end library called google-auth-library. This library lets you send the authorization code to Google. If the code is valid, Google returns identity information about the user, including a name and email address.

3. Once the user is authenticated, the database needs a record for that user. Check whether a record already exists. If not, create one. Since the `hashedPassword` field is required, you can store a placeholder value for OAuth users. Once you find or create the user record, set the JWT cookie and return the user's name and a `csrfToken` in the response to the front end. You can test this with the front end, but it would be difficult to test with Postman or Jest.

### **11.3.2 Todos in Folders**

There are several ways to implement folders, but you will need to extend the data model. One approach is to create a folders table. Each folder belongs to a user, and one user may have many folders. A folder can have many tasks.

To support this, you would add an optional folder id foreign key to the tasks table. Not every task has to belong to a folder. You would need a route that creates a folder for the logged-on user. You would also need a way to add a task to a folder or remove a task from a folder. That could possibly be done with the task update operation. You would also need a way to retrieve the user's folders and their ids. You could update the GET for `/tasks` to support a query parameter like `folder=xxxxx`. If that query parameter is present, return the tasks from that folder.

### **11.3.3 Role Based Access Control**

You would need to extend the user model to add a role column. One simple approach is to add an optional string called roles, containing a comma-delimited list of the user's roles. For example, you might add a "manager" role. A manager could view progress across users and would have special access to `analyticsRoutes`, which can show everyone's tasks.

You can use Prisma Studio or a similar tool to add roles to a user record in the database. At logon time, if the user record has a role attribute, include that role information in the JWT. Your authentication middleware would store it, if present, in `req.user.roles`. The manager-only routes would deny access if `req.user.roles` is missing or does not include "manager".

Once this is in place, add middleware to `analyticsRoutes.js` that allows access only to managers and returns 401 for others. Be sure to test both cases.

## **11.3.4 Documenting Your APIs with Swagger**

Swagger, also known as the OpenAPI specification, is a good way to document APIs. You document each API in your code with specially formatted comments. Swagger then builds a user interface that other developers can use to experiment with your APIs, including registering, logging on, and adding tasks. The process is documented **[here.](https://blog.logrocket.com/documenting-express-js-api-swagger/)**

You have been testing with Postman. You can export your Postman collection in a Swagger-compatible format to generate some documentation automatically, but you will still need to add to what Postman provides. Select your Postman collection and choose "export". That creates a JSON file. Then convert that to Swagger with **[this tool](https://metamug.com/util/postman-to-swagger/)**. Then you can open the generated user interface at http://localhost:3000/api-docs/.

## **11.3.5 A Progress Log for Each Task**

When you work on a team, team members may be assigned large tasks and may want to keep others updated on progress. You could add a logs table. Each log record might have a date and a string describing status. Each log record would belong to a task, and a task may have many log records.

You would need to add a route that creates a log record for a task. You already have a route that retrieves a task. You could add a query parameter that says to include the log records along with the task.

Note that this can cause the delete operation to fail because of the foreign key constraint. You cannot delete a task that has log records unless the schema handles that relationship. How can you fix this? Hint: You can do something special in the schema.

## **11.3.6 Updating Many Records with a Single Operation**

You might want to update a collection of tasks to mark them all complete. Or you might want to delete a collection of tasks. You could use `updateMany` or `deleteMany`, with query parameters such as `?isCompleted=true` to specify which tasks should be updated or deleted.

## **11.3.7 Bulk Update or Delete**

Another approach is to allow a REST request that specifies an array of task IDs. You can imagine a front end with checkboxes for selecting tasks. The user could then send a delete request for all selected tasks. Do not change the front end for this class. Just build the bulk update or bulk delete REST request. This would also use `updateMany` or `deleteMany`, but the `where` clause would use `in:` to specify the set of ids to include.

## **11.3.8 Recycle Bin**

You could add an optional `trash` boolean to the task model. When a deletion occurs, the `trash` column could be set to true. Queries would then be modified so tasks with `trash=true` are not returned. Another REST request could empty the trash and actually delete those records. A filter on the index request might allow trash entries to be included in the response, so they could be restored.

## **11.3.9 Implementing a Backlog**

You could add a backlog table. Each entry would include a task title and priority. Each logged-on user could see the backlog and add, modify, or delete entries from it.

A logged-on user could also claim a task. That would create a task with the same title, `createdAt`, and priority for that user, then remove the corresponding backlog item. Here is a tip: use a transaction. You do not want a race condition where two users claim the same task before the first claim removes it from the backlog.

---

Focus on one or two ideas, or pursue another back end idea that interests you.
