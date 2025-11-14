require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
const { createUser } = require("../services/userService");
const httpMocks = require("node-mocks-http");
const EventEmitter = require('events').EventEmitter;
const { register, logoff } = require("../controllers/userController");
const { logonRouteHandler, jwtMiddleware } = require("../passport/passport");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion.js")
const jwt = require("jsonwebtoken");
let saveReq;

// a few useful globals
let saveRes = null;
let saveData = null;

const cookie = require("cookie");
function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
  eventEmitter: EventEmitter,
});
  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);
    let currentHeader = res.getHeader("Set-Cookie");
    if (currentHeader === undefined) {
      currentHeader = [];
    }
    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };
  return res;
}

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  await createUser({
    email: "bob@sample.com",
    password: "Pa$$word20",
    name: "Bob",
  });

});

afterAll(() => {
  prisma.$disconnect();
});

let jwtCookie;

describe("testing logon, register, and logoff", () => {
  it("33. The user can be logged on", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logonRouteHandler,req,saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });
  it("35. A string in the Set-Cookie array starts with jwt=.", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toBeDefined();
  });
  it("36. That string contains HttpOnly;.", () => {
    expect(jwtCookie).toContain("HttpOnly");
  });
  it("37. returns the expected name.", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.name).toBe("Bob");
  });
  it("38. returns a csrfToken", () => {
    expect(saveData.csrfToken).toBeDefined();
  });
  it("39. A logon attempt with a bad password returns a 401", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "bad password" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logonRouteHandler,req,saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
  it("40. You can't register with an email address that is already registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "bob@sample.com",
        name: "another Bob",
        password: "Pa$$word20",
      },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(400);
  });
  it("41. You can register an additional user.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "manuel@sample.com",
        name: "Manuel",
        password: "Pa$$word20",
      },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("42. You can logon as that new user.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "manuel@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logonRouteHandler,req,saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("43. You can now logoff.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logoff, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("45. The logoff clears the cookie.", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toContain("Jan 1970");
  });
});

describe("Testing JWT middleware", () =>{
  it("61. Returns a 401 if the JWT is not present", async() =>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(jwtMiddleware,req,saveRes);
    expect(saveRes.statusCode).toBe(401);
  })
  it("62. Returns a 401 if the JWT is invalid", async ()=>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "badToken"}, "badSecret", { expiresIn: "1h" });
    req.cookies = {jwt: jwtCookie }
    await waitForRouteHandlerCompletion(jwtMiddleware,req,saveRes);
    expect(saveRes.statusCode).toBe(401);
  })
  it("63. Returns a 401 if the JWT is valid but the token isn't", async ()=>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "badtoken"}, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.cookies = {jwt: jwtCookie }
    if (!req.headers) {
      req.headers={};
    }
    req.headers["X-CSRF-TOKEN"]= "goodtoken"
    await waitForRouteHandlerCompletion(jwtMiddleware,req,saveRes);
    expect(saveRes.statusCode).toBe(401);
  })
  it("64. Calls next() if both the token and the jwt are good.", async ()=>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "goodtoken"}, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.cookies = {jwt: jwtCookie }
    if (!req.headers) {
      req.headers={};
    }
    req.headers["X-CSRF-TOKEN"]= "goodtoken"
    const next = await waitForRouteHandlerCompletion(jwtMiddleware,req,saveRes);
    saveReq=req;
    expect(next).toHaveBeenCalled();
  })
  it("65. Sets the req.user before calling next()", () =>{
    expect(saveReq.user.id).toBe(5);
  })
})
