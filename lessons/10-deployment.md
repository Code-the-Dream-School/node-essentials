# **Lesson 10 — A Front End and Deployment to the Internet**

## **Lesson Overview**

**Learning objective**: By the end of this lesson, you should be able to validate your Node back end with a provided React front end. You should also understand what Internet deployment requires and the specific tools you will use to deploy your project.
**Topics**:

1. A React Front End for the API
2. Issues in Internet Deployment
3. More security for Internet Deployment
4. How you will Deploy
5. Extra Points to Cover
6. Thinking About Your Capstone Project

## **10.1 A React Front End for the API**

In the React course, you built a todo list. That app let a user manage todos stored in Airtable. It used an Airtable token and a table identifier.

In this class, your back end lets each user store tasks. A task can be used like a todo. We have created a React front end for the back end you have built. It was adapted from a sample React todo list, with several important changes:

1. Function is added for user registration, logon, and logoff.
2. Each REST call to access tasks sends a credential. It does not send a token in the header like the Airtable version did. Instead, it uses `credentials: "include"` as an option on `fetch()`. This allows the browser to send the cookie with the JWT you set in your Node back end.
3. The data model is different from the Airtable version. Instead of separate Airtable tables, each task belongs to a user. The front end does not need to know much about that difference.
4. Local storage (see [here](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)) is used to keep track of whether a user is logged on and the name of that user. It is **not** used to store the security credential.
5. Security protections are added, especially to prevent cross site request forgery. The CSRF token is stored in local storage when the user authenticates, and it is sent as a header with each REST request for tasks.

Even with these changes, it still works a lot like the React application you created. You will try the full front end/back end combination in your assignment.

Here is an example of what the front end code looks like.  The code below marks a task as complete -- and it's not that different from what you did in your React todo list.

```javascript
      const payload = {
        isCompleted: true,
      };
      const options = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': logonState.csrfToken,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      };
      const resp = await fetch(`${urlBase}/tasks/${id}`, options);
      if (resp.status === 401) {
        return onUnauthorized();
      }
      if (!resp.ok) {
        throw new Error(resp.error);
      }
```

It may be tempting to change the React front end to make it cleaner or more complex. Resist that temptation for this lesson. The focus is Node, and front end changes will distract from the deployment work.

## **10.2 Issues in Internet Deployment**

You usually build an application so other people can use it. To do that on the Internet, you need more than working code. You need:

1. Server hardware on which the application is to run.  You have to have enough of this to support expected levels of load and to handle failover conditions in case one server or data center is down.
2. An IP address that is public on the Internet.  The Internet provider you have usually only gives you a private address.
3. A public DNS name for this IP address: widgets.acme.com or something like that.  This must be registered with the public DNS system.
4. An SSL certificate.  On the Internet, you don't want to use plain HTTP.  You want HTTPS.  The certificate must be issued by a trusted certificate authority, and must match your DNS name.
5. Databases and possibly other types of storage, with appropriate protections and periodic backup.
6. Network security infrastructure, including firewalls.
7. Automated deployment procedures that check for errors.
8. Automated logging and monitoring.
9. The skills to maintain all of the above.

This is a lot to manage. Most businesses do not want to maintain all of it themselves, so they use a cloud provider.

- You can request servers from a provider's data center. Usually, instead of physical hardware, you get a virtual server. You can deliver a virtual machine image to it using Docker, Kubernetes, and similar technologies.
- You can request a service to host your data or to provide storage.
- Instead of provisioning your own virtual server image, you can deploy your code to existing virtual servers that already have the operating system and tools like Node.
- You can automate requests for one or more registered DNS names and SSL certificates.
- Cloud providers also provide logging and monitoring services.
- You can use a deployment pipeline. Your build can be deployed to a test environment and then promoted to production when tests pass or when the team decides it is ready. Deployment pipeline tools include Jenkins, AWS CodePipeline, Azure DevOps, and others. These are good to learn.

There is a downside to the cloud: you depend on your cloud provider. In particular, the provider can access your data, so you have to trust them. Technologies exist to protect data and code from vulnerabilities or bad actors at a cloud provider, but they are complicated and can require more hardware that you own. Serious leaks have happened because of cloud provider security failures.

## **10.3 More Security for Internet Deployment**

Before you deploy, your back end needs enough security to prevent misuse. In Assignment 8, you added several protections, but one important gap remains.

For task routes and the logoff route, the caller must have a cookie created by the back end. For the logon route, the caller must have an email address and password. But the register route has no protection yet. This creates two risks:

1. Someone could register with an email address they don't own.

2. A bot could register unlimited user records.

Typically, you would fix the first risk by sending a notification with a temporary key to the user's email. The user would send that key back somehow to prove they own the email address. We will not have you fix that right now, which makes the second risk especially important. You will address it in the assignment with Google's reCAPTCHA service.

## **10.4 How You Will Deploy**

This is only an outline. Your assignment will provide the exact steps.

Here is the big picture:

```text
local Node app -> Neon database -> Render back end -> deployed front end config -> test everything
```

First, you will make sure your local app can talk to the cloud database. Then you will deploy the back end to Render and give Render the environment variables it needs. After that, you will point the provided front end at the deployed back end. Finally, you will test the deployed application with Postman and the front end.

1. You need a cloud-hosted database. An application in the cloud cannot reach your local database because your laptop does not have a public database address. You will use neon.tech. You will create a free account and a database. When you create the database, you will get a URL that includes the database password.

2. You will point your current Node application at the Neon database. This is a change to your `.env` file. Remember that the URL includes a password. The `.env` file is the place for that secret.

3. You will then run a Prisma command to create the tables you need.

4. You will run your Node application and check whether it works with the new database. You will test it with Postman and then with the React front end we provide. The users and tasks you previously created in your local database will need to be created again in the Neon database.

5. You will then create a free account on Render.com.

6. You will add a new service in Render.com. Render gives you a simple deployment pipeline. Follow these steps:

    1. Connect your repo → Point Render at your GitHub repository.
    2. Build command → Install dependencies and set up Prisma:   
        npm install && npx prisma migrate deploy
    3. Run command → Start your Node app:  
        npm start
    4. Service name → Pick a unique name (e.g. nodehomework-23). This becomes part of your Render URL.
    5. Environment variables → Since .env isn’t in GitHub, configure them in Render’s dashboard:  
        DATABASE_URL → from Neon  
        JWT_SECRET → your JWT secret  

7. You will then start the deployment of your Render.com service.

8. When deployment completes, your application will be live and Render will give you a URL. Now you need to test it. When you created your Postman tests, you configured the `baseURL` as `http://localhost:3000`. Change that URL to your Render service URL and test with Postman.

9. You will then change the configuration of your React front end and test with that too.

When you use the Render.com free plan, builds are slow. Your application also goes to sleep if it is idle for a while, and it takes time to wake back up. Do not rely on Render's free plan for your class demo.

## **10.5 Extra Points to Cover**

This course does not cover every Express topic. Here are a few additional ideas you should know about.

### **Best Practices for Route Naming**

The same Express server might serve both a REST API and ordinary HTML content. For that reason, it is best to start REST routes with `/api`.

As your back end evolves, you may need to change routes to add new capabilities. Those changes might break front end applications that call the API. A common solution is to put a version number in the API routes. For example:

Instead of:  
```
/users
/tasks
```
You should have:
```
/api/v1/users
/api/v1/tasks
```
Do not fix it now. Just be aware that this is a better long-term approach.

### **Sessions**

The app you created has a minimal user session, just enough to make authentication work. Some applications need more. For example, when you log on to an eCommerce site, you may build a shopping cart. That shopping cart information is usually stored in the session.

A session identifier is stored in an HttpOnly cookie, perhaps inside the JWT. The identifier contains a way to find the user and a random nonce for the current session. The back end uses that session identifier to write session information, such as the shopping cart, into a database. You can use the `express-session` package for this purpose. Session stores can include MongoDB, PostgreSQL, and Redis.

Redis is an in-memory key/value store. It is not a relational database. You read or write individual records based on a key. Sessions are temporary, so they do not need to be persisted as carefully as other data. But a session store should be fast and scalable. A cloud-hosted Redis store is a common choice for sessions.

### **Storage**

Suppose your app needs to store data other than SQL records or JSON documents: images, mp3 files, videos, and similar files. For example, maybe you want to store a JPEG image for each user. Where should that data go?

SQL and MongoDB are not the right place for this kind of file storage. While your app runs on your laptop, you can write JPEGs to your local disk. After deployment to a cloud provider, you may not have a writable disk for that purpose. Instead, applications usually use a storage service such as Amazon S3, Digital Ocean Spaces, Google Cloud Storage, or another similar provider.

The user selects a JPEG to upload, and the front end asks the back end for a URL. The back end gets a temporary writable URL from the storage service and returns it to the front end. The front end uploads the JPEG to that URL. The back end also gets a durable, read-only URL for the same JPEG and stores that URL in a user record. Later, the front end can retrieve and display the image.

Each storage service has a corresponding toolkit available on NPM.

## **10.6 Thinking About Your Capstone Project**

Review the rubric for the class final project. Once you complete Assignment 10, you will have satisfied nearly all rubric requirements except one: do something extra.

The rubric includes ideas for what that extra feature might be. Lesson 11 gives tips for several of them. You may also choose something else. Remember, though, that this class is about Node. Avoid getting pulled into front end work. Your extra feature may be a new API, an additional query parameter for an existing API, or a database extension. You may need to test and demonstrate it with Postman. The provided front end has some features you can use, as described in Lesson 11.

### **Check for Understanding***

1. Is it possible to run a local database on your laptop that people can access from other machines?  How about a web server?

2. Why is a mechanism for automated deployment important?

3. Why are monitoring and logging important?

4. Why should all Internet web services use SSL (Secure Sockets Layer)?

### **Answers**

1. Yes, you can have a local database and local web server, within limits. For example, if you have a LAN at home, other machines on that LAN could access your database or web server using your laptop's IP address. But this is not very practical because it is limited to your home LAN. The bigger problem is that you do not have a public IP address. If you did, you would also be exposed to more attacks. It is possible to set up a virtual private network (VPN) to share access to non-public IP addresses over encrypted channels. You will use VPNs in many corporate environments.

2. You need automated deployment because you have to maintain the service you create. That means you will make changes and redeploy it. Without automated steps, including testing, deployment errors are much more likely.

3. Logs identify problems. Monitoring tells you when those problems happen. Your system could crash, fail because of a bug, get hacked, or be misused, and you want to know quickly.

4. Secure Sockets Layer keeps data protected while it travels over the network. A typical network packet passes through many public devices on the way from source to target. Any of those devices could be compromised. SSL also helps prove the server is genuine, not a spoofed copy, because the server proves it owns the certificate when the connection is established.

