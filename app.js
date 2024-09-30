const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import cors
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const authRoutes = require('./routes/authRoutes'); // Ensure correct path

const app = express();
app.use(bodyParser.json());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5000', // Allow only this origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed methods
  credentials: true, // Allow credentials (if needed)
};

// Enable CORS with the specified options
app.use(cors(corsOptions));

// Serve static files
app.use(express.static(path.join(__dirname, 'public'))); // Serve files from the public directory

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.1',
    info: {
      title: 'Siteware docs',
      version: '1.0.0',
      description: 'A simple API to manage tasks',
    },
    servers: [
      {
        url: 'http://localhost:8000', // Your server URL
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve Swagger documentation with custom CSS
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCssUrl: '/swagger-custom.css', // URL to your custom CSS
}));

// Use auth routes
app.use('/auth', authRoutes); // Make sure you're using the correct path for routes

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Siteware API!' });
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
