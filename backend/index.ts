import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import clientRoutes from './routes/client.routes';
import { initCronJobs } from './jobs/syncEmails.job';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/clients', clientRoutes);

// Health check
app.get('/health', (req, res) => {
  res.send('Backend is running!');
});

// Initialize Cron Jobs
initCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
