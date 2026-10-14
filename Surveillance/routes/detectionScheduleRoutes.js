const express = require("express");

const router = express.Router();


// ==========================================
// CONTROLLERS
// ==========================================

const {
    getDetectionSchedule,
    updateDetectionSchedule,
    updateCameraDetectionStatus,
    getCameraDetectionStatus
} = require(
    "../controllers/detectionScheduleController"
);


// ==========================================
// GET ALL DETECTION SCHEDULES
// ==========================================

router.get(
    "/",
    getDetectionSchedule
);


// ==========================================
// UPDATE DETECTION SCHEDULE BY ID
// ==========================================

router.put(
    "/:id",
    updateDetectionSchedule
);


// ==========================================
// GET INDIVIDUAL CAMERA STATUS
// ==========================================

router.get(
    "/camera/:camera_id",
    getCameraDetectionStatus
);


// ==========================================
// UPDATE INDIVIDUAL CAMERA STATUS
// ==========================================

router.put(
    "/camera/:camera_id",
    updateCameraDetectionStatus
);


// ==========================================
// EXPORT
// ==========================================

module.exports = router;