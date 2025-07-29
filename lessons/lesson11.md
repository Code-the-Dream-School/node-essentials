# **Lesson 11 — Ideas for Enhancing Your Application**

## **Lesson Overview**

**Learning objective**: Students will optionally explore various ideas additional functions that may be be added to an application.  Among the ideas presented are Oauth authentication using Google, adding additional associations to a data model, role based access control, pagination of result sets, updating many records with a single operation, and Swagger documentation of APIs.

**Topics**:

1. Ideas for your Todos Application
2. Oauth Authentication with Google 
3. Todos in Folders
4. Role Based Access Control
5. Pagination of Result Sets
6. Swagger Documentation for your API
7. A progress log for each task
8. Updating Many Records with a Single Operation


## **11.1 Ideas for your Todos Application**

As part of the Rubric for the Final Project, we ask you to add something.  Here are some ideas on things to add.  This is not an exhaustive list.  You may think of other things you'd like to add instead.  We do ask that you focus on the back end, as that is the emphasis for this class.  For the items listed in this lesson, you don't have to build them according to the approach described.  Also, these are just outlines -- you'll have to figure out the exact steps yourself.

## **11.2 Oauth Authentication with Google**

You have seen a button on web applications you use that says, Logon with Google.  That's Oauth.  Here's how you'd do it.

1. You need to enable the front end with the Google component.  The process is described **[here.](https://blog.logrocket.com/guide-adding-google-login-react-app/)**  You'd get that working first.  Request the user's name and email as part of the token payload.

2. Once the front end has the authentication token, you need send it to the back end to establish a session.  You'll need a new route for the purpose.  The route handler would use a new Passport strategy, which is described **[here.](https://www.npmjs.com/package/passport-google-id-token)**  Get advice from your favorite AI as needed.

3. Once the user is authenticated, you need to have a record in the database corresponding to that user.  The token will convey the user's name and email.  See if you have a database record for that user.  If not, create one.  As the hashedPassword field is mandatory, you'll have to put something bogus in that.  Once you've found or created the user record, set the JWT cookie, and return the user's name and a csrfToken in the response to the front end.

## **11.3 Todos in Folders**

There are various ways to implement this, but you'll need to extend the data model.  One way is to create a folders table.  Each folder would belong to a user, and a user may have many folders.  A folder would have many tasks.  Not all of a user's tasks would belong to a folder.  You'd need to have a route that changes folders, to add or remove tasks from a given folder.  You'd need to have the front end allow the user to create a folder, display the folders that a user has, allow that user to open a particular folder, and allow that user to move a task to a folder.  The APIs for these operations might just be additional query parameters for task operations you already have, except for the one that creates a folder.

## **11.4 Role Based Access Control**

You'd need to extend the user model to add a role column.  One way to do this is to add an optional string called roles, which would have a comma delimited list of the roles the user has.  You could keep it simple for now.  For example, you might have a "manager" role.  The manager is keeping tabs on all the users, to see who is progressing at getting their todos done.  The manager would have special access to one or several routes that allow them to see everyone's tasks.  You'd have to have some kind of standalone program that sets the value of the roles string.  You might want to return the roles string at logon time so that the front end displays the other available capabilities -- but remember, the enforcement has to be on the back end, or it can be bypassed. You might choose a different role to implement.

## **11.5 Pagination of Result Sets**

Your React application does do pagination.  The way it does it, of course, is to load the entire list of tasks, and then just show some of them.  If the list you are paginating is long, that can be unwise.  You can have Prisma do the pagination for you -- but the front end has to keep track of which page of the result set is to be shown, so that the user can scroll back and forth.  Prisma pagination is described **[here.](https://www.prisma.io/docs/orm/prisma-client/queries/pagination)**  You would probably want to create a standalone program to that could populate the database with several hundred tasks, so that you can test your work.

## **11.6 Documenting Your APIs with Swagger**

Swagger, also known as the OpenAPI specification, is a good way to document your APIs.  You document each API in your code with comments of a particular format.  Then Swagger builds and exports an entire user interface that other developers can use to experiment with your APIs, including in this case, registering, logging on, adding tasks, etc.  The process is documented **[here.](https://blog.logrocket.com/documenting-express-js-api-swagger/)**  You have been testing with Postman.  You can export your Postman test descriptions in Swagger format, to generate some of the documentation you need automatically, but you'll have to add on to what Postman provides.  You select your Postman collection and choose "export".  That creates a JSON file.  Then, you convert that to Swagger with **[this tool](https://metamug.com/util/postman-to-swagger/)**

## **11.7 A Progress Log for Each Task**

When you work as a team, various team members may be assigned large tasks, and may want to keep other team members apprised of their progress.  So, you could have a logs table.  Each log record might have a date and a string describing status.  Each log record would belong to a task, and a task may have many log records.

## **11.8 Updating Many Records with a Single Operation**

You might want to flag a bunch of tasks as complete, and then save the result.  Or, you could mark a bunch of tasks for deletion, and then delete them all.  Or you could select a bunch of tasks and move all selected ones to a folder.  In each case, you'd have a route, and in the body of the json request, you'd have a JSON array of all the task IDs for a the particular operation.

---

These are some ideas.  Don't try to do them all, just one or two as your schedule permits, or do some other idea that you come up with.  Keep it simple!