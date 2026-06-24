# **Assignment 10 — A Front End, and Deployment to the Internet**

## **Task 1: Adding reCAPTCHA Support**

Before you start, create an `assignment10` git branch for your `node-homework` repository.

For this task, you need a Google Gmail account. Then do the following:

1. Go to `https://www.google.com/recaptcha/admin`. You will have to log on to Google if you have not already.

2. Select the form that says "Register a new site." Give it a label, like "my ctd node homework".

3. Choose reCAPTCHA v. 2.

4. Specify the domain `localhost`.

5. Accept the terms and click "Submit".

6. You will receive two keys: the site key and the secret key. Save the site key in a comment in your node-homework .env file, and save the secret in a variable, like:

   ```
   # reCAPTCHA site key  gobbledygook
   RECAPTCHA_SECRET=othergobbledygook
   ```
   Your back end does not use the site key, but you will need it in a later step.

7. Create a hard-to-guess secret, just as you did for `JWT_SECRET`. Add it to your .env file as `RECAPTCHA_BYPASS`. This is for testing. You cannot get a real reCAPTCHA token in Postman or in your Jest tests.

8. Add logic to the register method in `userController.js`. Check whether you received a reCAPTCHA token. If you did, verify whether it is valid.

   The front end has a Google widget with the "I'm not a robot." prompt. That widget tracks mouse movement, click timing, and similar signals. It uses that information to create a token. Then the front end sends the token to the back end in the body of the post.

   If the back end receives this token, verify it with a `fetch()` request to Google. We have not used `fetch()` on the Node side yet, but it works there just like it does in browser-side JavaScript. You can also use libraries like Axios, but we will use `fetch()`. The fetch might fail. If it does, the error should go to the error handler. If the fetch succeeds, Google's response tells you whether the token is good.

    You must also change `app.js`.  The line for the json parser currently reads:
    ```js
    app.use(express.json({ limit: "1kb" }));
    ```
    Change that to "1mb" or something similar because the reCAPTCHA token is bigger than 1KB.

9. In the test environment, Postman or Jest, you cannot run the Google widget, so you cannot generate a real token. When testing in Postman or Jest, put the RECAPTCHA_BYPASS value in the "X-Recaptcha-Test" header. If you do not receive a token in the request body, check whether the RECAPTCHA_BYPASS environment variable is set. If it is set and it matches the header, proceed as if you received a good token.

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
      .json({ message: "Bot verification failed. Please complete the reCAPTCHA." });
  }
```

10. Run `npm run tdd assignment10` to see if you have this working.

11. Try testing a register request with Postman. It will fail. Change the request to include the RECAPTCHA_BYPASS in the "X-Recaptcha-Test" header, and it should work.

12. Try `npm run test`. This runs your tests from assignment 9. Some of them will fail. Why? Optional: fix your tests so they complete correctly by adding the header you need.

You have now run the TDD for this assignment and the Postman test. These are not complete tests of reCAPTCHA because they use the bypass instead of a real token. You will correct that in the next lesson.

## **Task 2: Calling Your Back End from a React Front End**

For this step, create a new terminal session. Make sure your active directory is **not** the node-homework folder. The front end files should be completely separate.

1. Clone this repository: `https://github.com/Code-the-Dream-School/node-essentials-front-end`.
2. Change to the node-essentials-front-end folder. Then run `npm install` to get the packages you need.
3. Create a `.env` file. It should have four lines:
   ```
   VITE_BASE_URL=""
   VITE_TARGET="http://localhost:3000"
   VITE_RECAPTCHA_SITE_KEY=gobbledygook
   VITE_GOOGLE_CLIENT_ID="174295933149-09i1it2go1ssjpqtqam9vdm1pj257aqu.apps.googleusercontent.com"
   ```
   The site key is the one you saved in a comment in your node-homework .env file. Look at `vite.config.js`. It reroutes all requests for "/api" to the address specified in `VITE_TARGET`.

   `VITE_BASE_URL` is an artifact of the current configuration. Set it to `""`; it will be removed in the future. `VITE_GOOGLE_CLIENT_ID` is also an artifact. You must set it so the React front end can start, but Google logon will not work because your back end does not support that feature. There is also a sample back end on Digital Ocean. You can access it using the values in `.env.local.sample`.
4. You need one terminal session for the front end and one for the back end. In the back end terminal, go to the node-homework folder and start your app. In the front end terminal, where you are in node-essentials-front-end, type:
   ```bash
   npm run dev
   ```
   to start the front end.
5. You now have two local processes: the front end at http://localhost:3001 and the back end at http://localhost:3000. Open [http://localhost:3001](http://localhost:3001) in your browser and try the app. You should be able to register, logon, create todo list entries, mark them complete, and logoff. For registration, click the "I'm not a robot" button so you can see whether reCAPTCHA works. There is also a Google logon button, but it does not work because your back end does not support that function.

Open browser developer tools on the front end page and click the Network tab. Then use the app and watch the REST requests as they happen.

## **Task 3: Switching Your Back End to a Cloud Resident Postgres Database**

You are going to deploy your back end to the cloud. An application running in the cloud cannot connect to your local database. Create a database on Neon.tech, then switch your application so it uses that database instead of your local one.

1. Create a free account on Neon.tech, unless you already have one.

2. Create a new project called node-homework. This creates a Postgres database on Neon. A connection string, which is a URL, will be shown. Copy it to your clipboard. You can find it again later by opening the node-homework project, selecting "connect to your database", and clicking the connection string pulldown.

3. Edit the .env file in your node-homework directory. You have a line that begins `DATABASE_URL`. Comment it out by putting `# ` at the front. Create a new line that starts with `DATABASE_URL=` and paste the Neon connection string at the end. Be careful with the connection string. It contains a password. Since it is in the .env file, it should not be stored in Github.

4. Stop the back end app in node-homework if it is running.  In the terminal session, do the following command:

   ```bash
   npx prisma migrate deploy
   ```

   This command creates the tables your app needs in the Neon database, based on your Prisma schema file.

5. Start your app. Test it with Postman. Since this is a new database, the users and tasks you created earlier will not be there. Create new ones. Everything should work as before. Then try it with the sample front end. Everything should still work.

## **Task 4: Deploying Your Back End**

1. Create a free account on Render.com (if you don't have one already).

2. In your account dashboard, click the New button and select Web Service.

3. Configure your web service:

    1. Select public Git repository, provide the URL of your node-homework repository, and click Connect.
    2. Use the default values except for the ones below. You can change the service name, which defaults to node-homework-x, where x is some number, but you must choose a name no one else is using.
    3. For Branch, use assignment10. **Note: for your final project, you should switch this to the main branch, but your deployment for this lesson requires the code changes of the assignment10 branch.**
    4. For Build Command, use: `npm install --production && npx prisma migrate deploy`. This installs the packages needed in production, but not the packages used only for development and test. It also makes sure your database schema is current.
    5. For Run Command, use: `npm start`
    6. Make sure AutoDeploy is set to off. Otherwise, it will redeploy every time you change the main branch.
    7. Make sure the instance type is set to Free.
    8. Configure your environment variables. Your `.env` file is not in Github, so this is how you provide secrets to Render. You can use `Add from .env` to copy from your existing .env file. The ones you need are the DATABASE_URL, the JWT_SECRET, the RECAPTCHA_SECRET, and, for testing, the RECAPTCHA_BYPASS.

4. Click on Deploy Web Service. Build and deploy are slow on the free plan, so this may take several minutes.

5. The log will show progress. You might see errors that point to something you need to fix.

6. Eventually it will say that you are live and give you the URL. Click that URL. You will get a 404 because the `/` route is not part of your project, but this still proves the service is responding.

Note 1: Because you are using a free service, it will go to sleep after it idles for a while. It wakes up when a request is received, but the restart takes a few minutes.

Note 2: If you make changes to your app and push your commits to Github, go to your Render dashboard, select your web service, and click Manual Deploy to load the new version.

## **Task 5: Testing Your Deployed Back End with Postman**

Each of your Postman tests references the `urlBase` Postman environment variable. Change that environment variable so it contains the URL of the Render.com service you created. Then try each operation and make sure everything works. Make sure your Node app is not running locally, so you know the REST requests are going to Render.

## **Task 6: Testing Your Deployed Back End with the Front End**

Change the `.env` file for your front end. For VITE_TARGET, use the URL of your service on Render. Then try the front end and make sure everything still works.

**You need to tell your reviewer the URL for your deployed application on Render.** Create a file called project-summary.txt in the root of the node-homework folder, and put the URL in that file.

### **Check for Understanding**

1. You have created a public API by putting your app on Render. What are the risks?

2. What have you done to reduce those risks? What else should be done?

### **Answers**

1. The main risk is that the API could be misused. Anyone can register an email address, whether or not they own it. Then they can use that account to create an unlimited number of task records, maybe with a bot. They might put harmful data in the task records. They might also register with an email address that belongs to someone else, preventing that person from using the application.

2. You have added bot protection to the register API. You have also added other protections, such as CSRF prevention, data scrubbing to reduce cross-site scripting risk, and rate limiting. In a production application, you would verify the email address. That would require sending an email from the back end and confirming that the user received it. That is more complicated, so we do not do it in this class. You should also limit the number of task records any one user can create.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Inside your `node-homework` folder, add and commit the files you created so they are included on the `assignment10` branch.
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

Record a short video (3-5 minutes) on YouTube, Loom, or a similar platform. Share the link in your submission form.

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
