// ==================== MAIN APPLICATION ====================
class DoorPilotApp {
  constructor() {
    this.currentPage = 'landing';
    this.cart = [];
    this.orderData = {
      items: [],
      customerPhone: '',
      customerName: '',
      deliveryDetails: {},
      mapPin: {},
      voiceNoteUrl: '',
      landmarkImageUrl: '',
      textInstruction: ''
    };
    this.currentOrderId = null;
    this.voiceBlob = null;
    this.landmarkBlob = null;
    this.socket = null;
    this.recordingInterval = null;
    this.deliveryMarkers = {};

    this.initializeApp();
  }

  async initializeApp() {
    // Wait for DB to initialize
    await db.init();

    // Initialize Socket.IO for real-time updates
    this.initializeSocket();

    // Handle page load
    this.handlePageLoad();

    // Restore cart from storage
    await this.restoreCart();

    // Show landing page after animation
    setTimeout(() => {
      this.showPage('landing');
      setTimeout(() => this.showPage('order'), 2500);
    }, 500);
  }

  initializeSocket() {
    try {
      this.socket = io();

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      // Listen for delivery location updates
      this.socket.on('delivery-location-update', (data) => {
        this.updateDeliveryLocation(data);
      });

      // Listen for delivery nearby notification
      this.socket.on('delivery-near', (data) => {
        this.showNotification('Delivery partner is nearby!');
      });

      // Listen for wrong door notification
      this.socket.on('delivery-wrong-door', (data) => {
        this.showNotification('Delivery partner is at the wrong location');
      });
    } catch (err) {
      console.error('Socket.IO connection failed:', err);
    }
  }

  // ==================== PAGE MANAGEMENT ====================
  showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.add('hidden');
    });

    // Remove loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }

    // Show selected page
    const pageId = `${pageName}-page`;
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.remove('hidden');
      this.currentPage = pageName;

      // Execute page-specific logic
      this.executePageLogic(pageName);
    }
  }

  async executePageLogic(pageName) {
    switch (pageName) {
      case 'order':
        await this.loadItems();
        break;
      case 'map':
        setTimeout(() => {
          mapManager.initMap('map', (lat, lng) => {
            this.orderData.mapPin = { latitude: lat, longitude: lng };
          });
        }, 100);
        break;
      case 'voice':
        this.setupVoiceRecording();
        break;
      case 'review':
        this.populateReview();
        break;
      case 'tracking':
        this.startTracking();
        break;
      case 'findme':
        setTimeout(() => {
          this.initializeFindMe();
        }, 100);
        break;
    }
  }

  // ==================== ORDER SELECTION ====================
  async loadItems() {
    try {
      const items = await api.getItems();
      this.renderItems(items);
    } catch (err) {
      console.error('Failed to load items:', err);
      alert('Failed to load items');
    }
  }

  renderItems(catalogItems) {
    const grid = document.getElementById('items-grid');
    grid.innerHTML = '';

    Object.keys(catalogItems).forEach(category => {
      catalogItems[category].forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
          <div class="item-card-icon">📦</div>
          <div class="item-card-name">${item.name}</div>
          <div class="item-card-price">₹${item.price}</div>
          <div class="item-card-qty">In cart: <span id="qty-${item.id}">0</span></div>
        `;

        card.addEventListener('click', () => {
          this.addToCart(item);
        });

        grid.appendChild(card);
      });
    });
  }

  addToCart(item) {
    const existing = this.cart.find(i => i.id === item.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({ ...item, quantity: 1 });
    }

    this.updateCartUI();
    this.saveCart();
  }

  updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    const proceedBtn = document.getElementById('proceed-btn');

    let count = 0;
    let total = 0;

    this.cart.forEach(item => {
      count += item.quantity;
      total += item.price * item.quantity;

      const qtyEl = document.getElementById(`qty-${item.id}`);
      if (qtyEl) qtyEl.textContent = item.quantity;
    });

    countEl.textContent = count;
    totalEl.textContent = `₹${total}`;
    proceedBtn.disabled = count === 0;

    // Store cart items in order data
    this.orderData.items = this.cart;
  }

  async saveCart() {
    await db.save('cache', { key: 'cart', value: this.cart });
  }

  async restoreCart() {
    const cached = await db.get('cache', 'cart');
    if (cached && cached.value) {
      this.cart = cached.value;
      this.updateCartUI();
    }
  }

  // ==================== DELIVERY DETAILS ====================
  setupDeliveryDetailsForm() {
    const form = document.getElementById('delivery-form');

    document.getElementById('next-location-btn').addEventListener('click', (e) => {
      e.preventDefault();

      // Validate form
      if (!form.checkValidity()) {
        alert('Please fill all required fields');
        return;
      }

      // Collect form data
      this.orderData.deliveryDetails = {
        apartmentName: document.getElementById('apartment-name').value,
        colonyName: document.getElementById('colony-name').value,
        flatNumber: document.getElementById('flat-number').value,
        houseNumber: document.getElementById('house-number').value,
        flatColor: document.getElementById('flat-color').value,
        gateNumber: document.getElementById('gate-number').value,
        staircaseColor: document.getElementById('staircase-color').value,
        hasLift: document.getElementById('has-lift').checked,
        isLeftSide: document.getElementById('is-left-side').checked,
        floorNumber: document.getElementById('floor-number').value,
        intercomCode: document.getElementById('intercom-code').value,
        specialIdentifiers: document.getElementById('special-identifiers').value
      };

      this.orderData.customerName = document.getElementById('customer-name').value;
      this.orderData.customerPhone = document.getElementById('customer-phone').value;

      // Save draft
      this.saveDraft();

      this.showPage('map');
    });
  }

  // ==================== VOICE & LANDMARKS ====================
  setupVoiceRecording() {
    // Landmark upload
    document.getElementById('landmark-file').addEventListener('change', (e) => {
      this.handleLandmarkUpload(e);
    });

    // Voice recording controls
    document.getElementById('start-recording').addEventListener('click', () => {
      this.startVoiceRecording();
    });

    document.getElementById('stop-recording').addEventListener('click', () => {
      this.stopVoiceRecording();
    });

    document.getElementById('re-record-btn').addEventListener('click', () => {
      this.resetVoiceRecording();
    });

    document.getElementById('next-confirm-btn').addEventListener('click', () => {
      this.orderData.textInstruction = document.getElementById('text-instruction').value;
      this.showPage('review');
    });
  }

  async handleLandmarkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    this.landmarkBlob = file;

    // Preview image
    const preview = document.getElementById('landmark-preview');
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    preview.innerHTML = '';
    preview.appendChild(img);
    preview.classList.remove('hidden');
  }

  async startVoiceRecording() {
    const success = await voiceRecorder.startRecording();
    if (!success) return;

    document.getElementById('start-recording').classList.add('hidden');
    document.getElementById('stop-recording').classList.remove('hidden');
    document.getElementById('recording-time').classList.remove('hidden');

    // Update timer
    this.recordingInterval = setInterval(() => {
      const duration = voiceRecorder.getRecordingDuration();
      document.getElementById('timer').textContent = formatTime(duration);
    }, 100);
  }

  stopVoiceRecording() {
    clearInterval(this.recordingInterval);

    this.voiceBlob = voiceRecorder.stopRecording();
    voiceRecorder.clearRecording();

    document.getElementById('start-recording').classList.remove('hidden');
    document.getElementById('stop-recording').classList.add('hidden');
    document.getElementById('recording-time').classList.add('hidden');

    // Show playback
    const audio = voiceRecorder.createAudioElement(this.voiceBlob);
    const playback = document.getElementById('voice-playback');
    playback.innerHTML = '';
    playback.appendChild(audio);
    playback.innerHTML += '<button id="re-record-btn" class="btn btn-secondary">Re-record</button>';
    playback.classList.remove('hidden');

    // Re-attach event listener
    document.getElementById('re-record-btn').addEventListener('click', () => {
      this.resetVoiceRecording();
    });
  }

  resetVoiceRecording() {
    this.voiceBlob = null;
    document.getElementById('voice-playback').classList.add('hidden');
    document.getElementById('start-recording').classList.remove('hidden');
    document.getElementById('start-recording').click();
  }

  // ==================== REVIEW & CONFIRM ====================
  populateReview() {
    // Items
    const itemsList = document.getElementById('review-items');
    itemsList.innerHTML = '';
    let total = 0;

    this.orderData.items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} x${item.quantity} = ₹${item.price * item.quantity}`;
      itemsList.appendChild(li);
      total += item.price * item.quantity;
    });

    document.getElementById('review-total').textContent = `₹${total}`;

    // Location
    const locationDiv = document.getElementById('review-location');
    const details = this.orderData.deliveryDetails;
    locationDiv.innerHTML = `
      <p><strong>Building:</strong> ${details.apartmentName || '-'}</p>
      <p><strong>Flat #:</strong> ${details.flatNumber || '-'}</p>
      <p><strong>Colony:</strong> ${details.colonyName || '-'}</p>
      <p><strong>Door Color:</strong> ${details.flatColor || '-'}</p>
    `;

    // Guidance
    const guidanceDiv = document.getElementById('review-guidance');
    guidanceDiv.innerHTML = `
      <p><strong>Instructions:</strong></p>
      <p>${this.orderData.textInstruction || 'No text instruction'}</p>
      <p>${this.landmarkBlob ? 'Landmark image included' : ''}</p>
      <p>${this.voiceBlob ? 'Voice note included' : ''}</p>
    `;
  }

  async confirmAndPlaceOrder() {
    try {
      document.getElementById('confirm-order-btn').disabled = true;

      // Show processing
      this.showPage('processing');

      // Upload voice and landmark
      if (this.voiceBlob) {
        const voiceResult = await api.uploadVoice(this.voiceBlob);
        this.orderData.voiceNoteUrl = voiceResult.url;
      }

      if (this.landmarkBlob) {
        const landmarkResult = await api.uploadLandmark(this.landmarkBlob);
        this.orderData.landmarkImageUrl = landmarkResult.url;
      }

      // Create order
      const result = await api.createOrder(this.orderData);
      this.currentOrderId = result.orderId;

      // Save order locally
      await db.save('orders', { ...result.order, id: this.currentOrderId });

      // Show waiting page
      this.showPage('waiting');
      document.getElementById('order-id-display').textContent = `Order #${this.currentOrderId.substring(0, 8).toUpperCase()}`;

      // Simulate delivery executive assignment
      setTimeout(() => {
        this.simulateDeliveryAssignment();
      }, 2000);
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again.');
      document.getElementById('confirm-order-btn').disabled = false;
    }
  }

  async simulateDeliveryAssignment() {
    // Simulate finding a delivery executive
    try {
      // In production, backend would find available executives
      const deliveryExecutivePhone = '+919876543210'; // Simulated
      const deliveryExecutiveId = 'exec-' + Math.random().toString(36).substr(2, 9);

      const result = await api.assignDeliveryExecutive(
        this.currentOrderId,
        deliveryExecutivePhone,
        deliveryExecutiveId
      );

      console.log('Delivery assigned, SMS sent with Find Me link:', result.findMeLink);

      // Store delivery executive info
      this.currentDeliveryExecutiveId = deliveryExecutiveId;
      this.currentDeliveryExecutivePhone = deliveryExecutivePhone;

      // Listen for tracking
      if (this.socket) {
        this.socket.emit('track-delivery', this.currentOrderId);
      }

      // Show tracking page
      setTimeout(() => {
        this.showPage('tracking');
      }, 3000);
    } catch (err) {
      console.error('Error assigning delivery executive:', err);
      alert('Failed to assign delivery executive');
    }
  }

  // ==================== TRACKING ====================
  startTracking() {
    document.getElementById('delivery-phone').textContent = this.currentDeliveryExecutivePhone || 'Contacting...';

    // Simulate delivery executive location updates
    this.simulateDeliveryTracking();
  }

  simulateDeliveryTracking() {
    if (!this.currentPage === 'tracking') return;

    setTimeout(() => {
      // Simulate location updates every 3 seconds
      const trackingMap = L.map('tracking-map').setView([28.6139, 77.2090], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(trackingMap);

      const customerLocation = [this.orderData.mapPin.latitude || 28.6139, this.orderData.mapPin.longitude || 77.2090];
      L.marker(customerLocation, { title: 'Your Location' }).addTo(trackingMap);

      let execLat = customerLocation[0] + 0.01;
      let execLng = customerLocation[1] + 0.01;
      let execMarker = L.marker([execLat, execLng], {
        icon: L.icon({
          iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="30" height="40"><path fill="%23FF6B6B" d="M15 0C9 0 4 5 4 12c0 8 11 28 11 28s11-20 11-28c0-7-5-12-11-12z"/></svg>',
          iconSize: [30, 40]
        })
      }).addTo(trackingMap);

      // Animate marker towards customer
      const interval = setInterval(() => {
        if (!this.currentPage === 'tracking') {
          clearInterval(interval);
          return;
        }

        execLat += (customerLocation[0] - execLat) * 0.1;
        execLng += (customerLocation[1] - execLng) * 0.1;

        execMarker.setLatLng([execLat, execLng]);

        const distance = Math.sqrt(
          Math.pow(customerLocation[0] - execLat, 2) +
          Math.pow(customerLocation[1] - execLng, 2)
        );

        if (distance < 0.001) {
          clearInterval(interval);
          this.showDeliveryArrivalOptions();
        }
      }, 1000);
    }, 500);
  }

  showDeliveryArrivalOptions() {
    const status = document.getElementById('tracking-status');
    status.textContent = 'Delivery partner has arrived!';
    status.style.color = '#2ECE6B';
  }

  updateDeliveryLocation(data) {
    if (data.orderId !== this.currentOrderId) return;

    // Update marker position on map
    if (this.deliveryMarkers[data.deliveryExecutiveId]) {
      this.deliveryMarkers[data.deliveryExecutiveId].setLatLng([data.latitude, data.longitude]);
    }
  }

  // ==================== FIND ME PAGE (Delivery Executive) ====================
  async initializeFindMe() {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = window.location.pathname.split('/').pop();

    if (!token) {
      alert('Invalid Find Me link');
      return;
    }

    try {
      const order = await api.getOrderByToken(token);

      // Display instruction
      document.getElementById('findme-instruction').textContent = order.textInstruction || 'Follow the voice note for directions';

      // Display landmark image
      if (order.landmarkImageUrl) {
        const img = document.createElement('img');
        img.src = order.landmarkImageUrl;
        document.getElementById('findme-landmark').appendChild(img);
      }

      // Play voice note
      if (order.voiceNoteUrl) {
        const audio = document.getElementById('findme-voice');
        audio.src = order.voiceNoteUrl;
      }

      // Initialize map
      const findmeMap = L.map('findme-map').setView(
        [order.mapPin.latitude, order.mapPin.longitude],
        16
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(findmeMap);

      L.marker([order.mapPin.latitude, order.mapPin.longitude], {
        title: 'Delivery Location'
      }).addTo(findmeMap);

      // Setup Near Me button
      document.getElementById('findme-near-btn').addEventListener('click', async () => {
        try {
          await api.sendNearMeNotification(order.orderId, 'exec-' + Math.random());
          alert('Customer has been notified!');
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      });

      // Setup Wrong Door button
      document.getElementById('findme-wrong-btn').addEventListener('click', async () => {
        try {
          await api.sendWrongDoorNotification(order.orderId, 'exec-' + Math.random());
          alert('Customer has been notified about the wrong location');
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      });

      this.currentOrderId = order.orderId;
    } catch (err) {
      console.error('Error loading Find Me page:', err);
      alert('Failed to load delivery location');
    }
  }

  // ==================== RATING ====================
  setupRatingPage() {
    let selectedRating = 0;

    document.querySelectorAll('.rating-stars .star').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.rating);

        // Update UI
        document.querySelectorAll('.rating-stars .star').forEach((b, i) => {
          if (i < selectedRating) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });

        const ratingTexts = ['Poor', 'Not Good', 'OK', 'Good', 'Excellent'];
        document.getElementById('rating-text').textContent = ratingTexts[selectedRating - 1];
        document.getElementById('rating-text').classList.remove('hidden');

        document.getElementById('submit-rating-btn').disabled = false;
      });
    });

    document.getElementById('submit-rating-btn').addEventListener('click', async () => {
      const feedback = document.getElementById('feedback-text').value;

      try {
        await api.submitRating(this.currentOrderId, selectedRating, feedback);
        this.showPage('completion');
      } catch (err) {
        console.error('Error submitting rating:', err);
        alert('Failed to submit rating');
      }
    });
  }

  // ==================== UTILITIES ====================
  async saveDraft() {
    await db.save('drafts', { id: 'current', ...this.orderData });
  }

  showNotification(message) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2ECE6B;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9000;
      animation: slideInFromRight 0.3s ease-out;
    `;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
      div.remove();
    }, 3000);
  }

  handlePageLoad() {
    // Order page events
    document.getElementById('proceed-btn').addEventListener('click', () => {
      this.setupDeliveryDetailsForm();
      this.showPage('delivery-details');
    });

    // Delivery details form setup
    this.setupDeliveryDetailsForm();

    // Map page events
    document.getElementById('get-current-location').addEventListener('click', () => {
      mapManager.getCurrentLocation();
    });

    document.getElementById('next-voice-btn').addEventListener('click', () => {
      const location = mapManager.getSelectedLocation();
      if (!location.latitude || !location.longitude) {
        alert('Please select a location on the map');
        return;
      }
      this.orderData.mapPin = location;
      this.showPage('voice');
    });

    // Voice page events
    this.setupVoiceRecording();

    // Review page events
    document.getElementById('confirm-order-btn').addEventListener('click', () => {
      this.confirmAndPlaceOrder();
    });

    document.getElementById('back-btn').addEventListener('click', () => {
      this.showPage('voice');
    });

    // Rating page events
    this.setupRatingPage();

    // Completion page events
    document.getElementById('new-order-btn').addEventListener('click', () => {
      this.cart = [];
      this.orderData = {
        items: [],
        customerPhone: '',
        customerName: '',
        deliveryDetails: {},
        mapPin: {},
        voiceNoteUrl: '',
        landmarkImageUrl: '',
        textInstruction: ''
      };
      this.currentOrderId = null;
      this.voiceBlob = null;
      this.landmarkBlob = null;
      this.saveCart();
      this.showPage('order');
    });

    // Handle Find Me page if URL contains token
    if (window.location.pathname.includes('/find-me/')) {
      this.showPage('findme');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DoorPilotApp();
});
