const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Extract token from Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: "No authorization header provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Verify token with JWT_SECRET from environment
    const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_in_production_123456";
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user data to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Token has expired. Please login again." 
      });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false,
        message: "Invalid or malformed token" 
      });
    } else {
      return res.status(401).json({ 
        success: false,
        message: "Invalid or expired token" 
      });
    }
  }
};
