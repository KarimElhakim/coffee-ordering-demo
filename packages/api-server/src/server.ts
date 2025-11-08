import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { connectDB } from './db.js';

// Import routes
import storesRouter from './routes/stores.js';
import menuItemsRouter from './routes/menu-items.js';
import stationsRouter from './routes/stations.js';
import modifiersRouter from './routes/modifiers.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import kdsTicketsRouter from './routes/kds-tickets.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Create Express app
  const app = express();
  const httpServer = createServer(app);

  // Setup Socket.io for real-time updates
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  // Store io instance in app for access in routes
  app.set('io', io);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Coffee Shop API is running' });
  });

  // API routes
  app.use('/api/stores', storesRouter);
  app.use('/api/menu-items', menuItemsRouter);
  app.use('/api/stations', stationsRouter);
  app.use('/api/modifiers', modifiersRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/kds-tickets', kdsTicketsRouter);

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });

    // Allow clients to join specific rooms (e.g., by station)
    socket.on('join:station', (stationId: string) => {
      socket.join(`station:${stationId}`);
      console.log(`🏪 Client ${socket.id} joined station ${stationId}`);
    });

    socket.on('leave:station', (stationId: string) => {
      socket.leave(`station:${stationId}`);
      console.log(`🏪 Client ${socket.id} left station ${stationId}`);
    });
  });

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`🚀 Coffee Shop API Server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready for real-time updates`);
    console.log(`🔗 http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

