export const isAdmin = (req) => !!process.env.ADMIN_KEY && req.get('x-admin-key') === process.env.ADMIN_KEY;
export function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ success: false, message: 'Admin access key required.' });
  next();
}
