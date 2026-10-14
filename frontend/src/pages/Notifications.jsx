import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Notifications.css";

function Notifications() {

    const [notifications, setNotifications] = useState([]);
    const [lastLogin, setLastLogin] = useState(null);
    const [loginCount, setLoginCount] = useState(0);
    const [loading, setLoading] = useState(true);


    // ====================================
    // FETCH NOTIFICATIONS AND LOGIN DATA
    // ====================================

    const fetchData = async () => {

        try {

            // ====================================
            // GET LOGGED-IN ADMINISTRATOR
            // ====================================

            const adminId =
                localStorage.getItem("admin_id");


            // ====================================
            // CHECK LOGIN
            // ====================================

            if (!adminId) {

                console.error(
                    "Administrator ID not found."
                );

                setLoading(false);

                return;
            }


            // ====================================
            // FETCH ALL NOTIFICATIONS
            // ====================================

            const notificationResponse =
                await fetch(
                    "http://localhost:5000/api/notifications",
                    {
                        method: "GET",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "admin-id":
                                adminId
                        }
                    }
                );


            if (!notificationResponse.ok) {

                throw new Error(
                    "Failed to fetch notifications"
                );

            }


            const notificationData =
                await notificationResponse.json();


            if (notificationData.success) {

                setNotifications(
                    notificationData.notifications || []
                );

            } else {

                setNotifications([]);

            }


            // ====================================
            // LATEST LOGIN
            // ====================================

            const loginResponse =
                await fetch(
                    "http://localhost:5000/api/auth/last-login"
                );


            if (loginResponse.ok) {

                const loginData =
                    await loginResponse.json();


                if (loginData.success) {

                    setLastLogin(
                        loginData.lastLogin
                    );

                }

            }


            // ====================================
            // TOTAL LOGIN COUNT
            // ====================================

            const countResponse =
                await fetch(
                    "http://localhost:5000/api/auth/login-count"
                );


            if (countResponse.ok) {

                const countData =
                    await countResponse.json();


                if (countData.success) {

                    setLoginCount(
                        Number(countData.total) || 0
                    );

                }

            }

        } catch (error) {

            console.error(
                "Error loading notifications:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    // ====================================
    // LOAD DATA
    // REFRESH EVERY 3 SECONDS
    // ====================================

    useEffect(() => {

        fetchData();


        const interval =
            setInterval(() => {

                fetchData();

            }, 3000);


        return () =>
            clearInterval(interval);

    }, []);


    // ====================================
    // HUMAN DETECTION NOTIFICATIONS
    // ====================================
    //
    // IMPORTANT:
    // Only notifications whose type is
    // "Human Detection" are counted here.
    //
    // Administrator Login notifications
    // are NOT included.
    // ====================================

    const humanDetectionNotifications =
        notifications.filter(
            (notification) =>
                notification.type ===
                "Human Detection"
        );


    // ====================================
    // TOTAL HUMAN DETECTIONS
    // ====================================
    //
    // Includes BOTH:
    // - Read
    // - Unread
    //
    // This is the total number of
    // Human Detection records.
    // ====================================

    const humanDetectionCount =
        humanDetectionNotifications.length;


    // ====================================
    // UNREAD HUMAN DETECTIONS
    // ====================================
    //
    // Only Human Detection notifications
    // whose status is "Unread".
    // ====================================

    const unreadHumanDetections =
        humanDetectionNotifications.filter(
            (notification) =>
                String(
                    notification.status || ""
                ).toLowerCase() === "unread"
        ).length;


    return (

        <div className="notifications-page">


            {/* ========================= */}
            {/* TOP BAR */}
            {/* ========================= */}

            <div className="top-bar">

                <Link
                    to="/dashboard"
                    className="back-btn"
                >
                    ← Back
                </Link>


                <h1>
                    Notifications
                </h1>

            </div>

{/* ========================= */}
{/* SUMMARY */}
{/* ========================= */}

<div className="summary">


    {/* ========================= */}
    {/* HUMAN DETECTIONS */}
    {/* ========================= */}

    <div className="summary-card">

        <h3>
            Human Detections
        </h3>


        <h2>
            {humanDetectionCount}
        </h2>

    </div>


    {/* ========================= */}
    {/* UNREAD DETECTIONS */}
    {/* ========================= */}

    <div className="summary-card">

        <h3>
            Unread Detections
        </h3>


        <h2>
            {unreadHumanDetections}
        </h2>

    </div>

</div>

            {/* ========================= */}
            {/* ADMIN LOGIN SECTION */}
            {/* ========================= */}

            <h2>
                Administrator Login Notifications
            </h2>


            <Link
                to="/login-activity"
                style={{
                    textDecoration: "none",
                    color: "inherit"
                }}
            >

                <div className="notification-card blue">


                    {/* ========================= */}
                    {/* ICON */}
                    {/* ========================= */}

                    <div className="left">

                        <div className="icon blue">
                            👤
                        </div>

                    </div>


                    {/* ========================= */}
                    {/* INFORMATION */}
                    {/* ========================= */}

                    <div className="middle">

                        <h3>
                            Administrator Login
                        </h3>


                        <p>

                            {loginCount} administrator
                            login
                            {loginCount !== 1
                                ? "s"
                                : ""}
                            {" "}recorded.

                        </p>


                        <p>
                            Click to view all login
                            activities.
                        </p>


                        {lastLogin && (

                            <p>

                                <strong>
                                    Latest Login:
                                </strong>{" "}

                                {new Date(
                                    lastLogin.login_time
                                ).toLocaleString()}

                            </p>

                        )}

                    </div>


                    {/* ========================= */}
                    {/* LOGIN COUNT */}
                    {/* ========================= */}

                    <div className="right">

                        <span className="status blue">

                            {loginCount}

                        </span>

                    </div>

                </div>

            </Link>


            {/* ========================= */}
            {/* HUMAN DETECTION SECTION */}
            {/* ========================= */}

            <h2 className="section-title">

                Human Detection Notifications

            </h2>


            {loading ? (

                <div className="notification-card">

                    Loading...

                </div>

            ) : (

                <Link
                    to="/human-detections"
                    style={{
                        textDecoration: "none",
                        color: "inherit"
                    }}
                >

                    <div className="notification-card red">


                        {/* ========================= */}
                        {/* ICON */}
                        {/* ========================= */}

                        <div className="left">

                            <div className="icon red">
                                🚶
                            </div>

                        </div>


                        {/* ========================= */}
                        {/* INFORMATION */}
                        {/* ========================= */}

                        <div className="middle">

                            <h3>
                                Human Detection
                            </h3>


                            {/* ========================= */}
                            {/* TOTAL HUMAN DETECTIONS */}
                            {/* ========================= */}

                            <p>

                                {humanDetectionCount}
                                {" "}Human Detection
                                {humanDetectionCount !== 1
                                    ? "s"
                                    : ""}
                                {" "}Recorded

                            </p>


                            {/* ========================= */}
                            {/* UNREAD HUMAN DETECTIONS */}
                            {/* ========================= */}

                            <p>

                                {unreadHumanDetections > 0 ? (

                                    <>

                                        {unreadHumanDetections}
                                        {" "}unread human
                                        detection
                                        {unreadHumanDetections !== 1
                                            ? "s"
                                            : ""}

                                    </>

                                ) : (

                                    "All human detections have been read."

                                )}

                            </p>


                            <p>

                                Click to view all human
                                detection notifications.

                            </p>

                        </div>


                        {/* ========================= */}
                        {/* HUMAN DETECTION COUNT */}
                        {/* ========================= */}

                        <div className="right">

                            <span className="status red">

                                {humanDetectionCount}

                            </span>

                        </div>

                    </div>

                </Link>

            )}

        </div>

    );

}

export default Notifications;