const { ordersDb, trackingDb } = require('../models/Database');
const smsGateway = require('../models/SMSGateway');

// Delivery executive sends "Near Me" notification
exports.sendNearMeNotification = async (req, res) => {
  try {
    const { orderId, deliveryExecutiveId } = req.body;

    const order = ordersDb.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Send SMS to customer
    const message = `DoorPilot: Your delivery partner will arrive in about 5 minutes. Look out for them!`;
    
    try {
      await smsGateway.sendSMS(order.customerPhone, message);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr);
    }

    // Log tracking event
    trackingDb.add({
      orderId,
      deliveryExecutiveId,
      event: 'near_me_notification_sent',
      timestamp: new Date()
    });

    // Notify via WebSocket if available
    if (req.io) {
      req.io.to(`order-${orderId}`).emit('delivery-near', {
        orderId,
        message: 'Delivery partner is nearby!',
        timestamp: new Date()
      });
    }

    res.json({ success: true, message: 'Customer notified' });
  } catch (err) {
    console.error('Error sending near me notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Delivery executive sends "Wrong Door" notification
exports.sendWrongDoorNotification = async (req, res) => {
  try {
    const { orderId, deliveryExecutiveId } = req.body;

    const order = ordersDb.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Send SMS to customer
    const message = `DoorPilot: Delivery partner is at the wrong location. Please check the "Find Me" link to guide them correctly.`;
    
    try {
      await smsGateway.sendSMS(order.customerPhone, message);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr);
    }

    // Log tracking event
    trackingDb.add({
      orderId,
      deliveryExecutiveId,
      event: 'wrong_door_notification_sent',
      timestamp: new Date()
    });

    // Notify via WebSocket
    if (req.io) {
      req.io.to(`order-${orderId}`).emit('delivery-wrong-door', {
        orderId,
        message: 'Delivery partner is at the wrong location',
        timestamp: new Date()
      });
    }

    res.json({ success: true, message: 'Customer notified about wrong location' });
  } catch (err) {
    console.error('Error sending wrong door notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Update delivery executive location
exports.updateLocation = (req, res) => {
  try {
    const { orderId, deliveryExecutiveId, latitude, longitude } = req.body;

    // Log tracking event
    const tracking = trackingDb.add({
      orderId,
      deliveryExecutiveId,
      event: 'location_update',
      latitude,
      longitude,
      timestamp: new Date()
    });

    // Emit via WebSocket for real-time tracking
    if (req.io) {
      req.io.to(`order-${orderId}`).emit('delivery-location-update', {
        deliveryExecutiveId,
        latitude,
        longitude,
        timestamp: new Date()
      });
    }

    res.json({ success: true, tracking });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Get tracking history
exports.getTrackingHistory = (req, res) => {
  const { orderId } = req.params;
  const tracking = trackingDb.findAll().filter(t => t.orderId === orderId);
  res.json(tracking);
};
