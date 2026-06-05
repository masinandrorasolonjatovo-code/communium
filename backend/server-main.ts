/**
 * Main Backend Server
 * Express server with all MVP features integrated
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import paymentRoutes from './src/routes/payment';
import matchingRoutes from './src/routes/matching';
import profileRoutes from './src/routes/profile';
import authenticateUser from './src/middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes

// Public routes
app.get('/api/payment/tiers', (req, res) => {
  res.json({
    tiers: [
      {
        id: 'free',
        name: 'Free',
        priceUSD: 0,
        priceMAD: 0,
        features: ['Basic profile', 'View matches', 'Limited messaging'],
      },
      {
        id: 'silver',
        name: 'Silver',
        priceUSD: 9.99,
        priceMAD: 100,
        features: ['Everything in Free', 'Unlimited messaging', 'Priority support'],
      },
      {
        id: 'gold',
        name: 'Gold',
        priceUSD: 24.99,
        priceMAD: 250,
        features: ['Everything in Silver', 'Advanced matching', 'Export contacts'],
        popular: true,
      },
      {
        id: 'platinum',
        name: 'Platinum',
        priceUSD: 49.99,
        priceMAD: 500,
        features: ['Everything in Gold', 'Personal matchmaker', '1-on-1 mentoring', 'VIP support'],
      },
    ],
  });
});

// Protected routes (authentication required)
app.use('/api/payment', paymentRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/profile', profileRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
    ✅ Communium Backend is running!
    
    🌐 Server URL: http://localhost:${PORT}
    📊 Health Check: http://localhost:${PORT}/health
    
    🔗 API Routes:
      - POST /api/payment/checkout/stripe
      - POST /api/payment/checkout/cmi
      - GET /api/payment/tiers
      - POST /api/matching/recommendations
      - GET /api/matching/sectors
      - POST /api/matching/calculate-score
      
    Environment: ${process.env.NODE_ENV || 'development'}
    Database: ${process.env.DATABASE_URL ? '✓ Configured' : '✗ Not configured'}
    Redis: ${process.env.REDIS_URL ? '✓ Configured' : '✗ Not configured'}
  `);
});

export default app;
