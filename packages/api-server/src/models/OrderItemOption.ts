import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const orderItemOptionSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  order_item_id: { type: String, required: true, ref: 'OrderItem' },
  key: { type: String, required: true },
  value: { type: String, required: true },
  price_delta: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

export const OrderItemOption = mongoose.model('OrderItemOption', orderItemOptionSchema);


