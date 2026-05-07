// ==================== API Utilities ====================
class APIClient {
  constructor() {
    this.baseURL = window.location.origin;
    this.timeout = 10000;
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}/api${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Orders API
  async getItems() {
    return this.request('GET', '/orders/items');
  }

  async createOrder(orderData) {
    return this.request('POST', '/orders/create', orderData);
  }

  async getOrder(orderId) {
    return this.request('GET', `/orders/${orderId}`);
  }

  async getOrderByToken(token) {
    return this.request('GET', `/orders/token/${token}`);
  }

  async assignDeliveryExecutive(orderId, deliveryExecutivePhone, deliveryExecutiveId) {
    return this.request('POST', '/orders/assign-delivery', {
      orderId,
      deliveryExecutivePhone,
      deliveryExecutiveId
    });
  }

  async updateOrderStatus(orderId, status) {
    return this.request('PUT', `/orders/${orderId}/status`, { status });
  }

  async submitRating(orderId, rating, feedback) {
    return this.request('POST', '/orders/rate', {
      orderId,
      rating,
      feedback
    });
  }

  // Delivery API
  async sendNearMeNotification(orderId, deliveryExecutiveId) {
    return this.request('POST', '/delivery/near-me', {
      orderId,
      deliveryExecutiveId
    });
  }

  async sendWrongDoorNotification(orderId, deliveryExecutiveId) {
    return this.request('POST', '/delivery/wrong-door', {
      orderId,
      deliveryExecutiveId
    });
  }

  async updateLocation(orderId, deliveryExecutiveId, latitude, longitude) {
    return this.request('POST', '/delivery/update-location', {
      orderId,
      deliveryExecutiveId,
      latitude,
      longitude
    });
  }

  async getTrackingHistory(orderId) {
    return this.request('GET', `/delivery/tracking/${orderId}`);
  }

  // File Upload API
  async uploadVoice(blob) {
    return this.uploadFile('/upload/voice', blob, 'voice');
  }

  async uploadLandmark(blob) {
    return this.uploadFile('/upload/landmark', blob, 'landmark');
  }

  async uploadFile(endpoint, blob, fieldName) {
    const url = `${this.baseURL}/api${endpoint}`;
    const formData = new FormData();
    formData.append(fieldName, blob);

    try {
      const response = await Promise.race([
        fetch(url, {
          method: 'POST',
          body: formData
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout')), 30000)
        )
      ]);

      if (!response.ok) {
        throw new Error(`Upload Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

// Create global API client instance
const api = new APIClient();
