import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './config/database';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Pro Dev API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'Pro Dev API v1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      sessions: '/api/sessions/*',
      statistics: '/api/statistics/*'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/statistics', statisticsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  await prisma.$disconnect();
  console.log('✅ Database connection closed');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
