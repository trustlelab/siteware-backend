import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import agentRoutes from './routes/agentRoutes';
import twilioRoutes from './routes/twilioRoutes';
import voiceLabRoutes from './routes/voiceLabRoutes';
import fileRoutes from './routes/fileRouter'


import { loadSwaggerDocs } from './swaggerLoader'; 
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

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/download/:fileName', (req: Request, res: Response) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, '../uploads/files/', fileName);

  res.download(filePath, (err) => {
    if (err) {
      res.status(404).json({ message: 'File not found' });
    }
  });
});

const swaggerDocs = loadSwaggerDocs(path.join(__dirname, '../docs'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));



// Define your routes
app.use('/auth', authRoutes);
app.use('/agent', agentRoutes);
app.use('/twilio', twilioRoutes);
app.use('/voice', voiceLabRoutes);
app.use('/file/',fileRoutes)
// Welcome route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the Siteware API!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
