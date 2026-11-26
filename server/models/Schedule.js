import mongoose from 'mongoose';
const pt = new mongoose.Schema({ name: String, time: String }, { _id: false });
const s = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  journeyDate: { type: Date, required: true },
  departureTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // 24h HH:mm
  arrivalTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  price: { type: Number, required: true, min: 0 },
  boardingPoints: [pt], droppingPoints: [pt],
  status: { type: String, enum: ['Scheduled', 'Boarding', 'Completed', 'Cancelled'], default: 'Scheduled' },
}, { timestamps: true });
s.index({ route: 1, journeyDate: 1 });
export default mongoose.model('Schedule', s);
