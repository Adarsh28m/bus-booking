
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import buses from './routes/buses.js';
import routes from './routes/routes.js';
import schedules from './routes/schedules.js';
import bookings from './routes/bookings.js';
import admin from './routes/admin.js';

import { notFound, errorHandler } from './middleware/error.js';

const app = express();

const PORT = process.env.PORT || 5000;

// Trust Render proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

app.use(cors({
  origin: (process.env.CLIENT_URL || '')
    .split(',')
    .map(s => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-admin-key']
}));

app.use(express.json({ limit: '50kb' }));

app.use(mongoSanitize());

// API rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BusBook API is running',
    database: mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected'
  });
});

// API routes
app.use('/api/buses', buses);
app.use('/api/routes', routes);
app.use('/api/schedules', schedules);
app.use('/api/bookings', bookings);
app.use('/api/admin', admin);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in environment variables');
    }

    // Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected successfully');

    // Ensure database indexes exist
    await Promise.all(
      mongoose.connection.models
        ? Object.values(mongoose.connection.models).map(model =>
            model.syncIndexes()
          )
        : []
    );

    console.log('Database indexes synchronized');

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`BusBook API running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
