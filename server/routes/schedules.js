import { Router } from 'express';
import Schedule from '../models/Schedule.js';
import Route from '../models/Route.js';
import Seat from '../models/Seat.js';
import { BookedSeat } from '../models/Booking.js';
import crud from '../utils/crud.js';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bad = (res, message) => res.status(400).json({ success: false, message });

// Search schedules by route + date; availability is computed per schedule from BookedSeat.
export async function search(req, res, next) {
  try {
    const from = String(req.query.from || '').trim(), to = String(req.query.to || '').trim(), date = String(req.query.date || '');
    if (!from || !to || !date) return bad(res, 'From, To and date are required.');
    if (from.toLowerCase() === to.toLowerCase()) return bad(res, 'Source and destination cannot be the same.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date))) return bad(res, 'Invalid date.');
    if (date < new Date().toISOString().slice(0, 10)) return bad(res, 'Journey date cannot be in the past.');
    const exact = (s) => new RegExp(`^${esc(s)}$`, 'i');
    const routes = await Route.find({ source: exact(from), destination: exact(to), active: true }).select('_id');
    const start = new Date(`${date}T00:00:00.000Z`), end = new Date(start.getTime() + 864e5);
    const list = await Schedule.find({ route: { $in: routes }, journeyDate: { $gte: start, $lt: end }, status: { $in: ['Scheduled', 'Boarding'] } })
      .populate('bus').populate('route').lean();
    const taken = await BookedSeat.aggregate([{ $match: { schedule: { $in: list.map(s => s._id) } } }, { $group: { _id: '$schedule', n: { $sum: 1 } } }]);
    const map = Object.fromEntries(taken.map(t => [String(t._id), t.n]));
    res.json(list.filter(s => s.bus?.active).map(s => ({ ...s, availableSeats: s.bus.totalSeats - (map[String(s._id)] || 0) })));
  } catch (e) { next(e); }
}

const r = Router();
r.get('/search', search);
r.get('/:scheduleId/seats', async (req, res, next) => {
  try {
    const sc = await Schedule.findById(req.params.scheduleId);
    if (!sc) return res.status(404).json({ success: false, message: 'Schedule not found' });
    const [seats, booked] = await Promise.all([Seat.find({ bus: sc.bus }).sort('row column').lean(), BookedSeat.find({ schedule: sc._id }).select('seatNumber')]);
    const taken = new Set(booked.map(b => b.seatNumber));
    const out = seats.map(s => ({ seatNumber: s.seatNumber, seatType: s.seatType, row: s.row, column: s.column, booked: taken.has(s.seatNumber) }));
    res.json({ totalSeats: out.length, availableSeats: out.filter(s => !s.booked).length, bookedSeats: taken.size, seats: out });
  } catch (e) { next(e); }
});
// If the admin leaves boarding/dropping points empty, copy them from the route.
const fillPoints = async (b) => {
  if (b.route && !b.boardingPoints?.length) {
    const rt = await Route.findById(b.route);
    if (rt) { b.boardingPoints = rt.boardingPoints.map(name => ({ name, time: b.departureTime })); b.droppingPoints = rt.droppingPoints.map(name => ({ name, time: b.arrivalTime })); }
  }
  return b;
};
r.use('/', crud(Schedule, { populate: 'bus route', sort: 'journeyDate departureTime', before: fillPoints }));
export default r;
