const prisma = require('../prisma/db');
const bcrypt = require('bcrypt');

/**
 * Verify user password for authentication
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Object} - Object containing user data and validation result
 */
exports.verifyUserPassword = async (email, password) => {
  try {
  
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { user: null, isValid: false };
    }


    const isValid = password === user.password;

    if (isValid) {
      return { user, isValid: true };
    } else {
      return { user: null, isValid: false };
    }
  } catch (error) {
    console.error('Error verifying user password:', error);
    throw error;
  }
};

/**
 * Create a new user
 * @param {Object} userData - User data object
 * @returns {Object} - Created user
 */
exports.createUser = async (userData) => {
  try {
    const { name, email, password } = userData;
    

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }


    const newUser = await prisma.user.create({
      data: { name, email, password },
      select: { id: true, name: true, email: true }
    });

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};
