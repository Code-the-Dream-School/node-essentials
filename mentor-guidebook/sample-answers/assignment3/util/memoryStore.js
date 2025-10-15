const storedUsers = [];

let loggedOnUser = null;

const setLoggedOnUser = (user) => {
  loggedOnUser = user;
};

const getLoggedOnUser = () => {
  return loggedOnUser;
};

module.exports = { storedUsers, getLoggedOnUser, setLoggedOnUser };
