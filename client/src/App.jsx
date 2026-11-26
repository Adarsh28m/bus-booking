import { useState } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { Bus, Menu, X } from 'lucide-react';
import Home from './pages/Home.jsx';
import Buses from './pages/Buses.jsx';
import Seats from './pages/Seats.jsx';
import Passengers from './pages/Passengers.jsx';
import Review from './pages/Review.jsx';
import Confirmation from './pages/Confirmation.jsx';
import MyBooking from './pages/MyBooking.jsx';
import Admin from './pages/Admin.jsx';

const links = [['/', 'Home'], ['/buses', 'Search Buses'], ['/my-booking', 'My Booking'], ['/admin', 'Admin']];
export default function App() {
  const [open, setOpen] = useState(false);
  const cls = ({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-medium text-teal-800' : 'text-slate-600 hover:text-slate-900'}`;
  return (<div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur"><nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-teal-700"><Bus />BusBook</Link>
      <div className="hidden gap-1 md:flex">{links.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={cls}>{l}</NavLink>)}</div>
      <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></nav>
      {open && <div className="flex flex-col border-t px-4 pb-3 md:hidden" onClick={() => setOpen(false)}>{links.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={cls}>{l}</NavLink>)}</div>}</header>
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><Routes>
      <Route path="/" element={<Home />} /><Route path="/buses" element={<Buses />} /><Route path="/bus/:scheduleId/seats" element={<Seats />} />
      <Route path="/booking/passengers" element={<Passengers />} /><Route path="/booking/review" element={<Review />} /><Route path="/booking/confirmed" element={<Confirmation />} />
      <Route path="/my-booking" element={<MyBooking />} /><Route path="/admin" element={<Admin />} />
      <Route path="*" element={<div className="py-20 text-center"><h1 className="text-4xl font-bold">404</h1><p className="mt-2 text-slate-600">This page doesn't exist.</p><Link to="/" className="mt-4 inline-block text-teal-700">Go home</Link></div>} />
    </Routes></main>
    <footer className="border-t bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-600">
      <div><b className="text-teal-700">BusBook</b><div>Simple, reliable bus booking.</div></div>
      <div className="flex gap-4">{['About', 'Contact', 'Terms', 'Privacy', 'Support'].map(l => <span key={l}>{l}</span>)}</div></div></footer>
  </div>);
}
