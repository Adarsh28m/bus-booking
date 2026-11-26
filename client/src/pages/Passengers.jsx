import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../BookingContext.jsx';
import { PHONE, EMAIL } from '../utils/format.js';
const inp = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2';
export default function Passengers() {
  const { draft, setDraft } = useBooking(), nav = useNavigate();
  const { schedule: sc, seats } = draft;
  const [pas, setPas] = useState(() => (draft.passengers || (seats || []).map(seatNumber => ({ seatNumber, name: '', age: '', gender: '' }))));
  const [c, setC] = useState(draft.contact || { name: '', email: '', phone: '' });
  const [bp, setBp] = useState(draft.boardingPoint || ''), [dp, setDp] = useState(draft.droppingPoint || ''), [err, setErr] = useState('');
  if (!sc || !seats?.length) return <Navigate to="/" replace />;
  const upd = (i, k, v) => setPas(pas.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const next = (e) => {
    e.preventDefault();
    if (pas.some(p => !p.name.trim() || !(+p.age >= 1 && +p.age <= 120) || !p.gender)) return setErr('Enter name, a valid age (1–120) and gender for every passenger.');
    if (!c.name.trim()) return setErr('Enter a contact name.');
    if (!EMAIL.test(c.email)) return setErr('Enter a valid email address.');
    if (!PHONE.test(c.phone)) return setErr('Enter a valid 10-digit mobile number.');
    if (!bp || !dp) return setErr('Choose boarding and dropping points.');
    setDraft({ ...draft, passengers: pas.map(p => ({ ...p, age: +p.age })), contact: c, boardingPoint: bp, droppingPoint: dp }); nav('/booking/review');
  };
  return (<form onSubmit={next} noValidate className="mx-auto max-w-2xl space-y-5">
    <h1 className="text-2xl font-bold">Passenger details</h1>
    {pas.map((p, i) => <div key={p.seatNumber} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="font-semibold">Passenger {i + 1} · Seat {p.seatNumber}</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-sm sm:col-span-1">Name<input className={inp} value={p.name} onChange={e => upd(i, 'name', e.target.value)} /></label>
        <label className="text-sm">Age<input type="number" className={inp} value={p.age} onChange={e => upd(i, 'age', e.target.value)} /></label>
        <label className="text-sm">Gender<select className={inp} value={p.gender} onChange={e => upd(i, 'gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label></div></div>)}
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="font-semibold">Contact details</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-sm">Name<input className={inp} value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></label>
        <label className="text-sm">Email<input type="email" className={inp} value={c.email} onChange={e => setC({ ...c, email: e.target.value })} /></label>
        <label className="text-sm">Phone<input className={inp} inputMode="numeric" maxLength={10} value={c.phone} onChange={e => setC({ ...c, phone: e.target.value })} /></label></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Boarding point<select className={inp} value={bp} onChange={e => setBp(e.target.value)}><option value="">Select</option>{sc.boardingPoints.map(p => <option key={p.name}>{p.name}</option>)}</select></label>
        <label className="text-sm">Dropping point<select className={inp} value={dp} onChange={e => setDp(e.target.value)}><option value="">Select</option>{sc.droppingPoints.map(p => <option key={p.name}>{p.name}</option>)}</select></label></div></div>
    {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
    <button className="w-full rounded-lg bg-teal-700 py-3 font-medium text-white">Continue to Review</button>
  </form>);
}
