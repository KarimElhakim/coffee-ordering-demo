import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const menuItemSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  store_id: { type: String, required: true, ref: 'Store' },
  name: { type: String, required: true },
  base_price: { type: Number, required: true },
  station_id: { type: String, required: true, ref: 'Station' },
  is_active: { type: Boolean, default: true },
  stock_quantity: { type: Number, default: 0 },
  low_stock_threshold: { type: Number, default: 10 },
  out_of_stock: { type: Boolean, default: false },
  track_inventory: { type: Boolean, default: true },
  last_restocked_at: { type: Date },
  // Starbucks integration fields
  description: { type: String },
  category: { type: String },
  image_url: { type: String },
  local_image_path: { type: String },
  calories: { type: Number },
  nutrition_info: {
    calories: { type: Number },
    sugar_g: { type: Number },
    fat_g: { type: Number }
  },
  available_sizes: [{ type: String }],
  customizations: { type: mongoose.Schema.Types.Mixed },
  starbucks_stars: { type: Number },
  scraped_from_starbucks: { type: Boolean },
  starbucks_url: { type: String },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

// Auto-update updated_at on save
menuItemSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);


