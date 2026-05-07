// ==================== Map Utilities ====================
class MapManager {
  constructor() {
    this.map = null;
    this.marker = null;
    this.accuracyCircle = null;
    this.selectedLatitude = null;
    this.selectedLongitude = null;
    this._watchId = null;
  }

  // ── Init map and immediately jump to real GPS location ──────────────────
  initMap(containerId, onMarkerMove = null) {
    // Destroy any previous instance first
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Start with a world view; we'll fly to real location right away
    this.map = L.map(containerId, { zoomControl: true }).setView([20.5937, 78.9629], 5);

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // CRITICAL: force Leaflet to recalculate size after the container is visible
    setTimeout(() => {
      this.map.invalidateSize();
      // Auto-locate on open
      this.getCurrentLocation(onMarkerMove);
    }, 200);

    // Tap on map to pin location
    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.setMarker(lat, lng);
      if (onMarkerMove) onMarkerMove(lat, lng);
    });

    // Add GPS button to map
    this._addGPSControl(onMarkerMove);
  }

  // ── Place / move the pin marker ─────────────────────────────────────────
  setMarker(lat, lng, label = '') {
    if (this.marker) this.map.removeLayer(this.marker);
    if (this.accuracyCircle) this.map.removeLayer(this.accuracyCircle);

    this.selectedLatitude  = lat;
    this.selectedLongitude = lng;

    this.marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:44px;
          background:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 36 44%22><path fill=%22%23FFB800%22 stroke=%22%23c47f00%22 stroke-width=%221.5%22 d=%22M18 0C10 0 4 6 4 14c0 10 14 30 14 30s14-20 14-30C32 6 26 0 18 0z%22/><circle cx=%2218%22 cy=%2214%22 r=%226%22 fill=%22white%22/></svg>') no-repeat center/contain;
        "></div>`,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44]
      })
    }).addTo(this.map);

    if (label) this.marker.bindPopup(label).openPopup();

    this.map.flyTo([lat, lng], 17, { animate: true, duration: 1 });
  }

  // ── Get real GPS location, pin it, and fly there ────────────────────────
  getCurrentLocation(onMarkerMove = null) {
    if (!navigator.geolocation) {
      this._showToast('Geolocation not supported by your browser');
      return;
    }

    this._showToast('📍 Getting your location…', 2000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        this.setMarker(latitude, longitude, 'You are here');

        // Show accuracy circle
        if (this.accuracyCircle) this.map.removeLayer(this.accuracyCircle);
        this.accuracyCircle = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#FFB800',
          fillColor: '#FFD440',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(this.map);

        if (onMarkerMove) onMarkerMove(latitude, longitude);

        // Reverse geocode to show address
        this._reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error('Geolocation error:', err);
        const msgs = {
          1: 'Location permission denied. Please allow location access.',
          2: 'Location unavailable. Try again.',
          3: 'Location request timed out.'
        };
        this._showToast(msgs[err.code] || 'Could not get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // ── Reverse geocode lat/lng → address string ────────────────────────────
  async _reverseGeocode(lat, lng) {
    try {
      const res  = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && this.marker) {
        this.marker.bindPopup(`<b>📍 Your location</b><br>${data.address}`).openPopup();
      }
    } catch (_) { /* silent */ }
  }

  // ── GPS button inside the map ────────────────────────────────────────────
  _addGPSControl(onMarkerMove) {
    const ctrl = L.control({ position: 'bottomright' });
    ctrl.onAdd = () => {
      const btn = L.DomUtil.create('button', '');
      btn.title = 'Use my location';
      btn.style.cssText = `
        width:44px;height:44px;border:none;border-radius:50%;
        background:#FFB800;color:#1e1e1e;font-size:20px;
        cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
      `;
      btn.innerHTML = '📍';
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.getCurrentLocation(onMarkerMove);
      });
      return btn;
    };
    ctrl.addTo(this.map);
  }

  // ── Open Google Maps / Apple Maps navigation to a lat/lng ───────────────
  openNavigation(lat, lng, label = 'Delivery Location') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let url;
    if (isIOS) {
      // Apple Maps with directions
      url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    } else if (isAndroid) {
      // Google Maps navigation intent
      url = `google.navigation:q=${lat},${lng}`;
    } else {
      // Desktop: open Google Maps in browser
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }

    window.open(url, '_blank');
  }

  // ── Open navigation to current selected pin ──────────────────────────────
  navigateToPin() {
    if (!this.selectedLatitude || !this.selectedLongitude) {
      this._showToast('No location pinned yet');
      return;
    }
    this.openNavigation(this.selectedLatitude, this.selectedLongitude);
  }

  getSelectedLocation() {
    return {
      latitude:  this.selectedLatitude,
      longitude: this.selectedLongitude
    };
  }

  // ── Toast helper ─────────────────────────────────────────────────────────
  _showToast(msg, duration = 3000) {
    const existing = document.getElementById('map-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'map-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:rgba(30,30,30,0.88);color:#fff;padding:10px 20px;
      border-radius:24px;font-size:14px;z-index:9999;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
      animation:fadeIn 0.2s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  addDeliveryMarker(lat, lng) {
    return L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:40px;
          background:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 40%22><path fill=%22%23e53935%22 d=%22M16 0C9 0 3 6 3 13c0 9 13 27 13 27s13-18 13-27C29 6 23 0 16 0z%22/><circle cx=%2216%22 cy=%2213%22 r=%225%22 fill=%22white%22/></svg>') no-repeat center/contain;
        "></div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40]
      })
    }).addTo(this.map);
  }

  clearMap() {
    if (this.marker)        { this.map.removeLayer(this.marker);        this.marker = null; }
    if (this.accuracyCircle){ this.map.removeLayer(this.accuracyCircle); this.accuracyCircle = null; }
  }

  destroy() {
    if (this._watchId) navigator.geolocation.clearWatch(this._watchId);
    if (this.map) { this.map.remove(); this.map = null; }
  }
}

// Global instance
const mapManager = new MapManager();
