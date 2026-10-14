const express = require("express");

const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");

const {
    getPlaybackVideos
} = require("../controllers/playbackController");

// ======================================
// Get Playback Videos
// ======================================
router.get("/", requireAuth, getPlaybackVideos);

module.exports = router;
