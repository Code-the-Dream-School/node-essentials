# **Assignment 11 — Final Project**

## **Assignment Instructions**

Your assignment is to complete the final project and prepare your final presentation. If you have completed all assignments through Assignment 10, you already have a final project. If time permits, add one extra back-end feature. The lesson includes some ideas, or you may come up with your own. Only make changes to the back end so you are not distracted by React code.

Make your changes on an `assignment11` branch of your node-homework repository. Test the full app. If you add or modify APIs, test them. If you enable Swagger, make sure you can see the Swagger user interface.

**Important:** We hope you add an extra feature. If you do, describe what you added in `project-summary.txt`. If you add or modify any REST APIs, document them with enough detail for your reviewer to try them: the path, the method, any query parameters, and the request body if there is one.

## **Prepare Your Final Presentation**

Please record a 3-5 minute presentation that follows the expectations in the [final project rubric](../final-project-rubric.md). Your presentation does not need to be long, but it should give your reviewer a clear tour of what you built and what you learned.

Your presentation should cover:

- A brief explanation of what your application does.
- User registration and/or login.
- The application's CRUD functionality:
  - Create data.
  - Read data.
  - Update data.
  - Delete data.
- The security protections you included, such as protected routes, hashed passwords, and secure authentication handling.
- Any additional feature you implemented for the final project, such as pagination, filtering, role-based access control, Swagger documentation, or another back-end enhancement.
- One technical challenge you encountered and how you solved it.
- What you learned during the project and what you are most proud of.
- What you would add next if you continued developing the application.

## **Submit Your Assignment on GitHub**

📌 **Follow these steps to submit your work:**

#### **1️⃣ Add, Commit, and Push Your Changes**

- Inside your `node-homework` folder, add and commit the files you created so they are included on the `assignment11` branch.
- Push that branch to GitHub.

#### **2️⃣ Create a Pull Request**

- Log on to your GitHub account.
- Open your `node-homework` repository.
- Select your `assignment11` branch. It should be one or several commits ahead of your main branch.
- Create a pull request. **Save the link to this pull request.**
- **Merge the pull request.** In this one case, you do not wait for your reviewer.
- **On Render.com, open the dashboard for your service and do a manual deploy of the main branch.**
- **If your final project changed your Prisma schema, update your Render build command so it regenerates the Prisma Client and applies migrations:** `npm install --production && npx prisma generate && npx prisma migrate deploy`
- **Test that everything works for your Render service, including any extra function you have added.**


#### **3️⃣ Submit Your GitHub Link**

- Paste the URL of your pull request into the **assignment submission form**. Your reviewer may look at the pull request changes or the entire main branch.