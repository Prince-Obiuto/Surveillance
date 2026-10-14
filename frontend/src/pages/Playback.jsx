
import { Link, useLocation } from "react-router-dom";
import {
    useEffect,
    useState,
    useCallback,
    useRef
} from "react";

import "../styles/Playback.css";
import { fetchProtectedFile } from "../utils/auth";

// ==========================================
// BACKEND CONFIGURATION
// ==========================================

const BACKEND_URL = "http://localhost:5000";

// ==========================================
// CAMERA OPTIONS
// ==========================================

const CAMERA_OPTIONS = Array.from(
    { length: 10 },
    (_, index) => `Camera ${index + 1}`
);

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatDateTime(value) {
    if (!value) return "Unknown date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString();
}

function buildFileUrl(filePath) {
    if (!filePath) return "";

    if (
        typeof filePath !== "string" ||
        !filePath.startsWith("/") ||
        filePath.startsWith("//")
    ) {
        return "";
    }

    return `${BACKEND_URL}${filePath}`;
}

function getVideoUrl(video) {
    if (!video) return "";

    if (video.videoUrl) {
        return buildFileUrl(video.videoUrl);
    }

    if (!video.video_name) return "";

    return buildFileUrl(
        `/videos/${encodeURIComponent(video.video_name)}`
    );
}

// ==========================================
// PLAYBACK COMPONENT
// ==========================================

function Playback({ currentUser, authToken }) {
    const location = useLocation();

    const defaultCamera =
        location.state?.cameraName || "";

    // ========================================
    // HOD PERMISSION
    // ========================================

    // The authenticated user must be supplied
    // by your application's authentication system.

    const isHOD =
        String(currentUser?.role || "")
            .trim()
            .toUpperCase() === "HOD";

    // ========================================
    // SEARCH STATES
    // ========================================

    const [camera, setCamera] = useState(defaultCamera);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    // ========================================
    // PLAYBACK STATES
    // ========================================

    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] =
        useState(null);
    const [mediaUrls, setMediaUrls] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [videoError, setVideoError] = useState("");

    // ========================================
    // DELETE STATES
    // ========================================

    const [deletingId, setDeletingId] = useState(null);
    const [deleteMessage, setDeleteMessage] =
        useState("");

    const videoRef = useRef(null);
    const requestRef = useRef(null);

    // ========================================
    // LOAD PLAYBACK RECORDINGS
    // ========================================

    const loadVideos = useCallback(async () => {
        if (requestRef.current) {
            requestRef.current.abort();
        }

        const controller = new AbortController();
        requestRef.current = controller;

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            if (camera) {
                params.set("camera", camera);
            }

            if (date) {
                params.set("date", date);
            }

            if (time) {
                params.set("time", `${time}:00`);
            }

            const queryString = params.toString();

            const url = queryString
                ? `${BACKEND_URL}/api/playback?${queryString}`
                : `${BACKEND_URL}/api/playback`;

            const response = await fetch(url, {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(
                    `Unable to load recordings (${response.status}).`
                );
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to retrieve recordings."
                );
            }

            const receivedVideos = Array.isArray(data.videos)
                ? data.videos
                : [];

            // Only show videos whose files exist.

            const availableVideos = receivedVideos.filter(
                video =>
                    video.videoExists !== false &&
                    Boolean(getVideoUrl(video))
            );

            setVideos(availableVideos);

            // Preserve selected video when possible.

            setSelectedVideo(previous => {
                if (previous) {
                    const existing = availableVideos.find(
                        video =>
                            String(video.id) === String(previous.id)
                    );

                    if (existing) return existing;
                }

                return availableVideos[0] || null;
            });

            setVideoError("");

        } catch (err) {
            if (err.name === "AbortError") return;

            console.error("Playback loading error:", err);

            setError(err.message);
            setVideos([]);
            setSelectedVideo(null);

        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [camera, date, time]);

    // ========================================
    // LOAD RECORDINGS
    // ========================================

    useEffect(() => {
        loadVideos();

        return () => {
            if (requestRef.current) {
                requestRef.current.abort();
            }
        };
    }, [loadVideos]);

    useEffect(() => {
        let active = true;
        const createdUrls = [];
        const files = new Set(
            videos.map(video => video.image_name).filter(Boolean)
        );
        if (selectedVideo?.video_name) files.add(selectedVideo.video_name);

        Promise.all(Array.from(files).map(async name => {
            const isVideo = name === selectedVideo?.video_name;
            const fileUrl = `${BACKEND_URL}/${isVideo ? "videos" : "snapshots"}/${encodeURIComponent(name)}`;
            try {
                const objectUrl = await fetchProtectedFile(fileUrl);
                createdUrls.push(objectUrl);
                return [name, objectUrl];
            } catch (error) {
                console.error("Protected media load failed:", error);
                return [name, ""];
            }
        })).then(entries => {
            if (active) setMediaUrls(Object.fromEntries(entries));
        });

        return () => {
            active = false;
            createdUrls.forEach(URL.revokeObjectURL);
        };
    }, [videos, selectedVideo]);

    // ========================================
    // SELECT RECORDING
    // ========================================

    const handleSelectVideo = video => {
        setSelectedVideo(video);
        setVideoError("");
        setDeleteMessage("");
    };

    // ========================================
    // CLEAR SEARCH FILTERS
    // ========================================

    const clearFilters = () => {
        setCamera("");
        setDate("");
        setTime("");
    };

    // ========================================
    // HANDLE VIDEO ERROR
    // ========================================

    const handleVideoError = () => {
        setVideoError(
            "This recording could not be played. " +
            "The file may be missing, incomplete, " +
            "or encoded in a format unsupported by your browser."
        );
    };

    // ========================================
    // DELETE RECORDING - HOD ONLY
    // ========================================

    const handleDeleteVideo = async video => {
        // Frontend permission check.
        // Backend must independently enforce this.

        if (!isHOD) {
            setError(
                "Access denied. Only the HOD can delete recordings."
            );
            return;
        }

        if (deletingId !== null) return;

        if (!video?.id) {
            setError("Invalid recording ID.");
            return;
        }

        const confirmed = window.confirm(
            `PERMANENTLY DELETE RECORDING?\n\n` +
            `Camera: ${video.camera_name}\n` +
            `Recorded: ${formatDateTime(video.created_at)}\n` +
            `File: ${video.video_name}\n\n` +
            `This recording will be permanently deleted.\n` +
            `This action cannot be undone.\n\n` +
            `Do you want to continue?`
        );

        if (!confirmed) return;

        if (!authToken) {
            setError(
                "Authentication token missing. Please log in again."
            );
            return;
        }

        setDeletingId(video.id);
        setError("");
        setDeleteMessage("");

        try {
            const response = await fetch(
                `${BACKEND_URL}/api/playback/${encodeURIComponent(video.id)}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.success !== true) {
                throw new Error(
                    data.message ||
                    `Unable to delete recording (${response.status}).`
                );
            }

            // Stop playback if the deleted video
            // is currently playing.

            if (
                String(selectedVideo?.id) === String(video.id)
            ) {
                if (videoRef.current) {
                    videoRef.current.pause();
                }
            }

            // Remove recording from the list.

            const remainingVideos = videos.filter(
                item => String(item.id) !== String(video.id)
            );

            setVideos(remainingVideos);

            // Select another video if necessary.

            setSelectedVideo(previous => {
                if (String(previous?.id) === String(video.id)) {
                    return remainingVideos[0] || null;
                }

                return previous;
            });

            setVideoError("");

            setDeleteMessage(
                "Recording deleted successfully."
            );

        } catch (err) {
            console.error("Delete recording error:", err);

            setError(
                err.message || "Failed to delete recording."
            );

        } finally {
            setDeletingId(null);
        }
    };

    // ========================================
    // SELECTED VIDEO DETAILS
    // ========================================

    const selectedVideoUrl = mediaUrls[selectedVideo?.video_name] || "";
    const selectedImageUrl = mediaUrls[selectedVideo?.image_name] || "";

    const isManualRecording =
        selectedVideo?.recording_type === "manual";

    const manualCount = videos.filter(
        video => video.recording_type === "manual"
    ).length;

    const detectionCount = videos.filter(
        video => video.recording_type !== "manual"
    ).length;

    // ========================================
    // DELETE BUTTON STYLE
    // ========================================

    const deleteButtonStyle = {
        background: "#dc2626",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 16px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "13px"
    };

    // ========================================
    // PAGE
    // ========================================

    return (
        <div className="playback-page">

            {/* ================================ */}
            {/* TOP BAR */}
            {/* ================================ */}

            <div className="top-bar">

                <Link
                    to="/dashboard"
                    className="back-btn"
                >
                    ← Back
                </Link>

                <h1>Playback</h1>

            </div>

            {/* ================================ */}
            {/* SEARCH PANEL */}
            {/* ================================ */}

            <div className="search-panel">

                <select
                    value={camera}
                    onChange={event =>
                        setCamera(event.target.value)
                    }
                    aria-label="Select camera"
                >

                    <option value="">
                        All Cameras
                    </option>

                    {CAMERA_OPTIONS.map(name => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}

                </select>

                <input
                    type="date"
                    value={date}
                    onChange={event =>
                        setDate(event.target.value)
                    }
                    aria-label="Recording date"
                />

                <input
                    type="time"
                    value={time}
                    onChange={event =>
                        setTime(event.target.value)
                    }
                    aria-label="Recording start time"
                    title="Show recordings starting at or after this time"
                />

                <button
                    type="button"
                    onClick={loadVideos}
                    disabled={loading}
                >
                    {loading ? "Searching..." : "Search"}
                </button>

                <button
                    type="button"
                    onClick={clearFilters}
                    style={{
                        background: "#1e293b",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        cursor: "pointer"
                    }}
                >
                    Clear
                </button>

            </div>

            {/* ================================ */}
            {/* RECORDING SUMMARY */}
            {/* ================================ */}

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "20px"
                }}
            >

                <div
                    style={{
                        padding: "12px 18px",
                        borderRadius: "10px",
                        background: "#1e293b",
                        color: "#ffffff",
                        fontWeight: "600"
                    }}
                >
                    Total Recordings: {videos.length}
                </div>

                <div
                    style={{
                        padding: "12px 18px",
                        borderRadius: "10px",
                        background: "#334155",
                        color: "#ffffff",
                        fontWeight: "600"
                    }}
                >
                    Manual: {manualCount}
                </div>

                <div
                    style={{
                        padding: "12px 18px",
                        borderRadius: "10px",
                        background: "#475569",
                        color: "#ffffff",
                        fontWeight: "600"
                    }}
                >
                    Detection: {detectionCount}
                </div>

            </div>

            {/* ================================ */}
            {/* SUCCESS MESSAGE */}
            {/* ================================ */}

            {deleteMessage && (
                <div
                    role="status"
                    style={{
                        background: "#dcfce7",
                        color: "#166534",
                        border: "1px solid #86efac",
                        borderRadius: "10px",
                        padding: "15px",
                        marginBottom: "20px"
                    }}
                >
                    {deleteMessage}
                </div>
            )}

            {/* ================================ */}
            {/* ERROR MESSAGE */}
            {/* ================================ */}

            {error && (
                <div
                    role="alert"
                    style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "1px solid #fca5a5",
                        borderRadius: "10px",
                        padding: "15px",
                        marginBottom: "20px"
                    }}
                >
                    {error}
                </div>
            )}

            {/* ================================ */}
            {/* MAIN VIDEO CONTAINER */}
            {/* ================================ */}

            <div className="video-container">

                {loading ? (

                    <h2>Loading Recordings...</h2>

                ) : selectedVideo ? (

                    <>

                        {/* MAIN VIDEO PLAYER */}

                        <video
                            key={`${selectedVideo.id}-${selectedVideoUrl}`}
                            ref={videoRef}
                            className="main-video"
                            width="100%"
                            controls
                            preload="metadata"
                            playsInline
                            onError={handleVideoError}
                        >
                            <source
                                src={selectedVideoUrl}
                                type="video/mp4"
                            />

                            Your browser does not support HTML5 video.

                        </video>

                        {/* VIDEO ERROR */}

                        {videoError && (
                            <p
                                role="alert"
                                style={{
                                    color: "#ef4444",
                                    padding: "12px",
                                    fontSize: "14px"
                                }}
                            >
                                {videoError}
                            </p>
                        )}

                        {/* RECORDING BADGES */}

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                marginTop: "15px"
                            }}
                        >

                            <span
                                style={{
                                    padding: "7px 12px",
                                    borderRadius: "6px",
                                    background: "#1e293b",
                                    color: "#ffffff",
                                    fontSize: "12px",
                                    fontWeight: "700"
                                }}
                            >
                                {isManualRecording
                                    ? "MANUAL RECORDING"
                                    : "DETECTION RECORDING"}
                            </span>

                            <span
                                style={{
                                    padding: "7px 12px",
                                    borderRadius: "6px",
                                    background: "#334155",
                                    color: "#ffffff",
                                    fontSize: "12px",
                                    fontWeight: "700"
                                }}
                            >
                                {selectedVideo.status || "Recorded"}
                            </span>

                        </div>

                        {/* DETECTION SNAPSHOT */}

                        {selectedImageUrl && (
                            <div className="snapshot-section">

                                <h3>Detection Snapshot</h3>

                                <img
                                    src={selectedImageUrl}
                                    alt="Detection Snapshot"
                                    className="snapshot-preview"
                                />

                            </div>
                        )}

                        {/* VIDEO INFORMATION */}

                        <div className="video-information">

                            <h2>{selectedVideo.camera_name}</h2>

                            <p>
                                <strong>Recorded:</strong>{" "}
                                {formatDateTime(selectedVideo.created_at)}
                            </p>

                            <p>
                                <strong>Type:</strong>{" "}
                                {isManualRecording
                                    ? "Manual Recording"
                                    : "Detection Recording"}
                            </p>

                            <p>
                                <strong>Video:</strong>{" "}
                                {selectedVideo.video_name}
                            </p>

                            {/* ======================== */}
                            {/* HOD DELETE BUTTON */}
                            {/* ======================== */}

                            {isHOD && (
                                <div
                                    style={{
                                        marginTop: "20px",
                                        display: "flex",
                                        justifyContent: "flex-end"
                                    }}
                                >

                                    <button
                                        type="button"
                                        style={deleteButtonStyle}
                                        disabled={deletingId !== null}
                                        onClick={() =>
                                            handleDeleteVideo(selectedVideo)
                                        }
                                    >
                                        {String(deletingId) ===
                                            String(selectedVideo.id)
                                            ? "Deleting..."
                                            : "Delete Recording"}
                                    </button>

                                </div>
                            )}

                        </div>

                    </>

                ) : (

                    <div className="empty-playback">

                        <h2>No Videos Found</h2>

                        <p>
                            No playback recordings are available
                            for the selected camera, date or time.
                        </p>

                    </div>

                )}

            </div>

            {/* ================================ */}
            {/* TOTAL RECORDINGS */}
            {/* ================================ */}

            <h2 className="total-recordings">
                Available Recordings: {videos.length}
            </h2>

            {/* ================================ */}
            {/* RECORDING LIST */}
            {/* ================================ */}

            <div className="recording-list">

                {videos.map(video => {

                    const imageUrl = mediaUrls[video.image_name] || "";

                    const isSelected =
                        String(selectedVideo?.id) === String(video.id);

                    const isManual =
                        video.recording_type === "manual";

                    return (

                        <div
                            key={video.id}
                            className={
                                isSelected
                                    ? "record-card active"
                                    : "record-card"
                            }
                            onClick={() =>
                                handleSelectVideo(video)
                            }
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            onKeyDown={event => {

                                if (
                                    event.target !== event.currentTarget
                                ) return;

                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    event.preventDefault();
                                    handleSelectVideo(video);
                                }

                            }}
                        >

                            {/* SNAPSHOT */}

                            {imageUrl ? (

                                <img
                                    src={imageUrl}
                                    alt={`${video.camera_name} snapshot`}
                                />

                            ) : (

                                <div className="no-snapshot">
                                    {isManual
                                        ? "CCTV Recording"
                                        : "No Snapshot"}
                                </div>

                            )}

                            {/* RECORDING INFORMATION */}

                            <div className="record-card-content">

                                <h3>{video.camera_name}</h3>

                                <p>
                                    {formatDateTime(video.created_at)}
                                </p>

                                <p
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        color: isManual
                                            ? "#64748b"
                                            : "#2563eb"
                                    }}
                                >
                                    {isManual
                                        ? "MANUAL RECORDING"
                                        : "DETECTION RECORDING"}
                                </p>

                                <p className="recording-file">
                                    {video.video_name}
                                </p>

                                {/* ======================== */}
                                {/* HOD DELETE BUTTON */}
                                {/* ======================== */}

                                {isHOD && (

                                    <button
                                        type="button"
                                        disabled={deletingId !== null}
                                        onClick={event => {
                                            event.stopPropagation();
                                            handleDeleteVideo(video);
                                        }}
                                        style={{
                                            ...deleteButtonStyle,
                                            width: "100%",
                                            marginTop: "12px"
                                        }}
                                    >
                                        {String(deletingId) === String(video.id)
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>

                                )}

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>
    );
}

export default Playback;
