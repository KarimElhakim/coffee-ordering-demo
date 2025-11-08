import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const kdsTicketSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  order_id: { type: String, required: true, ref: 'Order' },
  station_id: { type: String, required: true, ref: 'Station' },
  status: { 
    type: String, 
    enum: ['new', 'prep', 'ready'], 
    default: 'new' 
  },
  bumped_by: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const KdsTicket = mongoose.model('KdsTicket', kdsTicketSchema);

