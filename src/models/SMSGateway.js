// ==================== SMS Gateway ====================
// Supports: Twilio (real), or simulated (console log)

class SMSGateway {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'simulated';
  }

  async sendSMS(phoneNumber, message) {
    console.log(`[SMS] → ${phoneNumber}: ${message}`);

    try {
      if (this.provider === 'twilio') {
        return await this._sendViaTwilio(phoneNumber, message);
      }
      return await this._simulate(phoneNumber, message);
    } catch (err) {
      console.error('[SMS] Send failed:', err.message);
      // Always fall back to simulation so the app doesn't break
      return await this._simulate(phoneNumber, message);
    }
  }

  async _sendViaTwilio(phoneNumber, message) {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || sid === 'your_account_sid') {
      console.warn('[SMS] Twilio credentials not set — falling back to simulation');
      return this._simulate(phoneNumber, message);
    }

    // Lazy-load twilio only when needed
    let twilio;
    try {
      twilio = require('twilio');
    } catch {
      console.warn('[SMS] twilio package not installed — run: npm install twilio');
      return this._simulate(phoneNumber, message);
    }

    const client = twilio(sid, token);
    const result = await client.messages.create({
      body: message,
      from,
      to: phoneNumber
    });

    console.log(`[Twilio] Message SID: ${result.sid}`);
    return { success: true, provider: 'twilio', messageId: result.sid };
  }

  async _simulate(phoneNumber, message) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📱 SIMULATED SMS`);
    console.log(`   To:      ${phoneNumber}`);
    console.log(`   Message: ${message}`);
    console.log(`${'─'.repeat(50)}\n`);
    return { success: true, provider: 'simulated', phoneNumber, message };
  }
}

module.exports = new SMSGateway();
