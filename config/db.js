const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables

// Initialize Sequelize instance using environment variables
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: false,  // Disable SQL logging
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true, // This will ensure SSL is enabled
      rejectUnauthorized: false // Set to true if you want to reject unauthorized SSL connections
    } : false
  }
});

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;
