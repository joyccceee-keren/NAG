const express = require('express');
const router = express.Router();

// SMS webhook (for receiving SMS from providers)
router.post('/webhook', (req, res) => {
  console.log('SMS webhook received:', req.body);
  res.json({ success: true });
});

module.exports = router;
