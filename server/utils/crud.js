import { Router } from 'express';
import { requireAdmin, isAdmin } from '../middleware/auth.js';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Generic REST CRUD. Public reads only see active records; writes need the admin key.
export default function crud(Model, { populate = '', search = [], soft = false, sort = '-createdAt', before, after } = {}) {
  const r = Router();
  const nf = (res) => res.status(404).json({ success: false, message: `${Model.modelName} not found` });
  r.get('/', async (req, res, next) => { try {
    const q = {};
    if (!isAdmin(req) && Model.schema.path('active')) q.active = true;
    if (req.query.search && search.length) { const rx = new RegExp(esc(String(req.query.search)), 'i'); q.$or = search.map(f => ({ [f]: rx })); }
    let c = Model.find(q).sort(sort);
    if (req.query.limit) c = c.limit(Math.min(200, +req.query.limit || 20));
    if (populate) c = c.populate(populate);
    res.json(await c);
  } catch (e) { next(e); } });
  r.get('/:id', async (req, res, next) => { try {
    const d = await Model.findById(req.params.id).populate(populate);
    d ? res.json(d) : nf(res);
  } catch (e) { next(e); } });
  r.post('/', requireAdmin, async (req, res, next) => { try {
    const d = await Model.create(before ? await before(req.body) : req.body);
    if (after) await after(d);
    res.status(201).json(d);
  } catch (e) { next(e); } });
  r.put('/:id', requireAdmin, async (req, res, next) => { try {
    const d = await Model.findById(req.params.id); if (!d) return nf(res);
    d.set(before ? await before(req.body) : req.body); await d.save();
    if (after) await after(d);
    res.json(d);
  } catch (e) { next(e); } });
  r.delete('/:id', requireAdmin, async (req, res, next) => { try {
    const d = await Model.findById(req.params.id); if (!d) return nf(res);
    if (soft) { d.active = false; await d.save(); } else await d.deleteOne();
    res.json({ success: true });
  } catch (e) { next(e); } });
  return r;
}
