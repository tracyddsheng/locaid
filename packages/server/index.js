import https from 'https';
import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import selfsigned from 'selfsigned';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- TEST DATA SIMULATION ---
// Define several smaller, land-locked bounding boxes within LA County
const LA_LAND_ZONES = [
    { name: "Downtown", lat: { min: 34.03, max: 34.07 }, lon: { min: -118.28, max: -118.22 } },
    { name: "Santa Monica", lat: { min: 34.00, max: 34.04 }, lon: { min: -118.50, max: -118.45 } },
    { name: "San Fernando Valley", lat: { min: 34.15, max: 34.20 }, lon: { min: -118.48, max: -118.40 } },
    { name: "Pasadena", lat: { min: 34.12, max: 34.16 }, lon: { min: -118.18, max: -118.12 } },
    { name: "Long Beach", lat: { min: 33.76, max: 33.80 }, lon: { min: -118.20, max: -118.15 } }
];

const staticAddresses = [];
const liveTrackers = [];

function getRandomInRange(min, max, decimals = 6) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function initializeTestData() {
    // 1. Create 100 static disabled addresses within land-locked zones
    for (let i = 0; i < 100; i++) {
        const zone = LA_LAND_ZONES[Math.floor(Math.random() * LA_LAND_ZONES.length)];
        staticAddresses.push({
            deviceId: `address_${i}`,
            latitude: getRandomInRange(zone.lat.min, zone.lat.max),
            longitude: getRandomInRange(zone.lon.min, zone.lon.max),
            type: 'address'
        });
    }

    // 2. Create 20 first responders
    for (let i = 0; i < 20; i++) {
        const zone = LA_LAND_ZONES[Math.floor(Math.random() * LA_LAND_ZONES.length)];
        liveTrackers.push({
            deviceId: `responder_${i}`,
            latitude: getRandomInRange(zone.lat.min, zone.lat.max),
            longitude: getRandomInRange(zone.lon.min, zone.lon.max),
            accuracy: getRandomInRange(5, 20, 0),
            type: 'responder'
        });
    }

    // 3. Create 40 live disabled users
    for (let i = 0; i < 40; i++) {
        const zone = LA_LAND_ZONES[Math.floor(Math.random() * LA_LAND_ZONES.length)];
        liveTrackers.push({
            deviceId: `user_${i}`,
            latitude: getRandomInRange(zone.lat.min, zone.lat.max),
            longitude: getRandomInRange(zone.lon.min, zone.lon.max),
            accuracy: getRandomInRange(5, 20, 0),
            type: 'user'
        });
    }
    console.log(`Initialized ${staticAddresses.length} static addresses and ${liveTrackers.length} live trackers.`);
}

function simulateLiveMovement() {
    liveTrackers.forEach(tracker => {
        // Simple random walk
        tracker.latitude += getRandomInRange(-0.001, 0.001);
        tracker.longitude += getRandomInRange(-0.001, 0.001);
        
        const data = JSON.stringify({ ...tracker, timestamp: new Date().toISOString() });
        clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(data);
            }
        });
    });
}

// --- SERVER SETUP ---
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..'))); // Serve static files from root

const pems = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 });

const server = https.createServer({
  key: pems.private,
  cert: pems.cert
}, app);

const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);
  console.log('Dashboard client connected');

  // On connection, send the initial batch of static addresses
  ws.send(JSON.stringify(staticAddresses));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Dashboard client disconnected');
  });
});

app.post('/location', (req, res) => {
  const { latitude, longitude, accuracy, deviceId, timestamp, type } = req.body;
  if (latitude && longitude && accuracy && deviceId && timestamp && type) {
    console.log('Received location:', req.body);
    const data = JSON.stringify(req.body);
    clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(data);
      }
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on https://localhost:${PORT}`);
  console.log(`Mobile client URL: https://localhost:${PORT}/packages/responder/index.html`);
  console.log(`Dashboard client URL: https://localhost:${PORT}/packages/dashboard/index.html`);

  initializeTestData();
  // Start the simulation loop
  setInterval(simulateLiveMovement, 2000);
});