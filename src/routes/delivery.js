const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Send "Near Me" notification
router.post('/near-me', deliveryController.sendNearMeNotification);

// Send "Wrong Door" notification
router.post('/wrong-door', deliveryController.sendWrongDoorNotification);

// Update delivery executive location
router.post('/update-location', deliveryController.updateLocation);

// Get tracking history
router.get('/tracking/:orderId', deliveryController.getTrackingHistory);

module.exports = router;
