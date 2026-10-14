const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// ======================================
// Get Playback Videos
// ======================================

const getPlaybackVideos = (req, res) => {

    const { camera, date, time } = req.query;

    let sql = `
        SELECT
            id,
            camera_name,
            image_name,
            video_name,
            created_at,
            status
        FROM notifications
        WHERE video_name IS NOT NULL
        AND video_name != ''
    `;

    const values = [];

    // Camera filter
    if (camera) {
        sql += " AND camera_name = ?";
        values.push(camera);
    }

    // Date filter
    if (date) {
        sql += " AND DATE(created_at) = ?";
        values.push(date);
    }

    // Time filter
    if (time) {
        sql += " AND TIME(created_at) >= ?";
        values.push(time);
    }

    sql += " ORDER BY created_at DESC";

    db.query(sql, values, (err, results) => {

        if (err) {

            console.error(
                "Playback database error:",
                err
            );

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        const videos = results.map((video) => {

            const videoPath = path.join(
                __dirname,
                "..",
                "videos",
                video.video_name
            );

            const imagePath = path.join(
                __dirname,
                "..",
                "snapshots",
                video.image_name
            );

            const videoExists =
                fs.existsSync(videoPath);

            const imageExists =
                fs.existsSync(imagePath);

            return {
                ...video,

                videoExists,

                imageExists,

                videoUrl: videoExists
                    ? `/videos/${video.video_name}`
                    : null,

                imageUrl: imageExists
                    ? `/snapshots/${video.image_name}`
                    : null
            };

        });

        res.json({
            success: true,
            videos
        });

    });
};

module.exports = {
    getPlaybackVideos
};