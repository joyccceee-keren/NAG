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
        // Destroy old map instance if any, then re-init after container is visible
        mapManager.destroy();
        setTimeout(() => {
          mapManager.initMap('map', (lat, lng) => {
            this.orderData.mapPin = { latitude: lat, longitude: lng };
          });
        }, 150);
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
      this.fullCatalog = items;
    } catch (err) {
      console.warn('API items load failed, using local sample catalog:', err);
      this.fullCatalog = {
        "🥬 Groceries": [
          { id: 'tomato-01',    name: 'Fresh Tomatoes',   price: 30,  img: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?w=400' },
          { id: 'potato-01',   name: 'Potatoes 1kg',      price: 40,  img: 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?w=400' },
          { id: 'onion-01',    name: 'Onions 1kg',        price: 35,  img: 'https://images.pexels.com/photos/175414/pexels-photo-175414.jpeg?w=400' },
          { id: 'carrot-01',   name: 'Carrots 500g',      price: 30,  img: 'https://images.pexels.com/photos/1306559/pexels-photo-1306559.jpeg?w=400' },
          { id: 'capsicum-01', name: 'Capsicum 3pcs',     price: 45,  img: 'https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?w=400' },
          { id: 'spinach-01',  name: 'Fresh Spinach',     price: 25,  img: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?w=400' },
          { id: 'milk-01',     name: 'Fresh Milk 500ml',  price: 30,  img: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?w=400' },
          { id: 'bread-01',    name: 'Whole Wheat 1kg',   price: 45,  img: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?w=400' },
          { id: 'eggs-01',     name: 'Farm Eggs 6pcs',    price: 60,  img: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?w=400' }
        ],
        "🍔 Food": [
          { id: 'burger-01',   name: 'Veg Burger',        price: 120, img: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?w=400' },
          { id: 'pizza-01',    name: 'Margherita Pizza',  price: 199, img: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?w=400' },
          { id: 'biryani-01',  name: 'Veg Biryani',      price: 150, img: 'https://images.pexels.com/photos/7426873/pexels-photo-7426873.jpeg?w=400' },
          { id: 'dosa-01',     name: 'Masala Dosa',      price: 90,  img: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?w=400' },
          { id: 'sandwich-01', name: 'Grilled Sandwich',  price: 80,  img: 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?w=400' }
        ],
        "🍿 Snacks": [
          { id: 'chips-01',    name: "Lay's Chips",       price: 25,  img: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?w=400' },
          { id: 'popcorn-01',  name: 'Butter Popcorn',   price: 45,  img: 'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?w=400' },
          { id: 'nachos-01',   name: 'Nachos & Salsa',   price: 55,  img: 'https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?w=400' },
          { id: 'biscuit-01',  name: 'Marie Biscuits',   price: 20,  img: 'https://images.pexels.com/photos/890515/pexels-photo-890515.jpeg?w=400' },
          { id: 'pringles-01', name: 'Pringles Original',price: 99,  img: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?w=400' }
        ],
        "🍪 Cookies": [
          { id: 'chocochip-01',     name: 'Choc Chunk Cookies', price: 60,  img: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?w=400' },
          { id: 'oreo-01',          name: 'Oreo Sandwich',      price: 40,  img: 'https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?w=400' },
          { id: 'butter-cookie-01', name: 'Butter Cookies',     price: 120, img: 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg?w=400' },
          { id: 'digestive-01',     name: 'Digestive Biscuit',  price: 55,  img: 'https://images.pexels.com/photos/890515/pexels-photo-890515.jpeg?w=400' },
          { id: 'goodday-01',       name: 'Good Day Cashew',    price: 30,  img: 'https://images.pexels.com/photos/1028714/pexels-photo-1028714.jpeg?w=400' }
        ],
        "🥤 Beverages": [
          { id: 'cola-01',   name: 'Coca Cola 300ml',    price: 40,  img: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?w=400' },
          { id: 'water-01',  name: 'Bisleri Water 1L',   price: 20,  img: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?w=400' },
          { id: 'soda-01',   name: 'Faurito Soda',       price: 30,  img: 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?w=400' },
          { id: 'juice-01',  name: 'Orange Juice',       price: 35,  img: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?w=400' },
          { id: 'coffee-01', name: 'Sleepy Owl Coffee',  price: 299, img: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400' },
          { id: 'lassi-01',  name: 'Sweet Lassi',        price: 50,  img: 'https://images.pexels.com/photos/3625372/pexels-photo-3625372.jpeg?w=400' }
        ],
        "💊 Medicines": [
          { id: 'paracetamol-01', name: 'Paracetamol 650mg',    price: 25,  img: 'https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg?w=400' },
          { id: 'bandaid-01',     name: 'Band-Aid Flex',        price: 35,  img: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?w=400' },
          { id: 'cough-01',       name: 'Cough Syrup',          price: 85,  img: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?w=400' },
          { id: 'sanitizer-01',   name: 'Hand Sanitizer',       price: 60,  img: 'https://images.pexels.com/photos/3873193/pexels-photo-3873193.jpeg?w=400' },
          { id: 'vitaminc-01',    name: 'Vitamin C 500mg',      price: 50,  img: 'https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg?w=400' }
        ],
        "📄 Documents": [
          { id: 'print-01',    name: 'A4 Printing',      price: 5,   img: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?w=400' },
          { id: 'envelope-01', name: 'Courier Envelope', price: 15,  img: 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?w=400' },
          { id: 'stamp-01',    name: 'Postage Stamp',    price: 10,  img: 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?w=400' },
          { id: 'folder-01',   name: 'Document Folder',  price: 30,  img: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?w=400' },
          { id: 'pen-01',      name: 'Ball Pen Pack',    price: 20,  img: 'https://images.pexels.com/photos/159751/book-address-book-learning-learn-159751.jpeg?w=400' }
        ]
      };
    }

    this.selectedCategory = 'all';
    this.setupCategoryFilter();
    this.renderCatalog();
  }

  setupCategoryFilter() {
    document.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCategory = btn.dataset.category;
        this.renderCatalog();
      });
    });
  }

  renderCatalog() {
    const grid = document.getElementById('items-grid');
    grid.innerHTML = '';

    const catalog = this.fullCatalog;
    const selected = this.selectedCategory;

    const categoriesToShow = selected === 'all'
      ? Object.keys(catalog)
      : Object.keys(catalog).filter(k => k === selected);

    if (categoriesToShow.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">No items found</p>';
      return;
    }

    categoriesToShow.forEach(category => {
      const section = document.createElement('div');
      section.className = 'catalog-section';

      section.innerHTML = `<h2 class="cat-title">${category}</h2>`;

      const row = document.createElement('div');
      row.className = 'product-grid';

      catalog[category].forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-img">
            <img src="${item.img}" alt="${item.name}" onerror="this.onerror=null;this.src='https://placehold.co/200x140/f5f5f5/FFB800?text=${encodeURIComponent(item.name)}'">
          </div>
          <div class="product-info">
            <div class="product-name">${item.name}</div>
            <div class="product-meta">20-30 mins</div>
            <div class="product-footer">
              <span class="product-price">₹${item.price}</span>
              <div class="qty-control hidden" id="qty-ctrl-${item.id}">
                <button class="qty-btn qty-minus" aria-label="Remove one ${item.name}">−</button>
                <span class="qty-num" id="qty-num-${item.id}">0</span>
                <button class="qty-btn qty-plus" aria-label="Add one ${item.name}">+</button>
              </div>
              <button class="product-add-btn" id="add-btn-${item.id}" aria-label="Add ${item.name} to cart">ADD</button>
            </div>
          </div>
        `;

        // ADD button — show qty controls
        card.querySelector('.product-add-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this.addToCart(item);
          document.getElementById(`add-btn-${item.id}`).classList.add('hidden');
          document.getElementById(`qty-ctrl-${item.id}`).classList.remove('hidden');
          document.getElementById(`qty-num-${item.id}`).textContent = this.getItemQty(item.id);
        });

        // + button
        card.querySelector('.qty-plus').addEventListener('click', (e) => {
          e.stopPropagation();
          this.addToCart(item);
          document.getElementById(`qty-num-${item.id}`).textContent = this.getItemQty(item.id);
        });

        // - button
        card.querySelector('.qty-minus').addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeFromCart(item.id);
          const qty = this.getItemQty(item.id);
          document.getElementById(`qty-num-${item.id}`).textContent = qty;
          if (qty === 0) {
            document.getElementById(`add-btn-${item.id}`).classList.remove('hidden');
            document.getElementById(`qty-ctrl-${item.id}`).classList.add('hidden');
          }
        });

        // Restore qty state if item already in cart
        const existingQty = this.getItemQty(item.id);
        if (existingQty > 0) {
          card.querySelector(`#add-btn-${item.id}`).classList.add('hidden');
          card.querySelector(`#qty-ctrl-${item.id}`).classList.remove('hidden');
          card.querySelector(`#qty-num-${item.id}`).textContent = existingQty;
        }
        row.appendChild(card);
      });

      section.appendChild(row);
      grid.appendChild(section);
    });
  }

  renderItems(catalogItems) {
    this.fullCatalog = catalogItems;
    this.selectedCategory = 'all';
    this.setupCategoryFilter();
    this.renderCatalog();
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

  removeFromCart(itemId) {
    const existing = this.cart.find(i => i.id === itemId);
    if (!existing) return;

    if (existing.quantity > 1) {
      existing.quantity -= 1;
    } else {
      this.cart = this.cart.filter(i => i.id !== itemId);
    }

    this.updateCartUI();
    this.saveCart();
  }

  getItemQty(itemId) {
    const item = this.cart.find(i => i.id === itemId);
    return item ? item.quantity : 0;
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

    // Update header cart count if present
    const headerCount = document.getElementById('header-cart-count');
    if (headerCount) headerCount.textContent = count;

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
    const btn = document.getElementById('next-location-btn');
    if (!btn || btn._bound) return;
    btn._bound = true;

    btn.addEventListener('click', () => {
      // Safe value helper
      const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
      const chk = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

      // Manual required field check
      const required = [
        { id: 'apartment-name', label: 'Apartment/Building name' },
        { id: 'colony-name',    label: 'Colony/Society name' },
        { id: 'flat-number',    label: 'Flat/Unit number' },
        { id: 'customer-name',  label: 'Your full name' },
        { id: 'customer-phone', label: 'Phone number' }
      ];

      for (const f of required) {
        if (!val(f.id)) {
          const el = document.getElementById(f.id);
          if (el) { el.focus(); el.style.borderColor = '#dc2626'; }
          this._showFieldError(f.id, `${f.label} is required`);
          return;
        }
        // Reset border
        const el = document.getElementById(f.id);
        if (el) el.style.borderColor = '';
      }

      this.orderData.deliveryDetails = {
        apartmentName:      val('apartment-name'),
        colonyName:         val('colony-name'),
        flatNumber:         val('flat-number'),
        flatColor:          val('flat-color'),
        gateNumber:         val('gate-number'),
        staircaseColor:     val('staircase-color'),
        hasLift:            chk('has-lift'),
        isLeftSide:         chk('is-left-side'),
        floorNumber:        val('floor-number'),
        intercomCode:       val('intercom-code'),
        specialIdentifiers: val('special-identifiers')
      };

      this.orderData.customerName  = val('customer-name');
      this.orderData.customerPhone = val('customer-phone');

      this.saveDraft();
      this.showPage('map');
    });
  }

  _showFieldError(id, msg) {
    const existing = document.getElementById('field-error-' + id);
    if (existing) existing.remove();
    const el = document.getElementById(id);
    if (!el) return;
    const err = document.createElement('div');
    err.id = 'field-error-' + id;
    err.style.cssText = 'color:#dc2626;font-size:12px;margin:-8px 0 8px 4px;';
    err.textContent = '⚠ ' + msg;
    el.insertAdjacentElement('afterend', err);
    setTimeout(() => err.remove(), 3000);
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

    // stopRecording() now returns a Promise<Blob>
    voiceRecorder.stopRecording().then((blob) => {
      if (!blob) return;
      this.voiceBlob = blob;

      document.getElementById('start-recording').classList.remove('hidden');
      document.getElementById('stop-recording').classList.add('hidden');
      document.getElementById('recording-time').classList.add('hidden');

      // Show playback
      const playback = document.getElementById('voice-playback');
      playback.innerHTML = '';
      const audio = voiceRecorder.createAudioElement(blob);
      if (audio) playback.appendChild(audio);
      const reRecordBtn = document.createElement('button');
      reRecordBtn.id = 're-record-btn';
      reRecordBtn.className = 'btn btn-secondary';
      reRecordBtn.textContent = 'Re-record';
      reRecordBtn.addEventListener('click', () => this.resetVoiceRecording());
      playback.appendChild(reRecordBtn);
      playback.classList.remove('hidden');
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
      this.showPage('processing');
      document.getElementById('processing-status').textContent = 'Uploading files…';

      // Upload voice note
      if (this.voiceBlob) {
        try {
          const voiceResult = await api.uploadVoice(this.voiceBlob);
          this.orderData.voiceNoteUrl = voiceResult.url;
          console.log('✅ Voice uploaded:', voiceResult.url);
        } catch (e) {
          console.warn('Voice upload failed (non-fatal):', e.message);
        }
      }

      // Upload landmark image
      if (this.landmarkBlob) {
        try {
          const landmarkResult = await api.uploadLandmark(this.landmarkBlob);
          this.orderData.landmarkImageUrl = landmarkResult.url;
          console.log('✅ Landmark uploaded:', landmarkResult.url);
        } catch (e) {
          console.warn('Landmark upload failed (non-fatal):', e.message);
        }
      }

      document.getElementById('processing-status').textContent = 'Creating order…';

      // Create order in database
      const result = await api.createOrder(this.orderData);
      this.currentOrderId = result.orderId;
      console.log('✅ Order created:', this.currentOrderId);

      // Save locally
      await db.save('orders', { ...result.order, id: this.currentOrderId });

      // Show waiting page
      this.showPage('waiting');
      document.getElementById('order-id-display').textContent =
        `Order #${this.currentOrderId.substring(0, 8).toUpperCase()}`;

      // Assign delivery executive after 1s
      setTimeout(() => this.assignDelivery(), 1000);

    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order: ' + err.message);
      document.getElementById('confirm-order-btn').disabled = false;
      this.showPage('review');
    }
  }

  async assignDelivery() {
    // Ask for delivery executive phone
    const input = prompt(
      '📱 Enter delivery executive phone number\n(with country code, e.g. +919876543210)\n\nLeave blank to use simulated SMS (check server console for the link):',
      '+91'
    );

    if (input === null) {
      // User cancelled — still assign with dummy phone so link is generated
    }

    const phone = (input || '').trim() || '+919999999999';
    const execId = 'exec-' + Math.random().toString(36).substring(2, 9);

    try {
      const result = await api.assignDeliveryExecutive(
        this.currentOrderId, phone, execId
      );

      this.currentDeliveryExecutiveId    = execId;
      this.currentDeliveryExecutivePhone = phone;

      console.log('✅ Find Me link:', result.findMeLink);

      // Show the Find Me link on the waiting page so you can copy/test it
      const waitingContainer = document.querySelector('.waiting-container');
      if (waitingContainer && result.findMeLink) {
        const linkBox = document.createElement('div');
        linkBox.style.cssText = `
          margin:16px 0;padding:12px 16px;
          background:#fff8e1;border:1px solid #FFB800;border-radius:12px;
          font-size:13px;word-break:break-all;text-align:left;
        `;
        linkBox.innerHTML = `
          <div style="font-weight:700;color:#c47f00;margin-bottom:6px;">🔗 Find Me Link (sent via SMS)</div>
          <a href="${result.findMeLink}" target="_blank" style="color:#0A2647;">${result.findMeLink}</a>
          <button onclick="navigator.clipboard.writeText('${result.findMeLink}').then(()=>alert('Copied!'))"
            style="display:block;margin-top:8px;padding:6px 14px;background:#FFB800;border:none;border-radius:20px;font-weight:700;cursor:pointer;font-size:12px;">
            📋 Copy Link
          </button>
        `;
        waitingContainer.appendChild(linkBox);
      }

      this.showNotification(`📱 SMS sent to ${phone}`);

      if (this.socket) {
        this.socket.emit('track-delivery', this.currentOrderId);
      }

    } catch (err) {
      console.error('Assignment error:', err);
      this.showNotification('⚠️ Could not assign delivery: ' + err.message);
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
    // ── Header 📍 button — show live location in a modal map ──────────────
    document.getElementById('location-btn').addEventListener('click', () => {
      this._openLocationModal();
    });

    // Order page events
    document.getElementById('proceed-btn').addEventListener('click', () => {
      this.showPage('delivery-details');
      this.setupDeliveryDetailsForm();
    });

    // Delivery details form — also set up now in case page is already visible
    this.setupDeliveryDetailsForm();

    // Map page events
    document.getElementById('get-current-location').addEventListener('click', () => {
      mapManager.getCurrentLocation((lat, lng) => {
        this.orderData.mapPin = { latitude: lat, longitude: lng };
      });
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

    // Clear cart button
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
      this.cart = [];
      this.orderData.items = [];
      // Delete entire IndexedDB to fully wipe cart
      indexedDB.deleteDatabase('DoorPilot');
      document.getElementById('cart-count').textContent = '0';
      document.getElementById('cart-total').textContent = '₹0';
      document.getElementById('header-cart-count').textContent = '0';
      document.getElementById('proceed-btn').disabled = true;
      this.renderCatalog();
    });

    // Handle Find Me page if URL contains token
    if (window.location.pathname.includes('/find-me/')) {
      this.showPage('findme');
    }
  }
  // ==================== LOCATION MODAL ====================
  _openLocationModal() {
    const existing = document.getElementById('location-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'location-modal';
    modal.style.cssText = `
      position:fixed;inset:0;z-index:10000;
      background:rgba(10,22,40,0.7);
      display:flex;align-items:flex-end;justify-content:center;
    `;

    modal.innerHTML = `
      <div id="loc-sheet" style="
        width:100%;max-width:600px;
        background:#fff;border-radius:24px 24px 0 0;
        overflow:hidden;
        box-shadow:0 -8px 40px rgba(0,0,0,0.3);
        transform:translateY(100%);
        transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
      ">
        <!-- Header -->
        <div style="background:#FFB800;padding:14px 18px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">📍</span>
          <span style="font-weight:700;font-size:16px;flex:1;">Your Exact Location</span>
          <button id="close-loc-modal" style="background:rgba(0,0,0,0.12);border:none;border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <!-- Map -->
        <div style="position:relative;">
          <div id="loc-modal-map" style="height:280px;width:100%;background:#e8e0d8;"></div>
          <!-- Loading overlay -->
          <div id="loc-map-loading" style="
            position:absolute;inset:0;background:rgba(255,248,225,0.92);
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
            font-size:14px;color:#555;
          ">
            <div style="width:36px;height:36px;border:3px solid #FFB800;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            <span>Getting your exact location…</span>
            <span style="font-size:12px;color:#888;">Allow location access if prompted</span>
          </div>
          <!-- Recenter button -->
          <button id="loc-recenter" style="
            position:absolute;bottom:12px;right:12px;
            width:40px;height:40px;border:none;border-radius:50%;
            background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);
            font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;
          ">🎯</button>
        </div>

        <!-- Address card -->
        <div style="padding:14px 18px 0;">
          <div id="loc-place-name" style="font-weight:700;font-size:15px;color:#1e1e1e;margin-bottom:4px;">Locating…</div>
          <div id="loc-modal-address" style="font-size:13px;color:#666;line-height:1.5;margin-bottom:12px;min-height:18px;"></div>
          <div id="loc-coords" style="font-size:11px;color:#aaa;margin-bottom:14px;font-family:monospace;"></div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:10px;padding:0 18px 20px;">
          <button id="loc-modal-navigate" style="
            flex:1;padding:13px 8px;border:none;border-radius:40px;
            background:#FFB800;color:#1e1e1e;font-weight:700;font-size:14px;cursor:pointer;
          ">🗺️ Navigate Here</button>
          <button id="loc-modal-share" style="
            flex:1;padding:13px 8px;border:none;border-radius:40px;
            background:#0A2647;color:#fff;font-weight:700;font-size:14px;cursor:pointer;
          ">🔗 Share Location</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Slide up
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('loc-sheet').style.transform = 'translateY(0)';
      });
    });

    const closeModal = () => {
      document.getElementById('loc-sheet').style.transform = 'translateY(100%)';
      setTimeout(() => modal.remove(), 350);
    };

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.getElementById('close-loc-modal').addEventListener('click', closeModal);

    let modalLat = null, modalLng = null, miniMap = null, myMarker = null, myCircle = null;

    // Init map immediately at a sensible default, then fly to GPS
    miniMap = L.map('loc-modal-map', { zoomControl: false, attributionControl: false, maxZoom: 20 })
               .setView([20.5937, 78.9629], 5);

    // Use OpenStreetMap standard — shows buildings, grass, paths at zoom 19+
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(miniMap);

    // Zoom controls top-right
    L.control.zoom({ position: 'topright' }).addTo(miniMap);

    setTimeout(() => miniMap.invalidateSize(), 100);

    // Recenter button
    document.getElementById('loc-recenter').addEventListener('click', () => {
      if (modalLat) miniMap.flyTo([modalLat, modalLng], 19, { animate: true, duration: 0.8 });
    });

    // GPS — try high accuracy first, fall back to network location
    if (!navigator.geolocation) {
      document.getElementById('loc-place-name').textContent = 'Geolocation not supported';
      document.getElementById('loc-map-loading').style.display = 'none';
      return;
    }

    const doLocate = (highAccuracy, attempt) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          modalLat = pos.coords.latitude;
          modalLng = pos.coords.longitude;
          const acc = pos.coords.accuracy;

          document.getElementById('loc-map-loading').style.display = 'none';
          document.getElementById('loc-coords').textContent =
            `${modalLat.toFixed(6)}, ${modalLng.toFixed(6)}  ±${Math.round(acc)}m` +
            (acc > 500 ? '  ⚠️ Low accuracy' : '');

          const youIcon = L.divIcon({
            className: '',
            html: `<div style="position:relative;width:22px;height:22px;">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(66,133,244,0.25);animation:markerPulse 2s infinite;"></div>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#4285F4;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(66,133,244,0.6);"></div>
            </div>`,
            iconSize: [22, 22], iconAnchor: [11, 11]
          });

          myMarker = L.marker([modalLat, modalLng], { icon: youIcon }).addTo(miniMap);
          myCircle = L.circle([modalLat, modalLng], {
            radius: acc, color: '#4285F4', fillColor: '#4285F4', fillOpacity: 0.08, weight: 1.5
          }).addTo(miniMap);
          miniMap.flyTo([modalLat, modalLng], 17, { animate: true, duration: 1.2 });

          document.getElementById('loc-place-name').textContent = 'Fetching address…';
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${modalLat}&lon=${modalLng}&format=json&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en', 'User-Agent': 'DoorPilot/1.0' } }
            );
            const geo = await res.json();
            if (geo && geo.display_name) {
              const addr = geo.address || {};
              const placeName = addr.amenity || addr.building || addr.college || addr.university ||
                addr.school || addr.hospital || addr.shop || addr.road || addr.neighbourhood || addr.suburb || 'Your Location';
              const shortAddr = [addr.road || addr.pedestrian, addr.neighbourhood || addr.suburb,
                addr.city || addr.town || addr.village, addr.state].filter(Boolean).join(', ');
              document.getElementById('loc-place-name').textContent = placeName;
              document.getElementById('loc-modal-address').textContent = shortAddr || geo.display_name;
              myMarker.bindPopup(`<b>${placeName}</b><br><small>${shortAddr}</small>`, { offset: [0,-12], closeButton: false }).openPopup();
            }
          } catch {
            try {
              const r2 = await fetch(`/api/reverse-geocode?lat=${modalLat}&lng=${modalLng}`);
              const d2 = await r2.json();
              if (d2.success) {
                document.getElementById('loc-place-name').textContent = 'Your Location';
                document.getElementById('loc-modal-address').textContent = d2.address;
              }
            } catch { /* silent */ }
          }
        },
        (err) => {
          if (highAccuracy && attempt === 1) {
            // Retry with network/WiFi location
            doLocate(false, 2);
            return;
          }
          document.getElementById('loc-map-loading').style.display = 'none';
          const msgs = {
            1: '❌ Location permission denied.\nClick the 🔒 icon in your address bar → Site settings → Location → Allow, then refresh.',
            2: '⚠️ Location unavailable. Try on a phone for accurate GPS.',
            3: '⏱️ Location timed out. Check browser location permissions.'
          };
          document.getElementById('loc-place-name').textContent = '⚠️ Location Error';
          document.getElementById('loc-modal-address').textContent = msgs[err.code] || 'Could not get location';
        },
        { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 8000 : 15000, maximumAge: 30000 }
      );
    };

    doLocate(true, 1);

    // Navigate button
    document.getElementById('loc-modal-navigate').addEventListener('click', () => {
      if (!modalLat) return;
      const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      let url;
      if (isIOS)          url = `maps://maps.apple.com/?ll=${modalLat},${modalLng}&q=My+Location`;
      else if (isAndroid) url = `geo:${modalLat},${modalLng}?q=${modalLat},${modalLng}(My+Location)`;
      else                url = `https://www.google.com/maps?q=${modalLat},${modalLng}`;
      window.open(url, '_blank');
    });

    // Share button
    document.getElementById('loc-modal-share').addEventListener('click', async () => {
      if (!modalLat) return;
      const shareUrl = `https://www.google.com/maps?q=${modalLat},${modalLng}`;
      const place    = document.getElementById('loc-place-name').textContent;
      const addr     = document.getElementById('loc-modal-address').textContent;

      if (navigator.share) {
        try {
          await navigator.share({ title: place, text: addr, url: shareUrl });
        } catch { /* cancelled */ }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          this.showNotification('📋 Location link copied!');
        } catch {
          this.showNotification(shareUrl);
        }
      }
    });
  }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DoorPilotApp();
});
