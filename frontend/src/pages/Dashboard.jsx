
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import futoLogo from "../assets/futo-logo.jpeg";

import {
    FaBars,
    FaTimes,
    FaBell,
    FaVideo,
    FaPlayCircle,
    FaCog,
    FaSignOutAlt,
    FaHome,
    FaUserClock,
    FaRunning,
    FaShieldAlt,
    FaUser,
    FaChevronDown,
    FaEye,
    FaFilm,
    FaBan,
    FaCalendarAlt,
    FaHistory,
    FaArrowRight,
    FaUsers
} from "react-icons/fa";

import "../styles/Dashboard.css";
import cameras from "../data/cameras";

// ==========================================
// BACKEND CONFIGURATION
// ==========================================

const API_BASE = "http://localhost:5000";

function Dashboard() {

    const navigate = useNavigate();

    // ==========================================
    // STATES
    // ==========================================

    const [menuOpen, setMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [lastLogin, setLastLogin] = useState(null);

    const [detectionActive, setDetectionActive] =
        useState(false);

    const [detectionStartTime, setDetectionStartTime] =
        useState("21:00");

    const [detectionEndTime, setDetectionEndTime] =
        useState("07:00");

    const [
        loadingDetectionSchedule,
        setLoadingDetectionSchedule
    ] = useState(true);

    const [notifications, setNotifications] = useState([]);

    const [
        loadingNotifications,
        setLoadingNotifications
    ] = useState(true);

    // ==========================================
    // LOAD CURRENT ADMIN
    // ==========================================

    useEffect(() => {

        const loggedIn = localStorage.getItem("isLoggedIn");

        if (!loggedIn) {
            navigate("/");
            return;
        }

        const savedUser = localStorage.getItem("user");

        if (savedUser) {

            try {

                setCurrentUser(JSON.parse(savedUser));

            } catch (error) {

                console.error(
                    "Unable to read logged-in user:",
                    error
                );

            }

        }

    }, [navigate]);

    // ==========================================
    // FORMAT SCHEDULE TIME
    // ==========================================

    const formatScheduleTime = useCallback((time) => {

        return time ? String(time).substring(0, 5) : "";

    }, []);

    // ==========================================
    // CONVERT TIME TO MINUTES
    // ==========================================

    const timeToMinutes = useCallback((timeString) => {

        if (!timeString) return null;

        const parts = String(timeString).trim().split(":");

        if (parts.length < 2) return null;

        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        if (
            !Number.isInteger(hours) ||
            !Number.isInteger(minutes) ||
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }

        return hours * 60 + minutes;

    }, []);

    // ==========================================
    // CHECK CURRENT DETECTION SCHEDULE
    // ==========================================

    const isCurrentTimeInsideSchedule = useCallback(
        (start, end) => {

            const startMinutes = timeToMinutes(start);
            const endMinutes = timeToMinutes(end);

            if (
                startMinutes === null ||
                endMinutes === null
            ) {
                return false;
            }

            const now = new Date();

            const currentMinutes =
                now.getHours() * 60 + now.getMinutes();

            // Same start and end means all day.

            if (startMinutes === endMinutes) {
                return true;
            }

            // Normal same-day schedule.

            if (startMinutes < endMinutes) {

                return (
                    currentMinutes >= startMinutes &&
                    currentMinutes < endMinutes
                );

            }

            // Overnight schedule.

            return (
                currentMinutes >= startMinutes ||
                currentMinutes < endMinutes
            );

        },
        [timeToMinutes]
    );

    // ==========================================
    // UPDATE DETECTION STATUS
    // ==========================================

    const updateDetectionStatus = useCallback(
        (startTime, endTime) => {

            setDetectionActive(
                isCurrentTimeInsideSchedule(startTime, endTime)
            );

        },
        [isCurrentTimeInsideSchedule]
    );

    // ==========================================
    // FETCH DETECTION SCHEDULE
    // ==========================================

    const fetchDetectionSchedule = useCallback(async () => {

        try {

            const response = await fetch(
                `${API_BASE}/api/detection-schedule`
            );

            if (!response.ok) {

                throw new Error(
                    `Failed to fetch detection schedule: HTTP ${response.status}`
                );

            }

            const data = await response.json();

            if (
                !data.success ||
                !Array.isArray(data.schedules)
            ) {

                console.error(
                    "Invalid detection schedule response:",
                    data
                );

                return;

            }

            if (data.schedules.length === 0) {

                setDetectionStartTime("21:00");
                setDetectionEndTime("07:00");
                setDetectionActive(false);

                return;

            }

            const generalSchedule = data.schedules.find(
                schedule =>
                    Number(schedule.manual_override) === 0
            );

            const activeSchedule =
                generalSchedule || data.schedules[0];

            const loadedStartTime = activeSchedule.start_time
                ? formatScheduleTime(activeSchedule.start_time)
                : "21:00";

            const loadedEndTime = activeSchedule.end_time
                ? formatScheduleTime(activeSchedule.end_time)
                : "07:00";

            setDetectionStartTime(previous =>
                previous === loadedStartTime
                    ? previous
                    : loadedStartTime
            );

            setDetectionEndTime(previous =>
                previous === loadedEndTime
                    ? previous
                    : loadedEndTime
            );

            updateDetectionStatus(
                loadedStartTime,
                loadedEndTime
            );

        } catch (error) {

            console.error(
                "Detection schedule fetch error:",
                error
            );

        } finally {

            setLoadingDetectionSchedule(false);

        }

    }, [formatScheduleTime, updateDetectionStatus]);

    // ==========================================
    // LOAD DETECTION SCHEDULE
    // ==========================================

    useEffect(() => {

        fetchDetectionSchedule();

        const interval = setInterval(
            fetchDetectionSchedule,
            30000
        );

        return () => clearInterval(interval);

    }, [fetchDetectionSchedule]);

    // ==========================================
    // AUTOMATIC DETECTION STATUS UPDATE
    // ==========================================

    useEffect(() => {

        const checkCurrentSchedule = () => {

            updateDetectionStatus(
                detectionStartTime,
                detectionEndTime
            );

        };

        checkCurrentSchedule();

        const interval = setInterval(
            checkCurrentSchedule,
            1000
        );

        return () => clearInterval(interval);

    }, [
        detectionStartTime,
        detectionEndTime,
        updateDetectionStatus
    ]);

    // ==========================================
    // LAST LOGIN
    // ==========================================

    useEffect(() => {

        if (!localStorage.getItem("isLoggedIn")) {
            navigate("/");
            return;
        }

        fetch(`${API_BASE}/api/auth/last-login`)

            .then(response => {

                if (!response.ok) {
                    throw new Error("Failed to fetch last login");
                }

                return response.json();

            })

            .then(data => {

                if (data.success && data.lastLogin) {

                    const loginDate = new Date(
                        data.lastLogin.login_time
                    );

                    const today = new Date();

                    const isToday =
                        loginDate.toDateString() ===
                        today.toDateString();

                    const dateText = isToday
                        ? "Today"
                        : loginDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        });

                    const timeText = loginDate.toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );

                    setLastLogin({
                        username: data.lastLogin.username,
                        date: dateText,
                        time: timeText
                    });

                } else {

                    setLastLogin(null);

                }

            })

            .catch(error => {

                console.error(
                    "Last login error:",
                    error
                );

                setLastLogin(null);

            });

    }, [navigate]);

    // ==========================================
    // FETCH NOTIFICATIONS
    // ==========================================

    const fetchNotifications = useCallback(async () => {

        try {

            const adminId = localStorage.getItem("admin_id");

            if (!adminId) {
                setNotifications([]);
                return;
            }

            const response = await fetch(
                `${API_BASE}/api/notifications`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "admin-id": adminId
                    }
                }
            );

            if (response.status === 401) {
                setNotifications([]);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch notifications");
            }

            const data = await response.json();

            setNotifications(
                data.success ? data.notifications || [] : []
            );

        } catch (error) {

            console.error(
                "Notification fetch error:",
                error
            );

            setNotifications([]);

        } finally {

            setLoadingNotifications(false);

        }

    }, []);

    // ==========================================
    // LOAD NOTIFICATIONS
    // ==========================================

    useEffect(() => {

        fetchNotifications();

        const interval = setInterval(
            fetchNotifications,
            30000
        );

        return () => clearInterval(interval);

    }, [fetchNotifications]);

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {

        const confirmed = window.confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmed) return;

        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("username");
        localStorage.removeItem("admin_id");

        navigate("/");

    };

    // ==========================================
    // CAMERA STATISTICS
    // ==========================================

    const totalCameras = cameras.length;

    const onlineCameras = cameras.filter(
        camera => camera.status === "Online"
    ).length;

    const offlineCameras = cameras.filter(
        camera => camera.status === "Offline"
    ).length;

    const onlinePercentage = totalCameras > 0
        ? Math.round(
            (onlineCameras / totalCameras) * 100
        )
        : 0;

    const offlinePercentage = totalCameras > 0
        ? Math.round(
            (offlineCameras / totalCameras) * 100
        )
        : 0;

    // ==========================================
    // TODAY'S ALERTS
    // ==========================================

    const today = new Date();

    const todaysAlerts = notifications.filter(
        notification => {

            if (!notification.created_at) {
                return false;
            }

            return (
                new Date(
                    notification.created_at
                ).toDateString() === today.toDateString()
            );

        }
    ).length;

    // ==========================================
    // UNREAD HUMAN DETECTION COUNT
    // ==========================================

    const unreadDetectionCount = notifications.filter(
        notification => {

            const type = String(
                notification.type || ""
            ).trim().toLowerCase();

            const status = String(
                notification.status || ""
            ).trim().toLowerCase();

            return (
                type === "human detection" &&
                status === "unread"
            );

        }
    ).length;

    // ==========================================
    // NAVIGATION
    // ==========================================

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const goToLiveCameras = () => {

        closeMenu();

        document
            .getElementById("live-cameras")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    };

    const goToDashboard = () => {

        closeMenu();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };

    const goToPage = page => {

        closeMenu();
        navigate(page);

    };

    // ==========================================
    // CAMERA HELPERS
    // ==========================================

    const isCameraOnline = camera =>
        camera.status === "Online";

    const hasLiveStream = camera =>
        isCameraOnline(camera) &&
        Boolean(camera.streamUrl);

    // ==========================================
    // ACCOUNTS PERMISSION
    // ==========================================

    const isHOD =
        String(currentUser?.role || "")
            .trim()
            .toUpperCase() === "HOD";

    // ==========================================
    // SIDEBAR SCROLLING STYLE
    // DUPLICATE HEIGHT WARNING FIXED
    // ==========================================

    const sidebarScrollStyle = {
        height: "100dvh",
        maxHeight: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehaviorY: "contain",
        boxSizing: "border-box",
        scrollbarWidth: "thin",
        scrollbarColor: "#334155 transparent",
        display: "flex",
        flexDirection: "column"
    };

    // ==========================================
    // MAIN DASHBOARD
    // ==========================================

    return (

        <div className="dashboard">

            {/* ====================================
          MOBILE OVERLAY
      ==================================== */}

            {menuOpen && (

                <div
                    className="sidebar-overlay"
                    onClick={closeMenu}
                />

            )}

            {/* ====================================
          MOBILE MENU BUTTON
      ==================================== */}

            <button
                type="button"
                className="mobile-menu-button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
            >

                {menuOpen ? <FaTimes /> : <FaBars />}

            </button>

            {/* ====================================
          SIDEBAR
      ==================================== */}

            <aside
                className={`sidebar ${menuOpen ? "show-sidebar" : ""
                    }`}
                style={sidebarScrollStyle}
            >

                {/* SYSTEM LOGO */}

                <div
                    className="sidebar-logo"
                    style={{ flexShrink: 0 }}
                >

                    <div className="logo-icon">
                        <img
                            src={futoLogo}
                            alt="FUTO Logo"
                        />
                    </div>

                    <div className="logo-text">
                        <h2>IFT SMART SURVEILLANCE</h2>
                        <span>Monitoring System</span>
                    </div>

                </div>

                {/* ==================================
            MAIN NAVIGATION
        ================================== */}

                <nav
                    className="sidebar-navigation"
                    style={{ flexShrink: 0 }}
                >

                    {/* DASHBOARD */}

                    <button
                        type="button"
                        className="sidebar-item active"
                        onClick={goToDashboard}
                    >
                        <FaHome />
                        <span>Dashboard</span>
                    </button>

                    {/* LIVE CAMERAS */}

                    <button
                        type="button"
                        className="sidebar-item"
                        onClick={goToLiveCameras}
                    >
                        <FaVideo />
                        <span>Live Cameras</span>
                    </button>

                    {/* PLAYBACK */}

                    <button
                        type="button"
                        className="sidebar-item"
                        onClick={() => goToPage("/playback")}
                    >
                        <FaPlayCircle />
                        <span>Playback</span>
                    </button>

                    {/* NOTIFICATIONS */}

                    <button
                        type="button"
                        className="sidebar-item"
                        onClick={() => goToPage("/notifications")}
                    >
                        <FaBell />
                        <span>Notifications</span>

                        {unreadDetectionCount > 0 && (

                            <span className="sidebar-notification-count">

                                {unreadDetectionCount > 99
                                    ? "99+"
                                    : unreadDetectionCount}

                            </span>

                        )}

                    </button>

                    {/* LOGIN ACTIVITIES */}

                    <button
                        type="button"
                        className="sidebar-item"
                        onClick={() => goToPage("/login-activity")}
                    >
                        <FaUserClock />
                        <span>Login Activities</span>
                    </button>

                    {/* SETTINGS */}

                    <button
                        type="button"
                        className="sidebar-item"
                        onClick={() => goToPage("/settings")}
                    >
                        <FaCog />
                        <span>Settings</span>
                    </button>

                </nav>

                {/* ==================================
            SYSTEM SECTION
        ================================== */}

                <div
                    className="sidebar-section"
                    style={{ flexShrink: 0 }}
                >

                    <div className="sidebar-section-title">
                        SYSTEM
                    </div>

                    {/* HUMAN DETECTION */}

                    <div className="system-item">

                        <FaRunning />

                        <span>Human Detection</span>

                        <span
                            className={
                                detectionActive
                                    ? "system-active"
                                    : "system-inactive"
                            }
                        >

                            {loadingDetectionSchedule
                                ? "..."
                                : detectionActive
                                    ? "ACTIVE"
                                    : "INACTIVE"}

                        </span>

                    </div>

                    {/* DETECTION SCHEDULE */}

                    <button
                        type="button"
                        className="system-button"
                        onClick={() =>
                            goToPage("/detection-schedule")
                        }
                    >

                        <FaCalendarAlt />
                        <span>Detection Schedule</span>

                    </button>

                    {/* ==================================
              ACCOUNTS - HOD ONLY
          ================================== */}

                    {isHOD && (

                        <button
                            type="button"
                            className="system-button"
                            onClick={() => goToPage("/accounts")}
                        >

                            <FaUsers />
                            <span>Accounts</span>

                        </button>

                    )}

                </div>

                {/* ==================================
            LOGOUT
        ================================== */}

                <div
                    className="sidebar-bottom"
                    style={{
                        flexShrink: 0,
                        marginTop: "auto",
                        paddingBottom: "20px"
                    }}
                >

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >

                        <FaSignOutAlt />
                        <span>Logout</span>

                    </button>

                </div>

            </aside>

            {/* ====================================
          MAIN CONTENT
      ==================================== */}

            <main className="main-content">

                {/* ==================================
            TOP HEADER
        ================================== */}

                <header className="top-header">

                    <div className="header-left">

                        <button
                            type="button"
                            className="desktop-menu-button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle sidebar"
                        >

                            <FaBars />

                        </button>

                        <h1>Dashboard</h1>

                    </div>

                    <div className="header-right">

                        {/* NOTIFICATION BELL */}

                        <button
                            type="button"
                            className="header-notification"
                            onClick={() => navigate("/notifications")}
                            aria-label="Unread human detection notifications"
                        >

                            <FaBell />

                            {unreadDetectionCount > 0 && (

                                <span>

                                    {unreadDetectionCount > 99
                                        ? "99+"
                                        : unreadDetectionCount}

                                </span>

                            )}

                        </button>

                        {/* LAST LOGIN */}

                        <div className="last-login-header">

                            <div className="last-login-icon">
                                <FaHistory />
                            </div>

                            <div className="last-login-information">

                                <strong>Last Login</strong>

                                <span>

                                    {lastLogin
                                        ? `${lastLogin.date} • ${lastLogin.time}`
                                        : "No Login Record"}

                                </span>

                            </div>

                        </div>

                        <div className="header-divider" />

                        {/* CURRENT ADMIN PROFILE */}

                        <button
                            type="button"
                            className="admin-profile"
                            onClick={() => navigate("/settings")}
                        >

                            <div className="admin-avatar">
                                <FaUser />
                            </div>

                            <div className="admin-information">

                                <strong>

                                    {currentUser?.username ||
                                        localStorage.getItem("username") ||
                                        "Admin"}

                                </strong>

                                <small>

                                    {currentUser?.role || "Administrator"}

                                </small>

                            </div>

                            <div className="admin-online" />

                            <FaChevronDown className="profile-arrow" />

                        </button>

                    </div>

                </header>

                {/* ==================================
            DASHBOARD CONTENT
        ================================== */}

                <section className="dashboard-content">

                    {/* ==================================
              STATISTICS
          ================================== */}

                    <div className="stats-grid">

                        {/* TOTAL CAMERAS */}

                        <div className="stat-card">

                            <div className="stat-icon blue">
                                <FaVideo />
                            </div>

                            <div className="stat-information">

                                <span>Total Cameras</span>

                                <strong>
                                    {totalCameras}
                                </strong>

                                <small>
                                    All Registered Cameras
                                </small>

                            </div>

                        </div>

                        {/* ONLINE CAMERAS */}

                        <div className="stat-card">

                            <div className="stat-icon green">
                                <FaVideo />
                            </div>

                            <div className="stat-information">

                                <span>Online Cameras</span>

                                <strong>
                                    {onlineCameras}
                                </strong>

                                <small className="green-text">
                                    {onlinePercentage}% of all cameras
                                </small>

                            </div>

                        </div>

                        {/* OFFLINE CAMERAS */}

                        <div className="stat-card">

                            <div className="stat-icon red">
                                <FaVideo />
                            </div>

                            <div className="stat-information">

                                <span>Offline Cameras</span>

                                <strong>
                                    {offlineCameras}
                                </strong>

                                <small className="red-text">
                                    {offlinePercentage}% of all cameras
                                </small>

                            </div>

                        </div>

                        {/* TODAY'S ALERTS */}

                        <div className="stat-card">

                            <div className="stat-icon orange">
                                <FaBell />
                            </div>

                            <div className="stat-information">

                                <span>Today's Alerts</span>

                                <strong>

                                    {loadingNotifications
                                        ? "..."
                                        : todaysAlerts}

                                </strong>

                                <small>
                                    All notifications today
                                </small>

                            </div>

                        </div>

                        {/* DETECTION STATUS */}

                        <div className="stat-card">

                            <div className="stat-icon detection">
                                <FaShieldAlt />
                            </div>

                            <div className="stat-information">

                                <span>Detection Status</span>

                                <strong
                                    className={
                                        detectionActive
                                            ? "active-status"
                                            : "inactive-status"
                                    }
                                >

                                    {loadingDetectionSchedule
                                        ? "..."
                                        : detectionActive
                                            ? "ACTIVE"
                                            : "INACTIVE"}

                                </strong>

                                <small>

                                    {detectionStartTime} - {detectionEndTime}

                                </small>

                            </div>

                        </div>

                    </div>

                    {/* ==================================
              LIVE CAMERA MONITORING
          ================================== */}

                    <section
                        className="live-camera-section"
                        id="live-cameras"
                    >

                        <div className="section-heading">

                            <div>
                                <h2>Live Camera Monitoring</h2>
                            </div>

                        </div>

                        {/* ==================================
                CAMERA GRID
            ================================== */}

                        <div className="camera-grid">

                            {cameras.map(camera => {

                                const online = isCameraOnline(camera);
                                const liveStream = hasLiveStream(camera);

                                return (

                                    <article
                                        className="camera-card"
                                        key={camera.id}
                                    >

                                        {/* CAMERA HEADER */}

                                        <div className="camera-card-header">

                                            <div className="camera-name">

                                                <span
                                                    className={
                                                        online
                                                            ? "status-dot online"
                                                            : "status-dot offline"
                                                    }
                                                />

                                                <strong>
                                                    {camera.name}
                                                </strong>

                                            </div>

                                            <span
                                                className={
                                                    online
                                                        ? "camera-status live"
                                                        : "camera-status offline"
                                                }
                                            >

                                                {online ? "ONLINE" : "OFFLINE"}

                                            </span>

                                        </div>

                                        {/* CAMERA LOCATION */}

                                        <div className="camera-location">
                                            {camera.location}
                                        </div>

                                        {/* CAMERA SCREEN */}

                                        <div className="camera-screen">

                                            {liveStream ? (

                                                <img
                                                    src={camera.streamUrl}
                                                    alt={`${camera.name} Live Feed`}
                                                />

                                            ) : (

                                                <div className="no-signal">

                                                    <FaBan />

                                                    <strong>

                                                        {online
                                                            ? "NO VIDEO FEED"
                                                            : "NO SIGNAL"}

                                                    </strong>

                                                    <span>

                                                        {online
                                                            ? "Stream not configured"
                                                            : "Camera Offline"}

                                                    </span>

                                                </div>

                                            )}

                                            {liveStream && (

                                                <span className="live-indicator">

                                                    <span />
                                                    LIVE

                                                </span>

                                            )}

                                        </div>

                                        {/* CAMERA DETAILS */}

                                        <div className="camera-details">

                                            <div>

                                                <span>IP Address</span>

                                                <strong>

                                                    {camera.ipAddress ||
                                                        "Not Available"}

                                                </strong>

                                            </div>

                                            <div>

                                                <span>Recording</span>

                                                <strong>

                                                    {camera.recording || "N/A"}

                                                </strong>

                                            </div>

                                        </div>

                                        {/* CAMERA BUTTONS */}

                                        <div className="camera-buttons">

                                            {/* LIVE VIEW */}

                                            <button
                                                type="button"
                                                className="camera-action live-view"
                                                onClick={() =>
                                                    navigate(`/camera/${camera.id}`)
                                                }
                                            >

                                                <FaEye />
                                                <span>Live View</span>

                                            </button>

                                            {/* PLAYBACK */}

                                            <button
                                                type="button"
                                                className="camera-action playback"
                                                onClick={() =>
                                                    navigate("/playback", {
                                                        state: {
                                                            cameraId: camera.id,
                                                            cameraName: camera.name
                                                        }
                                                    })
                                                }
                                            >

                                                <FaFilm />
                                                <span>Playback</span>

                                            </button>

                                        </div>

                                    </article>

                                );

                            })}

                        </div>

                        {/* VIEW ALL CAMERAS */}

                        <button
                            type="button"
                            className="view-all-cameras"
                            onClick={() => navigate("/camera")}
                        >

                            <span>View All Cameras</span>
                            <FaArrowRight />

                        </button>

                    </section>

                </section>

            </main>

        </div>

    );

}

export default Dashboard;
