# Getting Started with Node Development

Welcome to Code the Dream’s Node/Express class! You will be learning Node, an implementation of the JavaScript engine that runs standalone or as a web server. This page describes how to begin. You can develop Node applications on MacOS, Linux, or Windows. If you are developing on Windows, there is no need to do development in a virtual machine, as Node development works fine in Windows native environments, but you can use the Windows Subsystem for Linux if you prefer. You will need to install:

- Git
- Node
- Postman
- Postgresql
- The `node-homework` git repository

## Git

The git program s is typically already present on MacOS and Linux. You can run

```
git --version
```

to see if it is installed. On Windows, you should install Git for Windows, if you haven’t already. It is available [here.](https://gitforwindows.org/) You will also need an editor. For JavaScript development the VSCode editor is strongly recommended. Finally, you will need to install Node and the Node Package Manager npm. That package is available [here](https://nodejs.org/en/download/). You should install the latest LTS version. The other package you need is called Postman. In this class, you create REST APIs. You may have no front end for those APIs, so you need to test them with Postman. The Postman package is available [here](https://www.postman.com/downloads/). MacOS and Linux users can skip the next section — but please continue with the sections that follow.

## Node

For Windows and Mac, the installer for Node is available [here](https://nodejs.org/en/download/).

For Linux, you enter the following commands:

```bash
sudo apt update
sudo apt install nodejs
sudo apt install npm
```

## Postgresql

You will learn and use the SQL language for relational database access in this course.  The SQL database we use is called Postgres.  The steps needed to install and configure this package are a little different depending on the platform.

### Postgresql on Mac

Enter the following commands in a terminal session.  The `<username>` you use is your Mac username, that is, the value returned by the whoami command.

```bash
brew update
brew install postgresql@14
brew services start postgresql@14
psql -U postgres
CREATE ROLE <username> LOGIN CREATEDB;
CREATE DATABASE nodehomework OWNER <username>;
CREATE DATABASE tasklist OWNER <username>;
CREATE DATABASE testtasklist OWNER <username>;
\q
```

### Postgresql on Windows

The installer for Postgresql is [here](https://www.postgresql.org/download/windows).  You will need to assign a password for Postgres itself.  Think of one and write it down.  You will be prompted for it during the install.  You will also need a password for `mypguser`.  This is a special Postgres ID to be used for database access. Think of one and write it down.  Of course, don't reuse existing passwords.

Run the install program, accepting all default values.  Once it completes, open the Windows services panel and verify that the Postgresql service is running. Then open a `cmd` prompt (not Git Bash) and type the following, entering the Postgres password when prompted, and substituting the `mypguser` passwrod for `<pg-password>`:

```
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost
CREATE ROLE mypguser LOGIN CREATEDB PASSWORD ‘<pg-password>’;
CREATE DATABASE nodehomework OWNER mypguser;
CREATE DATABASE tasklist OWNER mypguser;
CREATE DATABASE testtasklist OWNER mypguser;
\q
```

### Postgresql on Linux

On Linux (or WSL) Postgres is installed as follows.  The `<username>` is your Linux username, whatever whoami returns.

```bash
sudo apt update
sudo apt install postgresql 
sudo service posgresql start
sudo -su postgres psql
CREATE DATABASE nodehomework OWNER <username>;
CREATE DATABASE tasklist OWNER <username>;
CREATE DATABASE tasklisttest OWNER <username>;
CREATE ROLE <username> LOGIN CREATEDB; 
\q
```

### The Postgresql Service

The steps above won't ensure that the Postgresql service always starts on Mac or Linux.  If you reboot, it won't automatically start.  This could be fixed, but you don't need it running all the time.  You only need it when working on a Node assignment that uses the database, but you will get error messages if you don't start the service when working on those lessons.

The installation procedure for Windows makes the Postgresql service start automatically.  You could change this to manual in the services panel, starting the service from that panel when you need it.  You don't want your boot times to get longer.

## Windows Setup

A few additional steps are recommended when setting up a Windows machine for Node development. When you install Git for Windows, you get a terminal shell program called Git Bash. This is the terminal environment you should use for Node development. Do not use cmd.exe or PowerShell, as these terminal environments work differently. With Git Bash, your terminal will work like the LInux or MacOS terminals, so you can enter the same commands as the students with Linux or MacOS. It helps to have some basic understanding of these shell commands: cd, ls, mkdir, touch, pwd. If you are not familiar with these, there is a tutorial [here](https://ubuntu.com/tutorials/command-line-for-beginners#1-overview). You should always start a Git Bash session to issue git, node, or npm commands. You should also configure git to handle line endings in the Linux way, via these commands:

```
git config --global core.eol lf
git config --global core.autocrlf input
```

You should also configure npm to integrate with Git Bash. This is done with the following command:

```
npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
```

You should also configure VSCode to handle line ends as Linux does, and to use Git Bash as the terminal shell. Start VSCode from your Git Bash session by typing

```
code .
```

You can then bring up the settings for VSCode by typing Ctrl, (the ctrl key plus the comma). The settings has a Search settings entry field. Type line end in that entry field. You will then be able to set the Eol to /n which is what you want. Then do a Search settings for: terminal integrated default profile windows. This brings up a dropdown, from which you should choose Git Bash. That completes Windows specific setup.

## The `node-homework` Repository

All of your homework, including the class final project, will be created in this repository.  You should install it now. There are also some configuration steps.

Create a repository called `node-homework` in your online github account.  This repository should be created as public, without a README, gitignore, or license file.  Do not fork the `node-homework` repository from Code the Dream.  Copy the URL for your new repository to your clipboard.  Then enter the following commands:

```bash
git clone https://github.com/Code-the-Dream-School/node-homework
git remote set-url origin <URL> # This is the URL of the repository you created.
git remote add upstream https://github.com/Code-the-Dream-School/node-homework
git push origin main
npm install
```

Once in a while, it may be necessary to get updates from Code the Dream for some code that's included with this repository.  That is the purpose of the upstream remote.  If this happens, a mentor will post instructions on how to pull down the update.

Create a .env file in the root of the `node-homework` folder.  For Mac environments, it should look like:

```
DB_URL=postgresql://<username>@localhost/nodehomework?host=/tmp
DATABASE_URL=postgresql://<username>@localhost/tasklist?host=/tmp
TEST_DATABASE_URL=postgresql://<username>@localhost/tasklist?host=/tmp
```

For Windows environments, you use the password you created for the `mypguser` Postgres user, substituting that for `<pg-password>` below.  

```
DB_URL=postgresql://mypguser:<pg-password>@localhost/nodehomework
DATABASE_URL=postgresql://mypguser:<pg-password>@localhost/tasklist
TEST_DATABASE_URL=postgresql://mypguser:<pg-password>@localhost/testtasklist
```

For Linux environments, your .env file should look like:

```
DB_URL=postgresql://<username>@localhost/nodehomework?host=/var/run/postgresql
DATABASE_URL=postgresql://<username>@localhost/tasklist?host=/var/run/postgresql
TEST_DATABASE_URL=postgresql://<username>@localhost/tasklist?host=/var/run/postgresql
```

## Validating Your `node-homework` Configuration

From your `node-homework` folder, run the following:

```bash
node load-db
```

You should see messages that tables have been loaded.  If this doesn't work, ask a mentor or another student for help.  Remember that the Postgresql service must be running when you do this command.


## Your Assignments

Each of your assignments will be created in the `node-homework` directory.  Before you start work on the assignment, you create a git branch for it.  For example, for the week 1 assignment, you would change to the `node-homework` directory and enter the command

```
git checkout -b assignment1
```

Then, from the `node-homework` folder type `code .` to bring up VSCode for that directory.

When you have finished the week’s assignment, you push it to github as follows:

```
git status
git add -A
git commit -m "Week 1 assignment"
git push origin assignment1
```

You then go to github and open your `node-homework` repository. You create a pull request.  Open the assignment submission form for the class. Include a link to your pull request in that form.  **Do not merge the pull request until your reviewer approves it.**  Each week’s work must be in a different git branch, and you create the assignment2 branch from the assignment1 branch so that each week builds on the work from the weeks before.

## Good Luck With the Class, and Happy Coding!