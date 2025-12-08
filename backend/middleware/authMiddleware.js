// backend/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });

  jwt.verify(token, process.env.JWT_SECRET || "secret_key", (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Token invalid or expired" });
    req.user = decoded; // contains {id, role}
    next();
  });
};

module.exports = { verifyToken };
