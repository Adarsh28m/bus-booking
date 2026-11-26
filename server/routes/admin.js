import { Router } from 'express';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import Booking, { BookedSeat } from '../models/Booking.js';
import { requireAdmin } from '../middleware/auth.js';
const r = Router();
r.use(requireAdmin);
const day = () => new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
const live = { bookingStatus: { $ne: 'Cancelled' } };

r.get('/dashboard', async (req, res, next) => {
  try {
    const today = day(), tomorrow = new Date(+today + 864e5);
    const upcoming = await Schedule.find({ journeyDate: { $gte: today }, status: 'Scheduled' }).populate('bus', 'totalSeats').lean();
    const [totalBuses, activeBuses, totalRoutes, todaySchedules, todayBookings, cancelled, rev, taken] = await Promise.all([
      Bus.countDocuments(), Bus.countDocuments({ active: true }), Route.countDocuments(),
      Schedule.countDocuments({ journeyDate: { $gte: today, $lt: tomorrow } }), Booking.countDocuments({ createdAt: { $gte: today } }),
      Booking.countDocuments({ bookingStatus: 'Cancelled' }), Booking.aggregate([{ $match: live }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
      BookedSeat.countDocuments({ schedule: { $in: upcoming.map(s => s._id) } })]);
    const cap = upcoming.reduce((a, s) => a + (s.bus?.totalSeats || 0), 0);
    res.json({ totalBuses, activeBuses, totalRoutes, todaySchedules, todayBookings, totalRevenue: rev[0]?.t || 0, cancelledBookings: cancelled, availableSeats: cap - taken });
  } catch (e) { next(e); }
});

r.get('/analytics', async (req, res, next) => {
  try {
    const nv = (rows) => rows.map(x => ({ name: x._id, value: x.value }));
    const [perDay, routes, status, operators, schedules, taken, totals] = await Promise.all([
      Booking.aggregate([{ $match: live }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }, { $sort: { _id: 1 } }, { $limit: 30 }]),
      Booking.aggregate([{ $match: live }, { $group: { _id: '$route', value: { $sum: 1 } } }, { $sort: { value: -1 } }, { $limit: 6 }, { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'r' } }, { $set: { _id: { $concat: [{ $first: '$r.source' }, ' → ', { $first: '$r.destination' }] } } }]),
      Booking.aggregate([{ $group: { _id: '$bookingStatus', value: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: live }, { $group: { _id: '$bus', value: { $sum: 1 } } }, { $lookup: { from: 'buses', localField: '_id', foreignField: '_id', as: 'b' } }, { $group: { _id: { $first: '$b.operatorName' }, value: { $sum: '$value' } } }, { $sort: { value: -1 } }, { $limit: 6 }]),
      Schedule.find().populate('bus', 'busName totalSeats').lean(),
      BookedSeat.aggregate([{ $group: { _id: '$schedule', n: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: live }, { $group: { _id: null, c: { $sum: 1 }, t: { $sum: '$totalAmount' } } }])]);
    const tk = Object.fromEntries(taken.map(t => [String(t._id), t.n])), occ = {}; let sum = 0, n = 0;
    for (const s of schedules) {
      if (!s.bus) continue;
      const o = (tk[String(s._id)] || 0) / s.bus.totalSeats; sum += o; n++;
      (occ[s.bus.busName] ||= []).push(o);
    }
    const routesOut = nv(routes);
    res.json({
      bookingsPerDay: perDay.map(d => ({ name: d._id, bookings: d.bookings, revenue: d.revenue })), popularRoutes: routesOut, bookingStatus: nv(status), operators: nv(operators),
      occupancy: Object.entries(occ).map(([name, a]) => ({ name, value: Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) })).sort((a, b) => b.value - a.value).slice(0, 8),
      totalBookings: totals[0]?.c || 0, revenue: totals[0]?.t || 0, mostPopularRoute: routesOut[0]?.name || '—', averageOccupancy: n ? Math.round(sum / n * 100) : 0,
    });
  } catch (e) { next(e); }
});
export default r;
