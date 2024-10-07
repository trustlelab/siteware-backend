import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Import cors
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import authRoutes from './routes/authRoutes'; // Assuming your file is named authRoutes.ts
import agentRoutes from './routes/AgentRoutes'; // Assuming your file is named AgentRoutes.ts

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

console.log('Serving uploads directory from: ', path.join(__dirname, 'uploads'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
  apis: ['./src/routes/*.ts'], // Path to the API docs (update as needed)
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve Swagger documentation with custom CSS
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCssUrl: '/swagger-custom.css', // URL to your custom CSS (if available)
}));

// Use auth routes
app.use('/auth', authRoutes); // Ensure this path is correct for your routes
app.use('/agent', agentRoutes); // Ensure this path is correct for your agent routes

// Default route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the Siteware API!' });
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
