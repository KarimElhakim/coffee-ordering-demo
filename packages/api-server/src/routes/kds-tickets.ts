import { Router } from 'express';
import { KdsTicket, Order, OrderItem, OrderItemOption, MenuItem, Station } from '../models/index.js';

const router = Router();

// Get all KDS tickets
router.get('/', async (req, res) => {
  try {
    const { station_id, status } = req.query;
    const query: any = {};
    
    if (station_id) query.station_id = station_id;
    if (status) query.status = status;

    const tickets = await KdsTicket.find(query).sort({ created_at: 1 });
    
    // Enrich with order, station, and items
    const enrichedTickets = await Promise.all(tickets.map(async (ticket) => {
      const order = await Order.findById(ticket.order_id);
      const station = await Station.findById(ticket.station_id);
      
      if (!order) return null;
      
      const items = await OrderItem.find({ order_id: ticket.order_id });
      
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.menu_item_id);
        const options = await OrderItemOption.find({ order_item_id: item._id });
        
        const itemObj = item.toObject();
        return {
          ...itemObj,
          id: itemObj._id,
          menu_item: menuItem ? { name: menuItem.name } : { name: 'Unknown' },
          options: options.map(opt => {
            const optObj = opt.toObject();
            return { ...optObj, id: optObj._id };
          })
        };
      }));
      
      const orderObj = order.toObject();
      const ticketObj = ticket.toObject();
      
      return {
        ...ticketObj,
        id: ticketObj._id,
        order: {
          ...orderObj,
          id: orderObj._id,
          items: enrichedItems
        },
        station: station ? {
          ...station.toObject(),
          id: station._id
        } : null
      };
    }));
    
    const validTickets = enrichedTickets.filter(t => t !== null);
    res.json(validTickets);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update KDS ticket status
router.patch('/:id', async (req, res) => {
  try {
    const { status, bumped_by } = req.body;
    const ticket = await KdsTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    ticket.status = status;
    if (bumped_by) ticket.bumped_by = bumped_by;
    
    await ticket.save();
    
    const ticketObj = ticket.toObject();
    const result = { ...ticketObj, id: ticketObj._id };
    
    // Emit socket event
    const io = (req as any).app.get('io');
    if (io) {
      io.emit('kds_ticket:updated', result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

