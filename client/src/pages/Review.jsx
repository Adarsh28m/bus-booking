import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import { useBooking } from '../BookingContext.jsx';
import { inr, fmtDate, fmtTime } from '../utils/format.js';
export default function Review() {
  const { draft, setDraft } = useBooking(), nav = useNavigate();
  const [pay, setPay] = useState('Pay at Counter'), [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const { schedule: sc, passengers: ps } = draft;
  if (!sc || !ps) return <Navigate to="/" replace />;
  async function confirm() {
    setBusy(true);
    try {
      // Mock payment step — swap this block for Razorpay/Stripe later; the booking API call stays the same.
      if (pay === 'Demo Online Payment') { setMsg('Processing demo payment…'); await new Promise(r => setTimeout(r, 1200)); toast.success('Payment Successful'); }
      const { data } = await api.post('/bookings', { scheduleId: sc._id, passengers: ps, contact: draft.contact, boardingPoint: draft.boardingPoint, droppingPoint: draft.droppingPoint, paymentMethod: pay });
      setDraft({}); nav('/booking/confirmed', { state: { booking: data }, replace: true });
    } catch (e) {
      toast.error(errMsg(e));
      if (e.response?.status === 409) nav(`/bus/${sc._id}/seats?pax=${ps.length}`); // refresh the seat layout
    } finally { setBusy(false); setMsg(''); }
  }
  const Row = ({ l, v }) => <div className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-slate-500">{l}</span><span className="text-right font-medium">{v}</span></div>;
  return (<div className="mx-auto max-w-xl space-y-5">
    <h1 className="text-2xl font-bold">Review booking</h1>
    <div className="divide-y rounded-2xl border bg-white p-5 shadow-sm">
      <Row l="Bus" v={sc.bus.busName} /><Row l="Route" v={`${sc.route.source} → ${sc.route.destination}`} /><Row l="Date" v={fmtDate(sc.journeyDate)} /><Row l="Departure" v={fmtTime(sc.departureTime)} />
      <Row l="Passengers" v={<div>{ps.map(p => <div key={p.seatNumber}>{p.name} — Seat {p.seatNumber}</div>)}</div>} /><Row l="Boarding" v={draft.boardingPoint} /><Row l="Dropping" v={draft.droppingPoint} />
      <Row l="Fare" v={`${inr(sc.price)} × ${ps.length}`} /><Row l="Total" v={<span className="text-lg font-bold">{inr(sc.price * ps.length)}</span>} /></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-2 font-semibold">Payment method</div>
      {['Pay at Counter', 'Demo Online Payment'].map(m => <label key={m} className="flex items-center gap-2 py-1 text-sm"><input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} />{m}</label>)}</div>
    <button disabled={busy} onClick={confirm} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 font-medium text-white disabled:opacity-60">
      {busy ? <><Loader2 className="animate-spin" size={18} />{msg || 'Confirming…'}</> : pay === 'Demo Online Payment' ? 'Pay & Confirm Booking' : 'Confirm Booking'}</button>
  </div>);
}
