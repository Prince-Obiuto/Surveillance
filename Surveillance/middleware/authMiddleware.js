const jwt = require("jsonwebtoken");
const db = require("../config/db");

const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const token = header.slice(7);

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"]
        });
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session."
        });
    }

    if (!decoded.id) {
        return res.status(401).json({
            success: false,
            message: "Invalid session."
        });
    }

    db.query(
        `SELECT id, username, full_name, email, role
         FROM administrators
         WHERE id = ? AND login_allowed = 1
         LIMIT 1`,
        [decoded.id],
        (err, rows) => {
            if (err) {
                console.error("Authentication query failed:", err);

                return res.status(500).json({
                    success: false,
                    message: "Authentication service unavailable."
                });
            }

            if (!rows.length) {
                return res.status(401).json({
                    success: false,
                    message: "Account unavailable or disabled."
                });
            }

            req.admin = rows[0];
            next();
        }
    );
};

const requireHOD = (req, res, next) => {
    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    if (req.admin.role !== "HOD") {
        return res.status(403).json({
            success: false,
            message: "HOD access required."
        });
    }

    next();
};

module.exports = {
    requireAuth,
    requireHOD
};
