import {
    useCallback,
    useEffect,
    useState
} from "react";

import { Link } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";

import "../styles/DetectionSchedule.css";


// =====================================================
// DETECTION SCHEDULE
// =====================================================

function DetectionSchedule() {


    // =====================================================
    // THEME
    // =====================================================

    const { darkMode } = useTheme();


    // =====================================================
    // CURRENT LOGGED-IN USER
    // =====================================================

    const [currentUser, setCurrentUser] =
        useState(null);


    // =====================================================
    // GENERAL SCHEDULE TIMES
    // =====================================================

    const [startTime, setStartTime] =
        useState("21:00");

    const [endTime, setEndTime] =
        useState("07:00");


    // =====================================================
    // GENERAL DETECTION STATUS
    // =====================================================

    const [
        generalScheduleEnabled,
        setGeneralScheduleEnabled
    ] = useState(false);


    // =====================================================
    // CAMERA SCHEDULES
    // =====================================================

    const [cameras, setCameras] =
        useState([]);


    // =====================================================
    // MANUAL OVERRIDES
    // =====================================================

    const [manualOverrides, setManualOverrides] =
        useState({});


    // =====================================================
    // LOADING
    // =====================================================

    const [loading, setLoading] =
        useState(true);


    // =====================================================
    // MESSAGE
    // =====================================================

    const [message, setMessage] =
        useState("");


    // =====================================================
    // CHECK WHETHER CURRENT USER IS HOD
    // =====================================================

    const isHOD =
        String(currentUser?.role || "")
            .trim()
            .toLowerCase() === "hod";


    // =====================================================
    // LOAD CURRENT LOGGED-IN USER
    // =====================================================

    useEffect(() => {

        const loggedIn =
            localStorage.getItem("isLoggedIn");


        if (!loggedIn) {

            window.location.href = "/";

            return;

        }


        const savedUser =
            localStorage.getItem("user");


        if (savedUser) {

            try {

                const user =
                    JSON.parse(savedUser);


                setCurrentUser(user);


            } catch (error) {

                console.error(
                    "Unable to read logged-in user:",
                    error
                );

            }

        } else {

            // =============================================
            // FALLBACK
            // =============================================

            const username =
                localStorage.getItem("username");


            const role =
                localStorage.getItem("role");


            setCurrentUser({

                username:
                    username || "Admin",

                role:
                    role || "Administrator"

            });

        }

    }, []);


    // =====================================================
    // CONVERT TIME TO MINUTES
    // =====================================================

    const timeToMinutes =
        useCallback(
            (timeString) => {

                if (!timeString) {

                    return null;

                }


                const value =
                    String(timeString).trim();


                const parts =
                    value.split(":");


                if (parts.length < 2) {

                    return null;

                }


                const hours =
                    Number(parts[0]);


                const minutes =
                    Number(parts[1]);


                if (
                    Number.isNaN(hours) ||
                    Number.isNaN(minutes)
                ) {

                    return null;

                }


                if (
                    hours < 0 ||
                    hours > 23 ||
                    minutes < 0 ||
                    minutes > 59
                ) {

                    return null;

                }


                return (
                    hours * 60 +
                    minutes
                );

            },
            []
        );


    // =====================================================
    // CHECK CURRENT TIME
    // =====================================================

    const isCurrentTimeInsideSchedule =
        useCallback(
            (start, end) => {

                const startMinutes =
                    timeToMinutes(start);


                const endMinutes =
                    timeToMinutes(end);


                if (
                    startMinutes === null ||
                    endMinutes === null
                ) {

                    return false;

                }


                const now =
                    new Date();


                const currentMinutes =
                    (
                        now.getHours() * 60
                    ) +
                    now.getMinutes();


                // =========================================
                // SAME START AND END
                // =========================================

                if (
                    startMinutes === endMinutes
                ) {

                    return true;

                }


                // =========================================
                // SAME DAY
                // =========================================

                if (
                    startMinutes < endMinutes
                ) {

                    return (
                        currentMinutes >= startMinutes &&
                        currentMinutes < endMinutes
                    );

                }


                // =========================================
                // OVERNIGHT
                // =========================================

                return (
                    currentMinutes >= startMinutes ||
                    currentMinutes < endMinutes
                );

            },
            [
                timeToMinutes
            ]
        );


    // =====================================================
    // GET CAMERA NAME
    // =====================================================

    const getCameraName =
        useCallback(
            (camera, index) => {

                return (
                    camera.camera_name ||
                    camera.camera ||
                    `Camera ${index + 1}`
                );

            },
            []
        );


    // =====================================================
    // GET CAMERA KEY
    // =====================================================

    const getCameraKey =
        useCallback(
            (camera, index) => {

                return (
                    camera.id ||
                    camera.camera_id ||
                    index + 1
                );

            },
            []
        );


    // =====================================================
    // UPDATE GENERAL SCHEDULE STATUS
    // =====================================================

    const updateGeneralScheduleStatus =
        useCallback(() => {

            const active =
                isCurrentTimeInsideSchedule(
                    startTime,
                    endTime
                );


            setGeneralScheduleEnabled(
                active
            );

        }, [
            startTime,
            endTime,
            isCurrentTimeInsideSchedule
        ]);


    // =====================================================
    // REAL-TIME SCHEDULE STATUS
    //
    // The schedule only changes when the minute changes,
    // so checking every 30 seconds is enough.
    // This avoids unnecessary screen updates.
    // =====================================================

    useEffect(() => {

        updateGeneralScheduleStatus();


        const interval =
            setInterval(() => {

                updateGeneralScheduleStatus();

            }, 30000);


        return () => {

            clearInterval(
                interval
            );

        };

    }, [
        updateGeneralScheduleStatus
    ]);


    // =====================================================
    // FETCH GENERAL SCHEDULE
    // =====================================================

    const fetchGeneralSchedule =
        useCallback(
            async () => {

                try {

                    const response =
                        await fetch(
                            "http://localhost:5000/api/general-detection-schedule"
                        );


                    if (!response.ok) {

                        throw new Error(
                            `General schedule HTTP ${response.status}`
                        );

                    }


                    const data =
                        await response.json();


                    if (
                        data.success &&
                        data.schedule
                    ) {

                        const loadedStartTime =
                            data.schedule.start_time
                                ? String(
                                    data.schedule.start_time
                                ).substring(0, 5)
                                : "21:00";


                        const loadedEndTime =
                            data.schedule.end_time
                                ? String(
                                    data.schedule.end_time
                                ).substring(0, 5)
                                : "07:00";


                        setStartTime(
                            loadedStartTime
                        );


                        setEndTime(
                            loadedEndTime
                        );


                        setGeneralScheduleEnabled(
                            isCurrentTimeInsideSchedule(
                                loadedStartTime,
                                loadedEndTime
                            )
                        );

                    }

                } catch (error) {

                    console.error(
                        "Fetch General Detection Schedule Error:",
                        error
                    );


                    setMessage(
                        "Unable to load the general detection schedule."
                    );

                }

            },
            [
                isCurrentTimeInsideSchedule
            ]
        );


    // =====================================================
    // FETCH CAMERA SCHEDULES
    // =====================================================

    const fetchSchedules =
        useCallback(
            async () => {

                try {

                    console.log(
                        "Loading camera detection schedules..."
                    );


                    const response =
                        await fetch(
                            "http://localhost:5000/api/detection-schedule"
                        );


                    console.log(
                        "Detection Schedule HTTP Status:",
                        response.status
                    );


                    if (!response.ok) {

                        let serverMessage =
                            `HTTP ${response.status}`;


                        try {

                            const errorData =
                                await response.json();


                            if (
                                errorData.message
                            ) {

                                serverMessage =
                                    errorData.message;

                            }

                        } catch (error) {

                            // Ignore JSON parsing error.

                        }


                        throw new Error(
                            serverMessage
                        );

                    }


                    const data =
                        await response.json();


                    console.log(
                        "Detection Schedule API Response:",
                        data
                    );


                    if (!data.success) {

                        throw new Error(
                            data.message ||
                            "Detection schedule request failed."
                        );

                    }


                    const schedules =
                        Array.isArray(
                            data.schedules
                        )
                            ? data.schedules
                            : [];


                    console.log(
                        "Camera schedules received:",
                        schedules
                    );


                    setCameras(
                        schedules
                    );


                    // =========================================
                    // BUILD MANUAL OVERRIDES
                    // =========================================

                    const databaseOverrides = {};


                    schedules.forEach(
                        (camera, index) => {

                            const cameraKey =
                                getCameraKey(
                                    camera,
                                    index
                                );


                            if (
                                Number(
                                    camera.manual_override
                                ) === 1
                            ) {

                                databaseOverrides[
                                    cameraKey
                                ] =
                                    Number(
                                        camera.detection_enabled
                                    ) === 1
                                        ? 1
                                        : 0;

                            }

                        }
                    );


                    setManualOverrides(
                        databaseOverrides
                    );


                    setMessage("");


                } catch (error) {

                    console.error(
                        "Fetch Detection Schedule Error:",
                        error
                    );


                    setCameras([]);


                    setMessage(
                        `Unable to load camera detection schedules: ${error.message}`
                    );


                } finally {

                    setLoading(false);

                }

            },
            [
                getCameraKey
            ]
        );


    // =====================================================
    // LOAD DATA
    // =====================================================

    useEffect(() => {

        const loadData =
            async () => {

                await Promise.all([
                    fetchGeneralSchedule(),
                    fetchSchedules()
                ]);

            };


        loadData();

    }, [
        fetchGeneralSchedule,
        fetchSchedules
    ]);


    // =====================================================
    // GET EFFECTIVE CAMERA STATUS
    // =====================================================

    const getEffectiveCameraStatus =
        useCallback(
            (camera, index) => {

                const cameraKey =
                    getCameraKey(
                        camera,
                        index
                    );


                // =========================================
                // MANUAL OVERRIDE HAS PRIORITY
                // =========================================

                if (
                    Object.prototype.hasOwnProperty.call(
                        manualOverrides,
                        cameraKey
                    )
                ) {

                    return Number(
                        manualOverrides[
                            cameraKey
                        ]
                    ) === 1;

                }


                // =========================================
                // FOLLOW GENERAL SCHEDULE
                // =========================================

                return generalScheduleEnabled;

            },
            [
                getCameraKey,
                manualOverrides,
                generalScheduleEnabled
            ]
        );


    // =====================================================
    // SAVE GENERAL SCHEDULE
    // =====================================================

    const saveGeneralSchedule =
        async () => {

            // =============================================
            // HOD PERMISSION CHECK
            // =============================================

            if (!isHOD) {

                setMessage(
                    "Only the HOD account can change the general detection schedule."
                );

                return;

            }


            try {

                setMessage("");


                // =========================================
                // VALIDATE TIME
                // =========================================

                if (
                    timeToMinutes(startTime) === null ||
                    timeToMinutes(endTime) === null
                ) {

                    setMessage(
                        "Please enter valid start and end times."
                    );

                    return;

                }


                const currentActiveStatus =
                    isCurrentTimeInsideSchedule(
                        startTime,
                        endTime
                    );


                // =========================================
                // SAVE GENERAL SCHEDULE
                // =========================================

                const response =
                    await fetch(
                        "http://localhost:5000/api/general-detection-schedule",
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                start_time:
                                    startTime,

                                end_time:
                                    endTime,

                                enabled:
                                    currentActiveStatus
                                        ? 1
                                        : 0

                            })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Failed to save general detection schedule."
                    );

                }


                setGeneralScheduleEnabled(
                    currentActiveStatus
                );


                // =========================================
                // UPDATE ONLY CAMERAS WITHOUT OVERRIDE
                // =========================================

                const updateRequests =
                    cameras
                        .filter(
                            (camera, index) => {

                                const cameraKey =
                                    getCameraKey(
                                        camera,
                                        index
                                    );


                                return !Object.prototype.hasOwnProperty.call(
                                    manualOverrides,
                                    cameraKey
                                );

                            }
                        )
                        .map(
                            (camera) => {

                                return fetch(
                                    `http://localhost:5000/api/detection-schedule/${camera.id}`,
                                    {

                                        method: "PUT",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body: JSON.stringify({

                                            detection_enabled:
                                                currentActiveStatus
                                                    ? 1
                                                    : 0,

                                            manual_override:
                                                0,

                                            start_time:
                                                startTime,

                                            end_time:
                                                endTime

                                        })

                                    }
                                );

                            }
                        );


                await Promise.all(
                    updateRequests
                );


                // =========================================
                // UPDATE LOCAL CAMERA DATA
                // =========================================

                setCameras(
                    (previousCameras) => {

                        return previousCameras.map(
                            (camera, index) => {

                                const cameraKey =
                                    getCameraKey(
                                        camera,
                                        index
                                    );


                                const hasManualOverride =
                                    Object.prototype.hasOwnProperty.call(
                                        manualOverrides,
                                        cameraKey
                                    );


                                if (
                                    hasManualOverride
                                ) {

                                    return camera;

                                }


                                return {

                                    ...camera,

                                    detection_enabled:
                                        currentActiveStatus
                                            ? 1
                                            : 0,

                                    manual_override:
                                        0,

                                    start_time:
                                        startTime,

                                    end_time:
                                        endTime

                                };

                            }
                        );

                    }
                );


                setMessage(
                    currentActiveStatus
                        ? `Schedule saved. It is currently ACTIVE (${startTime} - ${endTime}). General detection is ON.`
                        : `Schedule saved. It is currently INACTIVE (${startTime} - ${endTime}). General detection is OFF.`
                );


                // =========================================
                // RELOAD FROM DATABASE
                // =========================================

                await fetchSchedules();


            } catch (error) {

                console.error(
                    "Save General Schedule Error:",
                    error
                );


                setMessage(
                    `Unable to save the general detection schedule: ${error.message}`
                );

            }

        };


    // =====================================================
    // TOGGLE INDIVIDUAL CAMERA
    // =====================================================

    const toggleCamera =
        async (
            camera,
            index
        ) => {

            // =============================================
            // HOD PERMISSION CHECK
            // =============================================

            if (!isHOD) {

                setMessage(
                    "Only the HOD account can override individual camera detection."
                );

                return;

            }


            const cameraKey =
                getCameraKey(
                    camera,
                    index
                );


            const currentStatus =
                getEffectiveCameraStatus(
                    camera,
                    index
                );


            const newStatus =
                currentStatus
                    ? 0
                    : 1;


            try {

                setMessage("");


                // =========================================
                // UPDATE DATABASE
                // =========================================

                const response =
                    await fetch(
                        `http://localhost:5000/api/detection-schedule/${camera.id}`,
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                detection_enabled:
                                    newStatus,

                                manual_override:
                                    1,

                                start_time:
                                    startTime,

                                end_time:
                                    endTime

                            })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Failed to update camera detection status."
                    );

                }


                // =========================================
                // SAVE MANUAL OVERRIDE
                // =========================================

                setManualOverrides(
                    (previousOverrides) => ({

                        ...previousOverrides,

                        [cameraKey]:
                            newStatus

                    })
                );


                // =========================================
                // UPDATE CAMERA LOCALLY
                // =========================================

                setCameras(
                    (previousCameras) =>
                        previousCameras.map(
                            (item) =>
                                item.id === camera.id
                                    ? {

                                        ...item,

                                        detection_enabled:
                                            newStatus,

                                        manual_override:
                                            1

                                    }
                                    : item
                        )
                );


                setMessage(
                    `${getCameraName(camera, index)} detection manually turned ${
                        newStatus
                            ? "ON"
                            : "OFF"
                    }.`
                );


            } catch (error) {

                console.error(
                    "Toggle Camera Detection Error:",
                    error
                );


                setMessage(
                    `Unable to update camera detection status: ${error.message}`
                );

            }

        };


    // =====================================================
    // RETURN CAMERA TO GENERAL
    // =====================================================

    const resetCameraToGeneral =
        async (
            camera,
            index
        ) => {

            // =============================================
            // HOD PERMISSION CHECK
            // =============================================

            if (!isHOD) {

                setMessage(
                    "Only the HOD account can return cameras to general control."
                );

                return;

            }


            const cameraKey =
                getCameraKey(
                    camera,
                    index
                );


            try {

                setMessage("");


                const currentGeneralStatus =
                    isCurrentTimeInsideSchedule(
                        startTime,
                        endTime
                    );


                const newStatus =
                    currentGeneralStatus
                        ? 1
                        : 0;


                // =========================================
                // RETURN TO GENERAL
                // =========================================

                const response =
                    await fetch(
                        `http://localhost:5000/api/detection-schedule/${camera.id}`,
                        {

                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                detection_enabled:
                                    newStatus,

                                manual_override:
                                    0,

                                start_time:
                                    startTime,

                                end_time:
                                    endTime

                            })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Failed to return camera to general control."
                    );

                }


                // =========================================
                // REMOVE LOCAL OVERRIDE
                // =========================================

                setManualOverrides(
                    (previousOverrides) => {

                        const updated = {
                            ...previousOverrides
                        };


                        delete updated[
                            cameraKey
                        ];


                        return updated;

                    }
                );


                // =========================================
                // UPDATE CAMERA
                // =========================================

                setCameras(
                    (previousCameras) =>
                        previousCameras.map(
                            (item) =>
                                item.id === camera.id
                                    ? {

                                        ...item,

                                        detection_enabled:
                                            newStatus,

                                        manual_override:
                                            0,

                                        start_time:
                                            startTime,

                                        end_time:
                                            endTime

                                    }
                                    : item
                        )
                );


                setMessage(
                    `${getCameraName(camera, index)} has been returned to the general detection schedule.`
                );


            } catch (error) {

                console.error(
                    "Reset Camera General Control Error:",
                    error
                );


                setMessage(
                    `Unable to return camera to general control: ${error.message}`
                );

            }

        };


    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {

        return (

            <div
                className={
                    darkMode
                        ? "detection-schedule-page dark"
                        : "detection-schedule-page"
                }
            >

                <div className="schedule-top-bar">

                    <Link
                        to="/settings"
                        className="schedule-back-button"
                    >
                        ← Back
                    </Link>


                    <div>

                        <h1>
                            Detection Schedule
                        </h1>

                    </div>

                </div>


                <div className="schedule-loading">

                    Loading detection schedule...

                </div>

            </div>

        );

    }


    // =====================================================
    // GENERAL STATUS
    // =====================================================

    const generalStatusText =
        generalScheduleEnabled
            ? "GENERAL ON"
            : "GENERAL OFF";


    // =====================================================
    // MAIN PAGE
    // =====================================================

    return (

        <div
            className={
                darkMode
                    ? "detection-schedule-page dark"
                    : "detection-schedule-page"
            }
        >


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="schedule-top-bar">

                <Link
                    to="/settings"
                    className="schedule-back-button"
                >
                    ← Back
                </Link>


                <div>

                    <h1>
                        Detection Schedule
                    </h1>

                </div>

            </div>


            {/* =================================================
                GENERAL SCHEDULE
            ================================================= */}

            <div className="general-schedule-card">

                <div className="general-schedule-header">

                    <div>

                        <h2>
                            General Detection Schedule
                        </h2>

                    </div>


                    <span className="active-time-badge">

                        {startTime} - {endTime}

                    </span>

                </div>


                <div className="general-schedule-controls">


                    {/* START TIME */}

                    <div className="time-field">

                        <label>
                            Start Time
                        </label>


                        <input
                            type="time"
                            value={startTime}
                            onChange={(event) =>
                                setStartTime(
                                    event.target.value
                                )
                            }
                            disabled={!isHOD}
                        />

                    </div>


                    {/* END TIME */}

                    <div className="time-field">

                        <label>
                            End Time
                        </label>


                        <input
                            type="time"
                            value={endTime}
                            onChange={(event) =>
                                setEndTime(
                                    event.target.value
                                )
                            }
                            disabled={!isHOD}
                        />

                    </div>


                    {/* SAVE */}

                    {isHOD && (

                        <button
                            type="button"
                            className="save-schedule-button"
                            onClick={
                                saveGeneralSchedule
                            }
                        >
                            Save Schedule
                        </button>

                    )}


                    {/* GENERAL SWITCH */}

                    <button
                        type="button"
                        className={
                            generalScheduleEnabled
                                ? "camera-switch switch-on"
                                : "camera-switch switch-off"
                        }
                        disabled
                        aria-label={
                            generalScheduleEnabled
                                ? "General detection is currently ON"
                                : "General detection is currently OFF"
                        }
                    >

                        <span />

                    </button>


                    {/* GENERAL STATUS */}

                    <span
                        className={
                            generalScheduleEnabled
                                ? "status-on"
                                : "status-off"
                        }
                    >

                        {generalStatusText}

                    </span>

                </div>

            </div>


            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (

                <div className="schedule-message">

                    {message}

                </div>

            )}


            {/* =================================================
                INDIVIDUAL CAMERAS
            ================================================= */}

            <div className="camera-detection-card">

                <div className="camera-section-header">

                    <h2>
                        Individual Camera Detection
                    </h2>

                </div>


                <div className="camera-list">

                    {cameras.length === 0 ? (

                        <div className="schedule-message">

                            No camera detection schedules found.

                        </div>

                    ) : (

                        cameras.map(
                            (camera, index) => {

                                const cameraKey =
                                    getCameraKey(
                                        camera,
                                        index
                                    );


                                const isManuallyOverridden =
                                    Object.prototype.hasOwnProperty.call(
                                        manualOverrides,
                                        cameraKey
                                    );


                                const isEnabled =
                                    getEffectiveCameraStatus(
                                        camera,
                                        index
                                    );


                                return (

                                    <div
                                        className="camera-row"
                                        key={
                                            camera.id ||
                                            cameraKey
                                        }
                                    >


                                        {/* CAMERA NAME */}

                                        <div className="camera-information">

                                            <h3>

                                                {getCameraName(
                                                    camera,
                                                    index
                                                )}

                                            </h3>

                                        </div>


                                        {/* CAMERA STATUS */}

                                        <div className="camera-status">

                                            <span
                                                className={
                                                    isEnabled
                                                        ? "status-on"
                                                        : "status-off"
                                                }
                                            >

                                                {isEnabled
                                                    ? "ON"
                                                    : "OFF"}

                                            </span>


                                            {/* =================================
                                                HOD ONLY CAMERA SWITCH
                                            ================================= */}

                                            {isHOD && (

                                                <button
                                                    type="button"
                                                    className={
                                                        isEnabled
                                                            ? "camera-switch switch-on"
                                                            : "camera-switch switch-off"
                                                    }
                                                    onClick={() =>
                                                        toggleCamera(
                                                            camera,
                                                            index
                                                        )
                                                    }
                                                    aria-label={
                                                        isEnabled
                                                            ? "Turn detection off"
                                                            : "Turn detection on"
                                                    }
                                                >

                                                    <span />

                                                </button>

                                            )}


                                            {/* =================================
                                                GENERAL BUTTON
                                            ================================= */}

                                            {isHOD &&
                                                isManuallyOverridden && (

                                                    <button
                                                        type="button"
                                                        className="reset-camera-button"
                                                        onClick={() =>
                                                            resetCameraToGeneral(
                                                                camera,
                                                                index
                                                            )
                                                        }
                                                    >
                                                        General
                                                    </button>

                                                )}

                                        </div>

                                    </div>

                                );

                            }
                        )

                    )}

                </div>

            </div>

        </div>

    );

}


// =====================================================
// EXPORT
// =====================================================

export default DetectionSchedule;