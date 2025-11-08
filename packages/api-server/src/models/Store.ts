import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  _id: { type: String, default: '1' },
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export const Store = mongoose.model('Store', storeSchema);

