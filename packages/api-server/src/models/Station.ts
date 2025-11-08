import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const stationSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  store_id: { type: String, required: true, ref: 'Store' },
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export const Station = mongoose.model('Station', stationSchema);

