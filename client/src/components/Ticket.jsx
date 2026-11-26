import { Printer, Download, Bus } from 'lucide-react';
import { fmtDate, fmtTime, inr } from '../utils/format.js';
export default function Ticket({ b, actions = true }) {
  const Row = ({ l, v }) => <div><div className="text-xs text-slate-500">{l}</div><div className="font-medium">{v}</div></div>;
  return (<div>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-teal-700 p-4 text-white"><span className="flex items-center gap-2 font-bold"><Bus size={18} />BusBook</span><span className="text-sm">Booking ID: <b>{b.bookingId}</b></span></div>
      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <Row l="Bus" v={`${b.bus?.busName} (${b.bus?.busType})`} /><Row l="Route" v={`${b.route?.source} → ${b.route?.destination}`} /><Row l="Date" v={fmtDate(b.journeyDate)} />
        <Row l="Departure" v={fmtTime(b.departureTime)} /><Row l="Boarding" v={b.boardingPoint} /><Row l="Dropping" v={b.droppingPoint} />
        <div className="sm:col-span-3"><div className="text-xs text-slate-500">Passengers</div>
          {b.passengerDetails.map(p => <div key={p.seatNumber} className="text-sm">{p.name} ({p.age}, {p.gender}) — Seat <b>{p.seatNumber}</b></div>)}</div>
        <Row l="Total" v={inr(b.totalAmount)} /><Row l="Payment" v={`${b.paymentStatus} · ${b.paymentMethod}`} /><Row l="Status" v={b.bookingStatus} />
      </div>
    </div>
    {actions && <div className="no-print mt-4 flex gap-3">
      <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-white"><Printer size={16} />Print Ticket</button>
      <button onClick={() => window.print()} title="Choose 'Save as PDF' in the print dialog" className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2"><Download size={16} />Download Ticket</button></div>}
  </div>);
}
