# BusBook — MERN Bus Booking System

Search buses by route and date, pick seats on a live seat map, enter passenger details and book — no accounts needed. Everything (buses, routes, schedules, seats, bookings) lives in MongoDB; React only talks to the Express API.

## Features
Search with filters/sort · per-schedule seat availability · multi-seat booking · mock payment (Pay at Counter / Demo Online) · ticket with print · "Find My Booking" (ID + phone) · admin dashboard with Recharts analytics and CRUD for buses, routes, schedules and bookings.

## Data model
`Bus 1─* Seat` · `Bus 1─* Schedule *─1 Route` · `Schedule 1─* Booking` · `Booking.passengerDetails[]` · `BookedSeat` (one doc per booked seat per schedule).

**Double-booking protection:** `BookedSeat` has a unique index on `{schedule, seatNumber}`. Booking inserts all seats first; if any insert collides, the booking is rejected with HTTP 409 (`Seat A2 has just been booked by another passenger.`) and partial inserts are rolled back. This works on any MongoDB (no replica set required). Cancelling a booking deletes its `BookedSeat` rows, freeing the seats.

## Setup
1. **MongoDB Atlas:** create a free cluster, a DB user, allow network access, copy the connection string.
2. **Backend:** `cd server && npm i && cp .env.example .env` (set `MONGO_URI`, `ADMIN_KEY`, `CLIENT_URL`) → `npm run seed` → `npm run dev`
3. **Frontend:** `cd client && npm i && cp .env.example .env` → `npm run dev` → http://localhost:5173
4. Open **Admin** and enter your `ADMIN_KEY`.

Seed data: 10 buses, 10 routes, 280 schedules for the next 14 days, and ~50 sample bookings. Seats come from `utils/seatGenerator.js` (sleeper = 1+2 layout, others 2+2).

## Environment variables
Server: `MONGO_URI`, `PORT`, `CLIENT_URL` (comma-separated allowed origins, no trailing slash), `ADMIN_KEY`. Client: `VITE_API_URL` (e.g. `https://busbook-api.onrender.com/api`).

## API (admin routes need header `x-admin-key`)
- `GET /api/buses/search` · `GET /api/schedules/search` — `?from&to&date=YYYY-MM-DD`
- `GET/POST/PUT/DELETE /api/buses`, `/api/routes`, `/api/schedules` (writes = admin; bus delete = deactivate)
- `GET /api/schedules/:id/seats` → `{totalSeats, availableSeats, bookedSeats, seats[]}`
- `POST /api/bookings` · `GET /api/bookings/:bookingId?phone=` · `PATCH /api/bookings/:bookingId/cancel?phone=` · `GET /api/bookings` (admin) · `PATCH /api/bookings/:bookingId/complete` (admin)
- `GET /api/admin/dashboard` · `GET /api/admin/analytics`

## Deploy
**Render** (Web Service, root `server`, build `npm install`, start `npm start`) with the server env vars; set `CLIENT_URL` to your Vercel URL. **Vercel** (root `client`, Vite) with `VITE_API_URL`. In Atlas allow Render's outbound IPs (or `0.0.0.0/0`).

## Future improvements
Razorpay/Stripe (replace the mock block in `Review.jsx`), email/SMS tickets, seat holds with expiry, real admin accounts, PDF tickets.
