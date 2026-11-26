import 'dotenv/config';
import mongoose from 'mongoose';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import Seat from '../models/Seat.js';
import Booking, { BookedSeat } from '../models/Booking.js';
import { generateSeats } from '../utils/seatGenerator.js';

const A = ['AC', 'WiFi', 'Charging Point', 'Water Bottle'];
const buses = [
  ['City Express', 'City Express Volvo', 'Volvo AC', 40, 4.4, 2.6, A], ['Neeta Travels', 'Neeta Sleeper Plus', 'AC Sleeper', 30, 4.2, 3.0, A],
  ['Maharashtra Travels', 'Maharashtra Express', 'AC Semi-Sleeper', 36, 4.0, 2.4, ['AC', 'Charging Point']], ['VRL Travels', 'VRL Luxury', 'AC Seater', 40, 4.5, 2.5, A],
  ['SRS Travels', 'SRS Night Rider', 'Non-AC Sleeper', 30, 3.9, 2.0, ['Charging Point', 'Water Bottle']], ['City Express', 'City Express Seater', 'Non-AC Seater', 44, 3.8, 1.6, ['Water Bottle']],
  ['Neeta Travels', 'Neeta Volvo', 'Volvo AC', 40, 4.3, 2.7, A], ['VRL Travels', 'VRL Sleeper', 'AC Sleeper', 30, 4.1, 2.9, A],
  ['SRS Travels', 'SRS Comfort', 'AC Seater', 40, 4.0, 2.3, ['AC', 'WiFi']], ['Maharashtra Travels', 'Maharashtra Sleeper', 'Non-AC Sleeper', 30, 3.7, 1.9, ['Charging Point']],
].map(([operatorName, busName, busType, totalSeats, rating, rate, amenities], i) => ({ operatorName, busName, busType, totalSeats, rating, rate, amenities, busNumber: `MH-01-AB-${1000 + i}` }));

const pts = { Mumbai: ['Dadar', 'Borivali', 'Thane'], Pune: ['Shivajinagar', 'Wakad', 'Hinjewadi'], Nashik: ['CBS Bus Stand', 'College Road', 'Dwarka'], Goa: ['Panjim', 'Mapusa', 'Margao'], Aurangabad: ['Cidco', 'Station Road', 'Waluj'], Kolhapur: ['Central Bus Stand', 'Tarabai Park', 'Shahupuri'] };
const routes = [['Mumbai', 'Pune', 150, '3h 45m'], ['Pune', 'Mumbai', 150, '3h 45m'], ['Mumbai', 'Nashik', 170, '4h 30m'], ['Nashik', 'Mumbai', 170, '4h 30m'], ['Mumbai', 'Goa', 590, '11h 0m'],
  ['Pune', 'Goa', 450, '9h 0m'], ['Goa', 'Mumbai', 590, '11h 0m'], ['Pune', 'Nashik', 210, '5h 0m'], ['Mumbai', 'Aurangabad', 330, '7h 0m'], ['Pune', 'Kolhapur', 230, '5h 30m']];

const mins = (s) => (/(\d+)h/.exec(s)?.[1] || 0) * 60 + +(/(\d+)m/.exec(s)?.[1] || 0);
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([Bus, Route, Schedule, Seat, Booking, BookedSeat].map(m => m.deleteMany({})));
const busDocs = await Bus.insertMany(buses);
await Seat.insertMany(busDocs.flatMap(generateSeats));
const routeDocs = await Route.insertMany(routes.map(([source, destination, distance, duration]) => ({ source, destination, distance, duration, boardingPoints: pts[source], droppingPoints: pts[destination] })));

const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'), sched = [];
routeDocs.forEach((rt, i) => [[i, '07:00'], [(i + 3) % 10, '22:30']].forEach(([bi, dep]) => {
  const b = busDocs[bi], d0 = +dep.slice(0, 2) * 60 + +dep.slice(3), arr = hhmm(d0 + mins(rt.duration));
  for (let d = 0; d < 14; d++) sched.push({
    bus: b._id, route: rt._id, journeyDate: new Date(+today + d * 864e5), departureTime: dep, arrivalTime: arr, price: Math.round((100 + rt.distance * buses[bi].rate) / 10) * 10,
    boardingPoints: rt.boardingPoints.map(name => ({ name, time: dep })), droppingPoints: rt.droppingPoints.map(name => ({ name, time: arr })), status: 'Scheduled' });
}));
const scheduleDocs = await Schedule.insertMany(sched);

// Sample bookings so the dashboard has data
const pick = (a) => a[Math.floor(Math.random() * a.length)], names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali'];
for (let i = 0; i < 50; i++) {
  const sc = pick(scheduleDocs.slice(0, 120)), seats = (await Seat.find({ bus: sc.bus })).map(s => s.seatNumber).sort(() => Math.random() - .5).slice(0, 1 + Math.floor(Math.random() * 3));
  const taken = new Set((await BookedSeat.find({ schedule: sc._id })).map(x => x.seatNumber));
  const free = seats.filter(s => !taken.has(s)); if (!free.length) continue;
  const rt = routeDocs.find(r => String(r._id) === String(sc.route)), bookingId = `BUS-${sc.journeyDate.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const cancelled = Math.random() < .1, pay = Math.random() < .6;
  await BookedSeat.insertMany(cancelled ? [] : free.map(seatNumber => ({ schedule: sc._id, seatNumber, bookingId })));
  await Booking.create({ bookingId, schedule: sc._id, bus: sc.bus, route: sc.route, journeyDate: sc.journeyDate, departureTime: sc.departureTime,
    passengerDetails: free.map(seatNumber => ({ name: pick(names), age: 20 + Math.floor(Math.random() * 40), gender: pick(['Male', 'Female']), seatNumber })), boardingPoint: rt.boardingPoints[0], droppingPoint: rt.droppingPoints[0],
    totalAmount: sc.price * free.length, contactName: pick(names), contactEmail: 'demo@example.com', contactPhone: '9876543210', paymentMethod: pay ? 'Demo Online Payment' : 'Pay at Counter',
    paymentStatus: pay ? 'Paid' : 'Pending', bookingStatus: cancelled ? 'Cancelled' : 'Confirmed', createdAt: new Date(Date.now() - Math.random() * 10 * 864e5) });
}
console.log(`Seeded ${busDocs.length} buses, ${routeDocs.length} routes, ${scheduleDocs.length} schedules`); process.exit(0);
