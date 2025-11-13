// In-memory storage for users and tasks
const storedUsers = [];
const storedTasks = [];
let loggedOnUser = null;

const setLoggedOnUser = (user) => {
  loggedOnUser = user;
};

const getLoggedOnUser = () => {
  return loggedOnUser;
};

module.exports = {
  storedUsers,
  storedTasks,
  setLoggedOnUser,
  getLoggedOnUser
}; 