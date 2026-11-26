import mongoose from 'mongoose';
const s = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  seatNumber: { type: String, required: true },
  seatType: { type: String, enum: ['Window', 'Middle', 'Aisle', 'Sleeper'] },
  row: Number, column: Number,
});
s.index({ bus: 1, seatNumber: 1 }, { unique: true });
export default mongoose.model('Seat', s);
