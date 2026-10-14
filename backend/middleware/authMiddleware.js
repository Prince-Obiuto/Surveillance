const jwt = require("jsonwebtoken");
const db = require("../config/db");

const requireAuth = (req, res, next) => {
    const authHeader = req.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+([^\s]+)$/i);
    const secret = process.env.JWT_SECRET;

    if (!match || !secret) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    let payload;
    try {
        payload = jwt.verify(match[1], secret, {
            algorithms: ["HS256"]
        });
    } catch (_error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }

    const adminId = payload && payload.sub;
    if (!adminId) {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication token."
        });
    }

    db.query(
        `SELECT id, username, full_name, email, role, login_allowed
         FROM administrators WHERE id = ? LIMIT 1`,
        [adminId],
        (err, rows) => {
            if (err) {
                console.error("Authentication lookup error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to verify administrator."
                });
            }

            if (!rows.length || Number(rows[0].login_allowed) !== 1) {
                return res.status(401).json({
                    success: false,
                    message: "Administrator account is unavailable."
                });
            }

            req.admin = rows[0];
            return next();
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
            message: "Access denied. Only HOD can perform this action."
        });
    }

    return next();
};

module.exports = { requireAuth, requireHOD };
