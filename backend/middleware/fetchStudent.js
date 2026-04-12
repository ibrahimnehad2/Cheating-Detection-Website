var jwt = require('jsonwebtoken');
const JWT_SECRET = 'elephantismyfavoritanimal';

const fetchStudent = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).send({ error: 'Please authenticate with a valid token' });
  }
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    console.error(error.message);
    return res.status(401).send({ error: "Invalid student token" });
  }
};

module.exports = fetchStudent;
