// logger.js
const { createLogger, format, transports } = require('winston');

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json() // Log in JSON format
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // Log errors to error.log
    new transports.File({ filename: 'logs/combined.log' }) // Log all levels to combined.log
  ],
});


