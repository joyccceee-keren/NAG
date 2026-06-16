# 📋 DoorPilot Quick Reference Card

## 🚀 START HERE

```
1. Start Server:
   npm start

2. Open Dashboard:
   http://localhost:3001

3. Done! ✅
```

---

## 📍 ACCESS POINTS

| Role | URL | What to Do |
|------|-----|-----------|
| **🛍️ Customer** | `http://localhost:3001` → Click 🛍️ | Browse & order |
| **📍 Delivery Partner** | `http://localhost:3001` → Click 📍 | Navigate & deliver |
| **💬 WhatsApp Setup** | `http://localhost:3001` → Click 💬 | Register partner |
| **🚚 Dashboard** | `http://localhost:3001` | Home screen |

---

## 📱 WHATSAPP INTEGRATION

**Delivery Partner Phone:** `8431613496` ✅ Authenticated

**Messages Sent:**
- ✅ Order confirmation to customer
- ✅ Delivery details to partner
- ✅ SMS backup if WhatsApp fails

---

## 🧪 TEST IN 3 STEPS

### **Step 1: Place Order (Customer)**
- URL: `http://localhost:3001`
- Click 🛍️ **Shop**
- Add items
- Enter phone & location
- Place order
- ✅ Check WhatsApp: "Order Confirmed!"

### **Step 2: Assign Delivery (Admin)**
```bash
curl -X POST http://localhost:3001/api/orders/assign-delivery \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "[from-step-1]",
    "deliveryExecutivePhone": "8431613496",
    "deliveryExecutiveId": "DE001"
  }'
```
- ✅ Check 8431613496 WhatsApp: Order with details

### **Step 3: Navigate (Delivery Partner)**
- Open WhatsApp message on partner's phone
- Click delivery link
- ✅ Map opens with customer location
- Click "OPEN NAVIGATION"
- ✅ Google Maps navigation starts

---

## 🎯 COMMON TASKS

### **Check WhatsApp Status**
```bash
GET http://localhost:3001/api/whatsapp/status
```

### **Initialize WhatsApp (First Time)**
```bash
Visit: http://localhost:3001/api/whatsapp/initialize
Scan QR with delivery partner's phone
```

### **Create Order via API**
```bash
POST http://localhost:3001/api/orders/create
Body: {
  "customerPhone": "9876543210",
  "customerName": "John",
  "items": [{"name": "Lay's", "price": 20, "quantity": 1}],
  "mapPin": {"latitude": 28.6139, "longitude": 77.2090}
}
```

### **View All Orders**
```bash
GET http://localhost:3001/api/orders
```

---

## 🛠️ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| WhatsApp no messages | Reinit: `http://localhost:3001/api/whatsapp/initialize` |
| Map not showing | Allow location permission in browser |
| Link doesn't work | Use network IP `192.168.1.6:3001` from other devices |
| Error on dashboard | Refresh page or restart server |

---

## 📞 NUMBERS

- **Delivery Partner:** 8431613496 ✅
- **Test Customer:** 9876543210
- **Server Port:** 3001

---

## ⚡ Quick Commands

```bash
# Start server
npm start

# Check package.json for other scripts
cat package.json

# View logs (while running)
# Check terminal/console output
```

---

## ✅ KEY FEATURES

✅ Customer ordering with location  
✅ WhatsApp order confirmation  
✅ Delivery partner assignment  
✅ WhatsApp with complete order details  
✅ GPS navigation to customer  
✅ Real-time status updates  
✅ SMS backup messaging  
✅ Unified dashboard  

---

## 📊 URLS AT A GLANCE

```
Dashboard:           http://localhost:3001
Customer (Shop):     http://localhost:3001/index.html
Delivery (Track):    http://localhost:3001/delivery.html
WhatsApp QR:         http://localhost:3001/whatsapp-qr.html

API Status:          http://localhost:3001/api/whatsapp/status
API Init WhatsApp:   http://localhost:3001/api/whatsapp/initialize
API Get Orders:      http://localhost:3001/api/orders
API Create Order:    POST http://localhost:3001/api/orders/create
API Assign Delivery: POST http://localhost:3001/api/orders/assign-delivery
```

---

## 🎓 FULL GUIDES

- `LOCALHOST_GUIDE.md` - Complete guide with all details
- `QUICK_TEST_GUIDE.md` - Step-by-step testing
- `WHATSAPP_MESSAGES_REFERENCE.md` - Message examples
- `WHATSAPP_ORDER_INTEGRATION.md` - Technical details
- `README_WHATSAPP_UPDATE.md` - What was fixed

---

**Everything Works! Ready to deliver! 🚚**
