const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');

// IMPORTANT: specific routes MUST come before /:orderId wildcard

router.get('/items',          ctrl.getItems);               // GET  /api/orders/items
router.get('/token/:token',   ctrl.getOrderByToken);        // GET  /api/orders/token/:token
router.get('/',               ctrl.getAllOrders);            // GET  /api/orders
router.get('/:orderId',       ctrl.getOrder);               // GET  /api/orders/:orderId

router.post('/create',        ctrl.createOrder);            // POST /api/orders/create
router.post('/assign-delivery', ctrl.assignDeliveryExecutive); // POST /api/orders/assign-delivery
router.post('/rate',          ctrl.submitRating);           // POST /api/orders/rate

router.put('/:orderId/status', ctrl.updateOrderStatus);     // PUT  /api/orders/:orderId/status

module.exports = router;
