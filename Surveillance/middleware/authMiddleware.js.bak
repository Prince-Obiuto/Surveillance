const db = require("../config/db");

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const requireAuth = (req, res, next) => {

    // --------------------------------------
    // Get admin ID from request
    // --------------------------------------

    const adminId =
        req.headers["admin-id"] ||
        req.body.admin_id;


    // --------------------------------------
    // Check if admin ID exists
    // --------------------------------------

    if (!adminId) {

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }


    // --------------------------------------
    // Find administrator
    // --------------------------------------

    const sql = `
        SELECT
            id,
            username,
            full_name,
            email,
            role
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        sql,
        [adminId],
        (err, results) => {

            if (err) {

                console.error(
                    "Authentication error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            // ----------------------------------
            // Administrator not found
            // ----------------------------------

            if (results.length === 0) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid administrator."
                });

            }


            // ----------------------------------
            // Save administrator in request
            // ----------------------------------

            req.admin = results[0];


            // ----------------------------------
            // Continue
            // ----------------------------------

            next();

        }
    );

};


// ==========================================
// HOD ONLY
// ==========================================

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
            message:
                "Access denied. Only HOD can perform this action."
        });

    }


    next();

};


module.exports = {
    requireAuth,
    requireHOD
};