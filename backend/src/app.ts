import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { securityHeadersMiddleware, rateLimitingMiddleware, sanitizeInputMiddleware } from './middleware/security';
import { config } from './config';

export function createApp() {
  const app = express();

  // Disable framework information leakage
  app.disable('x-powered-by');

  // Enterprise Security Headers
  app.use(securityHeadersMiddleware);

  // CORS with origin validation
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-email'],
    })
  );

  // Denial-of-Service & Brute-Force Rate Limiting
  app.use(rateLimitingMiddleware);

  // Safe body parsing with reasonable size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Input Sanitization & Anti-Prototype Pollution
  app.use(sanitizeInputMiddleware);

  // Secure static serving for civic media uploads with path containment
  const uploadDir = path.resolve(__dirname, '../uploads');
  app.use(
    '/uploads',
    express.static(uploadDir, {
      dotfiles: 'deny',
      index: false,
      maxAge: '1d',
      setHeaders: res => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
      },
    })
  );

  // Mount API prefix
  app.use(config.apiPrefix, routes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
