const { Sequelize } = require('sequelize');

// Initialize Sequelize with PostgreSQL connection
const sequelize = new Sequelize('defaultdb', 'avnadmin', 'AVNS_4ASPPslH1q-pvzcb345', {
  host: 'pg-siteware-personal-c191.f.aivencloud.com',
  dialect: 'postgres',
  port: 12154,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,  // Disable SSL validation for self-signed certificates
    },
  },
});

module.exports = sequelize;
