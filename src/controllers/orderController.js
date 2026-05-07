const { ordersDb, deliveryExecutivesDb, trackingDb, ratingsDb } = require('../models/Database');
const smsGateway = require('../models/SMSGateway');
const { v4: uuidv4 } = require('uuid');

// Items catalog
const ITEMS_CATALOG = {
  snacks: [
    { id: 'snack-1', name: 'Chips', price: 50 },
    { id: 'snack-2', name: 'Cookies', price: 30 },
    { id: 'snack-3', name: 'Popcorn', price: 40 }
  ],
  beverages: [
    { id: 'bev-1', name: 'Water Bottle', price: 30 },
    { id: 'bev-2', name: 'Soda', price: 60 },
    { id: 'bev-3', name: 'Coffee', price: 80 }
  ],
  groceries: [
    { id: 'groc-1', name: 'Milk', price: 60 },
    { id: 'groc-2', name: 'Bread', price: 40 },
    { id: 'groc-3', name: 'Eggs', price: 80 }
  ],
  medicine: [
    { id: 'med-1', name: 'Paracetamol', price: 50 },
    { id: 'med-2', name: 'Cough Syrup', price: 120 },
    { id: 'med-3', name: 'Band-aid', price: 30 }
  ]
};

// Get available items
exports.getItems = (req, res) => {
  res.json(ITEMS_CATALOG);
};

// Create order
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      customerPhone,
      customerName,
      deliveryDetails,
      mapPin,
      voiceNoteUrl,
      landmarkImageUrl,
      textInstruction
    } = req.body;

    const order = ordersDb.add({
      customerPhone,
      customerName,
      items,
      deliveryDetails,
      mapPin,
      voiceNoteUrl,
      landmarkImageUrl,
      textInstruction,
      status: 'pending',
      totalAmount: items.reduce((sum, item) => sum + item.price, 0),
      findMeLink: null,
      deliveryExecutiveId: null,
      assignedAt: null,
      completedAt: null,
      rating: null
    });

    res.json({
      success: true,
      orderId: order.id,
      order
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get order details
exports.getOrder = (req, res) => {
  const { orderId } = req.params;
  const order = ordersDb.findById(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
};

// Assign delivery executive and send SMS
exports.assignDeliveryExecutive = async (req, res) => {
  try {
    const { orderId, deliveryExecutivePhone, deliveryExecutiveId } = req.body;

    const order = ordersDb.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Generate Find Me Link (unique token)
    const findMeToken = uuidv4();
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const findMeLink = `${baseUrl}/find-me/${findMeToken}`;

    // Update order with delivery executive and link
    const updatedOrder = ordersDb.update(orderId, {
      deliveryExecutiveId,
      deliveryExecutivePhone,
      findMeToken,
      status: 'assigned',
      assignedAt: new Date()
    });

    // Send SMS with Find Me Link
    const message = `DoorPilot: Click here to find the delivery location: ${findMeLink}`;
    
    try {
      await smsGateway.sendSMS(deliveryExecutivePhone, message);
    } catch (smsErr) {
      console.error('SMS send failed, but order was created:', smsErr);
    }

    res.json({
      success: true,
      orderId,
      findMeLink,
      order: updatedOrder
    });
  } catch (err) {
    console.error('Error assigning delivery executive:', err);
    res.status(500).json({ error: 'Failed to assign delivery executive' });
  }
};

// Update order status
exports.updateOrderStatus = (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const updated = ordersDb.update(orderId, { status });

  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json({ success: true, order: updated });
};

// Get all orders (for admin/tracking)
exports.getAllOrders = (req, res) => {
  const orders = ordersDb.findAll();
  res.json(orders);
};

// Get order by Find Me Token
exports.getOrderByToken = (req, res) => {
  const { token } = req.params;
  const orders = ordersDb.findAll();
  const order = orders.find(o => o.findMeToken === token);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Return sanitized order data for delivery executive
  res.json({
    orderId: order.id,
    customerName: order.customerName,
    deliveryDetails: order.deliveryDetails,
    mapPin: order.mapPin,
    voiceNoteUrl: order.voiceNoteUrl,
    landmarkImageUrl: order.landmarkImageUrl,
    textInstruction: order.textInstruction,
    status: order.status,
    createdAt: order.createdAt
  });
};

// Submit rating
exports.submitRating = (req, res) => {
  try {
    const { orderId, rating, feedback } = req.body;

    const order = ordersDb.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const ratingRecord = ratingsDb.add({
      orderId,
      rating,
      feedback,
      submittedAt: new Date()
    });

    ordersDb.update(orderId, { 
      rating,
      status: 'completed',
      completedAt: new Date()
    });

    res.json({ success: true, ratingRecord });
  } catch (err) {
    console.error('Error submitting rating:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};
