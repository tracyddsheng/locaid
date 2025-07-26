import https from 'https';
import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import selfsigned from 'selfsigned';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
});