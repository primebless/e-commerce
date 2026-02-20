import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/$/, '');
const configuredOrigins = String(process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const cleanOrigin = normalizeOrigin(origin);
      if (configuredOrigins.includes(cleanOrigin)) return callback(null, true);

      // Allow active Vercel deployment URLs during rollout.
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(cleanOrigin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/promotions', promoRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/seller', sellerRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
