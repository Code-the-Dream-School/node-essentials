# Node Class Final Project Requirements

## Requirements for the Project (Rubric)

\[ \] Create a Node/Express Tasklist application with the following elements:

### Models & Controllers

\[ \] REST APIs for user registration, logon and logoff, and for task record creation, retrieving one task record, retrieving many task records, task record update, and task record delete.

\[ \] Use of a Postgres database for CRUD operations on user and task records.

\[ \] Models for at least task and user records, with a one to many association between users and tasks.

\[ \] Implementation of security measures, including: 
- Protection for all task operations and for logoff.
- Passwords stored as hashes.
- Standard security protections for authentication, access control, protection against cross site request forgery, secure handling of the session credential, protection against injection attacks, and others according to the best practices described in the class.
- Appropriate handling of application secrets.

\[ \] Validation of all user input before data storage.

\[ \] Appropriate handling of error conditions.

\[ \] Automated test cases for all the operations on task records listed above.  Testing of REST requests using Jest, to include user registration, logon, retrieval of task records, and logoff, with appropriate validation of each result.

\[ \] Deployment of the Express back end application to Render.com, where it uses a Neon.tech Postgres database.

\[ \] Validation that the deployed back end application works as expected.

\[ \] Follow best practice on the organization of Express code modules and use of Eslint and Prettier.

\[ \] Extra function: One or several additions to make your project stand out.  Here are some suggestions.  Just a couple of these would suffice.  Please choose something that doesn't involve a front end change.  You can test and demonstrate these changes with Postman.

- Allow users to be configured with a role, and implement an API that requires this role.  For example, a "boss" role could see all tasks, regardless of which user owns them.
- Logon using a Google button.  This one actually involves a front end change, but the front end part is provided for you.
- Swagger documentation for the API, with an automatically generated UI built from Swagger.
- Organizing tasks into folders.
- An update many tasks operation, where a user could mark many tasks completed with one REST request.
- A delete many tasks operation, where a user could delete a collection of tasks with one REST request.
- Pagination of the task list.
- Filtering of the task list, e.g. to show only uncompleted tasks, or the tasks where the name matches a given regular expression.
- Log records, so that a user can log a series of status records for any given task, to indicate progress.
- Use your imagination!

Please don't spend time on React front end appearance.  That is not the purpose of this class.

## Project Demo Details

It is good practice to talk about what you have learned and know about project as you will be asked to talk about your experiences in job interviews. This is why we ask all students to give a short demo of their final projects. This demo is NOT graded and your performance in the **demo will have no bearing on your graduation**. Please record a 3-5 minute presentation that touches on all of the following:

\[ \] Provide a quick overview of the app.  
\[ \] Show logging in and/or user creation. 
\[ \] Demonstrate your app's CRUD functionality. The provided front end could be used and/or Postman.
\[ \] Create a record in the database using the app. 
\[ \] Show retrieval of task records, and/or update or delete of individual records, and talk about security protections.
\[ \] Show any additional features of the app such as pagination, search functionality, or anything you may have included. 
\[ \] Share what the most challenging part of the project and what you enjoyed working on the most or answer any of the following questions: 

- Did you encounter any problems? 
- How did you resolve them? 
- What resources did you use?
- What did you have the most fun building? 
- Did you reach your end goal? 
- How would you want to continue your project and grow it further? 

### How to Record Your Presentation

You can record your presentation in any of these three ways:

1.   1. Logging into your personal Zoom account and record your personal meeting where only you are in attendance and you are screen-sharing your work ([this is a link to a video on how to do this](https://www.youtube.com/watch?v=njwbjFYCbGU))
2.  Use a screen recording program already on your machine
    1.  [Mac users can use this link to watch a how-to video](https://www.youtube.com/watch?v=w9Byefp51tY)
    2.  [Windows users can use this link to watch a how-to video](https://www.youtube.com/watch?v=PJB7pM5bvNI)
3.  Use an online option such as loom ([link to a how to video on loom here](https://www.youtube.com/watch?v=oAdLPbfXcQo)).

### How to Upload and Share your Video

1.  Make sure you're logged in to youtube. If you don't have a youtube account, [create one by following these instructions](https://support.google.com/youtube/answer/161805?hl=en&co=GENIE.Platform%3DDesktop). You will know you're logged in if you have an initial/icon/other in the top right corner (where the M in the brown circle is on [this screenshot](https://github.com/Code-the-Dream-School/intro-to-programming-2025/blob/images/images/Screenshot%202025-01-27%20at%204.01.20%E2%80%AFPM.png))
2.  Click \`+ Create\` in the top right and select \`Upload video\`. [Click here to see screenshot](https://github.com/Code-the-Dream-School/intro-to-programming-2025/blob/images/images/Screenshot%202025-01-27%20at%204.01.27%E2%80%AFPM.png).
3.  In the Upload videos window that appears, click the black \`Select files\` button. [See this screenshot for a preview of this step](https://github.com/Code-the-Dream-School/intro-to-programming-2025/blob/images/images/Screenshot%202025-01-27%20at%204.01.35%E2%80%AFPM.png). You'll need to select the file of your recording you have saved on your computer.
4.  The file title will be the default video title. You can change this to include your name and "Node Final Project Presentation". [See this preview](https://github.com/Code-the-Dream-School/intro-to-programming-2025/blob/images/images/Screenshot%202025-01-27%20at%204.02.17%E2%80%AFPM.png).
5.  Scroll down under the title; select "No, it's not made for kids" and click on the \`Show more\` gray button to [make further setting changes](https://github.com/Code-the-Dream-School/intro-to-programming-2025/blob/images/images/Screenshot%202025-01-27%20at%204.02.30%E2%80%AFPM.png).
6.  You'll want to be sure the following options for some of the sections that appear after click \`Show more\` are set to the following:
    1.  **_Altered content_**: select "No" since you have not used AI to alter reality in your video
    2.  **_Recording date and location_**: please select the date you made your final project recording
    3.  **_Shorts remixing_**: select "Don't allow remixing"
    4.  **_Comments and ratings_**: if you would like classmates to leave comments, leave comments "On", otherwise you can turn them off by selecting "Off". _NOTE: we do not and cannot monitor comments. Please report anything concerning to Code the Dream but have screenshots if needed._ You can also UNcheck the "Show how many viewers like this video if you wish.
7.  Click the black \`Next\` button in the bottom right to proceed from the Details section of the upload through the Video elements and Checks portion.
8.  Once you are on the Visibility section of the upload, select "Unlisted" as seen [here](https://github.com/Code-the-Dream-School/intro-to-programming-2025/blob/images/images/Screenshot%202025-01-27%20at%204.04.52%E2%80%AFPM.png).
9.  Lastly, click \`Save\` and copy your video link as seen [here](https://github.com/Code-the-Dream-School/intro-to-programming-2025/blob/images/images/Screenshot%202025-01-27%20at%204.05.09%E2%80%AFPM.png).

### Submit Your Recording

Once you have recorded your presentation, please USE YOUR USUAL ASSIGNMENT SUBMISSION FORM LINK TO SUBMIT YOUR RECORDING OF YOUR FINAL PROJECT PRESENTATION - there will be additional fields at the bottom of the form after your usual questions.

You can watch a video on how to submit your recording [by clicking this link](https://youtu.be/bKPglZS2UTU)