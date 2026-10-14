const db = require("../config/db");

// ====================================
// Save Push Subscription
// ====================================

const savePushSubscription = (req, res) => {
    const { endpoint, keys } = req.body;

    // Validate subscription data
    if (
        !endpoint ||
        !keys ||
        !keys.p256dh ||
        !keys.auth
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid push subscription data"
        });
    }

    // Check if subscription already exists
    const checkSql = `
        SELECT id
        FROM push_subscriptions
        WHERE endpoint = ?
    `;

    db.query(
        checkSql,
        [endpoint],
        (checkError, results) => {

            if (checkError) {

                console.error(
                    "Check Push Subscription Error:",
                    checkError
                );

                return res.status(500).json({
                    success: false,
                    message: checkError.message
                });
            }

            // Subscription already exists
            if (results.length > 0) {

                return res.json({
                    success: true,
                    message: "Push subscription already exists"
                });
            }

            // Save new subscription
            const insertSql = `
                INSERT INTO push_subscriptions
                (endpoint, p256dh, auth)
                VALUES (?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    endpoint,
                    keys.p256dh,
                    keys.auth
                ],
                (insertError) => {

                    if (insertError) {

                        console.error(
                            "Save Push Subscription Error:",
                            insertError
                        );

                        return res.status(500).json({
                            success: false,
                            message: insertError.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message:
                            "Push subscription saved successfully"
                    });
                }
            );
        }
    );
};


// ====================================
// Export
// ====================================

module.exports = {
    savePushSubscription
};