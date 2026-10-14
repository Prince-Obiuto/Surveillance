const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// ====================================
// Get Notifications
// READ STATUS PER ADMINISTRATOR
// ====================================

const getNotifications = (req, res) => {

    // ====================================
    // GET LOGGED-IN ADMINISTRATOR
    // ====================================

    const adminId = req.admin.id;


    // ====================================
    // CHECK ADMIN ID
    // ====================================

    if (!adminId) {

        return res.status(401).json({
            success: false,
            message:
                "Administrator identity is required."
        });

    }


    // ====================================
    // GET NOTIFICATIONS
    // ====================================

    const sql = `
        SELECT
            n.*,

            CASE
                WHEN nr.admin_id IS NOT NULL
                THEN 'Read'
                ELSE 'Unread'
            END AS status

        FROM notifications n

        LEFT JOIN notification_reads nr
            ON n.id = nr.notification_id
            AND nr.admin_id = ?

        ORDER BY n.created_at DESC
    `;


    db.query(
        sql,
        [adminId],
        (err, results) => {

            if (err) {

                console.error(
                    "Get Notifications Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }


            // ====================================
            // SEND NOTIFICATIONS
            // ====================================

            res.json({
                success: true,
                notifications: results
            });

        }
    );

};


// ====================================
// Get Notification Statistics
// ====================================
// Human Detection = ALL human detection records
// Today's Alerts = Human detections created today
// ====================================

const getNotificationStats = (req, res) => {

    const sql = `
        SELECT

            COUNT(
                CASE
                    WHEN type = 'Human Detection'
                    THEN 1
                END
            ) AS humanDetection,

            COUNT(
                CASE
                    WHEN type = 'Human Detection'
                    AND DATE(created_at) = CURDATE()
                    THEN 1
                END
            ) AS todaysAlerts

        FROM notifications
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(
                "Get Notification Stats Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        const stats = results[0];

        res.json({
            success: true,
            humanDetection: Number(
                stats.humanDetection || 0
            ),
            todaysAlerts: Number(
                stats.todaysAlerts || 0
            )
        });

    });

};

// ====================================
// Mark Notification as Read
// PER ADMINISTRATOR
// ====================================

const markAsRead = (req, res) => {

    const { id } = req.params;


    // ====================================
    // GET LOGGED-IN ADMINISTRATOR
    // ====================================

    const adminId = req.admin.id;


    // ====================================
    // CHECK ADMIN ID
    // ====================================

    if (!adminId) {

        return res.status(401).json({
            success: false,
            message:
                "Administrator identity is required."
        });

    }


    // ====================================
    // CHECK NOTIFICATION EXISTS
    // ====================================

    const checkSql = `
        SELECT id
        FROM notifications
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        checkSql,
        [id],
        (checkErr, notificationResult) => {

            if (checkErr) {

                console.error(
                    "Check Notification Error:",
                    checkErr
                );

                return res.status(500).json({
                    success: false,
                    message: checkErr.message
                });

            }


            // ====================================
            // NOTIFICATION NOT FOUND
            // ====================================

            if (notificationResult.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found."
                });

            }


            // ====================================
            // SAVE READ STATUS FOR THIS ADMIN
            // ====================================

            const insertSql = `
                INSERT INTO notification_reads
                (
                    notification_id,
                    admin_id
                )
                VALUES (?, ?)

                ON DUPLICATE KEY UPDATE
                    read_at = CURRENT_TIMESTAMP
            `;


            db.query(
                insertSql,
                [id, adminId],
                (insertErr) => {

                    if (insertErr) {

                        console.error(
                            "Mark Notification As Read Error:",
                            insertErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                insertErr.message
                        });

                    }


                    // ====================================
                    // SUCCESS
                    // ====================================

                    return res.json({
                        success: true,
                        message:
                            "Notification marked as Read."
                    });

                }
            );

        }
    );

};

// ====================================
// Delete Notification
// HOD ONLY
// ====================================

const deleteNotification = (req, res) => {

    const { id } = req.params;

    // ====================================
    // GET ADMIN ID
    // ====================================

    const adminId = req.admin.id;

    console.log("===== DELETE NOTIFICATION REQUEST =====");
    console.log("Notification ID:", id);
    console.log("Admin ID:", adminId);


    // ====================================
    // CHECK ADMIN ID
    // ====================================

    if (!adminId) {

        return res.status(401).json({
            success: false,
            message:
                "Access denied. Administrator identity is required."
        });

    }


    // ====================================
    // CHECK ADMIN ROLE FROM DATABASE
    // ====================================

    const roleSql = `
        SELECT id, username, role
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        roleSql,
        [adminId],
        (roleErr, adminResult) => {

            if (roleErr) {

                console.error(
                    "Check Administrator Role Error:",
                    roleErr
                );

                return res.status(500).json({
                    success: false,
                    message: roleErr.message
                });

            }


            // ====================================
            // ADMINISTRATOR NOT FOUND
            // ====================================

            if (adminResult.length === 0) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });

            }


            const admin = adminResult[0];

            console.log(
                "Administrator:",
                admin.username
            );

            console.log(
                "Administrator Role:",
                admin.role
            );


            // ====================================
            // HOD ONLY
            // ====================================

            if (admin.role !== "HOD") {

                return res.status(403).json({
                    success: false,
                    message:
                        "Access denied. Only HOD can delete notifications."
                });

            }


            // ====================================
            // GET NOTIFICATION FILE NAMES
            // ====================================

            const selectSql = `
                SELECT image_name, video_name
                FROM notifications
                WHERE id = ?
            `;

            db.query(
                selectSql,
                [id],
                (err, results) => {

                    if (err) {

                        console.error(
                            "Get Notification Before Delete Error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });

                    }


                    // ====================================
                    // NOTIFICATION NOT FOUND
                    // ====================================

                    if (results.length === 0) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Notification not found."
                        });

                    }


                    const notification = results[0];


                    // ====================================
                    // BACKEND FOLDERS
                    // ====================================

                    const backendFolder = path.join(
                        __dirname,
                        ".."
                    );

                    const snapshotsFolder = path.join(
                        backendFolder,
                        "snapshots"
                    );

                    const videosFolder = path.join(
                        backendFolder,
                        "videos"
                    );


                    // ====================================
                    // DELETE SNAPSHOT
                    // ====================================

                    if (notification.image_name) {

                        const imagePath = path.join(
                            snapshotsFolder,
                            notification.image_name
                        );

                        if (fs.existsSync(imagePath)) {

                            try {

                                fs.unlinkSync(imagePath);

                                console.log(
                                    "Snapshot deleted:",
                                    notification.image_name
                                );

                            } catch (fileError) {

                                console.error(
                                    "Snapshot deletion error:",
                                    fileError
                                );

                            }

                        } else {

                            console.log(
                                "Snapshot not found:",
                                imagePath
                            );

                        }

                    }


                    // ====================================
                    // DELETE VIDEO
                    // ====================================

                    if (notification.video_name) {

                        const videoPath = path.join(
                            videosFolder,
                            notification.video_name
                        );

                        if (fs.existsSync(videoPath)) {

                            try {

                                fs.unlinkSync(videoPath);

                                console.log(
                                    "Video deleted:",
                                    notification.video_name
                                );

                            } catch (fileError) {

                                console.error(
                                    "Video deletion error:",
                                    fileError
                                );

                            }

                        } else {

                            console.log(
                                "Video not found:",
                                videoPath
                            );

                        }

                    }


                    // ====================================
                    // DELETE DATABASE RECORD
                    // ====================================

                    const deleteSql = `
                        DELETE FROM notifications
                        WHERE id = ?
                    `;

                    db.query(
                        deleteSql,
                        [id],
                        (deleteErr, result) => {

                            if (deleteErr) {

                                console.error(
                                    "Delete Notification Error:",
                                    deleteErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        deleteErr.message
                                });

                            }


                            // ====================================
                            // DELETE SUCCESSFUL
                            // ====================================

                            console.log(
                                "Notification deleted successfully."
                            );

                            return res.json({
                                success: true,
                                message:
                                    "Notification, snapshot and video deleted successfully."
                            });

                        }
                    );

                }
            );

        }
    );

};

// ====================================
// Export Functions
// ====================================

module.exports = {

    getNotifications,
    getNotificationStats,
    markAsRead,
    deleteNotification

};
