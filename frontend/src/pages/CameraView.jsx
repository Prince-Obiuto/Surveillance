import "../styles/CameraView.css";

import {
    useParams,
    useNavigate
} from "react-router-dom";

import {
    useRef,
    useState,
    useEffect,
    useCallback
} from "react";

import {
    FaArrowLeft,
    FaVideo,
    FaCircle,
    FaExpand,
    FaStop
} from "react-icons/fa";

import {
    useTheme
} from "../context/ThemeContext";

import cameras from "../data/cameras";


// ==========================================
// BACKEND API
// ==========================================

const API_BASE =
    "http://localhost:5000";


function CameraView() {

    // ==========================================
    // NAVIGATION
    // ==========================================

    const { id } =
        useParams();

    const navigate =
        useNavigate();


    // ==========================================
    // THEME
    // ==========================================

    const {
        darkMode
    } = useTheme();


    // ==========================================
    // FULLSCREEN REF
    // ==========================================

    const liveScreenRef =
        useRef(null);


    // ==========================================
    // FIND CAMERA
    // ==========================================

    const camera =
        cameras.find(
            cam =>
                cam.id === Number(id)
        );


    // ==========================================
    // CAMERA STREAM STATUS
    // ==========================================

    const hasStream =
        Boolean(
            camera?.streamUrl &&
            camera.streamUrl.trim() !== ""
        );


    const isOnline =
        camera?.status === "Online";


    // ==========================================
    // RECORDING STATES
    // ==========================================

    const [
        recording,
        setRecording
    ] = useState(false);


    const [
        recordedSince,
        setRecordedSince
    ] = useState(null);


    const [
        elapsed,
        setElapsed
    ] = useState(0);


    const [
        loading,
        setLoading
    ] = useState(false);


    const [
        checking,
        setChecking
    ] = useState(true);


    const [
        recordingError,
        setRecordingError
    ] = useState("");


    // ==========================================
    // GET RECORDING STATUS FROM BACKEND
    // ==========================================

    const getRecordingStatus =
        useCallback(
            async (
                showChecking = false
            ) => {

                if (!camera) {

                    setChecking(false);

                    return null;

                }


                if (showChecking) {

                    setChecking(true);

                }


                try {

                    const response =
                        await fetch(
                            `${API_BASE}/api/cameras/${id}/recording`
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            "Unable to check recording status."
                        );

                    }


                    // ======================================
                    // BACKEND IS THE SOURCE OF TRUTH
                    // ======================================

                    setRecording(
                        Boolean(
                            data.recording
                        )
                    );


                    setRecordedSince(
                        data.startedAt ||
                        null
                    );


                    setRecordingError("");


                    return data;


                } catch (error) {

                    console.error(
                        "Recording Status Error:",
                        error
                    );


                    setRecordingError(
                        error.message
                    );


                    return null;


                } finally {

                    if (showChecking) {

                        setChecking(false);

                    }

                }

            },
            [
                id,
                camera
            ]
        );


    // ==========================================
    // CHECK RECORDING WHEN PAGE OPENS
    // ==========================================
    //
    // IMPORTANT:
    //
    // Leaving this page DOES NOT stop recording.
    //
    // The cleanup only clears the browser polling
    // interval.
    //
    // The backend FFmpeg recording continues running.
    //
    // ==========================================

    useEffect(
        () => {

            if (!camera) {

                setChecking(false);

                return;

            }


            // Reset local display while checking
            // the actual backend state.
            setRecording(false);

            setRecordedSince(null);

            setElapsed(0);

            setRecordingError("");


            // Check immediately when camera page opens.
            getRecordingStatus(
                true
            );


            // Keep UI synchronized with backend.
            const interval =
                setInterval(
                    () => {

                        getRecordingStatus(
                            false
                        );

                    },
                    3000
                );


            return () => {

                // ======================================
                // IMPORTANT
                // ======================================
                //
                // We ONLY stop checking the backend.
                //
                // We DO NOT call:
                //
                // /recording/stop
                //
                // This means changing pages will NOT
                // stop the active camera recording.
                //
                // ======================================

                clearInterval(
                    interval
                );

            };

        },
        [
            id,
            camera,
            getRecordingStatus
        ]
    );


    // ==========================================
    // RECORDING TIMER
    // ==========================================

    useEffect(
        () => {

            if (
                !recording ||
                !recordedSince
            ) {

                setElapsed(0);

                return;

            }


            const updateTimer =
                () => {

                    const startTime =
                        new Date(
                            recordedSince
                        ).getTime();


                    if (
                        !Number.isFinite(
                            startTime
                        )
                    ) {

                        setElapsed(0);

                        return;

                    }


                    const seconds =
                        Math.max(
                            0,
                            Math.floor(
                                (
                                    Date.now() -
                                    startTime
                                ) / 1000
                            )
                        );


                    setElapsed(
                        seconds
                    );

                };


            updateTimer();


            const interval =
                setInterval(
                    updateTimer,
                    1000
                );


            return () => {

                clearInterval(
                    interval
                );

            };

        },
        [
            recording,
            recordedSince
        ]
    );


    // ==========================================
    // FORMAT RECORDING TIME
    // ==========================================

    const formatTime =
        (
            totalSeconds
        ) => {

            const hours =
                Math.floor(
                    totalSeconds / 3600
                );


            const minutes =
                Math.floor(
                    (
                        totalSeconds %
                        3600
                    ) / 60
                );


            const seconds =
                totalSeconds %
                60;


            return [
                hours,
                minutes,
                seconds
            ]
                .map(
                    value =>
                        String(
                            value
                        ).padStart(
                            2,
                            "0"
                        )
                )
                .join(":");

        };


    // ==========================================
    // START / STOP MANUAL RECORDING
    // ==========================================

    const toggleRecording =
        async () => {

            if (
                loading ||
                checking ||
                !camera
            ) {

                return;

            }


            const action =
                recording
                    ? "stop"
                    : "start";


            setLoading(true);

            setRecordingError("");


            try {

                console.log(
                    `${action.toUpperCase()} recording Camera ${id}...`
                );


                const response =
                    await fetch(
                        `${API_BASE}/api/cameras/${id}/recording/${action}`,
                        {
                            method: "POST"
                        }
                    );


                let data;


                try {

                    data =
                        await response.json();

                } catch {

                    throw new Error(
                        "Invalid response from recording server."
                    );

                }


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        `Failed to ${action} recording.`
                    );

                }


                console.log(
                    "Recording response:",
                    data
                );


                // ======================================
                // UPDATE UI AFTER BACKEND CONFIRMATION
                // ======================================

                setRecording(
                    Boolean(
                        data.recording
                    )
                );


                setRecordedSince(
                    data.startedAt ||
                    null
                );


                // ======================================
                // VERIFY ACTUAL BACKEND STATE
                // ======================================

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            500
                        )
                );


                await getRecordingStatus(
                    false
                );


            } catch (error) {

                console.error(
                    "Recording Error:",
                    error
                );


                setRecordingError(
                    error.message
                );


                // Even if the request had a browser-side
                // problem, check the real backend state.
                await getRecordingStatus(
                    false
                );


            } finally {

                setLoading(false);

            }

        };


    // ==========================================
    // FULLSCREEN
    // ==========================================

    const openFullScreen =
        async () => {

            const element =
                liveScreenRef.current;


            if (!element) {

                return;

            }


            try {

                if (
                    element.requestFullscreen
                ) {

                    await element
                        .requestFullscreen();

                } else if (
                    element.webkitRequestFullscreen
                ) {

                    element
                        .webkitRequestFullscreen();

                } else if (
                    element.msRequestFullscreen
                ) {

                    element
                        .msRequestFullscreen();

                }


            } catch (error) {

                console.error(
                    "Fullscreen Error:",
                    error
                );

            }

        };


    // ==========================================
    // CAMERA NOT FOUND
    // ==========================================

    if (!camera) {

        return (

            <div
                className={
                    darkMode
                        ? "camera-page dark"
                        : "camera-page"
                }
            >

                <div
                    className="camera-top-bar"
                >

                    <button
                        type="button"
                        className="camera-back-button"
                        onClick={
                            () =>
                                navigate(
                                    "/dashboard"
                                )
                        }
                    >

                        <FaArrowLeft />

                        <span>
                            Back
                        </span>

                    </button>

                </div>


                <div
                    className="camera-error-card"
                >

                    <FaVideo />

                    <h2>
                        Camera Not Found
                    </h2>

                    <p>
                        The selected camera does not exist.
                    </p>

                </div>

            </div>

        );

    }


    // ==========================================
    // MAIN CAMERA VIEW
    // ==========================================

    return (

        <div
            className={
                darkMode
                    ? "camera-page dark"
                    : "camera-page"
            }
        >

            {/* ======================================
                TOP BAR
            ====================================== */}

            <div
                className="camera-top-bar"
            >

                <button
                    type="button"
                    className="camera-back-button"
                    onClick={
                        () =>
                            navigate(
                                "/dashboard"
                            )
                    }
                >

                    <FaArrowLeft />

                    <span>
                        Back
                    </span>

                </button>


                <div
                    className="camera-heading"
                >

                    <div>

                        <h1>
                            {camera.name}
                        </h1>

                    </div>


                    <span
                        className={
                            isOnline
                                ? "camera-status-badge online"
                                : "camera-status-badge offline"
                        }
                    >

                        <FaCircle />

                        {camera.status}

                    </span>

                </div>

            </div>


            {/* ======================================
                LIVE MONITORING
            ====================================== */}

            <div
                className="camera-main-card"
            >

                <div
                    className="camera-section-header"
                >

                    <div>

                        <h2>
                            Live Monitoring
                        </h2>

                    </div>


                    {
                        hasStream &&
                        isOnline &&
                        (

                            <button
                                type="button"
                                className="camera-fullscreen-button"
                                onClick={
                                    openFullScreen
                                }
                            >

                                <FaExpand />

                                <span>
                                    Full Screen
                                </span>

                            </button>

                        )
                    }

                </div>


                {/* ==================================
                    LIVE CAMERA SCREEN
                ================================== */}

                <div
                    className="live-screen"
                    ref={
                        liveScreenRef
                    }
                >

                    {
                        hasStream &&
                            isOnline
                            ? (

                                <>

                                    <img
                                        src={
                                            camera.streamUrl
                                        }
                                        alt={
                                            `${camera.name} Live Feed`
                                        }
                                        className="live-feed"
                                    />


                                    <div
                                        className="camera-live-indicator"
                                    >

                                        <span
                                            className="live-dot"
                                        >
                                        </span>

                                        LIVE

                                    </div>


                                    <button
                                        type="button"
                                        className="fullscreen-overlay-button"
                                        onClick={
                                            openFullScreen
                                        }
                                        title="View Full Screen"
                                    >

                                        <FaExpand />

                                    </button>

                                </>

                            )
                            : (

                                <div
                                    className="no-signal"
                                >

                                    <FaVideo
                                        className="no-signal-icon"
                                    />

                                    <h2>
                                        NO SIGNAL
                                    </h2>

                                    <p>
                                        {camera.name} is currently offline.
                                    </p>

                                </div>

                            )
                    }

                </div>


                {/* ==================================
                    MANUAL RECORDING CONTROLS
                ================================== */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px",
                        padding: "20px",
                        marginTop: "15px",
                        borderRadius: "12px",
                        background:
                            darkMode
                                ? "#152536"
                                : "#f1f5f9"
                    }}
                >

                    {/* RECORDING STATUS */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}
                    >

                        <FaCircle
                            style={{
                                color:
                                    recording
                                        ? "#ef4444"
                                        : "#94a3b8",
                                fontSize: "13px"
                            }}
                        />


                        <div>

                            <strong
                                style={{
                                    display: "block",
                                    color:
                                        recording
                                            ? "#ef4444"
                                            : darkMode
                                                ? "#ffffff"
                                                : "#334155"
                                }}
                            >

                                {
                                    checking
                                        ? "Checking Recording..."
                                        : recording
                                            ? "RECORDING"
                                            : "NOT RECORDING"
                                }

                            </strong>


                            <span
                                style={{
                                    fontSize: "13px",
                                    color:
                                        darkMode
                                            ? "#cbd5e1"
                                            : "#64748b"
                                }}
                            >

                                {
                                    recording
                                        ? formatTime(
                                            elapsed
                                        )
                                        : "Manual Recording"
                                }

                            </span>

                        </div>

                    </div>


                    {/* ==================================
                        RECORD BUTTON
                    ================================== */}

                    <button
                        type="button"
                        onClick={
                            toggleRecording
                        }
                        disabled={
                            loading ||
                            checking ||
                            (
                                !recording &&
                                (
                                    !isOnline ||
                                    !hasStream
                                )
                            )
                        }
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            padding: "12px 22px",
                            border: "none",
                            borderRadius: "8px",

                            background:
                                recording
                                    ? "#dc2626"
                                    : "#1e293b",

                            color: "#ffffff",

                            fontWeight: "600",

                            fontSize: "14px",

                            cursor:
                                loading ||
                                    checking ||
                                    (
                                        !recording &&
                                        (
                                            !isOnline ||
                                            !hasStream
                                        )
                                    )
                                    ? "not-allowed"
                                    : "pointer",

                            opacity:
                                loading ||
                                    checking ||
                                    (
                                        !recording &&
                                        (
                                            !isOnline ||
                                            !hasStream
                                        )
                                    )
                                    ? 0.6
                                    : 1
                        }}
                    >

                        {
                            recording
                                ? <FaStop />
                                : <FaCircle />
                        }


                        <span>

                            {
                                loading
                                    ? "Please wait..."
                                    : recording
                                        ? "Stop Recording"
                                        : "Start Recording"
                            }

                        </span>

                    </button>

                </div>


                {/* ==================================
                    RECORDING ERROR
                ================================== */}

                {
                    recordingError &&
                    (

                        <p
                            role="alert"
                            style={{
                                color: "#ef4444",
                                fontSize: "13px",
                                marginTop: "12px",
                                padding: "0 15px"
                            }}
                        >

                            {recordingError}

                        </p>

                    )
                }

            </div>


            {/* ======================================
                CAMERA INFORMATION
            ====================================== */}

            <div
                className="camera-information-card"
            >

                <div
                    className="camera-section-header"
                >

                    <div>

                        <h2>
                            Camera Information
                        </h2>

                    </div>

                </div>


                <div
                    className="camera-information-grid"
                >

                    {/* CAMERA NAME */}

                    <div
                        className="camera-information-item"
                    >

                        <span
                            className="camera-info-label"
                        >
                            Camera Name
                        </span>

                        <strong>
                            {camera.name}
                        </strong>

                    </div>


                    {/* LOCATION */}

                    <div
                        className="camera-information-item"
                    >

                        <span
                            className="camera-info-label"
                        >
                            Location
                        </span>

                        <strong>
                            {camera.location}
                        </strong>

                    </div>


                    {/* IP ADDRESS */}

                    <div
                        className="camera-information-item"
                    >

                        <span
                            className="camera-info-label"
                        >
                            IP Address
                        </span>

                        <strong>
                            {camera.ipAddress}
                        </strong>

                    </div>


                    {/* CAMERA STATUS */}

                    <div
                        className="camera-information-item"
                    >

                        <span
                            className="camera-info-label"
                        >
                            Status
                        </span>

                        <span
                            className={
                                isOnline
                                    ? "camera-info-status online"
                                    : "camera-info-status offline"
                            }
                        >

                            <FaCircle />

                            {camera.status}

                        </span>

                    </div>


                    {/* LIVE RECORDING */}

                    <div
                        className="camera-information-item"
                    >

                        <span
                            className="camera-info-label"
                        >
                            Live Recording
                        </span>

                        <strong
                            style={{
                                color:
                                    recording
                                        ? "#ef4444"
                                        : "inherit"
                            }}
                        >

                            {
                                recording
                                    ? `Recording (${formatTime(elapsed)})`
                                    : "Not Recording"
                            }

                        </strong>

                    </div>


                    {/* STREAM STATUS */}

                    <div
                        className="camera-information-item"
                    >

                        <span
                            className="camera-info-label"
                        >
                            Stream
                        </span>

                        <strong>

                            {
                                hasStream
                                    ? "Available"
                                    : "Unavailable"
                            }

                        </strong>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default CameraView;