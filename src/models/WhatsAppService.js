const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER || '919876543210'; // Default test number
    this.sessionPath = path.join(__dirname, '../../.whatsapp-session');
    this.currentQR = null;
    this.currentQRText = null;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing WhatsApp Web...');
      
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.client.on('qr', (qr) => {
        console.log('\n📱 QR Code generated. Scan with your WhatsApp:');
        console.log('QR Code Text:', qr);
        console.log('\nAlternatively, visit: http://localhost:3001/api/whatsapp/qr to see image');
        
        // Store QR code for retrieval via API
        this.currentQRText = qr;
        
        // Generate QR code image
        const qrcode = require('qrcode');
        qrcode.toBuffer(qr, { errorCorrectionLevel: 'H', width: 300 })
          .then(buffer => {
            this.currentQR = buffer;
          })
          .catch(err => console.error('Error generating QR image:', err));
      });

      this.client.on('authenticated', () => {
        console.log('✅ WhatsApp authenticated successfully');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp auth failed:', msg);
      });

      this.client.on('ready', () => {
        this.isReady = true;
        console.log('✅ WhatsApp Web is ready');
      });

      this.client.on('disconnected', (reason) => {
        this.isReady = false;
        console.warn('⚠️ WhatsApp disconnected:', reason);
      });

      this.client.on('error', (error) => {
        console.error('❌ WhatsApp error:', error);
      });

      await this.client.initialize();
      
    } catch (error) {
      console.error('Failed to initialize WhatsApp:', error);
      throw error;
    }
  }

  async sendMessage(phoneNumber, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp is not ready. Please initialize first.');
      }

      // Format phone number (add country code if needed)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const chatId = `${formattedNumber}@c.us`;

      await this.client.sendMessage(chatId, message);
      console.log(`✅ Message sent to ${phoneNumber}`);
      
      return {
        success: true,
        message: 'Message sent successfully',
        phoneNumber: phoneNumber,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.message,
        phoneNumber: phoneNumber
      };
    }
  }

  async sendDeliveryUpdate(phoneNumber, orderId, message) {
    try {
      const formattedMessage = `🚚 *Delivery Update for Order #${orderId}*\n\n${message}`;
      return await this.sendMessage(phoneNumber, formattedMessage);
    } catch (error) {
      console.error('Error sending delivery update:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(phoneNumber, orderId, items, total) {
    try {
      let itemsList = items.map(item => `• ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`).join('\n');
      
      const message = `✅ *Order Confirmed!*\n\n*Order ID:* #${orderId}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${total}\n\nThank you for ordering!`;
      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      throw error;
    }
  }

  async sendDeliveryLink(phoneNumber, orderId, deliveryLink) {
    try {
      const message = `🎯 *Your Delivery Link*\n\nClick to track your order: ${deliveryLink}\n\nOrder ID: #${orderId}`;
      return await this.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending delivery link:', error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If doesn't start with country code, add India's code
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    
    return cleaned;
  }

  async destroy() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isReady = false;
        console.log('WhatsApp client closed');
      }
    } catch (error) {
      console.error('Error closing WhatsApp client:', error);
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      businessNumber: this.businessNumber,
      message: this.isReady ? 'WhatsApp is ready to send messages' : 'WhatsApp is not ready',
      hasQRCode: !!this.currentQRText
    };
  }

  getCurrentQR() {
    return this.currentQR;
  }

  getCurrentQRText() {
    return this.currentQRText;
  }
}

module.exports = new WhatsAppService();
