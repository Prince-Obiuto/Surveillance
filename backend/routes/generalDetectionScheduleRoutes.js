const express = require("express");

const router = express.Router();
const { requireAuth, requireHOD } = require("../middleware/authMiddleware");

const db = require("../config/db");


// =====================================================
// GET GENERAL DETECTION SCHEDULE
// =====================================================

router.get("/", requireAuth, (req, res) => {

    const sql = `
        SELECT
            id,
            start_time,
            end_time,
            enabled,
            updated_at
        FROM general_detection_schedule
        ORDER BY id ASC
        LIMIT 1
    `;


    db.query(sql, (error, results) => {

        if (error) {

            console.error(
                "Get General Detection Schedule Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to fetch general detection schedule."

            });

        }


        // ---------------------------------------------
        // NO SCHEDULE FOUND
        // ---------------------------------------------

        if (results.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "General detection schedule not found."

            });

        }


        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        return res.json({

            success: true,

            schedule: results[0]

        });

    });

});


// =====================================================
// UPDATE GENERAL DETECTION SCHEDULE
// =====================================================

router.put("/", requireAuth, requireHOD, (req, res) => {

    const {
        start_time,
        end_time,
        enabled
    } = req.body;


    // =================================================
    // VALIDATION
    // =================================================

    if (
        !start_time ||
        !end_time
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Start time and end time are required."

        });

    }


    // =================================================
    // ENABLED VALUE
    // =================================================

    const scheduleEnabled =
        enabled === undefined
            ? 1
            : Number(enabled) === 1
                ? 1
                : 0;


    // =================================================
    // UPDATE MASTER SCHEDULE
    // =================================================

    const sql = `
        UPDATE general_detection_schedule

        SET
            start_time = ?,
            end_time = ?,
            enabled = ?

        WHERE id = (
            SELECT id
            FROM (
                SELECT id
                FROM general_detection_schedule
                ORDER BY id ASC
                LIMIT 1
            ) AS temp
        )
    `;


    db.query(
        sql,
        [
            start_time,
            end_time,
            scheduleEnabled
        ],
        (error, result) => {

            if (error) {

                console.error(
                    "Update General Detection Schedule Error:",
                    error
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to update general detection schedule."

                });

            }


            // -----------------------------------------
            // CHECK IF ROW WAS UPDATED
            // -----------------------------------------

            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "General detection schedule not found."

                });

            }


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            return res.json({

                success: true,

                message:
                    "General detection schedule updated successfully."

            });

        }
    );

});


module.exports = router;
