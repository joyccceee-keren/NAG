const express = require('express');
const whatsappService = require('../models/WhatsAppService');
const router = express.Router();

/**
 * GET /api/whatsapp/status
 * Get WhatsApp service status
 */
router.get('/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/send
 * Send a custom message
 * Body: { phoneNumber, message }
 */
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'phoneNumber and message are required' 
      });
    }

    const result = await whatsappService.sendMessage(phoneNumber, message);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/order-confirmation
 * Send order confirmation
 * Body: { phoneNumber, orderId, items, total }
 */
router.post('/order-confirmation', async (req, res) => {
  try {
    const { phoneNumber, orderId, items, total } = req.body;

    if (!phoneNumber || !orderId || !items || !total) {
      return res.status(400).json({ 
        error: 'phoneNumber, orderId, items, and total are required' 
      });
    }

    const result = await whatsappService.sendOrderConfirmation(
      phoneNumber, 
      orderId, 
      items, 
      total
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/delivery-update
 * Send delivery update
 * Body: { phoneNumber, orderId, message }
 */
router.post('/delivery-update', async (req, res) => {
  try {
    const { phoneNumber, orderId, message } = req.body;

    if (!phoneNumber || !orderId || !message) {
      return res.status(400).json({ 
        error: 'phoneNumber, orderId, and message are required' 
      });
    }

    const result = await whatsappService.sendDeliveryUpdate(
      phoneNumber, 
      orderId, 
      message
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/delivery-link
 * Send delivery tracking link
 * Body: { phoneNumber, orderId, deliveryLink }
 */
router.post('/delivery-link', async (req, res) => {
  try {
    const { phoneNumber, orderId, deliveryLink } = req.body;

    if (!phoneNumber || !orderId || !deliveryLink) {
      return res.status(400).json({ 
        error: 'phoneNumber, orderId, and deliveryLink are required' 
      });
    }

    const result = await whatsappService.sendDeliveryLink(
      phoneNumber, 
      orderId, 
      deliveryLink
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/initialize
 * Initialize WhatsApp connection
 */
router.post('/initialize', async (req, res) => {
  try {
    await whatsappService.initialize();
    res.json({ 
      message: 'WhatsApp initialization started. Check console for QR code.' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
