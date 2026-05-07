const { ordersDb, deliveryExecutivesDb, trackingDb, ratingsDb } = require('../models/Database');
const smsGateway = require('../models/SMSGateway');
const { v4: uuidv4 } = require('uuid');

// Items catalog
const ITEMS_CATALOG = {
  "🥬 Groceries": [
    { id: 'tomato-01',    name: 'Fresh Tomatoes - 500g',   price: 30,  img: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'potato-01',   name: 'Potatoes - 1kg',           price: 40,  img: 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'onion-01',    name: 'Onions - 1kg',             price: 35,  img: 'https://images.pexels.com/photos/175414/pexels-photo-175414.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'spinach-01',  name: 'Fresh Spinach - 250g',     price: 25,  img: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'carrot-01',   name: 'Carrots - 500g',           price: 30,  img: 'https://images.pexels.com/photos/1306559/pexels-photo-1306559.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'capsicum-01', name: 'Capsicum - 3 pcs',         price: 45,  img: 'https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'milk-01',     name: 'Fresh Milk - 500ml',       price: 30,  img: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'bread-01',    name: 'Whole Wheat Bread',        price: 45,  img: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'eggs-01',     name: 'Farm Eggs - 6 pcs',        price: 60,  img: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=400' }
  ],
  "🍔 Food": [
    { id: 'burger-01',   name: 'Classic Veg Burger',       price: 120, img: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'pizza-01',    name: 'Margherita Pizza',         price: 199, img: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'biryani-01',  name: 'Veg Biryani - 1 plate',   price: 150, img: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'sandwich-01', name: 'Grilled Sandwich',         price: 80,  img: 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'dosa-01',     name: 'Masala Dosa',             price: 90,  img: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400' }
  ],
  "🍿 Snacks": [
    { id: 'chips-01',    name: "Lay's Classic Chips",      price: 25,  img: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'popcorn-01',  name: 'Butter Popcorn',          price: 45,  img: 'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'nachos-01',   name: 'Nachos with Salsa',       price: 55,  img: 'https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'biscuit-01',  name: 'Marie Gold Biscuits',     price: 20,  img: 'https://images.pexels.com/photos/890515/pexels-photo-890515.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'pringles-01', name: 'Pringles Original',       price: 99,  img: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400' }
  ],
  "🍪 Cookies": [
    { id: 'chocochip-01',     name: 'Choc Chunk Cookies',  price: 60,  img: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'oreo-01',          name: 'Oreo Sandwich',       price: 40,  img: 'https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'butter-cookie-01', name: 'Butter Cookies',      price: 120, img: 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'digestive-01',     name: 'Digestive Biscuit',   price: 55,  img: 'https://images.pexels.com/photos/890515/pexels-photo-890515.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'goodday-01',       name: 'Good Day Cashew',     price: 30,  img: 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg?auto=compress&cs=tinysrgb&w=400' }
  ],
  "🥤 Beverages": [
    { id: 'cola-01',   name: 'Coca Cola - 300ml',         price: 40,  img: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'water-01',  name: 'Bisleri Water - 1L',        price: 20,  img: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'soda-01',   name: 'Faurito Soda - 500ml',      price: 30,  img: 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'juice-01',  name: 'Orange Juice - 200ml',      price: 35,  img: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'coffee-01', name: 'Sleepy Owl Coffee',         price: 299, img: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'lassi-01',  name: 'Sweet Lassi - 300ml',       price: 50,  img: 'https://images.pexels.com/photos/3625372/pexels-photo-3625372.jpeg?auto=compress&cs=tinysrgb&w=400' }
  ],
  "💊 Medicines": [
    { id: 'paracetamol-01', name: 'Paracetamol 650mg',    price: 25,  img: 'https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'bandaid-01',     name: 'Band-Aid Flex 100pcs', price: 35,  img: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'cough-01',       name: 'Benadryl Cough Syrup', price: 85,  img: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'sanitizer-01',   name: 'Hand Sanitizer 100ml', price: 60,  img: 'https://images.pexels.com/photos/3873193/pexels-photo-3873193.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'vitaminc-01',    name: 'Vitamin C 500mg',      price: 50,  img: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400' }
  ],
  "📄 Documents": [
    { id: 'print-01',    name: 'Document Printing - A4', price: 5,   img: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'envelope-01', name: 'Courier Envelope - A4',  price: 15,  img: 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'stamp-01',    name: 'Postage Stamp',          price: 10,  img: 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { id: 'folder-01',   name: 'Document Folder',        price: 30,  img: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=400' }
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
