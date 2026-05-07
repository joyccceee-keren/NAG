const { ordersDb, ratingsDb } = require('../models/Database');
const smsGateway = require('../models/SMSGateway');
const { v4: uuidv4 } = require('uuid');

// ── Items catalog ────────────────────────────────────────────────────────────
const ITEMS_CATALOG = {
  Snacks: [
    { id: 'lays-01',    name: 'Lays Classic Chips - 50g',              price: 25, img: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400' },
    { id: 'popcorn-01', name: 'Butter Popcorn - 100g',                 price: 45, img: 'https://images.unsplash.com/photo-1585670083573-e3e5e5e5e5e5?w=400' }
  ],
  Cookies: [
    { id: 'unibic-01',  name: 'Unibic Chocolate Chip Cookies - 100g',  price: 60, img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400' },
    { id: 'oreo-01',    name: 'Oreo Chocolate Sandwich - 95g',          price: 40, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' }
  ],
  Beverages: [
    { id: 'cola-01',    name: 'Spark Cola 300ml',                       price: 30, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
    { id: 'water-01',   name: 'Mineral Water 1L',                       price: 20, img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' }
  ],
  Groceries: [
    { id: 'milk-01',    name: 'Full Cream Milk 500ml',                  price: 30, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
    { id: 'bread-01',   name: 'Whole Wheat Bread',                      price: 40, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' }
  ],
  Medicines: [
    { id: 'para-01',    name: 'Paracetamol 500mg (10 tabs)',            price: 25, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400' },
    { id: 'bandaid-01', name: 'Band-Aid Strips (10 pcs)',               price: 30, img: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400' }
  ]
};

// GET /api/orders/items
exports.getItems = (_req, res) => {
  res.json(ITEMS_CATALOG);
};

// POST /api/orders/create
exports.createOrder = async (req, res) => {
  try {
    const {
      items, customerPhone, customerName,
      deliveryDetails, mapPin,
      voiceNoteUrl, landmarkImageUrl, textInstruction
    } = req.body;

    if (!mapPin || !mapPin.latitude || !mapPin.longitude) {
      return res.status(400).json({ error: 'mapPin with latitude/longitude is required' });
    }

    const totalAmount = (items || []).reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);

    const order = ordersDb.add({
      customerPhone,
      customerName,
      items:           items || [],
      deliveryDetails: deliveryDetails || {},
      mapPin,                   // { latitude, longitude }
      voiceNoteUrl:    voiceNoteUrl    || null,
      landmarkImageUrl:landmarkImageUrl|| null,
      textInstruction: textInstruction || '',
      status:          'pending',
      totalAmount,
      findMeToken:     null,
      findMeLink:      null,
      deliveryExecutiveId:    null,
      deliveryExecutivePhone: null,
      assignedAt:      null,
      completedAt:     null,
      rating:          null
    });

    res.json({ success: true, orderId: order.id, order });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// GET /api/orders/:orderId
exports.getOrder = (req, res) => {
  const order = ordersDb.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

// GET /api/orders/token/:token  — used by delivery.html
exports.getOrderByToken = (req, res) => {
  const { token } = req.params;
  const order = ordersDb.findAll().find(o => o.findMeToken === token);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Return only what the delivery executive needs
  res.json({
    success:          true,
    orderId:          order.id,
    customerName:     order.customerName,
    deliveryDetails:  order.deliveryDetails,
    mapPin:           order.mapPin,
    voiceNoteUrl:     order.voiceNoteUrl,
    landmarkImageUrl: order.landmarkImageUrl,
    textInstruction:  order.textInstruction,
    status:           order.status,
    createdAt:        order.createdAt
  });
};

// POST /api/orders/assign-delivery
// Assigns a delivery executive, generates Find Me link, sends SMS
exports.assignDeliveryExecutive = async (req, res) => {
  try {
    const { orderId, deliveryExecutivePhone, deliveryExecutiveId } = req.body;

    const order = ordersDb.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Generate unique token for this delivery
    const findMeToken = uuidv4();

    // Use the runtime BASE_URL (auto-set to LAN IP in server.js)
    const baseUrl  = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    // ✅ Find Me link → delivery.html (correct page for delivery executive)
    const findMeLink = `${baseUrl}/delivery/${orderId}?token=${findMeToken}`;

    // Update order
    const updated = ordersDb.update(orderId, {
      deliveryExecutiveId,
      deliveryExecutivePhone,
      findMeToken,
      findMeLink,
      status:     'assigned',
      assignedAt: new Date()
    });

    // Send SMS to delivery executive
    const smsMessage =
      `DoorPilot Delivery 🛵\n` +
      `Customer: ${order.customerName || 'Customer'}\n` +
      `Open this link to navigate to their door:\n${findMeLink}`;

    try {
      await smsGateway.sendSMS(deliveryExecutivePhone, smsMessage);
    } catch (smsErr) {
      console.error('SMS failed (non-fatal):', smsErr.message);
    }

    // Emit via Socket.IO if available
    if (req.io) {
      req.io.to(`order-${orderId}`).emit('delivery-assigned', {
        orderId, findMeLink, deliveryExecutivePhone
      });
    }

    res.json({ success: true, orderId, findMeLink, order: updated });
  } catch (err) {
    console.error('assignDeliveryExecutive error:', err);
    res.status(500).json({ error: 'Failed to assign delivery executive' });
  }
};

// PUT /api/orders/:orderId/status
exports.updateOrderStatus = (req, res) => {
  const updated = ordersDb.update(req.params.orderId, { status: req.body.status });
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, order: updated });
};

// GET /api/orders/
exports.getAllOrders = (_req, res) => {
  res.json(ordersDb.findAll());
};

// POST /api/orders/rate
exports.submitRating = (req, res) => {
  try {
    const { orderId, rating, feedback } = req.body;
    const order = ordersDb.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const ratingRecord = ratingsDb.add({ orderId, rating, feedback, submittedAt: new Date() });
    ordersDb.update(orderId, { rating, status: 'completed', completedAt: new Date() });

    res.json({ success: true, ratingRecord });
  } catch (err) {
    console.error('submitRating error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};
