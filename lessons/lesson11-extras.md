# **Lesson 11 — Ideas for Enhancing Your Application**

## **Lesson Overview**

**Learning objective**: Students will optionally explore various ideas for additional functions that may be added to an application.  Among the ideas presented are OAuth authentication using Google, adding additional associations to a data model, role based access control, pagination of result sets, updating many records with a single operation, and Swagger documentation of APIs.

**Topics**:

1. Ideas for your Todos Application
2. OAuth Authentication with Google 
3. Todos in Folders
4. Role Based Access Control
5. Pagination of Result Sets
6. Swagger Documentation for your API
7. A progress log for each task
8. Updating Many Records with a Single Operation
9. Implementing a Task Backlog


## **11.1 Ideas for your Todos Application**

As part of the Rubric for the Final Project, we ask you to add something extra.  Here are some ideas on things to add.  This is not an exhaustive list.  You may think of other things you'd like to add instead.  We do ask that you make changes only to the back end, and not to the React front end.  This is so that you don't get distracted writing React code when you need to focus on Node, Express, and SQL.  For the items listed in this lesson, you don't have to build them according to the approach described.  Also, these are just outlines -- you'll have to figure out the exact steps yourself.

For most of these ideas, you'll need to modify the database schema using Prisma.  You'll also add additional routes or parameters to existing routes.  You then test with Postman, as (except for the Oauth idea), the front end doesn't support the additional function you add.  Be careful about authorization for any routes you add! You don't want one user to be able to do something to records belonging to a different user.

An extra for the extra: When you add a function, consider creating a Jest unit test for the function that you add. 

All changes should be in a lesson11 branch.  You will submit your assignment as usual.  You can show what you add during your presentation.

## **11.2 OAuth Authentication with Google**

### **What is OAuth?**

OAuth (Open Authorization) is a security protocol that allows applications to authenticate users without requiring them to share their actual passwords. Instead, it uses tokens to grant access to user data and resources. 

### **How OAuth Works Between Frontend, Backend, and Google**

The OAuth flow involves three main parties:

1. **Your Frontend (React App)** - The application requesting access
2. **Your Backend (Node.js/Express)** - Your server that handles authentication
3. **Google (OAuth Provider)** - The service that verifies the user's identity

### **The OAuth Flow Process**

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

### **Implementation Steps**


1. Your sample front end includes a Google logon button.  But, if you click it, you get an error message back, because you haven't implemented the back end route that it calls.  That route is /users/googleLogon, and the front end sends a POST with a body of `{authorizationCode: xxxxx}`, where the xxxxx is the authorization code obtained from Google.

2. You need to use a Google provided library on the back end, which is google-auth-library.

3. Once the user is authenticated, you need to have a record in the database corresponding to that user.  The token will convey the user's name and email.  See if you have a database record for that user.  If not, create one.  As the hashedPassword field is mandatory, you'll have to put something bogus in that.  Once you've found or created the user record, set the JWT cookie, and return the user's name and a csrfToken in the response to the front end.  You can test this one with the front end, but it would be difficult to test with Postman or Jest.

## **11.3 Todos in Folders**

There are various ways to implement this, but you'll need to extend the data model.  One way is to create a folders table.  Each folder would belong to a user, and a user may have many folders.  A folder would have many tasks.  So, you'd need an optional foreign key added to the tasks table, that being the folder id.  Not all of a user's tasks would belong to a folder.  You'd need to have a route that changes folders, to add or remove a task from a given folder.  You'd need to have a way to retrieve the user's list of folders, so that you can get the id for the folder.  You could change the GET for /tasks to pass a query parameter like folder=xxxxx, and if that query parameter is present, the tasks from that folder are returned.

## **11.4 Role Based Access Control**

You'd need to extend the user model to add a role column.  One way to do this is to add an optional string called roles, which would have a comma delimited list of the roles the user has.  You could keep it simple for now.  For example, you might have a "manager" role.  The manager is keeping tabs on all the users, to see who is progressing at getting their todos done.  The manager would have special access to one or several routes that allow them to see everyone's tasks.  You'd have to have some kind of standalone program that sets the value of the roles string for a given user.  At logon time, if the user record has a role attribute, you'd include that in the JWT.  Your authentication middleware would store this information, if present in the JWT, into req.user.roles.  The special manager routes would deny access if req.user.roles isn't present or doesn't include "manager".

Now, the manager probably doesn't want to see only the list of tasks, but also the name and email for the owner of each task.  You can do this with one Prisma query. Can you figure out how.

## **11.5 Pagination of Result Sets**

Your React application does do pagination.  The way it does it, of course, is to load the entire list of tasks, and then just show some of them.  If the list you are paginating is long, that can be unwise.  You can have Prisma do the pagination for you -- but the front end has to keep track of which page of the result set is to be shown, so that the user can scroll back and forth.  Prisma pagination is described **[here.](https://www.prisma.io/docs/orm/prisma-client/queries/pagination)**  You would probably want to create a standalone program that could populate the database with several hundred tasks, so that you can test your work.  You can test this with Postman.

## **11.6 Documenting Your APIs with Swagger**

Swagger, also known as the OpenAPI specification, is a good way to document your APIs.  You document each API in your code with comments of a particular format.  Then Swagger builds and exports an entire user interface that other developers can use to experiment with your APIs, including in this case, registering, logging on, adding tasks, etc.  The process is documented **[here.](https://blog.logrocket.com/documenting-express-js-api-swagger/)**  You have been testing with Postman.  You can export your Postman test descriptions in Swagger format, to generate some of the documentation you need automatically, but you'll have to add on to what Postman provides.  You select your Postman collection and choose "export".  That creates a JSON file.  Then, you convert that to Swagger with **[this tool](https://metamug.com/util/postman-to-swagger/)**  Then, you can check out the user interface you create, which will be a web page at http://localhost:3000/api-docs/.

## **11.7 A Progress Log for Each Task**

When you work as a team, various team members may be assigned large tasks, and may want to keep other team members apprised of their progress.  So, you could have a logs table.  Each log record might have a date and a string describing status.  Each log record would belong to a task, and a task may have many log records.  You'd need to add an additional route that records a log record for a task.  You already have a route that retrieves a task.  You could add a query parameter that says, get the log records as well as the tasks.

Note that you will cause the delete operation to fail, because of the foreign key constraint.  You can't delete a task that has log records.  How can you fix this?

## **11.8 Updating Many Records with a Single Operation**

You might want to update a collection of tasks to mark them all complete.  Or, you might want to delete a collection of tasks.  In each case, you'd have a route, and in the JSON body of the request, you'd have an array of all the task IDs for the particular operation.

## **11.9 Implementing a Backlog**

You could add a backlog table.  Each entry would be the title for a task.  Each logged on user could see the list of backlog entries and add, modify, or delete any.  However, a logged on user could also claim a task.  That would create a task with the same title belonging to the logged on user, and remove the corresponding backlog item.  Here's a tip: You should use a transaction!  You don't want a race condition, where one user claims a task, and so does another user, before the first one gets it deleted from the backlog.

---

These are some ideas.  Don't try to do them all, just one or two as your schedule permits, or do some other idea that you come up with.  Keep it simple!

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment11` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment11` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
