import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const orderSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  order_number: { type: String },
  store_id: { type: String, required: true, ref: 'Store' },
  table_id: { type: String, ref: 'Table' },
  channel: { 
    type: String, 
    enum: ['table', 'kiosk', 'cashier', 'web'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['new', 'paid', 'in_prep', 'ready', 'served', 'cancelled'], 
    default: 'new' 
  },
  total_amount: { type: Number, required: true },
  subtotal: { type: Number },
  tax_amount: { type: Number },
  discount_amount: { type: Number },
  discount_percentage: { type: Number },
  employee_id: { type: String },
  terminal_id: { type: String },
  customer_id: { type: String },
  customer_name: { type: String },
  customer_phone: { type: String },
  customer_email: { type: String },
  transaction_id: { type: String },
  receipt_number: { type: String },
  payment_method: { type: String },
  order_notes: { type: String },
  internal_notes: { type: String },
  location: { type: String },
  shift_id: { type: String },
  paid_at: { type: Date },
  completed_at: { type: Date },
  cancelled_at: { type: Date },
  served_at: { type: Date },
  cancellation_reason: { type: String },
  preparing_started_at: { type: Date },
  ready_at: { type: Date },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

// Generate order number
let orderCounter = 1;
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.order_number) {
    this.order_number = `ORD-${String(orderCounter++).padStart(6, '0')}`;
  }
  this.updated_at = new Date();
  next();
});

export const Order = mongoose.model('Order', orderSchema);

