import mongoose from 'mongoose';
const { Schema } = mongoose;
const passenger = new Schema({
  name: { type: String, required: true, trim: true }, age: { type: Number, required: true, min: 1, max: 120 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true }, seatNumber: { type: String, required: true },
}, { _id: false });
const s = new Schema({
  bookingId: { type: String, required: true, unique: true },
  schedule: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
  bus: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
  route: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
  journeyDate: Date, departureTime: String, passengerDetails: [passenger],
  boardingPoint: String, droppingPoint: String, totalAmount: Number,
  contactName: String, contactEmail: String, contactPhone: String,
  paymentMethod: { type: String, enum: ['Pay at Counter', 'Demo Online Payment'] },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  bookingStatus: { type: String, enum: ['Confirmed', 'Cancelled', 'Completed'], default: 'Confirmed' },
}, { timestamps: true });
export default mongoose.model('Booking', s);

// One document per booked seat per schedule. The UNIQUE index is what makes double booking impossible,
// even when two requests arrive at the same instant (no replica-set transaction needed).
const bs = new Schema({ schedule: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true }, seatNumber: { type: String, required: true }, bookingId: String });
bs.index({ schedule: 1, seatNumber: 1 }, { unique: true });
export const BookedSeat = mongoose.model('BookedSeat', bs);
