import { Router } from 'express';
import Bus from '../models/Bus.js';
import Seat from '../models/Seat.js';
import crud from '../utils/crud.js';
import { generateSeats } from '../utils/seatGenerator.js';
import { search } from './schedules.js';
const r = Router();
r.get('/search', search); // spec alias: GET /api/buses/search?from&to&date
const regen = async (bus) => { await Seat.deleteMany({ bus: bus._id }); await Seat.insertMany(generateSeats(bus)); };
r.use('/', crud(Bus, { search: ['operatorName', 'busName', 'busNumber'], soft: true, after: regen }));
export default r;
