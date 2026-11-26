import { useLocation, Navigate, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Ticket from '../components/Ticket.jsx';
export default function Confirmation() {
  const b = useLocation().state?.booking;
  if (!b) return <Navigate to="/my-booking" replace />;
  return (<div className="mx-auto max-w-2xl space-y-5">
    <div className="no-print text-center"><CheckCircle className="mx-auto text-emerald-600" size={44} /><h1 className="mt-2 text-3xl font-bold">Booking Confirmed!</h1>
      <p className="text-slate-600">Save your booking ID <b>{b.bookingId}</b> and phone number to find this ticket later.</p></div>
    <Ticket b={b} /><Link to="/" className="no-print block text-center text-teal-700">Book another trip</Link></div>);
}
