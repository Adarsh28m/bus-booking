import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg } from '../services/api.js';
import { useBooking } from '../BookingContext.jsx';
import { inr, fmtDate, fmtTime } from '../utils/format.js';
export default function Seats() {
  const { scheduleId } = useParams(), [sp] = useSearchParams(), nav = useNavigate(), { setDraft } = useBooking();
  const pax = Math.min(6, Math.max(1, +sp.get('pax') || 1));
  const [sc, setSc] = useState(null), [data, setData] = useState(null), [sel, setSel] = useState([]), [err, setErr] = useState('');
  const loadSeats = useCallback(() => api.get(`/schedules/${scheduleId}/seats`).then(r => { setData(r.data); setSel(s => s.filter(n => !r.data.seats.find(x => x.seatNumber === n)?.booked)); }).catch(e => setErr(errMsg(e))), [scheduleId]);
  useEffect(() => { api.get(`/schedules/${scheduleId}`).then(r => setSc(r.data)).catch(e => setErr(errMsg(e))); loadSeats(); }, [scheduleId, loadSeats]);
  if (err) return <p role="alert" className="text-red-600">{err}</p>;
  if (!sc || !data) return <p className="text-slate-500">Loading seat layout…</p>;
  const cols = Math.max(...data.seats.map(s => s.column)), gap = cols === 3 ? 1 : 2, rows = {};
  data.seats.forEach(s => (rows[s.row] ||= []).push(s));
  const toggle = (s) => {
    if (s.booked) return;
    if (sel.includes(s.seatNumber)) return setSel(sel.filter(x => x !== s.seatNumber));
    if (sel.length >= pax) return toast.info(`You are booking for ${pax} passenger${pax > 1 ? 's' : ''}.`);
    setSel([...sel, s.seatNumber]);
  };
  const cls = (s) => s.booked ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : sel.includes(s.seatNumber) ? 'bg-blue-600 text-white border-blue-700' : 'bg-green-100 border-green-500 text-green-800 hover:bg-green-200';
  return (<div className="mx-auto max-w-3xl space-y-5">
    <div><h1 className="text-2xl font-bold">{sc.bus.busName}</h1><p className="text-slate-600">{sc.route.source} → {sc.route.destination} · {fmtDate(sc.journeyDate)} · {fmtTime(sc.departureTime)}</p></div>
    <div className="grid gap-6 md:grid-cols-[1fr_240px]">
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-4 rounded-lg bg-slate-100 py-1 text-center text-xs font-semibold text-slate-500">FRONT · DRIVER</div>
        <div className="space-y-2">{Object.entries(rows).map(([row, seats]) => <div key={row} className="flex items-center justify-center gap-2">
          {seats.map((s, i) => <div key={s.seatNumber} className={i === gap ? 'ml-8' : ''}><button onClick={() => toggle(s)} disabled={s.booked} aria-label={`Seat ${s.seatNumber}${s.booked ? ' booked' : ''}`}
            className={`border text-xs font-medium rounded-md ${s.seatType === 'Sleeper' ? 'h-12 w-16' : 'h-10 w-10'} ${cls(s)}`}>{s.seatNumber}</button></div>)}</div>)}</div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs"><span><i className="mr-1 inline-block h-3 w-3 rounded bg-green-300" />Available</span><span><i className="mr-1 inline-block h-3 w-3 rounded bg-blue-600" />Selected</span><span><i className="mr-1 inline-block h-3 w-3 rounded bg-slate-300" />Booked</span></div></div>
      <div className="h-fit space-y-3 rounded-2xl border bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">{data.availableSeats} of {data.totalSeats} seats available</div>
        <div><div className="text-xs text-slate-500">Selected seats ({sel.length}/{pax})</div><div className="font-medium">{sel.length ? sel.join(', ') : '—'}</div></div>
        <div><div className="text-xs text-slate-500">Total</div><div className="text-2xl font-bold">{inr(sc.price * sel.length)}</div></div>
        <button disabled={sel.length !== pax} onClick={() => { setDraft({ schedule: sc, seats: sel }); nav('/booking/passengers'); }} className="w-full rounded-lg bg-teal-700 py-2.5 font-medium text-white disabled:opacity-50">Continue</button>
        {sel.length !== pax && <p className="text-xs text-slate-500">Select exactly {pax} seat{pax > 1 ? 's' : ''} to continue.</p>}</div></div>
  </div>);
}
