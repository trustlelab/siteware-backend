import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import agentRoutes from './routes/AgentRoutes';

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8000;

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

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
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCssUrl: '/swagger-custom.css',
}));

app.use('/auth', authRoutes);
app.use('/agent', agentRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the Siteware API!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
