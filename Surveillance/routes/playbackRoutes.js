const express = require("express");

const router = express.Router();

const {
    getPlaybackVideos
} = require("../controllers/playbackController");

// ======================================
// Get Playback Videos
// ======================================
router.get("/", getPlaybackVideos);

module.exports = router;