import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const modifierSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  store_id: { type: String, required: true, ref: 'Store' },
  name: { type: String, required: true },
  type: { type: String, enum: ['single', 'multi'], required: true },
  created_at: { type: Date, default: Date.now }
});

export const Modifier = mongoose.model('Modifier', modifierSchema);

