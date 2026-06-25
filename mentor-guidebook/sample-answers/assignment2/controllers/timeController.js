function getTime(req, res) {
  res.status(200).json({
    time: new Date().toString(),
  });
}

function echoBody(req, res) {
  res.status(200).json({
    weReceived: req.body,
  });
}

module.exports = {
  getTime,
  echoBody,
};
