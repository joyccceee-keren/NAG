# 🧪 Quick Test Guide - WhatsApp Order Integration

## 🚀 Start the Server
```bash
cd c:\Users\dsca\NAG.idp\NAG
npm start
# Server runs on http://localhost:3001
```

## 📱 Step 1: Initialize WhatsApp (One-time)
Visit in browser:
```
http://localhost:3001/api/whatsapp/initialize
```
- Scan the displayed QR code with WhatsApp on delivery partner's phone (8431613496)
- Wait for "✅ WhatsApp Web is ready" message
- Don't close the page

## ✅ Step 2: Verify WhatsApp Status
```
GET http://localhost:3001/api/whatsapp/status
```

Response:
```json
{
  "isReady": true,
  "businessNumber": "919876543210",
  "message": "WhatsApp is ready to send messages",
  "hasQRCode": true
}
```

## 🛒 Step 3: Create a Test Order

Use Postman or cURL:

```bash
curl -X POST http://localhost:3001/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "9876543210",
    "customerName": "Test Customer",
    "items": [
      { "name": "Lay'\''s Classic Salted - 51g", "price": 20, "quantity": 2 },
      { "name": "Coca Cola - 300ml", "price": 40, "quantity": 1 }
    ],
    "mapPin": {
      "latitude": 28.6139,
      "longitude": 77.2090
    },
    "textInstruction": "Ring the bell twice"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": "b4638052-124e-4b9f-a36f-38a5a0d82b9b",
  "order": { ... }
}
```

**✅ Check WhatsApp on customer phone (9876543210):**
```
✅ *Order Confirmed!*

*Order ID:* #b4638052-124e-4b9f-a36f-38a5a0d82b9b

*Items:*
• Lay's Classic Salted - 51g x2 = ₹40
• Coca Cola - 300ml x1 = ₹40

*Total:* ₹80

Thank you for ordering!
```

## 🚚 Step 4: Assign Delivery Partner

Copy the orderId from previous response and run:

```bash
curl -X POST http://localhost:3001/api/orders/assign-delivery \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "b4638052-124e-4b9f-a36f-38a5a0d82b9b",
    "deliveryExecutivePhone": "8431613496",
    "deliveryExecutiveId": "DE001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": "b4638052-124e-4b9f-a36f-38a5a0d82b9b",
  "findMeLink": "http://192.168.1.6:3001/delivery/b4638052-124e-4b9f-a36f-38a5a0d82b9b?token=uuid-token",
  "order": { ... }
}
```

**✅ Check WhatsApp on delivery partner phone (8431613496):**
```
🚚 *DoorPilot Delivery Order*

*Order ID:* #b4638052-124e-4b9f-a36f-38a5a0d82b9b
*Customer:* Test Customer
*Phone:* 9876543210

*Items:*
• Lay's Classic Salted - 51g x2 = ₹40
• Coca Cola - 300ml x1 = ₹40

*Total:* ₹80

📍 *Delivery Link:*
http://192.168.1.6:3001/delivery/b4638052-124e-4b9f-a36f-38a5a0d82b9b?token=...

Click to navigate to customer location. 👆
```

## 🎯 Step 5: Verify Delivery Link Works

Click the link from the WhatsApp message:
```
http://192.168.1.6:3001/delivery/[ORDER_ID]?token=[TOKEN]
```

**Expected:** Delivery page loads with:
- ✅ Customer location marked on map
- ✅ Order details
- ✅ Navigation buttons (NEAR ME, WRONG DOOR, OPEN NAVIGATION)
- ✅ Live location sharing option

## 📊 What Should Happen

### Customer (9876543210)
- Receives WhatsApp when order is created
- Message includes: Order ID, items, total
- Knows order is confirmed

### Delivery Partner (8431613496)
- Receives WhatsApp when delivery assigned
- Message includes: Order ID, customer name/phone, items with prices, total, delivery link
- Can click link to start navigation
- Receives SMS as backup

## 🔍 Troubleshooting

### WhatsApp Messages Not Received?
1. Check WhatsApp status: `http://localhost:3001/api/whatsapp/status`
2. If `isReady: false`, run initialization again
3. Ensure server is running
4. Check browser console for errors

### Server Logs
Watch the terminal while testing:
```
✅ Message sent to [phone_number]
✅ WhatsApp order confirmation sent to [phone]
✅ WhatsApp delivery message sent to [phone]
```

### SMS Still Appearing?
- This is normal! SMS is used as backup
- Both SMS and WhatsApp are sent

## 🔄 Repeat Testing

Each test can use different data:
```bash
# Test 2
{
  "customerPhone": "9123456789",
  "customerName": "Another Customer",
  "items": [
    { "name": "Pringles Original - 40g", "price": 51, "quantity": 1 }
  ],
  "mapPin": { "latitude": 28.5244, "longitude": 77.1855 }
}
```

## 📱 Postman Collection (Optional)

Create these requests in Postman:

### 1. Get WhatsApp Status
```
GET http://localhost:3001/api/whatsapp/status
```

### 2. Initialize WhatsApp
```
GET http://localhost:3001/api/whatsapp/initialize
```

### 3. Create Order
```
POST http://localhost:3001/api/orders/create
Body (JSON):
{
  "customerPhone": "9876543210",
  "customerName": "Test Customer",
  "items": [...],
  "mapPin": {...}
}
```

### 4. Assign Delivery
```
POST http://localhost:3001/api/orders/assign-delivery
Body (JSON):
{
  "orderId": "{{paste_from_step_3}}",
  "deliveryExecutivePhone": "8431613496",
  "deliveryExecutiveId": "DE001"
}
```

## ✨ Success Indicators

✅ WhatsApp messages received on both customer and delivery partner phones  
✅ Messages include complete order details (not just location link)  
✅ Delivery link in message is clickable and works  
✅ SMS still being sent as backup  
✅ No console errors in server terminal  
✅ Order status updates to "assigned"  

---

**Ready to test? Start the server and follow the steps above!**
