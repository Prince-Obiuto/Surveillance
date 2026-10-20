const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("./middleware/authMiddleware");

// ======================================
// ROUTES
// ======================================

const authRoutes = require("./routes/authRoutes");
const playbackRoutes = require("./routes/playbackRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const pushSubscriptionRoutes = require("./routes/pushSubscriptionRoutes");
const generalDetectionScheduleRoutes =
    require("./routes/generalDetectionScheduleRoutes");
const detectionScheduleRoutes =
    require("./routes/detectionScheduleRoutes");

const app = express();
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again in 15 minutes."
    }
});

const trustedProxyHops = Number.parseInt(
    process.env.TRUST_PROXY_HOPS || "0",
    10
);
if (Number.isInteger(trustedProxyHops) && trustedProxyHops > 0) {
    app.set("trust proxy", trustedProxyHops);
}

app.disable("x-powered-by");

// ======================================
// MIDDLEWARE
// ======================================

app.use(cors());

app.use(express.json());

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Request body must contain valid JSON.",
        });
    }

    return next(err);
});

// ======================================
// STATIC VIDEO FILES
// ======================================

app.use(
    "/videos",
    requireAuth,
    express.static(
        path.join(__dirname, "videos")
    )
);

// ======================================
// STATIC SNAPSHOT FILES
// ======================================

app.use(
    "/snapshots",
    requireAuth,
    express.static(
        path.join(__dirname, "snapshots")
    )
);

// ======================================
// API ROUTES
// ======================================

// --------------------------------------
// Authentication
// --------------------------------------

app.use(
    "/api/auth",
    (req, res, next) => {
        if (req.method === "POST" && req.path === "/login") {
            return loginLimiter(req, res, next);
        }
        return next();
    },
    authRoutes
);


// --------------------------------------
// Playback
// --------------------------------------

app.use(
    "/api/playback",
    playbackRoutes
);


// --------------------------------------
// Notifications
// --------------------------------------

app.use(
    "/api/notifications",
    notificationRoutes
);


// --------------------------------------
// Push Notification Subscriptions
// --------------------------------------

app.use(
    "/api/push-subscriptions",
    pushSubscriptionRoutes
);


// --------------------------------------
// Detection Schedule
// --------------------------------------

app.use(
    "/api/detection-schedule",
    detectionScheduleRoutes
);

app.use(
    "/api/general-detection-schedule",
    generalDetectionScheduleRoutes
);


// ======================================
// TEST
// ======================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message:
            "Smart Surveillance Backend is Running Successfully"
    });

});


// ======================================
// HEALTH CHECK
// ======================================

app.get("/api/health", (req, res) => {
    db.query("SELECT 1", (err) => {
        if (err) {
            return res.status(503).json({
                status: "Unavailable",
                server: "Running",
                database: "Unavailable"
            });
        }

        return res.status(200).json({
            status: "OK",
            server: "Running",
            database: "Connected"
        });
    });
});


// ======================================
// PORT
// ======================================

const PORT =
    process.env.PORT || 5000;

if (require.main === module) app.listen(PORT, () => {

    console.log(
        "======================================"
    );

    console.log(
        `🚀 Server is running on port ${PORT}`
    );

    console.log(
        `🌐 http://localhost:${PORT}`
    );

    console.log(
        `🎥 Videos: http://localhost:${PORT}/videos/`
    );

    console.log(
        `📸 Snapshots: http://localhost:${PORT}/snapshots/`
    );

    console.log(
        `🔔 Push Subscriptions: http://localhost:${PORT}/api/push-subscriptions`
    );

    console.log(
        `⏰ Detection Schedule: http://localhost:${PORT}/api/detection-schedule`
    );

    console.log(
        "======================================"
    );

});

module.exports = app;
