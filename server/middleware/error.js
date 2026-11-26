export const notFound = (req, res) => res.status(404).json({ success: false, message: 'Route not found' });
export function errorHandler(err, req, res, next) {
  console.error(err);
  let status = err.status || 500, message = err.status ? err.message : 'Something went wrong on the server.';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid ID'; }
  else if (err.code === 11000) { status = 409; message = 'That record already exists.'; }
  res.status(status).json({ success: false, message });
}
