# 🚀 DoorPilot Localhost Complete Guide

## 📍 Server Access Points

### **Primary Access (Unified Dashboard)**
```
http://localhost:3001
```
**What it includes:**
- 🛍️ Main App (Customer ordering)
- 📍 Delivery Tracking (Delivery partner navigation)
- 💬 WhatsApp QR (Partner registration)
- 🚚 Dashboard home screen

---

## 👥 User Roles & Access

### **1️⃣ CUSTOMER ACCESS**
```
http://localhost:3001
```
Click 🛍️ **Shop** → Browse & Order

**Or direct access:**
```
http://localhost:3001/index.html
```

**Features:**
- Browse products (Groceries, Food, Snacks, Cookies, Beverages, Medicines)
- Add items to cart
- Enter delivery location
- Place order
- Receive WhatsApp confirmation

---

### **2️⃣ DELIVERY PARTNER ACCESS**
```
http://localhost:3001
```
Click 📍 **Track** → View & Navigate Orders

**Or direct access:**
```
http://localhost:3001/delivery.html
```

**Features:**
- View assigned orders
- See customer location on map
- Get real-time directions
- Share live location
- Send status updates ("Near me", "Wrong door")
- Complete delivery

---

### **3️⃣ WHATSAPP REGISTRATION**
```
http://localhost:3001
```
Click 💬 **WhatsApp** → Register Partner

**Or direct access:**
```
http://localhost:3001/whatsapp-qr.html
```

**First-time setup:**
1. Scan QR code with delivery partner's phone
2. WhatsApp authenticates
3. Messages start flowing automatically

---

### **4️⃣ DASHBOARD HOME**
```
http://localhost:3001
```
Click 🚚 (Logo) → Home

**Shows:**
- Quick access buttons to all sections
- WhatsApp status indicator
- System status

---

## 🎯 Complete User Journey

### **SCENARIO: Customer Orders → Delivery Partner Delivers**

#### **Step 1: Start Dashboard**
```
Open: http://localhost:3001
```
You see the unified dashboard with 4 sections in sidebar.

---

#### **Step 2: CUSTOMER Places Order**
```
1. Click 🛍️ Shop button
2. Browse products
3. Select items (e.g., 2x Lay's Classic, 1x Coca Cola)
4. Enter phone: 9876543210
5. Enter name: John Doe
6. Pin location on map
7. Click "Confirm Order"
```

**What Happens:**
- ✅ Order created in database
- ✅ WhatsApp sent to customer: Order confirmation with items & total
- ✅ SMS sent as backup
- ✅ Order shows as "pending"

---

#### **Step 3: ADMIN/SYSTEM Assigns Delivery**

Use API or dashboard:
```
POST http://localhost:3001/api/orders/assign-delivery
{
  "orderId": "[order-id-from-step-2]",
  "deliveryExecutivePhone": "8431613496",
  "deliveryExecutiveId": "DE001"
}
```

**What Happens:**
- ✅ Order status → "assigned"
- ✅ WhatsApp sent to delivery partner (8431613496):
  - Order ID
  - Customer name & phone
  - Full item list with prices
  - Total amount
  - **Clickable delivery navigation link**
- ✅ SMS sent as backup

---

#### **Step 4: DELIVERY PARTNER Receives & Accepts**

**Delivery Partner's Phone:**
- 📱 Receives WhatsApp message with order details
- 🔗 Clicks delivery link in WhatsApp

**Browser Opens:**
```
http://localhost:3001/delivery/[order-id]?token=[token]
```

---

#### **Step 5: DELIVERY PARTNER Navigates & Delivers**

```
1. Browser opens delivery.html
2. Map shows:
   - 🔵 Your current location (blue pin)
   - 🔴 Customer location (red pin)
   - Route between both
3. Click "OPEN NAVIGATION" → Google Maps opens
4. Drive to customer location
5. When you arrive:
   - Click "NEAR ME" → Customer gets notification
   - Or click "WRONG DOOR" → Get help
6. After delivery → Order marked complete
```

---

## 🔐 API Endpoints (For Testing)

### **WhatsApp Endpoints**

#### **Check WhatsApp Status**
```bash
GET http://localhost:3001/api/whatsapp/status

Response: { "isReady": true, "message": "..." }
```

#### **Initialize WhatsApp**
```bash
POST http://localhost:3001/api/whatsapp/initialize

# Then visit: http://localhost:3001/api/whatsapp/initialize
# Scan QR code with phone
```

#### **Get QR Code Image**
```bash
GET http://localhost:3001/api/whatsapp/qr
```

---

### **Order Endpoints**

#### **Create Order**
```bash
POST http://localhost:3001/api/orders/create

Body:
{
  "customerPhone": "9876543210",
  "customerName": "John Doe",
  "items": [
    { "name": "Lay's Classic", "price": 20, "quantity": 2 },
    { "name": "Coca Cola", "price": 40, "quantity": 1 }
  ],
  "mapPin": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "textInstruction": "Ring bell twice"
}

Response: { "success": true, "orderId": "..." }
```

#### **Get Order**
```bash
GET http://localhost:3001/api/orders/[order-id]
```

#### **Assign Delivery**
```bash
POST http://localhost:3001/api/orders/assign-delivery

Body:
{
  "orderId": "...",
  "deliveryExecutivePhone": "8431613496",
  "deliveryExecutiveId": "DE001"
}

Response: { "success": true, "findMeLink": "http://..." }
```

#### **Update Order Status**
```bash
PUT http://localhost:3001/api/orders/[order-id]/status

Body: { "status": "completed" }
```

#### **Get All Orders**
```bash
GET http://localhost:3001/api/orders
```

---

## 📱 WhatsApp Numbers

**Delivery Partner:**
```
Phone: 8431613496
Status: ✅ Authenticated
Messages Received: ✅ Yes
```

**Test Customer Numbers:**
```
9876543210 - Test customer 1
9123456789 - Test customer 2
8765432109 - Test customer 3
```

---

## 🌐 Network Access

### **Local Machine Only**
```
http://localhost:3001
```

### **From Network (Other Devices)**
```
http://192.168.1.6:3001
```
Replace `192.168.1.6` with your machine's actual IP if different.

**To find your IP:**
```bash
# Windows
ipconfig

# Look for: IPv4 Address under your network adapter
```

---

## 🧪 Testing Workflow

### **Test 1: Customer Order → WhatsApp Confirmation**

```bash
# 1. Create order
POST http://localhost:3001/api/orders/create
Body: { customer details, items, location }

# 2. Check your phone
# You should receive WhatsApp message:
# ✅ Order Confirmed!
# Order ID: #abc123
# Items: ...
# Total: ₹amount
```

---

### **Test 2: Delivery Assignment → Partner Notification**

```bash
# 1. Assign delivery
POST http://localhost:3001/api/orders/assign-delivery
Body: { orderId: "...", deliveryExecutivePhone: "8431613496" }

# 2. Check delivery partner's phone (8431613496)
# You should receive WhatsApp message:
# 🚚 DoorPilot Delivery Order
# Order ID: #abc123
# Customer: John Doe
# Phone: 9876543210
# Items: ...
# Total: ₹amount
# Delivery Link: http://192.168.1.6:3001/delivery/...
```

---

### **Test 3: Delivery Partner Navigation**

```bash
# 1. Open the delivery link from WhatsApp
http://192.168.1.6:3001/delivery/[order-id]?token=...

# 2. Map loads with customer location
# 3. Click "OPEN NAVIGATION"
# 4. Google Maps opens with route
# 5. Click "NEAR ME" after reaching
# 6. Customer gets notification
```

---

## 📊 Dashboard Navigation

### **Sidebar Buttons**

| Button | Icon | Access | Purpose |
|--------|------|--------|---------|
| Logo | 🚚 | Home | Dashboard welcome |
| Shop | 🛍️ | /index.html | Customer ordering |
| Track | 📍 | /delivery.html | Partner tracking |
| WhatsApp | 💬 | /whatsapp-qr.html | QR registration |

---

## 🔧 Troubleshooting

### **WhatsApp Messages Not Working?**

**Check 1: Is WhatsApp Initialized?**
```
Visit: http://localhost:3001/api/whatsapp/initialize
Response should show QR code
```

**Check 2: Check WhatsApp Status**
```
Visit: http://localhost:3001/api/whatsapp/status
Look for: "isReady": true
```

**Check 3: Server Console**
```
Look for logs:
✅ Message sent to [phone]
✅ WhatsApp order confirmation sent
```

---

### **Delivery Link Not Opening?**

**Issue:** Link copied from WhatsApp doesn't work

**Solution:**
1. Make sure you're using correct network
2. If from another device: use `http://192.168.1.6:3001` instead of `localhost`
3. Check if server is still running

---

### **Map Not Showing Customer Location?**

**Issue:** Blank map in delivery page

**Solution:**
1. Allow browser access to GPS/location
2. Refresh page
3. Check if `mapPin` was provided when creating order

---

## 📞 Quick Reference

### **Start Server**
```bash
cd c:\Users\dsca\NAG.idp\NAG
npm start
# Server runs on http://localhost:3001
```

### **Initialize WhatsApp (First Time)**
```
Visit: http://localhost:3001/api/whatsapp/initialize
Scan QR code with delivery partner's phone
```

### **Access Dashboard**
```
http://localhost:3001
```

### **Test Customer Order**
```
1. Click 🛍️ Shop
2. Add items
3. Enter phone & location
4. Place order
5. Check WhatsApp for confirmation
```

### **Test Delivery Partner**
```
1. Admin assigns delivery
2. Partner receives WhatsApp
3. Partner clicks delivery link
4. Map opens → Navigation works
```

---

## ✨ All Features in One Place

| Feature | URL | Access |
|---------|-----|--------|
| **Dashboard** | http://localhost:3001 | Main entry point |
| **Customer App** | http://localhost:3001/index.html | Orders & products |
| **Delivery App** | http://localhost:3001/delivery.html | Navigation & tracking |
| **WhatsApp QR** | http://localhost:3001/whatsapp-qr.html | Partner registration |
| **WhatsApp Status** | http://localhost:3001/api/whatsapp/status | Check status |
| **WhatsApp Init** | http://localhost:3001/api/whatsapp/initialize | Scan QR |
| **Get Orders** | http://localhost:3001/api/orders | List all orders |
| **Create Order** | POST http://localhost:3001/api/orders/create | New order |
| **Assign Delivery** | POST http://localhost:3001/api/orders/assign-delivery | Assign partner |

---

## 🎯 Recommended Testing Sequence

### **Day 1: Setup**
1. ✅ Start server: `npm start`
2. ✅ Visit dashboard: `http://localhost:3001`
3. ✅ Initialize WhatsApp: `http://localhost:3001/api/whatsapp/initialize`

### **Day 2: Customer Testing**
1. ✅ Click 🛍️ Shop
2. ✅ Add items & place order
3. ✅ Check WhatsApp for order confirmation
4. ✅ Verify SMS backup received

### **Day 3: Delivery Partner Testing**
1. ✅ Admin assigns order to 8431613496
2. ✅ Check delivery partner's WhatsApp
3. ✅ Click delivery link
4. ✅ Test navigation features
5. ✅ Simulate "Near me" & "Wrong door"

### **Day 4: Full End-to-End**
1. ✅ Customer creates order
2. ✅ Admin assigns delivery
3. ✅ Partner navigates & completes
4. ✅ Order marked complete
5. ✅ All messages verified

---

## 📈 Production Notes

**Before Going Live:**
- ✅ WhatsApp session must stay authenticated
- ✅ Server must keep running (use PM2 or similar)
- ✅ SMS gateway credentials configured
- ✅ Delivery partner phone verified
- ✅ Network IP doesn't change (or use DNS)

---

## 🎓 Help Resources

- **Setup Issues:** See `WHATSAPP_SETUP.md`
- **Testing Guide:** See `QUICK_TEST_GUIDE.md`
- **Integration Details:** See `WHATSAPP_ORDER_INTEGRATION.md`
- **Message Formats:** See `WHATSAPP_MESSAGES_REFERENCE.md`
- **Architecture:** See `SOLUTION_SUMMARY.md`

---

## ✅ Ready to Use!

```
Main URL:     http://localhost:3001
Customer:     Click 🛍️ Shop
Partner:      Click 📍 Track
WhatsApp:     Click 💬 WhatsApp
API:          http://localhost:3001/api/...
```

**Everything is integrated. Start ordering! 🚀**
