import mongoose from 'mongoose';
const s = new mongoose.Schema({
  source: { type: String, required: true, trim: true }, destination: { type: String, required: true, trim: true },
  distance: { type: Number, min: 1 }, duration: { type: String, required: true },
  boardingPoints: [String], droppingPoints: [String], active: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Route', s);
