import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { userRoutes } from './routes/user.routes';
import { projectRoutes } from './routes/project.routes';
import { scriptRoutes } from './routes/script.routes';
import { debugRoutes } from './routes/debug.routes';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { loggingMiddleware, monitoring, healthCheckHandler } from '../lib/logging';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Request logging and monitoring middleware
app.use(loggingMiddleware);
app.use(monitoring.metricsMiddleware());

// HTTP access logging (keep morgan for access logs)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint with comprehensive monitoring
app.get('/health', healthCheckHandler);

// Database health check endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    const { dbConnection } = await import('../lib/database/connection');
    const health = await dbConnection.healthCheck();
    res.json({
      success: true,
      data: health,
      message: 'Database health check completed'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database health check failed'
    });
  }
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/debug', debugRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export { app };