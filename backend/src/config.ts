import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'janraksha_dev_secret',
  duplicateSimilarityThreshold: parseFloat(process.env.AI_DUPLICATE_SIMILARITY_THRESHOLD || '0.65'),
};
