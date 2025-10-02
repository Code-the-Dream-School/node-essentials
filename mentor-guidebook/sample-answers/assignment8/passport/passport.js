const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { Strategy: JwtStrategy } = require("passport-jwt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { StatusCodes } = require("http-status-codes");


const { verifyUserPassword } = require("../services/userService");


passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const { user, isValid } = await verifyUserPassword(username, password);
        if (!isValid)
          return done(null, null, { message: "Authentication failed." });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);


const cookieExtractor = (req) => req?.cookies?.jwt || null;

const jwtOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    return done(null, jwtPayload);
  }),
);


const setJwtCookie = (req, res, user) => {
  
  const payload = { id: user.id, name: user.name, csrfToken: randomUUID() };
  req.user = payload;
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

  
  res.cookie("jwt", token, {
    ...(process.env.NODE_ENV === "production" && { domain: req.hostname }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
          maxAge: 3600000
  });
};


const logonRouteHandler = async (req, res, next) => {
  let user;
  user = await new Promise((resolve, reject) => {
    passport.authenticate("local", { session: false }, (err, user) => {
      return err ? reject(err) : resolve(user);
    })(req, res);
  });
  if (!user) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication failed" });
  } else {
    setJwtCookie(req, res, user);
    res.json({ name: user.name, csrfToken: req.user.csrfToken });
  }
};


const jwtMiddleware = async (req, res, next) => {
  passport.authenticate("jwt", { session: false, failWithError: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (user) {
      let loggedOn = true;
      if (["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)) {
        if (req.get("X-CSRF-TOKEN") != user.csrfToken) {
          loggedOn = false;
        }
      }
      if (loggedOn) {
        req.user = user;
        return next();
      }
    }
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
  })(req, res);
};

module.exports = {
  logonRouteHandler,
  jwtMiddleware,
  setJwtCookie,
};
