require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
const EventEmitter = require('events').EventEmitter;
const httpMocks = require("node-mocks-http");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.task.deleteMany(); // delete all tasks
  await prisma.user.deleteMany(); // delete all users
  user1 = await prisma.user.create( { data: {
    email: "bob@sample.com",
    hashedPassword: "nonsense",
    name: "Bob",
  }});
  user2 = await prisma.user.create({ data: {
    email: "alice@sample.com",
    hashedPassword:"nonsense",
    name: "Alice",
  }});
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing task creation", () => {
  it("14. cant create a task without a user id", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    try {
      await waitForRouteHandlerCompletion(create,req,saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
  it("15. You can't create a task with a bogus user id.", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: 72348 };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    try {
      await waitForRouteHandlerCompletion(create,req,saveRes);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError")
    }
  });
  it("16. If you have a valid user id, create() succeeds (res.statusCode should be 201).", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(create,req,saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("17. The object returned from the create() call has the expected title.", () => {
    saveData = saveRes._getJSONData();
    saveTaskId = saveData.id.toString();
    expect(saveData.title).toBe("first task");
  });
  it("18. The object has the right value for isCompleted.", () => {
    expect(saveData.isCompleted).toBe(false);
  });
  it("19. The object does not have any value for userId.", () => {
    expect(saveData.userId).not.toBeDefined();
  });
});

describe("getting created tasks", () => {
  it("20. You can't get a list of tasks without a user id.", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "GET",
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    try {
      await waitForRouteHandlerCompletion(index,req,saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
  it("21. If you use user1's id, index returns a 200 statusCode.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(index,req,saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("22. The returned JSON array has length 1.", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.tasks).toHaveLength(1);
  });
  it("23. The title in the first array object is as expected.", () => {
    expect(saveData.tasks[0].title).toBe("first task");
  });
  it("24. The first array object does not contain a userId.", () => {
    expect(saveData.tasks[0].userId).not.toBeDefined();
  });
  it("25. If get the list of tasks using the userId from user2, you get a 404.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user2.id };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await index(req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
  it("26. You can retrieve the first array object using the `show()` method of the controller.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(show,req,saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("27. User2 can't retrieve this object.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(show,req,saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
});

describe("testing the update and delete of tasks.", () => {
  it("28. User1 can set the task to isCompleted: true.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId };
    req.body = { isCompleted: true };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(update,req,saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("29. User2 can't do this.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId };
    req.body = { isCompleted: true };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(update,req,saveRes);
    expect(saveRes.statusCode).not.toBe(200);
  });
  it("30. User2 can't delete this task.", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(deleteTask,req,saveRes);
    expect(saveRes.statusCode).not.toBe(200);
  });
  it("31. User1 can delete this task.", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(deleteTask,req,saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("32. Retrieving user1's tasks now returns a 404.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(index,req,saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
});
