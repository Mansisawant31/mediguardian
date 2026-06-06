const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://melodious-creponne-073a1f.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/family', require('./routes/family'));
app.use('/api/health', require('./routes/health'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/ping', (req, res) => {
  res.json({ status: 'OK', message: 'MediGuardian API Running 🏥', timestamp: new Date() });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  socket.on('join-room', (userId) => {
    socket.join(userId);
  });
  socket.on('sos-alert', (data) => {
    io.emit('sos-received', data);
  });
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

require('./services/cronService');

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 MediGuardian Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
});