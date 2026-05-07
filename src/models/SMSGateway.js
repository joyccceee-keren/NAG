const axios = require('axios');

// SMS Gateway wrapper - supports multiple providers
class SMSGateway {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'twilio';
  }

  async sendSMS(phoneNumber, message) {
    console.log(`[SMS] Sending to ${phoneNumber}: ${message}`);

    try {
      if (this.provider === 'twilio') {
        return this.sendViaTwilio(phoneNumber, message);
      } else if (this.provider === 'messagebird') {
        return this.sendViaMessageBird(phoneNumber, message);
      } else {
        return this.simulateSMS(phoneNumber, message);
      }
    } catch (err) {
      console.error('SMS Send Error:', err);
      throw err;
    }
  }

  async sendViaTwilio(phoneNumber, message) {
    // In production, use Twilio SDK
    // For now, simulating the send
    console.log(`[Twilio] SMS sent to ${phoneNumber}`);
    return { success: true, provider: 'twilio', messageId: Math.random() };
  }

  async sendViaMessageBird(phoneNumber, message) {
    // In production, use MessageBird API
    console.log(`[MessageBird] SMS sent to ${phoneNumber}`);
    return { success: true, provider: 'messagebird', messageId: Math.random() };
  }

  async simulateSMS(phoneNumber, message) {
    // For development - log to console
    console.log(`[SIMULATED SMS] To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('---');
    return { success: true, provider: 'simulated', phoneNumber, message };
  }
}

module.exports = new SMSGateway();
