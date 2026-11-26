import mongoose from 'mongoose';
export const BUS_TYPES = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'AC Semi-Sleeper', 'Volvo AC'];
const s = new mongoose.Schema({
  operatorName: { type: String, required: true, trim: true },
  busName: { type: String, required: true, trim: true },
  busNumber: { type: String, required: true, unique: true, trim: true },
  busType: { type: String, enum: BUS_TYPES, required: true },
  totalSeats: { type: Number, required: true, min: 4, max: 60 },
  amenities: [String],
  rating: { type: Number, min: 0, max: 5, default: 4 },
  active: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Bus', s);
