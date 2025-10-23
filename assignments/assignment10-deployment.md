# **Assignment 10 — A Front End, and Deployment to the Internet**

## **Task 1: Adding ReCaptcha Support**

Before you start, remember to create an assignment10 git branch for your node-homework repository.

For this task, you have to have a Google gmail account. Then do the following:

1. Go to `https://www.google.com/recaptcha/admin`.  You'll have to log on to Google if you haven't already.

2. Select the form that says "Register a new site."  Give it some label, like "my ctd node homework".

3. Choose reCAPTCHA v. 2.

4. Specify the domain `localhost`.

5. Accept the terms and click "Submit".

6. You will be given two keys, the site key and the secret key.  Save the site key in a comment in your node-homework .env file, and save the secret in a variable, like:

   ```
   # reCAPTCHA site key  gobbledygook
   RECAPTCHA_SECRET=othergobbledygook
   ```
   Your back end doesn't use the site key, but you'll need it for a subsequent step.

7. Create a hard to guess secret, just as you did for the JWT_SECRET.  Add it to your .env file as RECAPTCHA_BYPASS.  This is for testing.  You can't get a real reCaptcha token in Postman or in your Jest tests.

8. Add additional logic to your `userController.js` for the register method.  You need to check if you received a reCaptcha token, and if so, whether it is valid.  The front end has a Google widget with the "I'm not a robot." prompt.  That widget tracks mouse movement and click speeds and the like, and builds up information in a token.  Then the front end sends the token to the back end in the body of the post. If the back end receives this token, you need to see if it is good.  This is done using a `fetch()` to a Google back end.  Hmm, we haven't used `fetch()` on the Node side yet, but it works there just as it does in browser side JavaScript.  (You can also use libraries like Axios, but we'll use `fetch()`.)  The fetch might fail, in which case the error is thrown to the error handler.  If the fetch succeeds, it will tell you whether the token is good.

9. In the test environment (Postman or Jest) you can't run the Google widget, so you can't generate a real token.  When testing in Postman or Jest you instead put the RECAPTCHA_BYPASS value in the "X-Recaptcha-Test" header.  If you don't receive a token in the body of the request, you check whether the RECAPTCHA_BYPASS environment variable is set.  If it is and it matches what is in the header, you proceed as if you got a good token.

Here's the code you'll need to add to the register method, just before userSchema.validate:

```js
  let isPerson = false;
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "We can't tell if you're a person or a bot." });
  }
```

10. Run `npm run tdd assignment10` to see if you have this working.

11. Try testing a register request with Postman.  Of course it will fail.  Change the request to include the RECAPTCHA_BYPASS in the "X-Recaptcha-Test" header, and it should work.

12. Try `npm run test`.  This runs your tests from assignment 9.  Some of them will fail.  Why?  Optional: Fix your tests so that they complete correctly, by adding in the header you need.

You have run the TDD for this assignment as well as the Postman test -- but these aren't very good tests in this case.  You are just using the bypass, and not a real token.  You'll correct this in the next lesson.

## **Task 2: Calling Your Back End from a React Front End**

For this step, create a new terminal session.  Make sure that your active directory is **not** the node-homework folder.  You want the front end files to be completely separate.

1. Do a git clone for the following URL: `https://github.com/Code-the-Dream-School/node-essentials-front-end` .
2. Change to the node-essentials-front-end folder.  Then do an `npm install` to get the packages you need.
3. Create a `.env` file. It should have two lines:
   ```
   VITE_BASE_URL=/api
   VITE_RECAPTCHA_SITE_KEY=gobbledygook
   ```
   The site key is the one that you saved in a comment in your node-homework .env file.  Setting the base URL to "/api" causes operations to be redirected through the Vite proxy, which is configured to point to your back end running on http://localhost:3000.  
4. You need one terminal session for the front end and one for the back end.  In the terminal session for the back end, go to the node-homework folder and start your app.  In the terminal session for the front end (the one where you are in node-essentials-front-end) type
   ```bash
   npm run dev
   ```
   to start the front end.
5. You now have two local processes, the front end at http://localhost:3001, and the back end at http://localhost:3000.  Go to your browser and open [http://localhost:3001](http://localhost:3001).  Then, try the application out. You should be able to register, logon, create todo list entries, mark them complete, and logoff.  For the register step, you have to click on the "I'm not a robot" button, so you can now see if that part works.  There is also a button for Google logon -- but the button doesn't work, because you haven't enabled the back end for that function.

Go into browser developer tools for the front end screen, and click on network.  You can then do application operations and see the REST requests that flow.

## **Task 3: Switching Your Back End to a Cloud Resident Postgres Database**

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

## **Task 4: Deploying Your Back End**

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
    8. Configure your environment variables.  Your `.env` file isn't in Github, so this is how you get your secrets into the Render configuration.  You can use `Add from .env` to copy from your existing .env file.  The ones you need are the DATABASE_URL, the JWT_SECRET, the RECAPTCHA_SECRET, and, for testing, the RECAPTCHA_BYPASS.

4. Click on Deploy Web Service.

5. Wait.

6. Wait some more.  The build and deploy steps are slow on the Render free plan.  You have to be patient.

7. A log will convey the progress.  You might see errors, indicating something that you need to fix.

8. Eventually it will say that you are live, and give you the URL.  Click on that URL. You'll get a 404, because the `/` route is not part of your project, but this way you know it is working.

Note 1: Because you are running a free service, it will go to sleep after it idles for a while.  It will wake up when a request is received, but the restart takes a few minutes each time.

Note 2: If you make changes to your app and push your commits to your main Github branch, you can go to your Render dashboard, select your web service, and click on Manual Deploy to get the new version loaded.

## **Task 5: Testing Your Deployed Back End with Postman**

Each of your Postman tests references the `urlBase` Postman environment variable.  Change that environment variable so that it has the URL of the Render.com service you created.  Then, try each of the operations, to make sure everything works.  Make sure that your Node app is not running on your local machine, so that you know the REST requests are going to your service on Render.

## **Task 6: Testing Your Deployed Back End with the Front End**

Change the `.env` file for your front end.  For the VITE_BASE_URL, put in the URL of your service on Render.  Then try out the front end to see that everything still works.

**You need to tell your reviewer about the URL for your deployed application on Render.**  Create a file called project-summary.txt in the root of the node-homework folder, and put the URL in that file.

### **Check for Understanding**

1. You have created a public API by putting your app on Render.  What are the risks?

2. What have you done to mitigate those risks?  What else should be done?

### **Answers**

1. The main risk to you is that the API could be misused.  Anyone can register an email address, whether or not they actually own that address, and anyone can then use that account to create an unlimited number of task records, perhaps by configuring a bot with the email and password they registered.  They might put harmful data in the task records.  They might register with an email address that belongs to someone else, preventing that person from using the application.

2. You have put bot protection into the register API.  You have also put other measures in place, such as preventing cross site request forgery, scrubbing data to prevent cross site scripting attacks, and restricting the transaction rate.  In a production application, you would verify the email address.  This would require that you send an email message from the back end and then verify, somehow, that the user received it.  This is a little complicated, so we don't try to do it in this class.  You should also limit the number of task records that any one user can create.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Within your node-homework folder, do a git add and a git commit for the files you have created, so that they are added to the `assignment10` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment10` branch. It should be one or several commits ahead of your main branch.
- Create a pull request.

#### **3️⃣ Submit Your GitHub Link**

- Your browser now has the link to your pull request. Copy that link.
- Paste the URL into the **assignment submission form**.
---

## Video Submission

Record a short video (3–5 minutes) on YouTube, Loom, or similar platform. Share the link in your submission form.

**Video Content**: Short demos based on Lesson 10:

1. **How do you connect a React frontend to your Node.js backend API?**
   - Demonstrate how the frontend makes API calls with credentials
   - Walk through the authentication flow between frontend and backend
   - Show how CSRF tokens are handled in the frontend

2. **What are the key steps in deploying a Node.js application to the cloud?**
   - Demonstrate running Prisma migrations on the cloud database
   - Walk through your Render.com deployment configuration
   - Show your deployed application running live 

3. **How do you test and validate a deployed application?**
   - Test your deployed API endpoints with Postman using the live URL
   - Demonstrate the full application working with the React frontend
   - Show how to check deployment logs and troubleshoot issues
   - Explain the differences between local and production environments

**Video Requirements**:
- Keep it concise (3-5 minutes)
- Use screen sharing to show code examples 
- Speak clearly and explain concepts thoroughly
- Include the video link in your assignment submission
