# **Lesson 10 — A Front End and Deployment to the Internet**

## **Lesson Overview**

**Learning objective** Students will validate the workings of their Node back end with a provided React front end.  Students will understand the issues associated with Internet deployment and the specific steps and technologies used for this purpose.
**Topics**:

1. A React Front End for the API
2. Issues in Internet Deployment
3. More security for Internet Deployment
4. How you will Deploy
5. Thinking About Your Capstone Project

## **2.1 A React Front End for the API**

In the React course you recently completed, you implemented a todo list.  This application allowed the user to manage a list of todos, which were stored in Airtable.  The application was configured with an Airtable token and a table identifier.  In this class, you create a means for the user to store tasks, each of which could be a todo.  We have created a React front end for the back end you have created.  It is actually ported from a sample React todo list, but it is changed in important ways:

1. Function is added for user registration, logon, and logoff.
2. Each REST call to access tasks sends a credential, not as a token in the header (which is what happens with Airtable), but by using `credentials: "include"` as an option on the fetch().  This means that the cookie with the JWT that you set in your Node back end will propagate with each REST call for the tasks.
3. The data model is different from the Airtable case.  Instead of distinct tables, each task belongs to a user.  This is actually transparent to the front end.
4. Local storage (see [here](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)) is used to keep track of whether a user is logged on, and the name of that user -- but not(!)  to store the security credential.
5. Security protections are added, in particular to prevent cross site request forgery.  The CSRF token is stored in local storage when the user authenticates, and is sent as a header with each REST request for tasks.

There are other changes too.  For all that, it still works a lot like the React application you created.  You'll get an opportunity to try out the combination in your assignment.

If you were to take a peek, you'd see code like this.  The code below marks a task as complete -- and it's not that different from what you did in your React todo list.

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

Now, it may be tempting to make changes to the React front end, so that it looks nicer or does more stuff.  Well ... don't!  Not that this would be bad, but remember that you are now trying to learn Node.  If you spend time on the front end, as much fun as that is, you will get distracted from what you need to learn about the back end.

In a future iteration of the React class, students will implement a front end that communicates with a Node based back end that is deployed on the Internet, and the React project will include items 1 through 5 above, instead of using Airtable.  Then, in the Node class, they'll build the Node back end for their own front end.

## **2.2 Issues in Internet Deployment**

You build an application (usually) so that others can use it.  What do you need?

1. Server hardware on which the application is to run.  You have to have enough of this to support expected levels of load and to handle failover conditions in case one server or data center is down.
2. An IP address that is public on the Internet.  The Internet provider you have usually only gives you a private address.
3. A public DNS name for this IP address: widgets.acme.com or something like that.  This must be registered with the public DNS system.
4. An SSL certificate.  On the Internet, you don't want to use plain HTTP.  You want HTTPS.  The certificate must be issued by a trusted certificate authority, and must match your DNS name.
5. Databases and possibly other types of storage, with appropriate protections and periodic backup.
6. Network security infrastructure, including firewalls.
7. Automated deployment procedures that check for errors.
8. Automated logging and monitoring.
9. The skills to maintain all of the above.

Whew, a long list! These days, most businesses don't want to sign up for all of this, so they outsource the work to a "cloud" provider.  

- You can request servers from some provider's data center.  Typically, instead of bare iron, you get a virtual server.  You can deliver a virtual machine image to it, using Docker, Kubernetes, and similar technologies.
- You can request a service to host your data or to provide storage.
- Instead of provisioning your own virtual server image, you can have your code deployed to existing virtual servers that have already been provisioned with the operating system you want as well as with enabling technology like Node.
- You can automate requests for one or several registered DNS names and an SSL certificates.
- Cloud providers also provide logging and monitoring services.
- You can leverage a deployment pipeline.  Your build is deployed in a test environment and then propagated to production when the tests pass and/or when you elect to throw the switch.  Deployment pipeline technology includes tools like Jenkins, AWS CodePipeline, Azure Devops, and others.  These are good to learn!

There is a downside to the cloud, which is that you are dependent on your cloud provider.  In particular, they can get to all your data, so you have to trust them.  Technologies exist to protect your data and code from abuse by vulnerabilities or bad actors at your cloud provider, but they are complicated, and require more hardware that you have to own.  Serious leaks have occurred because of security failures by cloud providers.

## **2.3 More Security for Internet Deployment**

Before you deploy, you must be sure that you have enough security built into your back end to prevent misuse.  In Assignment 8, you added quite a few things, but there is still one big hole.  For all the tasks routes and the logoff route, the caller has to have a cookie created by the back end.  And for the logon route, the caller has to have an email address and a password. But for the register route, you have no protection at all.  This creates two risks:

1. Someone could register with an email address they don't own.

2. A bot could register unlimited user records.

Typically, you'd fix (1) by sending a notification with some temporary key to the user's email.  They'd have to send it back somehow to prove that they really own that email address.  We won't have you fix that at the moment, which makes it all the more important to address (2).  You'll do that in your assignment by using the Google reCaptcha service.

## **2.4 How You Will Deploy**

This is just an outline.  Explicit steps will be provided in your assignment.

1. You need a cloud resident database.  There is no way that an application in the cloud can get to your local database, because you don't have a public IP address, etc.  You will use neon.tech.  You will create a free account and a database.  When you create the database, you will get a URL, which includes the database password.

2. You will then point your current Node application at the Neon database.  This is a change to your .env file.  Remember that the URL you get includes a password.  The .env file is the place for this secret.

3. You will then run a Prisma command to create the tables you need.

4. You will then run your Node application.  You are trying to see if it works with the new database.  You will test it with Postman and then with the React front end we provide.  Of course, the user and task entries you previously created in your local database will have to be created again in the Neon database.

5. You will then create a free account on Render.com.

6. You'll then add a new service in Render.com  
    Render gives you a simple deployment pipeline. Follow these steps:

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

8. When it completes, you will see that your application is live, and it will give you the URL.  Now you need to test.  When you created your Postman tests, you configured the `baseURL` to be `http://localhost:3000`.  Now you can change the URL to be the one for your Render.com service, and test with Postman.

9. You will then change the configuration of your React front end, and test with that as well.

When you use the Render.com free plan, builds are slow.  Your application goes to sleep if it is idle for a while.  It takes a while for it to come back up.  Be patient ... and don't rely on Render.com for your class demo!

## **2.5 Thinking About Your Capstone Project**

Review the rubric for the class final project.  Once you complete assignment 10, you will have satisfied nearly all the requirements of the rubric, except one: Do something extra.  There are ideas in the rubric for what the "something extra" might be.  In lesson 11, there are some tips on how to do these.  You may elect to do something else entirely.  However!  Remember that this class is about Node.  You don't want to mess with the front end.  So, you may just be adding APIs or adding additional parameters to existing APIs, or extending the database in some way, and to test and demonstrate, you may have to rely on Postman.  The front end we provide has some function you can leverage, as described in lesson 11.

### **Check for Understanding***

1. Is it possible to run a local database on your laptop that people can access from other machines?  How about a web server?

2. Why is a mechanism for automated deployment important?

3. Why are monitoring and logging important?

4. Why should all Internet web services use SSL (Secure Sockets Layer)?

### **Answers**

1. Yes, you can have a local database and local web server, within limits.  For example, if you have a LAN at home, other machines on that LAN could access your database and/or web server, using the IP address your laptop has.  But this isn't very practical, as it is limited to your home LAN.  The problem is that you don't have a public IP address -- and if you did, you'd be at risk for various attacks.  It is possible to set up a virtual private network (VPN) that you share with machines elsewhere, and to access non-public IP addresses over this network.  The VPN can use the regular Internet as its transport, setting up encrypted channels.  You'll use VPNs in most corporate environments.

2. You need automated deployment because you have to maintain the service you create, which means you are continually making changes and redeploying it.  If you don't automate the steps, including automated testing, you'll break it for sure.

3. Logs identify problems.  Monitoring tells you about these problems.  Your system could crash, or fail because of a bug, or get hacked or misused, and you want to know about it promptly.

4. Secure Sockets Layer keeps the data protected in flight.  A typical packet on the network is passed through many public devices as it travels from source to target.  Any one of those devices could get compromised, giving access to your sensitive data.  Moreover, SSL proves that the server is genuine, not a spoofed copy, because a one time only signature is delivered when each connection is established, and only the owner of that certificate can generate that signature.

