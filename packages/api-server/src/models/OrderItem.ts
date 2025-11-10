import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const orderItemSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  order_id: { type: String, required: true, ref: 'Order' },
  menu_item_id: { type: String, required: true, ref: 'MenuItem' },
  qty: { type: Number, required: true, default: 1 },
  price_each: { type: Number, required: true },
  note: { type: String },
  subtotal: { type: Number },
  discount_amount: { type: Number, default: 0 },
  tax_amount: { type: Number },
  line_total: { type: Number },
  product_name: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);


