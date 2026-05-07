const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const orderRoutes = require('./src/routes/orders');
const deliveryRoutes = require('./src/routes/delivery');
const smsRoutes = require('./src/routes/sms');
const uploadRoutes = require('./src/routes/uploads');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/upload', uploadRoutes);

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io for real-time tracking
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Delivery executive sends location
  socket.on('update-location', (data) => {
    console.log('Location update:', data);
    // Broadcast to all connected clients (customers)
    io.emit('delivery-location', {
      deliveryExecutiveId: data.deliveryExecutiveId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date()
    });
  });

  // Customer tracks delivery
  socket.on('track-delivery', (orderId) => {
    socket.join(`order-${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

server.listen(PORT, () => {
  console.log(`🚀 DoorPilot server running on http://localhost:${PORT}`);
  console.log('📦 Ready to connect delivery executives and customers');
});

module.exports = { app, io };
