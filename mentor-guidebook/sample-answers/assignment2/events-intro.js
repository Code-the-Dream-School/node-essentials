const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("tell", (message) => {
  // this registers a listener
  console.log("listener 1 got a tell message:", message);
});

emitter.on("tell", (message) => {
  // listener 2.  You don't want too many in the chain
  console.log("listener 2 got a tell message:", message);
});

emitter.on("error", (error) => {
  // a listener for errors.  It's a good idea to have one per emitter
  console.log("The emitter reported an error.", error.message);
});

emitter.emit("tell", "Hi there!");
emitter.emit("tell", "second message");
emitter.emit("tell", "all done");