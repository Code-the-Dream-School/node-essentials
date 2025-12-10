const waitForRouteHandlerCompletion = async (func, req, res) => {
  let next;
  const promise = new Promise((resolve, reject) => {
    next = jest.fn((error) => {
      if (error) reject(error);
      resolve();
    });
    res.on("finish", () => {
      resolve();
    });
  });
  await func(req, res, next);
  await promise;
  return next;
};
module.exports = waitForRouteHandlerCompletion;
