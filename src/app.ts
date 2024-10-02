import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Import cors
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path, { dirname } from 'path';
import authRoutes from './routes/authRoutes.ts'; // Explicitly add the .ts extension
import { fileURLToPath } from 'url';

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

// Use import.meta.url to get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'public'))); // Serve files from the public directory

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
  apis: ['./src/routes/*.ts'], // Path to the API docs
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
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the Siteware API!' });
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
