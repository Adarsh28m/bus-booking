import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { toast } from 'react-toastify';
import { Search, ArrowRight } from 'lucide-react';
import api from '../services/api.js';
const inp = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2';
export default function Home() {
  const nav = useNavigate();
  const [f, setF] = useState({ from: '', to: '', date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), pax: 1 });
  const [routes, setRoutes] = useState([]), [ops, setOps] = useState([]);
  useEffect(() => {
    api.get('/routes', { params: { limit: 5 } }).then(r => setRoutes(r.data)).catch(() => {});
    api.get('/buses').then(r => setOps([...new Set(r.data.map(b => b.operatorName))])).catch(() => {});
  }, []);
  const go = (v) => nav(`/buses?from=${encodeURIComponent(v.from)}&to=${encodeURIComponent(v.to)}&date=${v.date}&pax=${v.pax}`);
  const submit = (e) => {
    e.preventDefault();
    if (!f.from.trim() || !f.to.trim()) return toast.error('Enter both From and To.');
    if (f.from.trim().toLowerCase() === f.to.trim().toLowerCase()) return toast.error('Source and destination cannot be the same.');
    if (f.date < format(new Date(), 'yyyy-MM-dd')) return toast.error('Journey date cannot be in the past.');
    go(f);
  };
  return (<div className="space-y-12">
    <section className="rounded-3xl bg-teal-700 px-6 py-12 text-white">
      <h1 className="text-4xl font-bold sm:text-5xl">Book Your Bus Journey</h1><p className="mt-3 text-teal-100">Search buses, choose your seat and travel with ease.</p>
      <form onSubmit={submit} className="mt-8 grid gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-lg sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm">From<input className={inp} placeholder="Mumbai" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></label>
        <label className="text-sm">To<input className={inp} placeholder="Pune" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></label>
        <label className="text-sm">Journey Date<input type="date" className={inp} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label>
        <label className="text-sm">Passengers<select className={inp} value={f.pax} onChange={e => setF({ ...f, pax: e.target.value })}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n}>{n}</option>)}</select></label>
        <button className="flex items-center justify-center gap-2 self-end rounded-lg bg-teal-700 py-2.5 font-medium text-white hover:bg-teal-800"><Search size={18} />Search Buses</button>
      </form></section>
    <section><h2 className="mb-3 text-xl font-bold">Popular Routes</h2><div className="flex flex-wrap gap-3">
      {routes.map(r => <button key={r._id} onClick={() => setF({ ...f, from: r.source, to: r.destination })} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm hover:border-teal-500">{r.source}<ArrowRight size={14} />{r.destination}</button>)}</div></section>
    <section><h2 className="mb-3 text-xl font-bold">Popular Bus Operators</h2><div className="flex flex-wrap gap-3">{ops.map(o => <span key={o} className="rounded-xl bg-white px-4 py-2 shadow-sm border">{o}</span>)}</div></section>
  </div>);
}
