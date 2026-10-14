const express = require("express");
const router = express.Router();

const db = require("../config/db");
const webpush = require("../config/webPush");

// =====================================================
// SAVE PUSH SUBSCRIPTION
// =====================================================

router.post("/subscribe", (req, res) => {
    const {
        admin_id,
        endpoint,
        keys,
        device_name
    } = req.body;

    // -------------------------------------------------
    // CHECK REQUIRED DATA
    // -------------------------------------------------

    if (
        !endpoint ||
        !keys ||
        !keys.p256dh ||
        !keys.auth
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid push subscription data."
        });
    }

    // -------------------------------------------------
    // CHECK IF SUBSCRIPTION ALREADY EXISTS
    // -------------------------------------------------

    const checkSql = `
        SELECT id
        FROM push_subscriptions
        WHERE endpoint = ?
        LIMIT 1
    `;

    db.query(
        checkSql,
        [endpoint],
        (checkError, results) => {

            if (checkError) {

                console.error(
                    "Subscription check error:",
                    checkError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to check push subscription."
                });
            }

            // -------------------------------------------------
            // UPDATE EXISTING SUBSCRIPTION
            // -------------------------------------------------

            if (results.length > 0) {

                const updateSql = `
                    UPDATE push_subscriptions
                    SET
                        admin_id = ?,
                        p256dh = ?,
                        auth = ?,
                        device_name = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE endpoint = ?
                `;

                db.query(
                    updateSql,
                    [
                        admin_id || null,
                        keys.p256dh,
                        keys.auth,
                        device_name || "Unknown Device",
                        endpoint
                    ],
                    (updateError) => {

                        if (updateError) {

                            console.error(
                                "Subscription update error:",
                                updateError
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to update subscription."
                            });
                        }

                        return res.status(200).json({
                            success: true,
                            message:
                                "Push subscription updated successfully."
                        });
                    }
                );

                return;
            }

            // -------------------------------------------------
            // INSERT NEW SUBSCRIPTION
            // -------------------------------------------------

            const insertSql = `
                INSERT INTO push_subscriptions
                (
                    admin_id,
                    endpoint,
                    p256dh,
                    auth,
                    device_name
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    admin_id || null,
                    endpoint,
                    keys.p256dh,
                    keys.auth,
                    device_name || "Unknown Device"
                ],
                (insertError) => {

                    if (insertError) {

                        console.error(
                            "Subscription insert error:",
                            insertError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to save push subscription."
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message:
                            "Push subscription saved successfully."
                    });
                }
            );
        }
    );
});

// =====================================================
// REMOVE PUSH SUBSCRIPTION
// =====================================================

router.delete("/unsubscribe", (req, res) => {

    const { endpoint } = req.body;

    if (!endpoint) {

        return res.status(400).json({
            success: false,
            message: "Push endpoint is required."
        });
    }

    const sql = `
        DELETE FROM push_subscriptions
        WHERE endpoint = ?
    `;

    db.query(
        sql,
        [endpoint],
        (error) => {

            if (error) {

                console.error(
                    "Unsubscribe error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to remove push subscription."
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Push subscription removed successfully."
            });
        }
    );
});

// =====================================================
// TEST PUSH NOTIFICATION
// =====================================================

router.post("/test", async (req, res) => {

    try {

        const sql = `
            SELECT
                id,
                admin_id,
                endpoint,
                p256dh,
                auth,
                device_name
            FROM push_subscriptions
        `;

        db.query(
            sql,
            async (error, subscriptions) => {

                if (error) {

                    console.error(
                        "Get subscriptions error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to get push subscriptions."
                    });
                }

                if (!subscriptions || subscriptions.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "No registered notification devices found."
                    });
                }

                const payload = JSON.stringify({
                    title: "Smart Surveillance Test",
                    body:
                        "Test notification from Smart Surveillance System.",
                    icon: "/logo192.png",
                    badge: "/logo192.png",
                    url: "/notifications",
                    type: "test"
                });

                let sent = 0;
                let failed = 0;

                for (const subscription of subscriptions) {

                    const pushSubscription = {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth
                        }
                    };

                    try {

                        await webpush.sendNotification(
                            pushSubscription,
                            payload
                        );

                        sent++;

                        console.log(
                            "Test notification sent to:",
                            subscription.device_name
                        );

                    } catch (pushError) {

                        failed++;

                        console.error(
                            "Test push error:",
                            pushError
                        );

                        // -----------------------------------------
                        // REMOVE EXPIRED SUBSCRIPTION
                        // -----------------------------------------

                        if (
                            pushError.statusCode === 404 ||
                            pushError.statusCode === 410
                        ) {

                            db.query(
                                `
                                DELETE FROM push_subscriptions
                                WHERE id = ?
                                `,
                                [subscription.id],
                                (deleteError) => {

                                    if (deleteError) {

                                        console.error(
                                            "Expired subscription delete error:",
                                            deleteError
                                        );

                                    } else {

                                        console.log(
                                            "Expired push subscription removed:",
                                            subscription.device_name
                                        );

                                    }
                                }
                            );
                        }
                    }
                }

                return res.status(200).json({
                    success: true,
                    message:
                        "Test notification process completed.",
                    sent,
                    failed
                });
            }
        );

    } catch (error) {

        console.error(
            "Test notification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send test notification."
        });
    }
});

// =====================================================
// SEND REAL SURVEILLANCE NOTIFICATION
// =====================================================
//
// This endpoint will be called by the Python YOLO
// detection program whenever a human is detected.
//
// Example:
//
// POST /api/push-subscriptions/send
//
// {
//     "title": "🚨 Human Detected",
//     "body": "Person detected by Camera 1",
//     "type": "Human Detection",
//     "camera_name": "Camera 1"
// }
//
// =====================================================

router.post("/send", async (req, res) => {

    try {

        const {
            title,
            body,
            type,
            camera_name,
            image_name,
            video_name
        } = req.body;

        // -------------------------------------------------
        // CHECK REQUIRED DATA
        // -------------------------------------------------

        if (!title || !body) {

            return res.status(400).json({
                success: false,
                message:
                    "Notification title and body are required."
            });
        }

        // -------------------------------------------------
        // GET ALL REGISTERED DEVICES
        // -------------------------------------------------

        const sql = `
            SELECT
                id,
                admin_id,
                endpoint,
                p256dh,
                auth,
                device_name
            FROM push_subscriptions
        `;

        db.query(
            sql,
            async (error, subscriptions) => {

                if (error) {

                    console.error(
                        "Get push subscriptions error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to get registered devices."
                    });
                }

                if (
                    !subscriptions ||
                    subscriptions.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "No registered notification devices found.",
                        sent: 0,
                        failed: 0
                    });
                }

                // -------------------------------------------------
                // BUILD NOTIFICATION PAYLOAD
                // -------------------------------------------------

                const payload = JSON.stringify({

                    title,

                    body,

                    icon: "/logo192.png",

                    badge: "/logo192.png",

                    url: "/notifications",

                    type:
                        type ||
                        "Human Detection",

                    camera_name:
                        camera_name ||
                        "Unknown Camera",

                    image_name:
                        image_name ||
                        null,

                    video_name:
                        video_name ||
                        null,

                    timestamp:
                        new Date().toISOString()

                });

                let sent = 0;
                let failed = 0;

                // -------------------------------------------------
                // SEND TO EVERY REGISTERED DEVICE
                // -------------------------------------------------

                for (
                    const subscription
                    of subscriptions
                ) {

                    const pushSubscription = {

                        endpoint:
                            subscription.endpoint,

                        keys: {

                            p256dh:
                                subscription.p256dh,

                            auth:
                                subscription.auth

                        }

                    };

                    try {

                        await webpush.sendNotification(
                            pushSubscription,
                            payload
                        );

                        sent++;

                        console.log(
                            "======================================"
                        );

                        console.log(
                            "PUSH NOTIFICATION SENT"
                        );

                        console.log(
                            "Device:",
                            subscription.device_name
                        );

                        console.log(
                            "Title:",
                            title
                        );

                        console.log(
                            "Body:",
                            body
                        );

                        console.log(
                            "======================================"
                        );

                    } catch (pushError) {

                        failed++;

                        console.error(
                            "Push notification failed for:",
                            subscription.device_name
                        );

                        console.error(
                            pushError
                        );

                        // -------------------------------------------------
                        // REMOVE EXPIRED / INVALID SUBSCRIPTION
                        // -------------------------------------------------

                        if (
                            pushError.statusCode === 404 ||
                            pushError.statusCode === 410
                        ) {

                            db.query(
                                `
                                DELETE FROM push_subscriptions
                                WHERE id = ?
                                `,
                                [subscription.id],
                                (deleteError) => {

                                    if (deleteError) {

                                        console.error(
                                            "Expired subscription delete error:",
                                            deleteError
                                        );

                                    } else {

                                        console.log(
                                            "Expired notification device removed:",
                                            subscription.device_name
                                        );

                                    }
                                }
                            );
                        }
                    }
                }

                // -------------------------------------------------
                // RETURN RESULT
                // -------------------------------------------------

                return res.status(200).json({

                    success: true,

                    message:
                        "Surveillance notification process completed.",

                    sent,

                    failed,

                    total_devices:
                        subscriptions.length

                });
            }
        );

    } catch (error) {

        console.error(
            "Send surveillance notification error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to send surveillance notification."

        });
    }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;