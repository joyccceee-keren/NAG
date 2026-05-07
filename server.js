const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Never cache HTML — always serve fresh
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Attach io to every request so controllers can emit events
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/orders',   require('./src/routes/orders'));
app.use('/api/delivery', require('./src/routes/delivery'));
app.use('/api/upload',   require('./src/routes/uploads'));
app.use('/api/sms',      require('./src/routes/sms'));

// ── Geocoding (Nominatim – free, no API key required) ──────────────────────
// Forward geocode: address → lat/lng
app.get('/api/geocode', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'Address is required' });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DoorPilot/1.0 (doorpilot@example.com)' }
    });
    const data = await response.json();

    if (data && data.length > 0) {
      res.json({
        success: true,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        formatted: data[0].display_name
      });
    } else {
      res.status(404).json({ error: 'Address not found' });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

// Reverse geocode: lat/lng → address
app.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DoorPilot/1.0 (doorpilot@example.com)' }
    });
    const data = await response.json();

    if (data && data.display_name) {
      res.json({ success: true, address: data.display_name });
    } else {
      res.status(404).json({ error: 'Location not found' });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
});

// ── Order + Delivery shorthand routes (used by delivery.html) ──────────────
// Create order and generate "Find Me" link
app.post('/api/create-order', async (req, res) => {
  const { address, lat, lng, voiceNote, instructions, customerPhone, deliveryGuyPhone } = req.body;

  const deliveryId = 'find_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  const orderData = {
    id: deliveryId,
    address, lat, lng, voiceNote, instructions,
    customerPhone, deliveryGuyPhone,
    status: 'waiting_for_delivery',
    createdAt: new Date().toISOString()
  };

  const ordersFile = path.join(__dirname, 'data', 'orders.json');
  let orders = [];
  if (fs.existsSync(ordersFile)) {
    orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
  }
  orders.push(orderData);
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

  const findMeLink = `${process.env.BASE_URL || 'http://localhost:' + PORT}/delivery/${deliveryId}`;
  res.json({ success: true, deliveryId, findMeLink });
});

// Get delivery details (used by delivery.html)
app.get('/api/delivery/:id', (req, res) => {
  const { id } = req.params;
  const ordersFile = path.join(__dirname, 'data', 'orders.json');

  if (!fs.existsSync(ordersFile)) {
    return res.status(404).json({ error: 'No deliveries found' });
  }

  const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
  const order = orders.find(o => o.id === id);

  if (!order) return res.status(404).json({ error: 'Delivery not found' });

  res.json({
    success: true,
    lat: order.lat,
    lng: order.lng,
    instructions: order.instructions,
    voiceNote: order.voiceNote,
    address: order.address
  });
});

// Serve delivery portal page
app.get('/delivery/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'delivery.html'));
});

// Serve Find Me page
app.get('/find-me/:token', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a room for a specific order (for real-time tracking)
  socket.on('track-delivery', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`Socket ${socket.id} tracking order ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── Start Server ────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 DoorPilot server running on http://localhost:${PORT}`);
  console.log('📦 Ready to connect delivery executives and customers');
  console.log(`🗺️  Geocoding: Nominatim (OpenStreetMap) – no API key needed`);
  console.log(`📡 Routes: /api/orders  /api/delivery  /api/upload  /api/sms`);
});
