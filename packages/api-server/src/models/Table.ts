import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const tableSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  store_id: { type: String, required: true, ref: 'Store' },
  label: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export const Table = mongoose.model('Table', tableSchema);


