const express = require("express");

const router = express.Router();

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
    getNotifications
);


// ====================================
// Mark Notification as Read
// ====================================

router.put(
    "/:id/read",
    markAsRead
);


// ====================================
// Delete Notification
// ====================================

router.delete(
    "/:id",
    deleteNotification
);


module.exports = router;