const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get items catalog
router.get('/items', orderController.getItems);

// Create new order
router.post('/create', orderController.createOrder);

// Get specific order
router.get('/:orderId', orderController.getOrder);

// Get order by Find Me token (for delivery executive)
router.get('/token/:token', orderController.getOrderByToken);

// Assign delivery executive and send SMS
router.post('/assign-delivery', orderController.assignDeliveryExecutive);

// Update order status
router.put('/:orderId/status', orderController.updateOrderStatus);

// Submit rating and feedback
router.post('/rate', orderController.submitRating);

// Get all orders (admin)
router.get('/', orderController.getAllOrders);

module.exports = router;
