# **Assignment 10 — A Front End, and Deployment to the Internet**

## **Task 1: Calling Your Back End from a React Front End**

For this step, create a new terminal session.  Make sure that your active directory is **not** the node-homework folder.  You want the front end files to be completely separate.

1. Do a git clone for the following URL: `https://github.com/Code-the-Dream-School/node-essentials-front-end` .
2. Change to the node-essentials-front-end folder.  Then do an `npm install` to get the packages you need.
3. Create a `.env` file. It should have one line that says
   ```
   VITE_BASE_URL=/api
   ```
   This causes the Vite proxy to point to your back end running on http://localhost:3000.
4. You need one terminal session for the front end and one for the back end.  In the terminal session for the back end, go to the node-homework folder and start your app.  In the terminal session for the front end (the one where you are in node-essentials-front-end) type
   ```bash
   npm run dev
   ```
   to start the front end.
5. You now have two local processes, the front end at http://localhost:3001, and the back end at http://localhost:3000.  Go to your browser and open [http://localhost:3001](http://localhost:3001).
Then, try the application out. You should be able to register, logon, create todo list entries, mark them complete, and logoff.

You should go into developer tools for the front end screen, and click on network.  You can then do application operations and see the REST requests that flow.

## **Task 2: Switching Your Back End to a Cloud Resident Postgres Database**

You are going to deploy your back end to the cloud.  An application in the cloud can't connect to your local database.  You'll now create a database on Neon.tech, and switch your application so that it uses that one instead of a local database.

1. Create a free account on Neon.tech (unless you have one already.)

2. Create a new project called node-homework.  This creates a Postgres database on Neon.  A connection string (a URL) will be shown.  Copy it to your clipboard.  (You can get to this connection string at any time, by opening the node-homework project, selecting "connect to your database", and clicking on the connection string pulldown.)

3. Edit the .env file in your node-homework directory.  You have a line that begins `DATABASE_URL`.  Comment that one out by putting a `# ` at the front.  Create a new line that starts with `DATABASE_URL=`and paste in the connection string at the end.  Be careful with the connection string!  It contains a password.  Because you are putting it in the .env file, it won't be stored in Github.

4. Stop the back end app in node-homework if it is running.  In the terminal session, do the following command:

   ```bash
   npx prisma migrate deploy
   ```

   This command creates the tables your app needs in the Neon database, according to the schema in your Prisma schema file.

5.  Start up your app.  Test it with Postman.  Of course, as you are using a new database, the user entries you created with register are not present yet, nor are any task entries.  So, create new ones.  Everything should work as before.  Then try it with the sample front end.  Everything should work as before.

## **Task 3: Deploying Your Back End**

1. Create a free account on Render.com (if you don't have one already).

2. Within the dashboard for your account, click on the New button and select Web Service.

3. Configure your web service:

    1. Select public Git repository, and give the URL of your node-homework repository, and click Connect.
    2. Use all the default values, except for the ones below.  You could try to change the name, which will default to node-homework-x, where x is some number, but of course, you have to specify a name that no one else is using.
    3. For Branch, use main.
    4. For Build Command, use: `npm install --production && npx prisma migrate deploy` .  This installs the packages you need (but not the ones that are used only for development and test).  It also makes sure that your database schema is current.
    5. For Run Command, use: `npm start`
    6. Make sure AutoDeploy is set to off.  Otherwise it will redeploy every time you change the main branch.
    7. Make sure the instance type is set to Free.
    8. Configure your environment variables.  Your `.env` file isn't in Github, so this is how you get your secrets into the Render configuration.  You can use `Add from .env` to copy from your existing .env file.  The ones you need are the DATABASE_URL and the JWT_SECRET.

4. Click on Deploy Web Service.

5. Wait.

6. Wait some more.  The build and deploy steps are slow on the Render plan.  You have to be patient.

7. A log will convey the progress.  You might see errors, indicating something that you need to fix.

8. Eventually it will say that you are live, and give you the URL.  Click on that URL. You'll get a 404, because the `/` route is not part of your project, but this way you know it is working.

Note 1: Because you are running a free service, it will go to sleep after it idles for a while.  It will wake up when a request is received, but the restart takes a few minutes each time.

Note 2: If you make changes to your app and push your commits to your main Github branch, you can go to your Render dashboard, select your web service, and click on Manual Deploy to get the new version loaded.

## **Task 4: Testing Your Deployed Back End with Postman**

Each of your Postman tests references the `urlBase` Postman environment variable.  Change that environment variable so that it has the URL of the Render.com service you created.  Then, try each of the operations, to make sure everything works.  Make sure that your Node app is not running on your local machine, so that you know the REST requests are going to your service on Render.

## **Task 5: Testing Your Deployed Back End with the Front End**

Change the `.env` file for your front end.  For the VITE_BASE_URL, put in the URL of your service on Render.  Then try out the front end to see that everything still works.

### **Check for Understanding**

1. You have created a public API by putting your app on Render.  Does this create risks?

2. How might you mitigate these risks?

### **Answers**

1. The main risk to you is that the API could be misused.  For example, a bot could get on and create many bogus accounts.  Then it could fill up your database with bogus records.

2. One mitigation is to put some protection into the registration process.  As it is, anyone could register with any email address, whether or not it is real.  The standard fix is to send something to that email address and then require the user to prove that they got it, before completing each registration.  We could teach that, but the emails you send would probably go to the spam folder, and if you put a link in an email, it is flagged as suspicious, so there are some complications to the process.

## **Task 6: Submitting Your Work**

**Note** This one is a little different.  You haven't written any code for this lesson, so your node-homework repository is unchanged.  There is no branch to create, nothing to commit, no PR to do.

**So do this instead.**

Copy the URL of your Render.com service.  When you submit your homework, you put this URL in the homework submission form, instead of putting in a link to a PR.  This allows your homework reviewer to see that your deployment has succeeded and that the applicaiton runs.
