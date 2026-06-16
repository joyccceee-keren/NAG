# WhatsApp Integration Setup Guide

## Overview
DoorPilot now includes WhatsApp Web integration for automatic message delivery tracking. This allows customers to receive real-time delivery updates via WhatsApp.

## Installation

The WhatsApp integration is already installed. The required packages:
```bash
npm install whatsapp-web.js qrcode-terminal
```

## Setup Instructions

### 1. Initialize WhatsApp Connection

When you start the server, initialize WhatsApp by making a POST request:

```bash
curl -X POST http://localhost:3000/api/whatsapp/initialize
```

### 2. Scan QR Code

When initialization is triggered:
- Check the server console for a QR code
- Scan the QR code using your WhatsApp mobile app camera
- The connection will authenticate automatically

### 3. Configuration

Edit `.env` file and update:

```env
# WhatsApp Business Number (your WhatsApp account number)
WHATSAPP_BUSINESS_NUMBER=919876543210

# Auto-initialize on server start (optional)
WHATSAPP_AUTO_INIT=false
```

## API Endpoints

### 1. Send Custom Message
```
POST /api/whatsapp/send
Body: {
  "phoneNumber": "9876543210",
  "message": "Your order is ready!"
}
```

### 2. Send Order Confirmation
```
POST /api/whatsapp/order-confirmation
Body: {
  "phoneNumber": "9876543210",
  "orderId": "ORD-001",
  "items": [
    { "name": "Lay's Chips", "quantity": 2, "price": 20 }
  ],
  "total": 40
}
```

### 3. Send Delivery Update
```
POST /api/whatsapp/delivery-update
Body: {
  "phoneNumber": "9876543210",
  "orderId": "ORD-001",
  "message": "Your delivery partner is 5 minutes away"
}
```

### 4. Send Delivery Link
```
POST /api/whatsapp/delivery-link
Body: {
  "phoneNumber": "9876543210",
  "orderId": "ORD-001",
  "deliveryLink": "http://localhost:3000/delivery/ORD-001?token=abc123"
}
```

### 5. Get WhatsApp Status
```
GET /api/whatsapp/status
```

## Usage Examples

### JavaScript/Node.js
```javascript
const whatsappService = require('./src/models/WhatsAppService');

// Send simple message
await whatsappService.sendMessage('9876543210', 'Hello from DoorPilot!');

// Send order confirmation
await whatsappService.sendOrderConfirmation(
  '9876543210',
  'ORD-001',
  [{ name: 'Chips', quantity: 1, price: 20 }],
  20
);

// Send delivery update
await whatsappService.sendDeliveryUpdate(
  '9876543210',
  'ORD-001',
  'Your order is out for delivery!'
);
```

### cURL Examples
```bash
# Send message
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "message": "Hello from DoorPilot!"
  }'

# Send order confirmation
curl -X POST http://localhost:3000/api/whatsapp/order-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "orderId": "ORD-001",
    "items": [{"name": "Chips", "quantity": 1, "price": 20}],
    "total": 20
  }'
```

## Phone Number Format

The service automatically handles phone number formatting:
- 10-digit numbers: Treated as Indian numbers (adds country code 91)
- Full international numbers: Used as-is
- Examples:
  - `9876543210` → `919876543210`
  - `919876543210` → `919876543210`
  - `+919876543210` → `919876543210`

## Automatic Message Integration

To automatically send WhatsApp messages when orders are created:

1. Edit `/src/controllers/orderController.js`
2. Add WhatsApp message after order creation:

```javascript
const whatsappService = require('../models/WhatsAppService');

// After order is saved
await whatsappService.sendOrderConfirmation(
  customerPhone,
  orderId,
  orderItems,
  totalAmount
);
```

## Troubleshooting

### QR Code Not Appearing
- Check server console for QR code output
- Ensure WhatsApp is running on your phone
- Restart the WhatsApp initialization

### Messages Not Sending
- Verify WhatsApp is authenticated (`GET /api/whatsapp/status`)
- Check phone number format
- Ensure the recipient's number is saved in your WhatsApp contacts

### Connection Dropping
- WhatsApp session is stored locally in `.whatsapp-session/`
- Delete this folder to force re-authentication
- Check server logs for errors

## Features

✅ Send text messages  
✅ Format messages with bold (*text*), italics (_text_), code (```text```)  
✅ Send delivery confirmations  
✅ Send order updates  
✅ Automatic phone number formatting  
✅ Session persistence (auto-login)  
✅ Error handling and logging  

## Security Notes

⚠️ **Important**: 
- Never share QR codes with others
- Keep `.whatsapp-session/` folder private
- Use environment variables for sensitive data
- Don't commit `.env` file to git

## Limitations

- Session expires after account logout on mobile
- WhatsApp Web can only be used on one device at a time
- Rate limiting may apply for bulk messages
- Requires active internet connection

## Support

For issues or questions:
1. Check server console logs
2. Verify WhatsApp authentication status via API
3. Restart the server and re-authenticate

---

**Note**: This integration uses WhatsApp Web. Always ensure compliance with WhatsApp's Terms of Service when automating messages.
