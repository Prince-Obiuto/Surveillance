import "../styles/Settings.css";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";

// =====================================================
// BACKEND
// =====================================================

const API_URL = "http://localhost:5000";

// =====================================================
// VAPID PUBLIC KEY
// =====================================================

const VAPID_PUBLIC_KEY =
    "BJpwUKEt7Tk9z06vBo9VWSzk4RvQ-AmI2OOwoSCQk9loHqOcpoxhAhQlvIFl5XBVI75zcWPbX_Sn-J2IFIVu44M";

// =====================================================
// CONVERT BASE64 PUBLIC KEY
// =====================================================

function urlBase64ToUint8Array(base64String) {

    const padding =
        "=".repeat(
            (4 - (base64String.length % 4)) % 4
        );

    const base64 =
        (
            base64String +
            padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(
            (char) => char.charCodeAt(0)
        )
    );
}

// =====================================================
// MASK EMAIL
// =====================================================

function maskEmail(email) {

    if (!email) {
        return "";
    }

    const parts =
        email.split("@");

    if (parts.length !== 2) {
        return email;
    }

    const username =
        parts[0];

    const domain =
        parts[1];

    // -----------------------------------------------
    // VERY SHORT EMAIL USERNAME
    // -----------------------------------------------

    if (username.length <= 2) {

        return (
            username.charAt(0) +
            "***@" +
            domain
        );

    }

    // -----------------------------------------------
    // NORMAL EMAIL
    // Example:
    // kaycee3@gmail.com
    // becomes:
    // k***3@gmail.com
    // -----------------------------------------------

    return (
        username.charAt(0) +
        "***" +
        username.charAt(
            username.length - 1
        ) +
        "@" +
        domain
    );
}

// =====================================================
// SETTINGS COMPONENT
// =====================================================

function Settings() {

    const {
        darkMode,
        setDarkMode
    } = useTheme();


    // =================================================
    // CURRENT LOGGED-IN ADMIN
    // =================================================

    const [currentUser, setCurrentUser] = useState(null);


    // =================================================
    // LOAD CURRENT USER
    // =================================================

    useEffect(() => {

        const savedUser =
            localStorage.getItem("user");

        if (savedUser) {

            try {

                const user =
                    JSON.parse(savedUser);

                setCurrentUser(user);

            } catch (error) {

                console.error(
                    "Unable to read saved user:",
                    error
                );

            }

        }

    }, []);


    // =================================================
    // NOTIFICATION STATE
    // =================================================

    const [
        browserNotifications,
        setBrowserNotifications
    ] = useState(false);

    const [
        notificationStatus,
        setNotificationStatus
    ] = useState("");

    const [
        notificationLoading,
        setNotificationLoading
    ] = useState(false);


    // =================================================
    // CHECK NOTIFICATION STATUS
    // =================================================

    useEffect(() => {

        const checkNotificationStatus =
            async () => {

                try {

                    // ----------------------------------
                    // BROWSER SUPPORT
                    // ----------------------------------

                    if (
                        !(
                            "Notification"
                            in window
                        )
                    ) {

                        setNotificationStatus(
                            "Browser notifications are not supported."
                        );

                        return;
                    }


                    // ----------------------------------
                    // CHECK PERMISSION
                    // ----------------------------------

                    if (
                        Notification.permission ===
                        "granted"
                    ) {

                        // --------------------------------
                        // CHECK SERVICE WORKER
                        // --------------------------------

                        if (
                            "serviceWorker"
                            in navigator
                        ) {

                            const registration =
                                await navigator.serviceWorker.getRegistration(
                                    "/sw.js"
                                );

                            if (registration) {

                                const subscription =
                                    await registration.pushManager.getSubscription();

                                if (subscription) {

                                    setBrowserNotifications(
                                        true
                                    );

                                    setNotificationStatus(
                                        "Browser notifications are enabled."
                                    );

                                    return;
                                }
                            }
                        }
                    }

                    setBrowserNotifications(
                        false
                    );

                } catch (error) {

                    console.error(
                        "Notification status error:",
                        error
                    );

                }

            };


        checkNotificationStatus();

    }, []);


    // =================================================
    // ENABLE BROWSER NOTIFICATIONS
    // =================================================

    const enableBrowserNotifications =
        async () => {

            try {

                setNotificationLoading(
                    true
                );

                setNotificationStatus(
                    "Requesting notification permission..."
                );


                // --------------------------------------
                // CHECK BROWSER SUPPORT
                // --------------------------------------

                if (
                    !(
                        "Notification"
                        in window
                    )
                ) {

                    setNotificationStatus(
                        "Your browser does not support notifications."
                    );

                    return;
                }


                if (
                    !(
                        "serviceWorker"
                        in navigator
                    )
                ) {

                    setNotificationStatus(
                        "Service workers are not supported by this browser."
                    );

                    return;
                }


                if (
                    !(
                        "PushManager"
                        in window
                    )
                ) {

                    setNotificationStatus(
                        "Push notifications are not supported by this browser."
                    );

                    return;
                }


                // --------------------------------------
                // REQUEST PERMISSION
                // --------------------------------------

                let permission =
                    Notification.permission;


                if (
                    permission !== "granted"
                ) {

                    permission =
                        await Notification.requestPermission();

                }


                // --------------------------------------
                // PERMISSION DENIED
                // --------------------------------------

                if (
                    permission !== "granted"
                ) {

                    setBrowserNotifications(
                        false
                    );

                    setNotificationStatus(
                        "Notification permission was not granted."
                    );

                    return;
                }


                // --------------------------------------
                // REGISTER SERVICE WORKER
                // --------------------------------------

                setNotificationStatus(
                    "Registering notification service..."
                );


                const registration =
                    await navigator.serviceWorker.register(
                        "/sw.js"
                    );


                await navigator.serviceWorker.ready;


                console.log(
                    "Service worker registered:",
                    registration
                );


                // --------------------------------------
                // CHECK EXISTING SUBSCRIPTION
                // --------------------------------------

                let subscription =
                    await registration.pushManager.getSubscription();


                // --------------------------------------
                // CREATE NEW SUBSCRIPTION
                // --------------------------------------

                if (!subscription) {

                    setNotificationStatus(
                        "Creating push subscription..."
                    );


                    subscription =
                        await registration.pushManager.subscribe({

                            userVisibleOnly: true,

                            applicationServerKey:
                                urlBase64ToUint8Array(
                                    VAPID_PUBLIC_KEY
                                )

                        });

                }


                // --------------------------------------
                // SUBSCRIPTION JSON
                // --------------------------------------

                const subscriptionJSON =
                    subscription.toJSON();


                console.log(
                    "Push subscription:",
                    subscriptionJSON
                );


                // --------------------------------------
                // SEND TO BACKEND
                // --------------------------------------

                setNotificationStatus(
                    "Saving device subscription..."
                );


                const response =
                    await fetch(
                        `${API_URL}/api/push-subscriptions/subscribe`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                admin_id:
                                    localStorage.getItem(
                                        "admin_id"
                                    ),

                                endpoint:
                                    subscriptionJSON.endpoint,

                                keys: {

                                    p256dh:
                                        subscriptionJSON.keys?.p256dh,

                                    auth:
                                        subscriptionJSON.keys?.auth

                                },

                                device_name:
                                    navigator.userAgent

                            })

                        }
                    );


                const data =
                    await response.json();


                // --------------------------------------
                // BACKEND ERROR
                // --------------------------------------

                if (
                    !response.ok ||
                    !data.success
                ) {

                    console.error(
                        "Subscription backend error:",
                        data
                    );

                    setNotificationStatus(
                        data.message ||
                        "Unable to save notification subscription."
                    );

                    return;
                }


                // --------------------------------------
                // SUCCESS
                // --------------------------------------

                setBrowserNotifications(
                    true
                );

                setNotificationStatus(
                    "Browser notifications enabled successfully."
                );


                // --------------------------------------
                // TEST LOCAL NOTIFICATION
                // --------------------------------------

                registration.showNotification(
                    "Smart Surveillance",
                    {

                        body:
                            "Browser notifications are now enabled.",

                        icon:
                            "/favicon.ico",

                        badge:
                            "/favicon.ico",

                        data: {
                            url:
                                "/notifications"
                        }

                    }
                );


            } catch (error) {

                console.error(
                    "Enable notification error:",
                    error
                );

                setBrowserNotifications(
                    false
                );

                setNotificationStatus(
                    "Unable to enable browser notifications."
                );

            } finally {

                setNotificationLoading(
                    false
                );

            }

        };


    // =================================================
    // DISABLE BROWSER NOTIFICATIONS
    // =================================================

    const disableBrowserNotifications =
        async () => {

            try {

                setNotificationLoading(
                    true
                );

                setNotificationStatus(
                    "Disabling notifications..."
                );


                if (
                    !(
                        "serviceWorker"
                        in navigator
                    )
                ) {

                    setBrowserNotifications(
                        false
                    );

                    return;
                }


                const registration =
                    await navigator.serviceWorker.getRegistration(
                        "/sw.js"
                    );


                if (!registration) {

                    setBrowserNotifications(
                        false
                    );

                    setNotificationStatus(
                        "Notifications are disabled."
                    );

                    return;
                }


                const subscription =
                    await registration.pushManager.getSubscription();


                if (subscription) {

                    const endpoint =
                        subscription.endpoint;


                    // ----------------------------------
                    // REMOVE FROM DATABASE
                    // ----------------------------------

                    try {

                        await fetch(
                            `${API_URL}/api/push-subscriptions/unsubscribe`,
                            {

                                method: "DELETE",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    endpoint
                                })

                            }
                        );

                    } catch (error) {

                        console.error(
                            "Backend unsubscribe error:",
                            error
                        );

                    }


                    // ----------------------------------
                    // UNSUBSCRIBE BROWSER
                    // ----------------------------------

                    await subscription.unsubscribe();

                }


                setBrowserNotifications(
                    false
                );

                setNotificationStatus(
                    "Browser notifications disabled."
                );


            } catch (error) {

                console.error(
                    "Disable notification error:",
                    error
                );

                setNotificationStatus(
                    "Unable to disable notifications."
                );

            } finally {

                setNotificationLoading(
                    false
                );

            }

        };


    // =================================================
    // HANDLE NOTIFICATION SWITCH
    // =================================================

    const handleBrowserNotificationChange =
        () => {

            if (
                browserNotifications
            ) {

                disableBrowserNotifications();

            } else {

                enableBrowserNotifications();

            }

        };


    // =================================================
    // TEST PUSH NOTIFICATION
    // =================================================

    const testNotification =
        async () => {

            try {

                setNotificationStatus(
                    "Sending test notification..."
                );


                const response =
                    await fetch(
                        `${API_URL}/api/push-subscriptions/test`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                admin_id:
                                    localStorage.getItem(
                                        "admin_id"
                                    )

                            })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Test notification failed."
                    );

                }


                setNotificationStatus(
                    "Test notification sent."
                );


            } catch (error) {

                console.error(
                    "Test notification error:",
                    error
                );

                setNotificationStatus(
                    "Test notification could not be sent yet."
                );

            }

        };


    // =================================================
    // RENDER
    // =================================================

    return (

        <div
            className={
                darkMode
                    ? "settings-page dark"
                    : "settings-page"
            }
        >

            {/* ======================================
                TOP BAR
            ====================================== */}

            <div className="top-bar">

                <Link
                    to="/dashboard"
                    className="back-btn"
                >
                    ← Back
                </Link>

                <h1>
                    Settings
                </h1>

            </div>


            {/* ======================================
                ADMINISTRATOR PROFILE
            ====================================== */}

            <div className="settings-card">

                <h2>
                    Administrator Profile
                </h2>

                <div className="settings-field">

    <label>Full Name</label>

    <input
        type="text"
        value={currentUser?.full_name || ""}
        disabled
    />

</div>




                {/* ==================================
                    ADMINISTRATOR USERNAME
                ================================== */}

                <div className="form-group">

                    <label>
                         Username
                    </label>

                 
        <input
            type="text"
            value={
                currentUser?.username ||
                localStorage.getItem("username") ||
                ""
            }
            disabled
        />

                </div>

                <div className="settings-field">

    <label>Role</label>

    <input
        type="text"
        value={currentUser?.role || ""}
        disabled
    />

</div>


                {/* ==================================
                    EMAIL ADDRESS
                ================================== */}

                <div className="form-group">

                    <label>
                        Email Address
                    </label>

                    <input
                        type="text"
                        value={
                            maskEmail(
                                 currentUser?.email ||
                ""
                            )
                        }
                        readOnly
                    />

                </div>


                {/* ==================================
                    EDIT PROFILE
                ================================== */}

                <div className="settings-action-wrapper">

                    <Link
                        to="/edit-profile"
                        className="settings-action-btn"
                    >

                        {/* USER ICON */}

                        <span className="settings-action-icon">
                            ♙
                        </span>

                        <span>
                            Edit Profile
                        </span>

                    </Link>

                </div>


                {/* ==================================
                    CHANGE PASSWORD
                ================================== */}

                <div className="settings-action-wrapper">

                    <Link
                        to="/change-password"
                        className="settings-action-btn"
                    >

                        {/* LOCK ICON */}

                        <span className="settings-action-icon">
                            ♧
                        </span>

                        <span>
                            Change Password
                        </span>

                    </Link>

                </div>

            </div>


            {/* ======================================
                CAMERA SETTINGS
            ====================================== */}

            <div className="settings-card">

                <h2>
                    Camera Settings
                </h2>


                <div className="setting-row">

                    <span>
                        Total Cameras
                    </span>

                    <input
                        type="number"
                        defaultValue="10"
                    />

                </div>


                <div className="setting-row">

                    <span>
                        Recording Enabled
                    </span>

                    <input
                        type="checkbox"
                    />

                </div>


                <div className="setting-row">

                    <span>
                        Enable Motion Detection
                    </span>

                    <input
                        type="checkbox"
                        defaultChecked
                    />

                </div>

            </div>


            {/* ======================================
                NOTIFICATION SETTINGS
            ====================================== */}

            <div className="settings-card">

                <h2>
                    Notification Settings
                </h2>


                <div className="setting-row">

                    <span>
                        Human Detection Alerts
                    </span>

                    <input
                        type="checkbox"
                        defaultChecked
                    />

                </div>


                <div className="setting-row">

                    <span>
                        Camera Offline Alerts
                    </span>

                    <input
                        type="checkbox"
                        defaultChecked
                    />

                </div>


                <div className="setting-row">

                    <span>
                        Admin Login Alerts
                    </span>

                    <input
                        type="checkbox"
                        defaultChecked
                    />

                </div>


                <div className="setting-row">

                    <span>
                        Browser/Desktop Notifications
                    </span>

                    <input
                        type="checkbox"
                        checked={
                            browserNotifications
                        }
                        onChange={
                            handleBrowserNotificationChange
                        }
                        disabled={
                            notificationLoading
                        }
                    />

                </div>


                {/* ==================================
                    NOTIFICATION STATUS
                ================================== */}

                {notificationStatus && (

                    <div
                        style={{
                            marginTop: "12px",
                            fontSize: "13px",
                            color:
                                browserNotifications
                                    ? "#16a34a"
                                    : "#64748b"
                        }}
                    >
                        {notificationStatus}
                    </div>

                )}


                {/* ==================================
                    TEST BUTTON
                ================================== */}

                {browserNotifications && (

                    <button
                        type="button"
                        onClick={
                            testNotification
                        }
                        disabled={
                            notificationLoading
                        }
                        style={{
                            marginTop: "15px",
                            padding: "10px 16px",
                            border: "none",
                            borderRadius: "8px",
                            background: "#2563eb",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        Send Test Notification
                    </button>

                )}

            </div>


            {/* ======================================
                SYSTEM SETTINGS
            ====================================== */}

            <div className="settings-card">

                <h2>
                    System Settings
                </h2>


                <div className="setting-row">

                    <span>
                        Dark Mode
                    </span>

                    <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={() =>
                            setDarkMode(
                                !darkMode
                            )
                        }
                    />

                </div>


                <div className="setting-row">

                    <span>
                        Automatic Backup
                    </span>

                    <input
                        type="checkbox"
                    />

                </div>


                <div className="setting-row">

                    <span>
                        Session Timeout (Minutes)
                    </span>

                    <input
                        type="number"
                        defaultValue="30"
                    />

                </div>

            </div>


            {/* ======================================
                BUTTONS
            ====================================== */}

            <div className="button-group">

                <button
                    className="save-btn"
                    type="button"
                >
                    Save Changes
                </button>


                <button
                    className="reset-btn"
                    type="button"
                >
                    Reset
                </button>

            </div>

        </div>

    );
}

export default Settings;