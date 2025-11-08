import { Router } from 'express';
import { Order, OrderItem, OrderItemOption, MenuItem, Table, Payment, KdsTicket, Station } from '../models/index.js';

const router = Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { store_id, status, channel } = req.query;
    const query: any = {};
    
    if (store_id) query.store_id = store_id;
    if (status) query.status = status;
    if (channel) query.channel = channel;

    const orders = await Order.find(query).sort({ created_at: -1 });
    
    // Enrich with items, table, and payments
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ order_id: order._id });
      const table = order.table_id ? await Table.findById(order.table_id) : null;
      const payments = await Payment.find({ order_id: order._id });
      
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.menu_item_id);
        const options = await OrderItemOption.find({ order_item_id: item._id });
        
        const itemObj = item.toObject();
        return {
          ...itemObj,
          id: itemObj._id,
          menu_item: menuItem ? {
            name: menuItem.name,
            base_price: menuItem.base_price
          } : null,
          options: options.map(opt => {
            const optObj = opt.toObject();
            return { ...optObj, id: optObj._id };
          })
        };
      }));
      
      const orderObj = order.toObject();
      return {
        ...orderObj,
        id: orderObj._id,
        table: table ? { label: table.label } : null,
        items: enrichedItems,
        payments: payments.map(p => {
          const pObj = p.toObject();
          return { ...pObj, id: pObj._id };
        })
      };
    }));

    res.json(enrichedOrders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Calculate subtotal if not provided
    const calculatedSubtotal = orderData.subtotal ?? orderData.items.reduce(
      (sum: number, item: any) => sum + (item.price_each * item.qty),
      0
    );
    
    // Calculate discount amount
    const calculatedDiscountAmount = orderData.discount_amount ?? 
      (orderData.discount_percentage ? calculatedSubtotal * (orderData.discount_percentage / 100) : 0);
    
    // Calculate tax (14% VAT)
    const calculatedTaxAmount = orderData.tax_amount ?? calculatedSubtotal * 0.14;
    
    // Create order
    const order = new Order({
      store_id: orderData.store_id,
      table_id: orderData.table_id,
      channel: orderData.channel,
      status: 'new',
      total_amount: orderData.total_amount,
      subtotal: calculatedSubtotal,
      tax_amount: calculatedTaxAmount,
      discount_amount: calculatedDiscountAmount,
      discount_percentage: orderData.discount_percentage ?? 0,
      employee_id: orderData.employee_id,
      terminal_id: orderData.terminal_id,
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_email: orderData.customer_email,
      transaction_id: orderData.transaction_id,
      receipt_number: orderData.receipt_number,
      payment_method: orderData.payment_method,
      order_notes: orderData.order_notes,
      internal_notes: orderData.internal_notes,
      location: orderData.location || 'dine-in',
      shift_id: orderData.shift_id
    });
    
    await order.save();
    
    // Create order items
    const itemsToCreate = orderData.items.map((item: any) => {
      const itemSubtotal = item.price_each * item.qty;
      return new OrderItem({
        order_id: order._id,
        menu_item_id: item.menu_item_id,
        qty: item.qty,
        price_each: item.price_each,
        note: item.note,
        subtotal: itemSubtotal,
        discount_amount: 0,
        tax_amount: itemSubtotal * 0.14,
        line_total: itemSubtotal,
        product_name: item.product_name
      });
    });
    
    const savedItems = await OrderItem.insertMany(itemsToCreate);
    
    // Create order item options
    const optionsToCreate: any[] = [];
    orderData.items.forEach((item: any, idx: number) => {
      if (item.options && item.options.length > 0) {
        item.options.forEach((opt: any) => {
          optionsToCreate.push(new OrderItemOption({
            order_item_id: savedItems[idx]._id,
            key: opt.key,
            value: opt.value,
            price_delta: opt.price_delta
          }));
        });
      }
    });
    
    if (optionsToCreate.length > 0) {
      await OrderItemOption.insertMany(optionsToCreate);
    }
    
    // Decrement inventory for items with inventory tracking
    for (const item of orderData.items) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      if (menuItem && menuItem.track_inventory) {
        menuItem.stock_quantity = Math.max(0, menuItem.stock_quantity - item.qty);
        menuItem.out_of_stock = menuItem.stock_quantity <= 0;
        await menuItem.save();
      }
    }
    
    // Return order with id field
    const orderObj = order.toObject();
    res.json({ ...orderObj, id: orderObj._id });
    
    // Emit socket event for new order
    const io = (req as any).app.get('io');
    if (io) {
      io.emit('order:created', { ...orderObj, id: orderObj._id });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update order status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    order.status = status;
    
    // Update timestamps based on status
    if (status === 'in_prep') {
      order.preparing_started_at = new Date();
    } else if (status === 'ready') {
      order.ready_at = new Date();
    } else if (status === 'served') {
      order.served_at = new Date();
    } else if (status === 'cancelled') {
      order.cancelled_at = new Date();
    } else if (status === 'paid') {
      order.paid_at = new Date();
    }
    
    await order.save();
    
    const orderObj = order.toObject();
    const result = { ...orderObj, id: orderObj._id };
    
    // Emit socket event
    const io = (req as any).app.get('io');
    if (io) {
      io.emit('order:updated', result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

