import { format, parseISO } from 'date-fns';
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtTime = (t = '00:00') => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
export const fmtDate = (d) => format(parseISO(String(d).slice(0, 10)), 'd MMMM yyyy');
export const durMin = (s = '') => (+(/(\d+)h/.exec(s)?.[1] || 0)) * 60 + +(/(\d+)m/.exec(s)?.[1] || 0);
export const hour = (t) => +t.slice(0, 2);
export const PHONE = /^[6-9]\d{9}$/, EMAIL = /^\S+@\S+\.\S+$/;
