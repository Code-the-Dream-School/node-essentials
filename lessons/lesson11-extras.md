# **Lesson 11 — Creating a Project, Ideas for Enhancement**

## **Lesson Overview**

**Learning objective**: Students will learn how to start a Node project, and how to work on a Node project an a team, although they will not perform these steps at this time.  Students will explore various ideas for additional functions that may be added to the class final project. 

**Topics**:

1. Creating Your Own Node Project
2. Working on a Project as a Team
3. Enhancement Ideas for your Node Back End

Following successful completion of class, you may begin a practicum.  The practicum will involve more practice with the skills you have learned in the Node and React classes, but it will also involve creating your own project from the beginning, and learning and practicing the special procedures when you work as a team on shared code.  You'll learn more of the steps when you start the practicum, but they are described in outline below.  **You do not need to do any of these procedures now,** but please read about them.  

Then, go to the section below on enhancement ideas.  If you have completed all the assignments up to now, you have a working final project, but if your final project is to stand out, you should try to add one or several of the enhancements suggested below, or perhaps one or more other enhancements you think of.

## **11.1 How to Begin Your Own Node Project**

You began this project by cloning the node-homework repository.  What if you want to create your own Node project? You don't need to do it now, but, for reference, here are steps you might use in the future.  Of course, different people do this in various ways.

1. Create a repository on Github.  You use the plus button on the upper right of the Github page.  Give it a title, choose a visibility, give it a README, and perhaps give it a license.  Copy the URL for the newly created repository to your clipboard.

2. Git clone the repository to your laptop.  Do not do the clone from within another Git repository.  Nested repositories are a mess.

3. Change to the directory created when you cloned.  Start VSCode.  Create a .gitignore, typically with these files, but sometimes with others as well:

    ```
    node_modules/
    tmp/
    .env
    .DS_Store
    ```

4. Run "npm init".  You can take the defaults, but you can change them as well.

5. Do an npm install of the packages you know you will need.  Of course, you will probably add to this list over time.  Have a look at the packages you've accumulated for node-homework, as listed in package.json.  These are often useful for other projects.  Remember to use `--save-dev` for those packages that are only needed in development.

6. Do a git add and commit of what you've done so far.  Then push it to your Github repository.  You still have only the main branch.

7. Go back to your Github for the repository.  Open Settings -> Rules -> Rulesets and create a new branch ruleset. Call it "protect default branch".  Add a branch target for the default branch, which is main.  Restrict deletions, block force pushes, and **require a pull request before merging**.  What does this do for you?  It makes sure you don't push to main.  Whenever you work on a project, you create a branch, make changes to that branch, git add, git commit, git push (for the branch), and create a pull request.  These are good habits.

This just describes the basics.  You could configure your Github repository with other steps governing the workflow, such as a trigger for automated tests, or automated syntax checking and code format checking.  You could create a specific form for pull requests, as is common for a team.

11.2 **Working on a Project as a Team**

Most projects involve multiple developers, all of whom contribute code to the same Git repository.  The repository and the development process have to be set up so that this works well.  Here are some points:

1. The repository README, or perhaps another file called CONTRIBUTING.md, must contain some key information:
    - What the project is intended to do
    - What prerequisites must be installed.  In your case, they were Node, NPM, and Postgres.
    - How to set up the project to do development:  Other team members will clone the repository and do an NPM install. They will need instructions on how to create a `.env` file. (Of course the instructions can't disclose the secrets.)  They will need instructions on how to configure prerequisites.  In your case, you created Postgres databases.  They will need instructions on other build steps.  In your case, this was performing a Prisma migration to load the schema.

2. In a team environment, each pull request must be reviewed by one or several team members before it can be merged.  The online repository must be configured to enforce that rule, and may have other rules and workflow.

3. Usually, there will be several special Git branches, each with protection rules. One way to do this is as follows:  

    - The **dev** branch is the default branch.  Each team member pulls from this branch, creates a feature branch from it, pushes the feature branch to Github when the feature is ready, and creates a pull request, where the target of the PR is the dev branch.
    - The **staging** branch is used to promote code from the dev branch when the dev branch is well tested and stable.  Additional testing is then performed, and user acceptance testing by the project owner may occur.  The staging test environment is made to match the production environment as closely as possible.  Practicum teams sometimes omit this one for simplicity.
    - When all is good in staging, the code is promoted to the **production** branch, which is sometimes main.

    Each of these branches, including feature branches, may have workflow that performs automated deployment for testing, perhaps to a cloud service.  The main branch is deployed, not for testing, but for public use.

4. You will have a project board that keeps track of the work backlog and the team member assigned to each task.

5. You will have a development process, typically using what is called the "Agile" methodology.  This organizes team communication.  You will also have design documents that describe the planned appearance and flow of the application, the APIs, and the data model.

6. As multiple team members are contributing code to the same repository, you need to understand how to avoid merge conflicts and how to resolve them when they do occur.  A merge conflict may occur if several members make overlapping changes to the same files.

## **11.3 Enhancement Ideas for Your Node Back End**

As part of the Rubric for the Final Project, we ask you to add something extra.  Here are some ideas on things to add.  This is not an exhaustive list.  You may think of other things you'd like to add instead.  We do ask that you make changes only to the back end, and not to the React front end.  This is so that you don't get distracted writing React code when you need to focus on Node, Express, and SQL.  For the items listed in this lesson, you don't have to build them according to the approach described.  Also, these are just outlines -- you'll have to figure out the exact steps yourself.

Don't try to do too much!  Just one or two of the ideas below, or something else you think of, should suffice.

For most of these ideas, you'll need to modify the database schema using Prisma.  You'll also add additional routes or parameters to existing routes.  You then test with Postman, as (except for the Oauth idea), the front end doesn't support the additional function you add.  Be careful about authorization for any routes you add! You don't want one user to be able to do something to records belonging to a different user.

An extra for the extra: When you add a function, consider creating a Jest unit test for the function that you add. 

All changes should be in a lesson11 branch.  You will submit your assignment as usual -- but see the assignment instructions as there are a couple of extra steps.  You can show what you add during your presentation.

### **11.3.1 OAuth Authentication with Google**

**What is OAuth?**

OAuth (Open Authorization) is a security protocol that allows applications to authenticate users without requiring them to share their actual passwords. Instead, it uses tokens to grant access to user data and resources. 

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


1. Your sample front end includes a Google logon button.  But, if you click it, you get an error message back, because you haven't implemented the back end route that it calls.  That route is /users/googleLogon, and the front end sends a POST with a body of `{authorizationCode: xxxxx}`, where the xxxxx is the authorization code obtained from Google.  You need to add support to your back end for this route.

2. You need to use a Google provided library on the back end, which is google-auth-library.  This provides a way to send the authorization code to Google, so that if it is valid, identity information about the user is returned, including a name and email address.

3. Once the user is authenticated, you need to have a record in the database corresponding to that user.  See if you have a database record for that user.  If not, create one.  As the hashedPassword field is mandatory, so you'll have to put something bogus in that.  Once you've found or created the user record, set the JWT cookie, and return the user's name and a csrfToken in the response to the front end.  You can test this one with the front end, but it would be difficult to test with Postman or Jest.

### **11.3.2 Todos in Folders**

There are various ways to implement this, but you'll need to extend the data model.  One way is to create a folders table.  Each folder would belong to a user, and a user may have many folders.  A folder would have many tasks.  So, you'd need an optional foreign key added to the tasks table, that being the folder id.  Not all of a user's tasks would belong to a folder.  You'd need to have a route that creates a folder for the logged on user.  You'd need to have a way to add task to a given folder,or to remove a task from a folder.  Perhaps this could be done with the task update operation.  You'd need to have a way to retrieve the user's list of folders, so that you can get the id for each folder.  You could change the GET for /tasks support a query parameter like folder=xxxxx, and if that query parameter is present, the tasks from that folder are returned.

### **11.3.3 Role Based Access Control**

You'd need to extend the user model to add a role column.  One way to do this is to add an optional string called roles, which would have a comma delimited list of the roles the user has.  You could keep it simple for now.  For example, you might have a "manager" role.  The manager is keeping tabs on all the users, to see who is progressing at getting their todos done.  The manager would have special access to one or several routes that allow them to see everyone's tasks.  You'd have to have some kind of standalone program that sets the value of the roles string for a given user.  At logon time, if the user record has a role attribute, you'd include that in the JWT.  Your authentication middleware would store this information, if present in the JWT, into req.user.roles.  The special manager routes would deny access if req.user.roles isn't present or doesn't include "manager".

Now, the manager probably doesn't want to see only the list of tasks, but also the name and email for the owner of each task.  You can do this with one Prisma query. Can you figure out how?

### **11.3.4 Pagination of Result Sets**

Your React application does do pagination.  The way it does it, of course, is to load the entire list of tasks, and then just show some of them.  If the list you are paginating is long, that can be unwise.  You can have Prisma do the pagination for you.  Prisma pagination is described **[here.](https://www.prisma.io/docs/orm/prisma-client/queries/pagination)**  You would have query parameters that specify which page you want, when you do a GET for /tasks.  You would probably want to create a standalone program that populates the database with several hundred tasks for a given user, so that you can test your work.  You could test pagination this with Postman.

## **11.3.5 Documenting Your APIs with Swagger**

Swagger, also known as the OpenAPI specification, is a good way to document your APIs.  You document each API in your code with comments of a particular format.  Then Swagger builds and exports an entire user interface that other developers can use to experiment with your APIs, including in this case, registering, logging on, adding tasks, etc.  The process is documented **[here.](https://blog.logrocket.com/documenting-express-js-api-swagger/)**  You have been testing with Postman.  You can export your Postman test descriptions in Swagger format, to generate some of the documentation you need automatically, but you'll have to add on to what Postman provides.  You select your Postman collection and choose "export".  That creates a JSON file.  Then, you convert that to Swagger with **[this tool](https://metamug.com/util/postman-to-swagger/)**  Then, you can check out the user interface you create, which will be a web page at http://localhost:3000/api-docs/.

## **11.3.6 A Progress Log for Each Task**

When you work as a team, various team members may be assigned large tasks, and may want to keep other team members apprised of their progress.  So, you could have a logs table.  Each log record might have a date and a string describing status.  Each log record would belong to a task, and a task may have many log records.  You'd need to add an additional route that records a log record for a task.  You already have a route that retrieves a task.  You could add a query parameter that says, get the log records as well as the tasks.

Note that you will cause the delete operation to fail, because of the foreign key constraint.  You can't delete a task that has log records.  How can you fix this?

## **11.3.7 Updating Many Records with a Single Operation**

You might want to update a collection of tasks to mark them all complete.  Or, you might want to delete a collection of tasks.  In each case, you'd have a route, and in the JSON body of the request, you'd have an array of all the task IDs for the particular operation.

## **11.3.8 Implementing a Backlog**

You could add a backlog table.  Each entry would be the title for a task.  Each logged on user could see the list of backlog entries and add, modify, or delete any.  However, a logged on user could also claim a task.  That would create a task with the same title belonging to the logged on user, and remove the corresponding backlog item.  Here's a tip: You should use a transaction!  You don't want a race condition, where one user claims a task, and so does another user, before the first one gets it deleted from the backlog.

---

These are some ideas.  Don't try to do them all, just one or two as your schedule permits, or do some other idea that you come up with.  Keep it simple!

