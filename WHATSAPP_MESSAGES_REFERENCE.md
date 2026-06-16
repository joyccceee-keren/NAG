# 📱 WhatsApp Messages Reference

## Message Types

### 1️⃣ **Order Confirmation Message** (Sent to Customer)

**Trigger:** When customer creates an order  
**Recipient:** Customer phone number  
**Format:** Rich text with emojis

**Example:**
```
✅ *Order Confirmed!*

*Order ID:* #b4638052-124e-4b9f-a36f-38a5a0d82b9b

*Items:*
• Lay's Classic Salted - 51g x2 = ₹40
• Coca Cola - 300ml x1 = ₹40

*Total:* ₹80

Thank you for ordering!
```

**Code:**
```javascript
async sendOrderConfirmation(phoneNumber, orderId, items, total) {
  const itemsList = items.map(item => 
    `• ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`
  ).join('\n');
  
  const message = 
    `✅ *Order Confirmed!*\n\n` +
    `*Order ID:* #${orderId}\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    `*Total:* ₹${total}\n\nThank you for ordering!`;
    
  return await this.sendMessage(phoneNumber, message);
}
```

---

### 2️⃣ **Delivery Assignment Message** (Sent to Delivery Partner)

**Trigger:** When delivery executive is assigned to order  
**Recipient:** Delivery partner phone (8431613496)  
**Format:** Rich text with clickable link

**Example:**
```
🚚 *DoorPilot Delivery Order*

*Order ID:* #b4638052-124e-4b9f-a36f-38a5a0d82b9b
*Customer:* Rahul Kumar
*Phone:* 9876543210

*Items:*
• Lay's Classic Salted - 51g x2 = ₹40
• Coca Cola - 300ml x1 = ₹40

*Total:* ₹80

📍 *Delivery Link:*
http://192.168.1.6:3001/delivery/b4638052-124e-4b9f-a36f-38a5a0d82b9b?token=abc123...

Click to navigate to customer location. 👆
```

**Code:**
```javascript
const itemsList = (order.items || [])
  .map(item => `• ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`)
  .join('\n');

const whatsAppMessage = 
  `🚚 *DoorPilot Delivery Order*\n\n` +
  `*Order ID:* #${order.id}\n` +
  `*Customer:* ${order.customerName || 'Customer'}\n` +
  `*Phone:* ${order.customerPhone || 'N/A'}\n\n` +
  `*Items:*\n${itemsList}\n\n` +
  `*Total:* ₹${order.totalAmount}\n\n` +
  `📍 *Delivery Link:*\n${findMeLink}\n\n` +
  `Click to navigate to customer location. 👆`;

return await whatsAppService.sendMessage(deliveryExecutivePhone, whatsAppMessage);
```

---

### 3️⃣ **Generic Message** (Custom)

**Trigger:** Manual API call  
**Recipient:** Any phone number  
**Format:** Plain or formatted text

**Example API Call:**
```bash
POST /api/whatsapp/send
{
  "phoneNumber": "919876543210",
  "message": "Hello! Your order is ready for pickup. 📦"
}
```

**Code:**
```javascript
async sendMessage(phoneNumber, message) {
  const formattedNumber = this.formatPhoneNumber(phoneNumber);
  const chatId = `${formattedNumber}@c.us`;
  
  await this.client.sendMessage(chatId, message);
  return {
    success: true,
    message: 'Message sent successfully',
    phoneNumber: phoneNumber,
    timestamp: new Date()
  };
}
```

---

## Message Formatting Guide

### Text Styles in WhatsApp

| Style | Markdown | Result |
|-------|----------|--------|
| Bold | `*text*` | **text** |
| Italic | `_text_` | *text* |
| Strikethrough | `~text~` | ~~text~~ |
| Monospace | ``` `text` ``` | `text` |
| Code Block | ``` ```text``` ``` | Code block |

### Emojis Used

| Emoji | Usage | Code |
|-------|-------|------|
| ✅ | Order confirmed | `\u2705` |
| 🚚 | Delivery order | `\uD83D\uDE9A` |
| 📍 | Location/Navigation | `\uD83D\uDCCD` |
| 👆 | Call-to-action | `\uD83D\uDC46` |
| 📦 | Package | `\uD83D\uDCE6` |
| 💬 | Chat/Message | `\uD83D\uDCEC` |
| ⏰ | Time | `\u23F0` |
| ✓ | Check | `\u2713` |

### Line Breaks & Formatting

```javascript
// Use \n for line breaks
const message = `Line 1\nLine 2\nLine 3`;

// Use \n\n for paragraph breaks
const message = `Paragraph 1\n\nParagraph 2`;

// Lists with • bullet
const message = `Items:\n• Item 1\n• Item 2\n• Item 3`;
```

---

## Message Sending Flow

### 1. **API Endpoint Called**
```bash
POST /api/orders/create
{
  "customerPhone": "9876543210",
  "customerName": "Customer Name",
  "items": [...],
  "mapPin": {...}
}
```

### 2. **Order Created**
- Order saved to database
- Order ID generated

### 3. **WhatsApp Service Check**
```javascript
if (customerPhone && whatsAppService.getStatus().isReady) {
  // WhatsApp is ready, send message
  await whatsAppService.sendOrderConfirmation(...)
}
```

### 4. **Message Formatted**
- Item list generated
- Total calculated
- Message template filled
- Emojis and formatting applied

### 5. **Message Sent**
```javascript
await this.client.sendMessage(chatId, formattedMessage);
```

### 6. **Delivery (On Partner's Phone)**
✅ WhatsApp notification received  
✅ Message displays with formatting  
✅ Link is clickable  
✅ Partner can respond  

### 7. **Error Handling**
```javascript
try {
  await whatsAppService.sendOrderConfirmation(...);
} catch (waErr) {
  console.warn('WhatsApp failed (non-fatal):', waErr.message);
  // SMS is sent as backup
}
```

---

## Expected Message Timeline

### Scenario: Customer Orders, Partner Assigned (2 minutes later)

**T+0s: Customer Creates Order**
```
Customer → App → API /orders/create
Response: { orderId: "abc123" }
SMS to Customer: "Order created, ID: abc123"
WhatsApp to Customer: ✅ Order Confirmed with items & total
```

**T+2min: Order Assigned to Partner**
```
Admin/System → API /orders/assign-delivery
Response: { findMeLink: "http://..." }
SMS to Partner (8431613496): "Order assigned, open link..."
WhatsApp to Partner: 🚚 Order details + clickable link
```

**T+2min+5s: Partner Receives Message**
```
Partner's Phone WhatsApp:
┌─────────────────────────────────────────┐
│ 🚚 *DoorPilot Delivery Order*           │
│                                         │
│ *Order ID:* #abc123                     │
│ *Customer:* John Doe                    │
│ *Phone:* 9876543210                     │
│                                         │
│ *Items:*                                │
│ • Item 1 x2 = ₹100                      │
│ • Item 2 x1 = ₹50                       │
│                                         │
│ *Total:* ₹150                           │
│                                         │
│ 📍 *Delivery Link:*                     │
│ http://192.168.1.6:3001/delivery...     │
│                                         │
│ Click to navigate ↓                     │
└─────────────────────────────────────────┘
```

**T+2min+10s: Partner Clicks Link**
```
Browser Opens: /delivery/abc123?token=...
Map Loads with customer location
Navigation buttons available
Status: "Ready to deliver"
```

---

## Troubleshooting Messages

### Problem: Messages not appearing

**Check 1: Is WhatsApp ready?**
```bash
GET /api/whatsapp/status
# Response: { "isReady": true }
```

**Check 2: Watch server console**
```
✅ Message sent to 8431613496
✅ WhatsApp order confirmation sent to 9876543210
```

**Check 3: Check WhatsApp Web session**
- Open http://localhost:3001/api/whatsapp/initialize
- Scan QR code again if session expired

### Problem: Links not clickable

**Cause:** Link format issue  
**Solution:** Ensure link is plain text (not embedded in other text)
```javascript
// ✅ Correct
const message = `Link:\n${findMeLink}`;

// ❌ Wrong
const message = `Click ${findMeLink} here`;
```

### Problem: Message formatting broken

**Cause:** Escaping issues  
**Solution:** Use backticks for multi-line strings
```javascript
// ✅ Correct
const message = `Line 1\nLine 2`;

// ❌ Wrong
const message = "Line 1\\nLine 2";
```

---

## Reference URLs

**Dashboard:** http://localhost:3001  
**WhatsApp Status:** http://localhost:3001/api/whatsapp/status  
**Initialize QR:** http://localhost:3001/api/whatsapp/initialize  
**Create Order:** POST http://localhost:3001/api/orders/create  
**Assign Delivery:** POST http://localhost:3001/api/orders/assign-delivery  

---

## Summary Table

| Component | Message Type | Recipient | When Sent | Content |
|-----------|--------------|-----------|-----------|---------|
| Customer | Order Confirmation | Customer Phone | Order created | ✅ Order ID, Items, Total |
| Partner | Delivery Order | 8431613496 | Delivery assigned | 🚚 Order details, Customer info, Link |
| Backup | SMS | Both | If WhatsApp fails | Plain text version |

---

**📱 All messages include rich formatting, emojis, and clickable links.**  
**✅ Complete order context included at every step.**  
**🔄 SMS backup ensures delivery if WhatsApp unavailable.**
