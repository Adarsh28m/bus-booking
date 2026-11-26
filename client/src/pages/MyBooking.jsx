import { useState } from 'react';
import api, { errMsg } from '../services/api.js';
import Ticket from '../components/Ticket.jsx';
import { toast } from 'react-toastify';
import { PHONE } from '../utils/format.js';
const inp = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2';
export default function MyBooking() {
  const [id, setId] = useState(''), [phone, setPhone] = useState(''), [b, setB] = useState(null), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function find(e) {
    e.preventDefault(); setErr(''); setB(null);
    if (!id.trim()) return setErr('Enter your booking ID.');
    if (!PHONE.test(phone)) return setErr('Enter the 10-digit phone number used for the booking.');
    setBusy(true);
    try { setB((await api.get(`/bookings/${id.trim().toUpperCase()}`, { params: { phone } })).data); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  }
  async function cancel() {
    if (!confirm('Cancel this booking?')) return;
    try { setB((await api.patch(`/bookings/${b.bookingId}/cancel`, null, { params: { phone } })).data); toast.success('Booking cancelled'); } catch (x) { toast.error(errMsg(x)); }
  }
  return (<div className="mx-auto max-w-2xl space-y-5">
    <form onSubmit={find} noValidate className="no-print space-y-3 rounded-2xl border bg-white p-5 shadow-sm"><h1 className="text-xl font-bold">Find My Booking</h1>
      <label className="block text-sm">Booking ID<input className={inp} placeholder="BUS-20261015-8F42K" value={id} onChange={e => setId(e.target.value)} /></label>
      <label className="block text-sm">Phone Number<input className={inp} inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(e.target.value)} /></label>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white disabled:opacity-60">{busy ? 'Searching…' : 'Find Booking'}</button></form>
    {b && <><Ticket b={b} />{b.bookingStatus === 'Confirmed' && <button onClick={cancel} className="no-print text-sm text-red-600 underline">Cancel booking</button>}</>}
  </div>);
}
