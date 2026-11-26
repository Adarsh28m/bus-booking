import { Router } from 'express';
import Booking, { BookedSeat } from '../models/Booking.js';
import Schedule from '../models/Schedule.js';
import Seat from '../models/Seat.js';
import { requireAdmin, isAdmin } from '../middleware/auth.js';
const r = Router();
const fail = (res, code, message) => res.status(code).json({ success: false, message });
const rand = () => Math.random().toString(36).slice(2, 7).toUpperCase();
const POP = [{ path: 'bus', select: 'operatorName busName busType busNumber' }, { path: 'route', select: 'source destination duration' }];

r.post('/', async (req, res, next) => {
  try {
    const { scheduleId, passengers, contact = {}, boardingPoint, droppingPoint, paymentMethod } = req.body;
    if (!Array.isArray(passengers) || !passengers.length || passengers.length > 6) return fail(res, 400, 'Select between 1 and 6 seats.');
    const seatNums = passengers.map(p => String(p.seatNumber));
    if (new Set(seatNums).size !== seatNums.length) return fail(res, 400, 'Duplicate seats selected.');
    for (const p of passengers) {
      if (!p.name?.trim() || !(p.age >= 1 && p.age <= 120) || !['Male', 'Female', 'Other'].includes(p.gender)) return fail(res, 400, 'Complete all passenger details.');
    }
    if (!contact.name?.trim() || !/^\S+@\S+\.\S+$/.test(contact.email || '') || !/^[6-9]\d{9}$/.test(contact.phone || '')) return fail(res, 400, 'Enter a valid contact name, email and 10-digit phone.');
    if (!['Pay at Counter', 'Demo Online Payment'].includes(paymentMethod)) return fail(res, 400, 'Choose a payment method.');
    const sc = await Schedule.findById(scheduleId);
    if (!sc || !['Scheduled', 'Boarding'].includes(sc.status)) return fail(res, 404, 'This schedule is not available for booking.');
    if (!sc.boardingPoints.some(b => b.name === boardingPoint) || !sc.droppingPoints.some(d => d.name === droppingPoint)) return fail(res, 400, 'Invalid boarding or dropping point.');
    if (await Seat.countDocuments({ bus: sc.bus, seatNumber: { $in: seatNums } }) !== seatNums.length) return fail(res, 400, 'One or more seats do not exist on this bus.');

    const bookingId = `BUS-${sc.journeyDate.toISOString().slice(0, 10).replace(/-/g, '')}-${rand()}`;
    try {
      await BookedSeat.insertMany(seatNums.map(seatNumber => ({ schedule: sc._id, seatNumber, bookingId })), { ordered: true });
    } catch (e) {
      await BookedSeat.deleteMany({ bookingId }); // roll back any seats we grabbed before the conflict
      if (e.code !== 11000 && e.writeErrors?.[0]?.err?.code !== 11000) throw e;
      const taken = (await BookedSeat.find({ schedule: sc._id, seatNumber: { $in: seatNums } })).map(s => s.seatNumber);
      return fail(res, 409, `Seat ${taken.join(', ')} ${taken.length > 1 ? 'have' : 'has'} just been booked by another passenger.`);
    }
    try {
      const b = await Booking.create({
        bookingId, schedule: sc._id, bus: sc.bus, route: sc.route, journeyDate: sc.journeyDate, departureTime: sc.departureTime,
        passengerDetails: passengers.map(p => ({ name: p.name, age: p.age, gender: p.gender, seatNumber: String(p.seatNumber) })),
        boardingPoint, droppingPoint, totalAmount: sc.price * seatNums.length, // price always computed server-side
        contactName: contact.name, contactEmail: contact.email, contactPhone: contact.phone,
        paymentMethod, paymentStatus: paymentMethod === 'Demo Online Payment' ? 'Paid' : 'Pending',
      });
      res.status(201).json(await b.populate(POP));
    } catch (e) { await BookedSeat.deleteMany({ bookingId }); throw e; }
  } catch (e) { next(e); }
});

r.get('/', requireAdmin, async (req, res, next) => {
  try {
    const q = {};
    if (req.query.search) q.$or = [{ bookingId: new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { contactPhone: String(req.query.search) }];
    res.json(await Booking.find(q).sort('-createdAt').limit(200).populate(POP));
  } catch (e) { next(e); }
});

// Public lookup requires booking ID + phone ("Find My Booking")
async function owned(req, res) {
  const b = await Booking.findOne({ bookingId: req.params.bookingId });
  if (!b || !(isAdmin(req) || (req.query.phone && b.contactPhone === String(req.query.phone)))) { fail(res, 404, 'Booking not found. Check the booking ID and phone number.'); return null; }
  return b;
}
r.get('/:bookingId', async (req, res, next) => { try { const b = await owned(req, res); if (b) res.json(await b.populate(POP)); } catch (e) { next(e); } });
r.patch('/:bookingId/cancel', async (req, res, next) => {
  try {
    const b = await owned(req, res); if (!b) return;
    if (b.bookingStatus !== 'Confirmed') return fail(res, 400, `Booking is already ${b.bookingStatus.toLowerCase()}.`);
    b.bookingStatus = 'Cancelled'; await b.save();
    await BookedSeat.deleteMany({ bookingId: b.bookingId }); // frees the seats
    res.json(await b.populate(POP));
  } catch (e) { next(e); }
});
r.patch('/:bookingId/complete', requireAdmin, async (req, res, next) => {
  try {
    const b = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!b) return fail(res, 404, 'Booking not found');
    b.bookingStatus = 'Completed'; await b.save(); res.json(await b.populate(POP));
  } catch (e) { next(e); }
});
export default r;
