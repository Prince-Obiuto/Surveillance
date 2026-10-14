const db = require("../config/db");

// ==========================================
// CHECK IF HUMAN DETECTION IS ACTIVE
// ==========================================

const isDetectionActive = (cameraId, callback) => {

    const sql = `
        SELECT
            detection_enabled,
            start_time,
            end_time
        FROM detection_schedule
        WHERE camera_id = ?
        LIMIT 1
    `;

    db.query(sql, [cameraId], (err, results) => {

        if (err) {

            console.error(
                "Detection Schedule Check Error:",
                err
            );

            return callback(err, false);

        }

        // ======================================
        // No schedule found
        // ======================================

        if (results.length === 0) {

            console.log(
                `No detection schedule found for Camera ${cameraId}`
            );

            return callback(null, false);

        }

        const schedule = results[0];

        // ======================================
        // Detection manually disabled
        // ======================================

        if (!schedule.detection_enabled) {

            return callback(null, false);

        }

        // ======================================
        // Current time
        // ======================================

        const now = new Date();

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();


        // ======================================
        // Convert start time to minutes
        // ======================================

        const startParts =
            String(schedule.start_time)
                .substring(0, 5)
                .split(":");

        const startMinutes =
            Number(startParts[0]) * 60 +
            Number(startParts[1]);


        // ======================================
        // Convert end time to minutes
        // ======================================

        const endParts =
            String(schedule.end_time)
                .substring(0, 5)
                .split(":");

        const endMinutes =
            Number(endParts[0]) * 60 +
            Number(endParts[1]);


        // ======================================
        // Handle overnight schedule
        // Example:
        // 21:00 → 07:00
        // ======================================

        let active = false;


        if (startMinutes < endMinutes) {

            // Example:
            // 08:00 → 17:00

            active =
                currentMinutes >= startMinutes &&
                currentMinutes < endMinutes;

        } else {

            // Example:
            // 21:00 → 07:00

            active =
                currentMinutes >= startMinutes ||
                currentMinutes < endMinutes;

        }


        return callback(
            null,
            active
        );

    });

};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    isDetectionActive
};