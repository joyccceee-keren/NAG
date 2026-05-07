# DoorPilot - Delivery Location Guide Platform

A modern web platform that enables customers to pre-generate precise delivery location guidance with voice notes, landmarks, and map pins. Delivery executives receive a one-time SMS link to access the complete guidance without requiring any app installation.

## Features

### For Customers
✅ **Simple Order Selection** - Browse and add items to cart (snacks, beverages, groceries, medicine)  
✅ **Detailed Location Guidance** - Provide apartment details, flat colors, gate numbers, unique identifiers  
✅ **Voice Instructions** - Record custom voice notes with directions  
✅ **Landmark Photos** - Upload images of nearby landmarks for visual reference  
✅ **Precise Map Pin** - Drop exact delivery location on map  
✅ **Real-time Tracking** - Watch delivery executive navigate in real-time  
✅ **Rating System** - Provide feedback after delivery  

### For Delivery Executives
✅ **Find Me Link** - One-time SMS link with no login required  
✅ **Voice Guidance** - Auto-play customer's voice instructions  
✅ **Visual Landmarks** - See landmark images uploaded by customer  
✅ **Precise Location** - Map with exact delivery pin  
✅ **Near Me Alert** - Notify customer when arriving  
✅ **Wrong Door Help** - Get re-guidance if at wrong location  

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start server
npm start

# Open browser to http://localhost:5000
```

## Architecture

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Real-time**: Socket.IO
- **Maps**: Leaflet + OpenStreetMap
- **Database**: IndexedDB (client) + JSON files (server MVP)
- **Storage**: Local files + cloud (configurable)

## Key APIs

- **Orders**: Create orders, track status, submit ratings
- **Delivery**: Location updates, notifications, guidance
- **Uploads**: Voice notes, landmark images
- **SMS**: Integration with Twilio/MessageBird

## Offline Support

- Progressive Web App (PWA) with Service Worker
- IndexedDB for local data storage
- Automatic sync when online
- Works completely without internet

## File Structure

```
public/           - Frontend (HTML, CSS, JS)
src/             - Backend (Express routes, controllers)
data/            - JSON database files
```

## Documentation

See full setup and feature docs in the detailed README above.
