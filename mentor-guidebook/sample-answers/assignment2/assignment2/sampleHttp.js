const http = require("http");

const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
    const res = await fetch('/time');
    const timeObj = await res.json();
    console.log(timeObj);
    const timeP = document.getElementById('time');
    timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;

const server = http.createServer({ keepAliveTimeout: 60000 }, (req, res) => {
  if (
    req.method === "POST" &&
    req.url === "/" &&
    req.headers["content-type"] === "application/json"
  ) {
    let body = "";
    req.on("data", (chunk) => (body += chunk)); // this is how you assemble the body.
    req.on("end", () => { // this event is emitted when the body is completely assembled.  If there isn't a body, it is emitted when the request arrives.
      const parsedBody = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          weReceived: parsedBody,
        }),
      );
    });
  } else if (req.method != "GET") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "That route is not available.",
      }),
    );
  } else if (req.url === "/secret") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "The secret word is 'Swordfish'.",
      }),
    );
  } else if (req.url === "/time") {
    res.writeHead(200, { "Content-Type": "application/json"});
    res.end(
      JSON.stringify({
        time: new Date().toString(),
      }),
    );
  } else if (req.url === "/timePage") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8"});
    res.end(htmlString);
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        pathEntered: req.url,
      }),
    );
  }
});

server.listen(8000);
