const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance

// Define the User model
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resetPasswordOTP: {
    type: DataTypes.STRING,
    allowNull: true, // Will store hashed OTP
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true, // Will store OTP expiration time
  },
}, {
  timestamps: true,
});

module.exports = User;
