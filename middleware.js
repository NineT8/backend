const jwt = require('jsonwebtoken');

function middleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(400).json({ error: 'Token not found.' });
  }

  const token = authHeader.split(' ')[1]; // Get the token after 'Bearer'

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

module.exports = { middleware };
