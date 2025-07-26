import https from 'https';
import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import selfsigned from 'selfsigned';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { STATIC_ADDRESSES, LIVE_TRACKERS_START } from './src/testData.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load the .env file from the same directory as this script.
dotenv.config({ path: path.resolve(__dirname, '.env') });


// --- Nodemailer with Gmail Setup ---
let transporter;
async function setupEmailTransporter() {
    // Check if we have credentials for a real email service
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log("✉️  Configuring Nodemailer to use Gmail...");
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    } else {
        // Fallback to Ethereal for testing if no credentials are provided
        console.log("✉️  No email credentials found, falling back to Ethereal for testing.");
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, 
            auth: {
                user: testAccount.user, 
                pass: testAccount.pass,
            },
        });
    }
}
setupEmailTransporter().catch(console.error);


// --- TEST DATA SIMULATION ---
let staticAddresses = [];
let liveTrackers = [];

function getRandomInRange(min, max, decimals = 6) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function initializeTestData() {
    // Use a deep copy to prevent the simulation from altering the original data
    staticAddresses = JSON.parse(JSON.stringify(STATIC_ADDRESSES));
    liveTrackers = JSON.parse(JSON.stringify(LIVE_TRACKERS_START));

    console.log(`Initialized ${staticAddresses.length} static addresses and ${liveTrackers.length} live trackers from static data.`);
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

app.post('/send-notification', async (req, res) => {
    const { email, name } = req.body;
    if (!email || !name) {
        return res.status(400).json({ error: 'Missing required fields: email, name' });
    }

    const subject = "Urgent: Please Share Your Location for Emergency Response";
    const htmlContent = `
        <h1>Emergency Alert - Location Request</h1>
        <p>Hello ${name},</p>
        <p>This is an urgent request from the emergency response team. Due to a developing situation in your area, we are asking you to share your live location so we can provide assistance if needed.</p>
        <p>Please click the link below on your mobile device to begin sharing your location:</p>
        <p><a href="https://10.150.92.15:3000/packages/user/index.html" style="font-size: 16px; padding: 12px 20px; background-color: #990909; color: white; text-decoration: none; border-radius: 5px;">Share Location</a></p>
        <p>Your safety is our top priority. Thank you for your cooperation.</p>
        <hr>
        <p><em>This is an automated message from the LocAid Emergency Response System.</em></p>
    `;

    try {
        if (!transporter) {
            return res.status(503).json({ error: "Email service is not yet available. Please try again in a moment." });
        }
        
        const info = await transporter.sendMail({
            from: '"LocAid Alerts" <alerts@locaid.com>', // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            html: htmlContent, // html body
        });

        // If using Ethereal, log the preview URL
        if (transporter.options.host === 'smtp.ethereal.email') {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`Email sent: ${info.messageId}`);
            console.log(`Preview URL: ${previewUrl}`);
            return res.status(200).json({ message: 'Email sent to test account!', previewUrl: previewUrl });
        }

        console.log(`Email sent successfully to ${email}:`, info.messageId);
        return res.status(200).json({ message: 'Email sent successfully!', messageId: info.messageId });

    } catch (error) {
        console.error('API Handler Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 LocAid Server listening on https://localhost:${PORT}`);
  console.log(`\n📱 Client URLs:`);
  console.log(`   👥 User Client:      https://localhost:${PORT}/packages/user/index.html`);
  console.log(`   🚨 Responder Client: https://localhost:${PORT}/packages/responder/index.html`);
  console.log(`   🖥️  Dashboard:        https://localhost:${PORT}/packages/dashboard/login.html`);

  // initializeTestData();
  // // Start the simulation loop
  // setInterval(simulateLiveMovement, 2000);
});