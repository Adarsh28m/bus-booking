import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import { inr, fmtTime, durMin, hour } from '../utils/format.js';
const sel = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const SLOTS = { Morning: [5, 12], Afternoon: [12, 17], Evening: [17, 21], Night: [21, 29] };
const hr = (t) => { const h = hour(t); return h < 5 ? h + 24 : h; };
export default function Buses() {
  const [sp] = useSearchParams(), nav = useNavigate();
  const from = sp.get('from'), to = sp.get('to'), date = sp.get('date'), pax = sp.get('pax') || 1;
  const [list, setList] = useState(null), [err, setErr] = useState('');
  const [sort, setSort] = useState('price'), [type, setType] = useState([]), [slots, setSlots] = useState([]), [ams, setAms] = useState([]), [max, setMax] = useState(5000);
  useEffect(() => {
    if (!from || !to || !date) { setErr('Start from the home page to search for buses.'); return; }
    setList(null); setErr('');
    api.get('/buses/search', { params: { from, to, date } }).then(r => setList(r.data)).catch(e => setErr(errMsg(e)));
  }, [from, to, date]);
  const tog = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const shown = useMemo(() => {
    const T = { AC: b => /AC/.test(b) && !/Non-AC/.test(b), 'Non-AC': b => /Non-AC/.test(b), Sleeper: b => /Sleeper/.test(b), Seater: b => /Seater/.test(b) };
    const out = (list || []).filter(s => s.price <= max && (!type.length || type.some(t => T[t](s.bus.busType))) &&
      (!slots.length || slots.some(k => hr(s.departureTime) >= SLOTS[k][0] && hr(s.departureTime) < SLOTS[k][1])) &&
      ams.every(a => s.bus.amenities.some(x => x.toLowerCase().includes(a.toLowerCase()))));
    const key = { price: s => s.price, departure: s => hr(s.departureTime) * 60 + +s.departureTime.slice(3), arrival: s => s.arrivalTime, rating: s => -s.bus.rating, duration: s => durMin(s.route.duration) }[sort];
    return out.sort((a, b) => (key(a) > key(b) ? 1 : -1));
  }, [list, sort, type, slots, ams, max]);
  const Chk = ({ items, arr, set, title }) => <div><div className="mb-1 text-sm font-semibold">{title}</div>{items.map(i => <label key={i} className="mr-3 flex items-center gap-1 text-sm"><input type="checkbox" checked={arr.includes(i)} onChange={() => tog(arr, set, i)} />{i}</label>)}</div>;
  return (<div className="space-y-5">
    <h1 className="text-2xl font-bold">{from} → {to} <span className="text-base font-normal text-slate-500">{date}</span></h1>
    {err && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{err} <Link to="/" className="underline">Back to search</Link></div>}
    {!err && !list && <p className="text-slate-500">Searching buses…</p>}
    {list && <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <aside className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
        <label className="block text-sm font-semibold">Sort by<select className={`${sel} mt-1 w-full font-normal`} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="price">Cheapest</option><option value="departure">Departure</option><option value="arrival">Arrival</option><option value="rating">Rating</option><option value="duration">Duration</option></select></label>
        <Chk title="Bus type" items={['AC', 'Non-AC', 'Sleeper', 'Seater']} arr={type} set={setType} />
        <Chk title="Departure" items={Object.keys(SLOTS)} arr={slots} set={setSlots} />
        <Chk title="Amenities" items={['WiFi', 'Charging', 'AC', 'Water Bottle']} arr={ams} set={setAms} />
        <label className="block text-sm font-semibold">Max price: {inr(max)}<input type="range" min="100" max="5000" step="50" value={max} onChange={e => setMax(+e.target.value)} className="w-full" /></label></aside>
      <div className="space-y-4">
        {!shown.length && <p className="rounded-2xl border border-dashed p-10 text-center text-slate-500">No buses found for this route and date. Try another date or loosen the filters.</p>}
        {shown.map(s => <div key={s._id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm text-slate-500">{s.bus.operatorName}</div><h3 className="font-semibold">{s.bus.busName}</h3><div className="text-xs text-slate-500">{s.bus.busType}</div></div>
            <div className="flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-sm text-green-800"><Star size={14} />{s.bus.rating}</div></div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1"><span className="font-medium">{fmtTime(s.departureTime)} <ArrowRight className="inline" size={14} /> {fmtTime(s.arrivalTime)}</span><span className="text-sm text-slate-500">{s.route.duration}</span>
            <span className="text-xs text-slate-500">Boarding: {s.boardingPoints[0]?.name} · Dropping: {s.droppingPoints[0]?.name}</span></div>
          <div className="mt-4 flex items-center justify-between"><div><span className="text-xl font-bold">{inr(s.price)}</span><span className={`ml-3 text-sm ${s.availableSeats < pax ? 'text-red-600' : 'text-slate-600'}`}>{s.availableSeats} seats available</span></div>
            <button disabled={s.availableSeats < pax} onClick={() => nav(`/bus/${s._id}/seats?pax=${pax}`)} className="rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800 disabled:opacity-50">Select Seats</button></div></div>)}</div></div>}
  </div>);
}
