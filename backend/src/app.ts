import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static serving for secure media uploads
  const path = require('path');
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Mount API prefix
  app.use(config.apiPrefix, routes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
