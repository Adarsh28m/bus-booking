import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'react-toastify';
import api, { errMsg } from '../services/api.js';
import Ticket from '../components/Ticket.jsx';
import { inr, fmtDate, fmtTime } from '../utils/format.js';

const inp = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const BUS_TYPES = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'AC Semi-Sleeper', 'Volvo AC'];
const COLORS = ['#0f766e', '#f59e0b', '#ef4444', '#6366f1', '#64748b'];

const Box = ({ t, children }) => <div className="rounded-2xl border bg-white p-4 shadow-sm"><h3 className="mb-2 text-sm font-semibold">{t}</h3><div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>;
const Bars = ({ t, data, y = 'value', color = '#0f766e' }) => <Box t={t}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey={y} fill={color} radius={[4, 4, 0, 0]} /></BarChart></Box>;

function Overview() {
  const [d, setD] = useState(null), [a, setA] = useState(null), [err, setErr] = useState('');
  useEffect(() => { Promise.all([api.get('/admin/dashboard'), api.get('/admin/analytics')]).then(([x, y]) => { setD(x.data); setA(y.data); }).catch(e => setErr(errMsg(e))); }, []);
  if (err) return <p className="text-red-600">{err}</p>;
  if (!d) return <p className="text-slate-500">Loading…</p>;
  const tiles = [['Total Buses', d.totalBuses], ['Active Buses', d.activeBuses], ['Total Routes', d.totalRoutes], ["Today's Schedules", d.todaySchedules], ["Today's Bookings", d.todayBookings],
    ['Total Revenue', inr(d.totalRevenue)], ['Cancelled', d.cancelledBookings], ['Available Seats', d.availableSeats]];
  return (<div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{tiles.map(([l, v]) => <div key={l} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-slate-500">{l}</div></div>)}</div>
    <p className="text-sm text-slate-600">Total bookings: <b>{a.totalBookings}</b> · Most popular route: <b>{a.mostPopularRoute}</b> · Average occupancy: <b>{a.averageOccupancy}%</b></p>
    <div className="grid gap-4 md:grid-cols-2">
      <Bars t="Bookings per day" data={a.bookingsPerDay} y="bookings" /><Bars t="Revenue per day (₹)" data={a.bookingsPerDay} y="revenue" color="#f59e0b" />
      <Bars t="Popular routes" data={a.popularRoutes} color="#6366f1" /><Bars t="Bus occupancy (%)" data={a.occupancy} color="#0f766e" />
      <Box t="Booking status"><PieChart><Pie data={a.bookingStatus} dataKey="value" nameKey="name" label>{a.bookingStatus.map((_, i) => <Cell key={i} fill={COLORS[i % 5]} />)}</Pie><Tooltip /></PieChart></Box>
      <Bars t="Most popular operators" data={a.operators} color="#ef4444" /></div></div>);
}

// Generic table + form used for buses, routes and schedules
function Crud({ title, path, fields, columns }) {
  const [rows, setRows] = useState([]), [q, setQ] = useState(''), [form, setForm] = useState(null), [err, setErr] = useState('');
  const load = () => api.get(path, { params: { search: q || undefined } }).then(r => { setRows(r.data); setErr(''); }).catch(e => setErr(errMsg(e)));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);
  const open = (row) => setForm(row ? { _id: row._id, ...Object.fromEntries(fields.map(f => [f.name,
    f.type === 'csv' ? (row[f.name] || []).join(', ') : f.type === 'date' ? String(row[f.name]).slice(0, 10) : f.type === 'select' ? (row[f.name]?._id || row[f.name] || '') : row[f.name] ?? ''])) }
    : Object.fromEntries(fields.map(f => [f.name, f.def ?? ''])));
  async function save(e) {
    e.preventDefault();
    const body = Object.fromEntries(fields.map(f => [f.name, f.type === 'csv' ? form[f.name].split(',').map(s => s.trim()).filter(Boolean) : f.type === 'number' ? +form[f.name] : form[f.name]]));
    try { form._id ? await api.put(`${path}/${form._id}`, body) : await api.post(path, body); toast.success('Saved'); setForm(null); load(); } catch (x) { toast.error(errMsg(x)); }
  }
  async function del(row) { if (!confirm('Delete / deactivate this record?')) return; try { await api.delete(`${path}/${row._id}`); load(); } catch (x) { toast.error(errMsg(x)); } }
  return (<div className="space-y-3">
    <div className="flex gap-2"><input className={`${inp} flex-1`} placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
      <button onClick={() => open()} className="rounded-lg bg-teal-700 px-4 text-sm text-white">Add {title.slice(0, -1)}</button></div>
    {err && <p className="text-red-600">{err}</p>}
    {form && <form onSubmit={save} className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(f => <label key={f.name} className="text-sm">{f.label}
        {f.type === 'select' ? <select required className={inp} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}><option value="">Select</option>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          : f.type === 'bool' ? <input type="checkbox" className="ml-2" checked={!!form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.checked })} />
          : <input required={!f.optional} className={inp} type={f.type === 'csv' ? 'text' : f.type} step={f.step} value={form[f.name]} placeholder={f.type === 'csv' ? 'comma, separated' : ''} onChange={e => setForm({ ...form, [f.name]: e.target.value })} />}</label>)}
      <div className="flex items-end gap-2"><button className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">{form._id ? 'Update' : 'Add'}</button><button type="button" onClick={() => setForm(null)} className="text-sm text-slate-600">Cancel</button></div></form>}
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{columns.map(c => <th key={c[0]} className="p-3">{c[0]}</th>)}<th className="p-3 text-right">Actions</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r._id} className="border-t">{columns.map(c => <td key={c[0]} className="p-3">{c[1](r)}</td>)}
        <td className="space-x-3 p-3 text-right"><button className="text-teal-700" onClick={() => open(r)}>Edit</button><button className="text-red-600" onClick={() => del(r)}>Delete</button></td></tr>)}</tbody></table>
      {!rows.length && <p className="p-8 text-center text-slate-500">Nothing here yet.</p>}</div></div>);
}

function Bookings() {
  const [rows, setRows] = useState([]), [q, setQ] = useState(''), [view, setView] = useState(null), [err, setErr] = useState('');
  const load = () => api.get('/bookings', { params: { search: q || undefined } }).then(r => setRows(r.data)).catch(e => setErr(errMsg(e)));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);
  const act = async (id, a) => { try { await api.patch(`/bookings/${id}/${a}`); load(); } catch (x) { toast.error(errMsg(x)); } };
  return (<div className="space-y-3">
    <input className={inp} placeholder="Search by booking ID or phone…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />{err && <p className="text-red-600">{err}</p>}
    {view && <div className="rounded-2xl border bg-slate-100 p-4"><Ticket b={view} actions={false} /><button className="mt-3 text-sm text-slate-600" onClick={() => setView(null)}>Close</button></div>}
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Booking ID', 'Passenger', 'Bus', 'Route', 'Date', 'Seats', 'Amount', 'Payment', 'Status', 'Actions'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
      <tbody>{rows.map(b => <tr key={b._id} className="border-t"><td className="p-3 font-mono text-xs">{b.bookingId}</td><td>{b.contactName}</td><td>{b.bus?.busName}</td><td>{b.route?.source} → {b.route?.destination}</td><td>{fmtDate(b.journeyDate)}</td>
        <td>{b.passengerDetails.map(p => p.seatNumber).join(', ')}</td><td>{inr(b.totalAmount)}</td><td>{b.paymentStatus}</td><td>{b.bookingStatus}</td>
        <td className="space-x-2 p-3"><button className="text-teal-700" onClick={() => setView(b)}>View</button>
          {b.bookingStatus === 'Confirmed' && <><button className="text-red-600" onClick={() => confirm('Cancel this booking?') && act(b.bookingId, 'cancel')}>Cancel</button><button className="text-slate-700" onClick={() => act(b.bookingId, 'complete')}>Complete</button></>}</td></tr>)}</tbody></table>
      {!rows.length && <p className="p-8 text-center text-slate-500">No bookings found.</p>}</div></div>);
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('adminKey')), [key, setKey] = useState(''), [tab, setTab] = useState('Overview'), [opts, setOpts] = useState(null), [err, setErr] = useState('');
  useEffect(() => {
    if (!authed) return;
    Promise.all([api.get('/buses'), api.get('/routes')]).then(([b, r]) => setOpts({ buses: b.data, routes: r.data }))
      .catch(e => { if (e.response?.status === 401) { sessionStorage.removeItem('adminKey'); setAuthed(false); } setErr(errMsg(e)); });
  }, [authed, tab]);
  async function login(e) {
    e.preventDefault(); sessionStorage.setItem('adminKey', key);
    try { await api.get('/admin/dashboard'); setErr(''); setAuthed(true); } catch (x) { sessionStorage.removeItem('adminKey'); setErr(x.response?.status === 401 ? 'Admin key is incorrect.' : errMsg(x)); }
  }
  if (!authed) return (<form onSubmit={login} className="mx-auto max-w-sm space-y-3 rounded-2xl border bg-white p-6 shadow-sm"><h1 className="text-xl font-bold">Admin access</h1>
    {err && <p className="text-sm text-red-600">{err}</p>}<input type="password" aria-label="Admin key" placeholder="Admin access key" className={inp} value={key} onChange={e => setKey(e.target.value)} />
    <button className="w-full rounded-lg bg-teal-700 py-2 text-white">Open admin</button></form>);

  const busFields = [{ name: 'operatorName', label: 'Operator Name' }, { name: 'busName', label: 'Bus Name' }, { name: 'busNumber', label: 'Bus Number' }, { name: 'busType', label: 'Bus Type', type: 'select', options: BUS_TYPES.map(t => [t, t]) },
    { name: 'totalSeats', label: 'Total Seats', type: 'number' }, { name: 'amenities', label: 'Amenities', type: 'csv', optional: true }, { name: 'rating', label: 'Rating', type: 'number', step: '0.1', def: 4 }, { name: 'active', label: 'Active', type: 'bool', def: true }];
  const routeFields = [{ name: 'source', label: 'Source' }, { name: 'destination', label: 'Destination' }, { name: 'distance', label: 'Distance (km)', type: 'number' }, { name: 'duration', label: 'Duration (e.g. 3h 45m)' },
    { name: 'boardingPoints', label: 'Boarding Points', type: 'csv' }, { name: 'droppingPoints', label: 'Dropping Points', type: 'csv' }, { name: 'active', label: 'Active', type: 'bool', def: true }];
  const schedFields = opts && [{ name: 'bus', label: 'Bus', type: 'select', options: opts.buses.map(b => [b._id, b.busName]) }, { name: 'route', label: 'Route', type: 'select', options: opts.routes.map(r => [r._id, `${r.source} → ${r.destination}`]) },
    { name: 'journeyDate', label: 'Journey Date', type: 'date' }, { name: 'departureTime', label: 'Departure', type: 'time' }, { name: 'arrivalTime', label: 'Arrival', type: 'time' }, { name: 'price', label: 'Price (₹)', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Boarding', 'Completed', 'Cancelled'].map(s => [s, s]), def: 'Scheduled' }];
  const tabs = ['Overview', 'Buses', 'Routes', 'Schedules', 'Bookings'];
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl font-bold">Admin</h1><button className="text-sm text-slate-500" onClick={() => { sessionStorage.removeItem('adminKey'); setAuthed(false); }}>Sign out</button></div>
    <div className="flex flex-wrap gap-2">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm ${tab === t ? 'bg-teal-700 text-white' : 'border bg-white'}`}>{t}</button>)}</div>
    {tab === 'Overview' && <Overview />}
    {tab === 'Buses' && <Crud key="b" title="Buses" path="/buses" fields={busFields} columns={[['Operator', r => r.operatorName], ['Bus', r => r.busName], ['Number', r => r.busNumber], ['Type', r => r.busType], ['Seats', r => r.totalSeats], ['Rating', r => r.rating], ['Active', r => (r.active ? 'Yes' : 'No')]]} />}
    {tab === 'Routes' && <Crud key="r" title="Routes" path="/routes" fields={routeFields} columns={[['Route', r => `${r.source} → ${r.destination}`], ['Distance', r => `${r.distance} km`], ['Duration', r => r.duration], ['Boarding', r => r.boardingPoints.join(', ')]]} />}
    {tab === 'Schedules' && (opts ? <Crud key="s" title="Schedules" path="/schedules" fields={schedFields} columns={[['Bus', r => r.bus?.busName], ['Route', r => `${r.route?.source} → ${r.route?.destination}`], ['Date', r => fmtDate(r.journeyDate)], ['Time', r => `${fmtTime(r.departureTime)} → ${fmtTime(r.arrivalTime)}`], ['Price', r => inr(r.price)], ['Status', r => r.status]]} /> : <p>{err || 'Loading…'}</p>)}
    {tab === 'Bookings' && <Bookings />}
  </div>);
}
