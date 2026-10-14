const express = require("express");

const router = express.Router();
const { requireAuth, requireHOD } = require("../middleware/authMiddleware");


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
    requireAuth,
    getDetectionSchedule
);


// ==========================================
// UPDATE DETECTION SCHEDULE BY ID
// ==========================================

router.put(
    "/:id",
    requireAuth,
    requireHOD,
    updateDetectionSchedule
);


// ==========================================
// GET INDIVIDUAL CAMERA STATUS
// ==========================================

router.get(
    "/camera/:camera_id",
    requireAuth,
    getCameraDetectionStatus
);


// ==========================================
// UPDATE INDIVIDUAL CAMERA STATUS
// ==========================================

router.put(
    "/camera/:camera_id",
    requireAuth,
    requireHOD,
    updateCameraDetectionStatus
);


// ==========================================
// EXPORT
// ==========================================

module.exports = router;
