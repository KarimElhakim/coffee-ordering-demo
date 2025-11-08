import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const paymentSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  order_id: { type: String, required: true, ref: 'Order' },
  provider: { 
    type: String, 
    enum: ['stripe', 'cash', 'card_present_demo'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'succeeded', 'failed'], 
    default: 'pending' 
  },
  amount: { type: Number, required: true },
  ext_ref: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const Payment = mongoose.model('Payment', paymentSchema);

