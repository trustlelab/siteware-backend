import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'; // Import dotenv for environment variables

dotenv.config(); // Load environment variables

// Type definitions for Sequelize options
interface SequelizeOptions {
  host: string | undefined;
  port: number | undefined;
  dialect: any; // You may want to use a stricter type based on your DB dialect
  logging: boolean;
  dialectOptions: {
    ssl: boolean | {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
}

// Initialize Sequelize instance using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    dialect: process.env.DB_DIALECT as any, // Change 'any' to the specific type for your dialect if needed
    logging: false, // Disable SQL logging
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true, // This will ensure SSL is enabled
        rejectUnauthorized: false // Set to true if you want to reject unauthorized SSL connections
      } : false
    }
  } as SequelizeOptions
);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

export default sequelize;
