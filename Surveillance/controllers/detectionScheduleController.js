const db = require("../config/db");


// =====================================================
// GET ALL DETECTION SCHEDULES
// =====================================================
//
// DATABASE TABLE:
//
// detection_schedule
//
// Columns:
// id
// camera_id
// detection_enabled
// start_time
// end_time
// updated_at
// manual_override
//
// IMPORTANT:
// There is NO camera_name column in the database.
//
// Therefore we create camera_name automatically:
//
// camera_id = 1  -> Camera 1
// camera_id = 2  -> Camera 2
// ...
// camera_id = 10 -> Camera 10
//
// =====================================================

const getDetectionSchedule = (req, res) => {

    const sql = `
        SELECT
            id,
            camera_id,
            CONCAT('Camera ', camera_id) AS camera_name,
            detection_enabled,
            start_time,
            end_time,
            updated_at,
            manual_override
        FROM detection_schedule
        ORDER BY camera_id ASC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "Get Detection Schedule Error:",
                err
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load detection schedules.",

                error:
                    err.message

            });

        }


        console.log(
            "Detection schedules loaded:",
            results.length
        );


        return res.json({

            success: true,

            schedules: results

        });

    });

};


// =====================================================
// UPDATE DETECTION SCHEDULE
// =====================================================
//
// This updates one detection schedule record.
//
// manual_override = 1
//     Camera is manually controlled.
//
// manual_override = 0
//     Camera follows the general schedule.
//
// =====================================================

const updateDetectionSchedule = (req, res) => {

    const { id } = req.params;


    const {
        detection_enabled,
        start_time,
        end_time,
        manual_override
    } = req.body;


    // =================================================
    // CHECK ID
    // =================================================

    if (!id) {

        return res.status(400).json({

            success: false,

            message:
                "Detection schedule ID is required."

        });

    }


    // =================================================
    // VALIDATE DETECTION STATUS
    // =================================================

    if (
        detection_enabled !== true &&
        detection_enabled !== false &&
        detection_enabled !== 1 &&
        detection_enabled !== 0 &&
        detection_enabled !== "1" &&
        detection_enabled !== "0"
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Detection status must be ON or OFF."

        });

    }


    // =================================================
    // NORMALIZE DETECTION STATUS
    // =================================================

    const detectionStatus =
        Number(detection_enabled) === 1
            ? 1
            : 0;


    // =================================================
    // NORMALIZE MANUAL OVERRIDE
    // =================================================
    //
    // If manual_override is not supplied,
    // manual control is assumed.
    //
    // 1 = manual control
    // 0 = general schedule
    //
    // =================================================

    let manualOverride = 1;


    if (
        manual_override === 0 ||
        manual_override === false ||
        manual_override === "0"
    ) {

        manualOverride = 0;

    }


    if (
        manual_override === 1 ||
        manual_override === true ||
        manual_override === "1"
    ) {

        manualOverride = 1;

    }


    // =================================================
    // CHECK THAT THE RECORD EXISTS
    // =================================================

    const checkSql = `
        SELECT
            id,
            camera_id
        FROM detection_schedule
        WHERE id = ?
        LIMIT 1
    `;


    db.query(

        checkSql,

        [id],

        (checkErr, checkResults) => {

            if (checkErr) {

                console.error(
                    "Check Detection Schedule Error:",
                    checkErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to check detection schedule.",

                    error:
                        checkErr.message

                });

            }


            // =========================================
            // RECORD NOT FOUND
            // =========================================

            if (checkResults.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Detection schedule not found."

                });

            }


            // =========================================
            // UPDATE DATABASE
            // =========================================

            const sql = `
                UPDATE detection_schedule
                SET
                    detection_enabled = ?,
                    start_time = ?,
                    end_time = ?,
                    manual_override = ?
                WHERE id = ?
            `;


            db.query(

                sql,

                [
                    detectionStatus,
                    start_time || "21:00:00",
                    end_time || "07:00:00",
                    manualOverride,
                    id
                ],

                (err, result) => {

                    if (err) {

                        console.error(
                            "Update Detection Schedule Error:",
                            err
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to update detection schedule.",

                            error:
                                err.message

                        });

                    }


                    // =================================
                    // GET UPDATED CAMERA INFORMATION
                    // =================================

                    const getUpdatedSql = `
                        SELECT
                            id,
                            camera_id,
                            CONCAT('Camera ', camera_id) AS camera_name,
                            detection_enabled,
                            start_time,
                            end_time,
                            updated_at,
                            manual_override
                        FROM detection_schedule
                        WHERE id = ?
                        LIMIT 1
                    `;


                    db.query(

                        getUpdatedSql,

                        [id],

                        (getErr, updatedResults) => {

                            if (getErr) {

                                console.error(
                                    "Get Updated Detection Schedule Error:",
                                    getErr
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Schedule updated, but updated information could not be loaded.",

                                    error:
                                        getErr.message

                                });

                            }


                            const updatedCamera =
                                updatedResults[0];


                            // =============================
                            // GENERAL CONTROL
                            // =============================

                            if (
                                manualOverride === 0
                            ) {

                                return res.json({

                                    success: true,

                                    message:
                                        "Camera returned to general detection schedule.",

                                    camera:
                                        updatedCamera,

                                    detection_enabled:
                                        detectionStatus,

                                    manual_override:
                                        0

                                });

                            }


                            // =============================
                            // MANUAL CONTROL
                            // =============================

                            return res.json({

                                success: true,

                                message:
                                    detectionStatus === 1
                                        ? "Camera detection turned ON manually."
                                        : "Camera detection turned OFF manually.",

                                camera:
                                    updatedCamera,

                                detection_enabled:
                                    detectionStatus,

                                manual_override:
                                    1

                            });

                        }

                    );

                }

            );

        }

    );

};


// =====================================================
// UPDATE INDIVIDUAL CAMERA DETECTION STATUS
// =====================================================
//
// This endpoint is used when the administrator
// directly turns an individual camera ON or OFF.
//
// Example:
//
// PUT
// /api/detection-schedule/camera/1
//
// Body:
//
// {
//     "detection_enabled": true
// }
//
// =====================================================

const updateCameraDetectionStatus = (req, res) => {

    const { camera_id } = req.params;


    const {
        detection_enabled
    } = req.body;


    // =================================================
    // CHECK CAMERA ID
    // =================================================

    if (!camera_id) {

        return res.status(400).json({

            success: false,

            message:
                "Camera ID is required."

        });

    }


    // =================================================
    // VALIDATE CAMERA ID
    // =================================================

    const cameraIdNumber =
        Number(camera_id);


    if (
        !Number.isInteger(cameraIdNumber)
        ||
        cameraIdNumber < 1
        ||
        cameraIdNumber > 10
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Camera ID must be a number between 1 and 10."

        });

    }


    // =================================================
    // VALIDATE DETECTION STATUS
    // =================================================

    if (
        detection_enabled !== true &&
        detection_enabled !== false &&
        detection_enabled !== 1 &&
        detection_enabled !== 0 &&
        detection_enabled !== "1" &&
        detection_enabled !== "0"
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Detection status must be ON or OFF."

        });

    }


    // =================================================
    // NORMALIZE STATUS
    // =================================================

    const detectionStatus =
        Number(detection_enabled) === 1
            ? 1
            : 0;


    // =================================================
    // CHECK CAMERA EXISTS
    // =================================================

    const checkSql = `
        SELECT
            id,
            camera_id
        FROM detection_schedule
        WHERE camera_id = ?
        LIMIT 1
    `;


    db.query(

        checkSql,

        [cameraIdNumber],

        (checkErr, checkResults) => {

            if (checkErr) {

                console.error(
                    "Check Camera Detection Status Error:",
                    checkErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to check camera detection schedule.",

                    error:
                        checkErr.message

                });

            }


            // =========================================
            // CAMERA NOT FOUND
            // =========================================

            if (checkResults.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        `Camera ${cameraIdNumber} detection schedule not found.`

                });

            }


            // =========================================
            // UPDATE CAMERA
            // =========================================
            //
            // manual_override = 1
            //
            // This means the administrator has
            // manually controlled this camera.
            //
            // =========================================

            const sql = `
                UPDATE detection_schedule
                SET
                    detection_enabled = ?,
                    manual_override = 1
                WHERE camera_id = ?
            `;


            db.query(

                sql,

                [
                    detectionStatus,
                    cameraIdNumber
                ],

                (err, result) => {

                    if (err) {

                        console.error(
                            "Update Camera Detection Status Error:",
                            err
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to update camera detection status.",

                            error:
                                err.message

                        });

                    }


                    // =================================
                    // GET UPDATED CAMERA
                    // =================================

                    const getUpdatedSql = `
                        SELECT
                            id,
                            camera_id,
                            CONCAT('Camera ', camera_id) AS camera_name,
                            detection_enabled,
                            start_time,
                            end_time,
                            updated_at,
                            manual_override
                        FROM detection_schedule
                        WHERE camera_id = ?
                        LIMIT 1
                    `;


                    db.query(

                        getUpdatedSql,

                        [cameraIdNumber],

                        (getErr, updatedResults) => {

                            if (getErr) {

                                console.error(
                                    "Get Updated Camera Detection Status Error:",
                                    getErr
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Camera status updated, but updated information could not be loaded.",

                                    error:
                                        getErr.message

                                });

                            }


                            const updatedCamera =
                                updatedResults[0];


                            // =================================
                            // SUCCESS
                            // =================================

                            return res.json({

                                success: true,

                                message:
                                    detectionStatus === 1
                                        ? `Camera ${cameraIdNumber} detection turned ON manually.`
                                        : `Camera ${cameraIdNumber} detection turned OFF manually.`,

                                camera_id:
                                    cameraIdNumber,

                                camera_name:
                                    `Camera ${cameraIdNumber}`,

                                detection_enabled:
                                    detectionStatus,

                                manual_override:
                                    1,

                                camera:
                                    updatedCamera

                            });

                        }

                    );

                }

            );

        }

    );

};


// =====================================================
// GET INDIVIDUAL CAMERA DETECTION STATUS
// =====================================================
//
// Example:
//
// GET
// /api/detection-schedule/camera/1
//
// =====================================================

const getCameraDetectionStatus = (req, res) => {

    const { camera_id } = req.params;


    // =================================================
    // CHECK CAMERA ID
    // =================================================

    if (!camera_id) {

        return res.status(400).json({

            success: false,

            message:
                "Camera ID is required."

        });

    }


    // =================================================
    // VALIDATE CAMERA ID
    // =================================================

    const cameraIdNumber =
        Number(camera_id);


    if (
        !Number.isInteger(cameraIdNumber)
        ||
        cameraIdNumber < 1
        ||
        cameraIdNumber > 10
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Camera ID must be a number between 1 and 10."

        });

    }


    // =================================================
    // GET CAMERA
    // =================================================

    const sql = `
        SELECT
            id,
            camera_id,
            CONCAT('Camera ', camera_id) AS camera_name,
            detection_enabled,
            start_time,
            end_time,
            updated_at,
            manual_override
        FROM detection_schedule
        WHERE camera_id = ?
        LIMIT 1
    `;


    db.query(

        sql,

        [cameraIdNumber],

        (err, results) => {

            if (err) {

                console.error(
                    "Get Camera Detection Status Error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to get camera detection status.",

                    error:
                        err.message

                });

            }


            // =========================================
            // CAMERA NOT FOUND
            // =========================================

            if (
                results.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        `Camera ${cameraIdNumber} detection schedule not found.`

                });

            }


            // =========================================
            // SUCCESS
            // =========================================

            return res.json({

                success: true,

                camera:
                    results[0]

            });

        }

    );

};


// =====================================================
// EXPORT FUNCTIONS
// =====================================================

module.exports = {

    getDetectionSchedule,

    updateDetectionSchedule,

    updateCameraDetectionStatus,

    getCameraDetectionStatus

};