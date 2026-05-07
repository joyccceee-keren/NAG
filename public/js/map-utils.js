// ==================== Map Utilities ====================
class MapManager {
  constructor() {
    this.map = null;
    this.marker = null;
    this.selectedLatitude = null;
    this.selectedLongitude = null;
  }

  initMap(containerId, onMarkerMove = null) {
    // Default location (urban area center)
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;

    this.map = L.map(containerId).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true
    }).addTo(this.map);

    // Add marker on click
    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.setMarker(lat, lng);
      if (onMarkerMove) onMarkerMove(lat, lng);
    });

    // Add current location button
    this.addCurrentLocationButton();
  }

  setMarker(lat, lng) {
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.selectedLatitude = lat;
    this.selectedLongitude = lng;

    this.marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="30" height="40"><path fill="%230A2647" d="M15 0C9 0 4 5 4 12c0 8 11 28 11 28s11-20 11-28c0-7-5-12-11-12z"/><circle cx="15" cy="12" r="4" fill="white"/></svg>',
        iconSize: [30, 40],
        iconAnchor: [15, 40]
      })
    }).addTo(this.map);

    this.map.setView([lat, lng], 16);
  }

  getSelectedLocation() {
    return {
      latitude: this.selectedLatitude,
      longitude: this.selectedLongitude
    };
  }

  addCurrentLocationButton() {
    const button = L.control({ position: 'topright' });

    button.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-control-custom');
      div.innerHTML = 'PIN';
      div.style.backgroundColor = '#0A2647';
      div.style.color = 'white';
      div.style.border = 'none';
      div.style.borderRadius = '4px';
      div.style.cursor = 'pointer';
      div.style.fontSize = '20px';
      div.style.width = '40px';
      div.style.height = '40px';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

      div.onclick = () => this.getCurrentLocation();
      return div;
    };

    button.addTo(this.map);
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.setMarker(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get current location');
        }
      );
    } else {
      alert('Geolocation is not supported');
    }
  }

  addDeliveryMarker(lat, lng) {
    const deliveryMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="30" height="40"><path fill="%23FF6B6B" d="M15 0C9 0 4 5 4 12c0 8 11 28 11 28s11-20 11-28c0-7-5-12-11-12z"/><circle cx="15" cy="12" r="4" fill="white"/></svg>',
        iconSize: [30, 40],
        iconAnchor: [15, 40]
      })
    }).addTo(this.map);

    return deliveryMarker;
  }

  animateMarkerPulse(marker) {
    if (!marker) return;
    let originalScale = 1;
    let scale = 1;
    let direction = 1;
    const interval = setInterval(() => {
      scale += direction * 0.1;
      if (scale >= 1.3) direction = -1;
      if (scale <= 0.9) direction = 1;

      marker._icon.style.transform = `scale(${scale})`;
    }, 100);

    return interval;
  }

  clearMap() {
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

// Create global map manager instance
const mapManager = new MapManager();
