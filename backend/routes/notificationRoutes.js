const express = require("express");

const router = express.Router();
const { requireAuth, requireHOD } = require("../middleware/authMiddleware");

const {
    getNotifications,
    markAsRead,
    deleteNotification
} = require("../controllers/notificationController");


// ====================================
// Get All Notifications
// ====================================

router.get(
    "/",
    requireAuth,
    getNotifications
);


// ====================================
// Mark Notification as Read
// ====================================

router.put(
    "/:id/read",
    requireAuth,
    markAsRead
);


// ====================================
// Delete Notification
// ====================================

router.delete(
    "/:id",
    requireAuth,
    requireHOD,
    deleteNotification
);


module.exports = router;
