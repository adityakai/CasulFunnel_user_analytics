import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import eventsRouter from './routes/events.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/causalfunnel_analytics';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';

app.use(cors());
app.use(express.json({ limit: '128kb' }));
app.use(express.static('public'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'causalfunnel-user-analytics' });
});

app.use('/api', eventsRouter);

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

async function start() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${mongoUri}`);
    app.listen(port, () => {
      console.log(`Analytics API running at http://127.0.0.1:${port}`);
    });
  } catch (error) {
    console.error('Failed to start API:', error.message);
    process.exit(1);
  }
}

start();