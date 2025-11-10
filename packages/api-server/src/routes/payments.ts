import { Router } from 'express';
import { Payment, Order, KdsTicket, OrderItem, MenuItem } from '../models/index.js';

const router = Router();

// Create payment and mark order as paid
router.post('/', async (req, res) => {
  try {
    const { order_id, provider, amount } = req.body;
    
    // Create payment
    const payment = new Payment({
      order_id,
      provider,
      status: 'succeeded',
      amount,
      ext_ref: `demo_${Date.now()}`
    });
    
    await payment.save();
    
    // Update order status
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = 'paid';
    order.paid_at = new Date();
    await order.save();
    
    // Create KDS tickets
    const orderItems = await OrderItem.find({ order_id });
    const ticketsToCreate: any[] = [];
    
    for (const item of orderItems) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      if (menuItem && menuItem.station_id) {
        ticketsToCreate.push(new KdsTicket({
          order_id,
          station_id: menuItem.station_id,
          status: 'new'
        }));
      }
    }
    
    if (ticketsToCreate.length > 0) {
      await KdsTicket.insertMany(ticketsToCreate);
    }
    
    const paymentObj = payment.toObject();
    const orderObj = order.toObject();
    
    const result = {
      payment: { ...paymentObj, id: paymentObj._id },
      order: { ...orderObj, id: orderObj._id }
    };
    
    // Emit socket events
    const io = (req as any).app.get('io');
    if (io) {
      io.emit('order:updated', result.order);
      io.emit('payment:created', result.payment);
      ticketsToCreate.forEach(ticket => {
        const ticketObj = ticket.toObject();
        io.emit('kds_ticket:created', { ...ticketObj, id: ticketObj._id });
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;


