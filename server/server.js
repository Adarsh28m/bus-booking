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
app.set('trust proxy', 1); // Render runs behind a proxy
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || '').split(',').map(s => s.trim().replace(/\/$/, '')), methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'x-admin-key'] }));
app.use(express.json({ limit: '50kb' }));
app.use(mongoSanitize());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600 }));
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/buses', buses);
app.use('/api/routes', routes);
app.use('/api/schedules', schedules);
app.use('/api/bookings', bookings);
app.use('/api/admin', admin);
app.use(notFound);
app.use(errorHandler);

await mongoose.connect(process.env.MONGO_URI);
// Make sure unique indexes (double-booking protection) exist before serving traffic
await Promise.all(Object.values(mongoose.models).map(m => m.syncIndexes()));
app.listen(process.env.PORT || 5000, () => console.log('BusBook API running'));
