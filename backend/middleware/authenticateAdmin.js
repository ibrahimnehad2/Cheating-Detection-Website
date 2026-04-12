const jwt = require("jsonwebtoken");
const ADMIN_SECRET = "myadminsecret";

const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, ADMIN_SECRET);
    if (decoded.role !== "admin") {
      return res.status(401).json({ error: "Not an admin token" });
    }
    next();
  } catch (error) {
    console.error("Admin token verification failed:", error);
    return res.status(401).json({ error: "Invalid admin token" });
  }
};

module.exports = authenticateAdmin;
