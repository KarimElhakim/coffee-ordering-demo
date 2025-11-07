// Simple static server that serves all apps on the same port
// This allows them to share localStorage!

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Helper function to serve app
function serveApp(appName) {
  const distPath = path.join(__dirname, 'apps', appName, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  console.log(`Setting up ${appName}:`);
  console.log(`  Dist path: ${distPath}`);
  console.log(`  Exists: ${fs.existsSync(distPath)}`);
  console.log(`  Index exists: ${fs.existsSync(indexPath)}`);
  
  return express.static(distPath);
}

// Serve each app at a different path
app.use('/customer', serveApp('customer'));
app.use('/cashier', serveApp('cashier'));
app.use('/kds', serveApp('kds'));
app.use('/dashboard', serveApp('dashboard'));

// Fallback to index.html for SPA routing (HashRouter)
app.get('/customer', (req, res) => {
  const indexPath = path.join(__dirname, 'apps/customer/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Customer app not built. Run: pnpm run build --filter @coffee-demo/customer');
  }
});

app.get('/cashier', (req, res) => {
  const indexPath = path.join(__dirname, 'apps/cashier/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Cashier app not built. Run: pnpm run build --filter @coffee-demo/cashier');
  }
});

app.get('/kds', (req, res) => {
  const indexPath = path.join(__dirname, 'apps/kds/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('KDS app not built. Run: pnpm run build --filter @coffee-demo/kds');
  }
});

app.get('/dashboard', (req, res) => {
  const indexPath = path.join(__dirname, 'apps/dashboard/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Dashboard app not built.');
  }
});

// Root redirect
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Karim's Coffee - Demo</title>
      <style>
        body {
          font-family: system-ui;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          color: #fff;
          padding: 60px 20px;
          margin: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: #2a2a2a;
          border-radius: 20px;
          padding: 50px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        h1 {
          text-align: center;
          color: #4ade80;
          margin: 0 0 40px 0;
          font-size: 48px;
        }
        .apps {
          display: grid;
          gap: 20px;
          margin: 40px 0;
        }
        .app-link {
          display: block;
          padding: 25px;
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: #000;
          text-decoration: none;
          border-radius: 12px;
          font-weight: bold;
          font-size: 20px;
          transition: transform 0.2s;
          text-align: center;
        }
        .app-link:hover {
          transform: scale(1.05);
        }
        .note {
          text-align: center;
          color: #9ca3af;
          margin-top: 30px;
          padding: 20px;
          background: #1a1a1a;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>☕ Karim's Coffee</h1>
        <p style="text-align: center; color: #9ca3af; font-size: 18px;">
          Complete Coffee Shop Management System
        </p>
        
        <div class="apps">
          <a href="/customer" class="app-link">📱 Customer App</a>
          <a href="/cashier" class="app-link">💼 Cashier / POS</a>
          <a href="/kds" class="app-link">🍳 Kitchen Display System</a>
          <a href="/dashboard" class="app-link">📊 Dashboard</a>
        </div>
        
        <div class="note">
          <strong>✅ All apps on same port = Shared localStorage!</strong><br>
          Orders from Customer/POS will appear in KDS instantly.
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 KARIM\'S COFFEE - ALL APPS RUNNING');
  console.log('========================================\n');
  console.log('✅ Server running on http://localhost:' + PORT);
  console.log('\n📱 Apps available at:\n');
  console.log('   Customer:  http://localhost:' + PORT + '/customer');
  console.log('   Cashier:   http://localhost:' + PORT + '/cashier');
  console.log('   KDS:       http://localhost:' + PORT + '/kds');
  console.log('   Dashboard: http://localhost:' + PORT + '/dashboard');
  console.log('\n========================================');
  console.log('✅ All apps share localStorage!');
  console.log('✅ Orders will appear in KDS in real-time!');
  console.log('========================================\n');
});

