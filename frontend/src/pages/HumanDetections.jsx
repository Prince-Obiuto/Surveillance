import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { canDelete } from "../utils/permissions";
import "../styles/HumanDetections.css";
import { fetchProtectedFile } from "../utils/auth";

function HumanDetection() {
    const [detections, setDetections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState({});
    const imageUrlCache = useRef(new Map());

    // Selected image for full-screen overlay
    const [selectedIndex, setSelectedIndex] = useState(null);


    // ==========================================
    // Fetch Human Detection Notifications
    // ==========================================

    const fetchDetections = async () => {

        try {

           const adminId =
    localStorage.getItem("admin_id");

const response = await fetch(
    "http://localhost:5000/api/notifications",
    {
        headers: {
            "admin-id": adminId
        }
    }
);

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch notifications"
                );
            }

            const data = await response.json();

            if (data.success) {

                // Only Human Detection notifications
                const humanDetections =
                    data.notifications.filter(
                        (notification) =>
                            notification.type ===
                            "Human Detection"
                    );

                setDetections(humanDetections);
            }

        } catch (error) {

            console.error(
                "Error fetching human detection records:",
                error
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // Load Records
    // Refresh every 3 seconds
    // ==========================================

    useEffect(() => {

        fetchDetections();

        const interval = setInterval(() => {
            fetchDetections();
        }, 3000);

        return () => {
            clearInterval(interval);
        };

    }, []);

    useEffect(() => {
        let active = true;
        const missingImages = detections.filter(detection =>
            detection.image_name && !imageUrlCache.current.has(detection.id)
        );
        const cachedEntries = detections
            .filter(detection => imageUrlCache.current.has(detection.id))
            .map(detection => [detection.id, imageUrlCache.current.get(detection.id)]);

        Promise.all(missingImages.map(async detection => {
            if (!detection.image_name) return [detection.id, ""];
            try {
                const url = await fetchProtectedFile(
                    `http://localhost:5000/snapshots/${encodeURIComponent(detection.image_name)}`
                );
                imageUrlCache.current.set(detection.id, url);
                return [detection.id, url];
            } catch (error) {
                console.error("Protected snapshot load failed:", error);
                return [detection.id, ""];
            }
        })).then(entries => {
            if (active) setImageUrls(previous => ({
                ...previous,
                ...Object.fromEntries([...cachedEntries, ...entries])
            }));
        });

        return () => { active = false; };
    }, [detections]);

    useEffect(() => () => {
        imageUrlCache.current.forEach(URL.revokeObjectURL);
    }, []);


    // ==========================================
    // Open Image
    // ==========================================

    const openImage = async (index) => {

        const detection = detections[index];

        if (!detection) {
            return;
        }

        // Open image
        setSelectedIndex(index);


        // ==========================================
        // Mark Notification as Read
        // ==========================================
if (detection.status !== "Read") {

    try {

        const adminId =
            localStorage.getItem("admin_id");


        const response = await fetch(
            `http://localhost:5000/api/notifications/${detection.id}/read`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json",

                    "admin-id":
                        adminId
                },

                body: JSON.stringify({
                    admin_id: adminId
                })
            }
        );

                const data =
                    await response.json();

                if (data.success) {

                    setDetections((previous) =>
                        previous.map((item) =>
                            item.id === detection.id
                                ? {
                                    ...item,
                                    status: "Read",
                                }
                                : item
                        )
                    );

                }

            } catch (error) {

                console.error(
                    "Error marking notification as Read:",
                    error
                );

            }

        }

    };


    // ==========================================
    // Close Image
    // ==========================================

    const closeImage = () => {
        setSelectedIndex(null);
    };


    // ==========================================
    // Previous Image
    // ==========================================
const showPrevious = useCallback(() => {

    if (selectedIndex === null) {
        return;
    }

    if (selectedIndex > 0) {
        setSelectedIndex(
            selectedIndex - 1
        );
    }

}, [selectedIndex]);

    // ==========================================
    // Next Image
    // ==========================================

  const showNext = useCallback(() => {

    if (selectedIndex === null) {
        return;
    }

    if (
        selectedIndex <
        detections.length - 1
    ) {

        setSelectedIndex(
            selectedIndex + 1
        );

    }

}, [selectedIndex, detections.length]);

  const deleteDetection = async (id) => {

    // ==========================================
    // GET LOGGED-IN ADMINISTRATOR
    // ==========================================

    const adminId = localStorage.getItem("admin_id");


    // ==========================================
    // CHECK LOGIN
    // ==========================================

    if (!adminId) {

        alert(
            "Your session has expired. Please login again."
        );

        return;
    }


    try {

        // ==========================================
        // DELETE REQUEST
        // ==========================================

        const response = await fetch(
            `http://localhost:5000/api/notifications/${id}`,
            {
                method: "DELETE",

                headers: {
                    "Content-Type": "application/json",

                    "admin-id": adminId
                },

                body: JSON.stringify({
                    admin_id: adminId
                })
            }
        );


        // ==========================================
        // READ BACKEND RESPONSE
        // ==========================================

        const data = await response.json();


        // ==========================================
        // BACKEND ERROR
        // ==========================================

        if (!response.ok || !data.success) {

            console.error(
                "Delete notification failed:",
                data
            );

            alert(
                data.message ||
                "You are not allowed to delete this notification."
            );

            return;
        }


        // ==========================================
        // SUCCESS
        // ==========================================

        alert(
            data.message ||
            "Notification deleted successfully."
        );


        // ==========================================
        // REMOVE FROM SCREEN
        // ==========================================

        setDetections(
            (previousDetections) =>
                previousDetections.filter(
                    (detection) =>
                        detection.id !== id
                )
        );


    } catch (error) {

        console.error(
            "Delete detection error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

    }

};

// ==========================================
// Keyboard Controls
// ==========================================

useEffect(() => {

    const handleKeyDown = (event) => {

        if (selectedIndex === null) {
            return;
        }


        // ======================================
        // CLOSE IMAGE
        // ======================================

        if (event.key === "Escape") {

            setSelectedIndex(null);

            return;
        }


        // ======================================
        // PREVIOUS IMAGE
        // ======================================

        if (event.key === "ArrowLeft") {

            if (selectedIndex > 0) {

                setSelectedIndex(
                    selectedIndex - 1
                );

            }

            return;
        }


        // ======================================
        // NEXT IMAGE
        // ======================================

        if (event.key === "ArrowRight") {

            if (
                selectedIndex <
                detections.length - 1
            ) {

                setSelectedIndex(
                    selectedIndex + 1
                );

            }

        }

    };


    window.addEventListener(
        "keydown",
        handleKeyDown
    );


    return () => {

        window.removeEventListener(
            "keydown",
            handleKeyDown
        );

    };

}, [
    selectedIndex,
    detections.length
]);


    // ==========================================
    // Current Selected Detection
    // ==========================================

    const selectedDetection =
        selectedIndex !== null
            ? detections[selectedIndex]
            : null;


    // ==========================================
    // Loading
    // ==========================================

    if (loading) {

        return (

            <div className="human-page">

                <div className="top-bar">

                    <Link
                        to="/notifications"
                        className="back-btn"
                    >
                        ← Back
                    </Link>

                    <h1>
                        Human Detection Records
                    </h1>

                </div>


                <div className="detection-card">

                    <div className="details">

                        <h2>
                            Loading...
                        </h2>

                    </div>

                </div>

            </div>

        );

    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div className="human-page">


            {/* =====================================
                TOP BAR
            ===================================== */}

            <div className="top-bar">

                <Link
                    to="/notifications"
                    className="back-btn"
                >
                    ← Back
                </Link>

                <h1>
                    Human Detection Records
                </h1>

            </div>


            {/* =====================================
                NO RECORDS
            ===================================== */}

            {detections.length === 0 ? (

                <div className="detection-card">

                    <div className="details">

                        <h2>
                            No Human Detection Records
                        </h2>

                        <p>
                            There are currently no
                            human detection notifications.
                        </p>

                    </div>

                </div>

            ) : (

                <>

                    {/* =====================================
                        DETECTION RECORDS
                    ===================================== */}

                    {detections.map(
                        (detection, index) => (

                            <div
                                className="detection-card"
                                key={detection.id}
                            >


                                {/* ==========================
                                    SNAPSHOT
                                ========================== */}

                                {detection.image_name && (

                                    <img
                                        src={imageUrls[detection.id] || ""}
                                        alt="Human Detection"
                                        className="detection-image"
                                        onClick={() =>
                                            openImage(index)
                                        }
                                        onError={(event) => {

                                            event.currentTarget.style.display =
                                                "none";

                                        }}
                                    />

                                )}


                                {/* ==========================
                                    DETAILS
                                ========================== */}

                                <div className="details">

                                    <h2>
                                        Human Detection
                                    </h2>


                                    <p>

                                        <strong>
                                            Camera:
                                        </strong>{" "}

                                        {detection.camera_name ||
                                            "Camera 1"}

                                    </p>


                                    <p>

                                        <strong>
                                            Message:
                                        </strong>{" "}

                                        {detection.message ||
                                            "Person detected"}

                                    </p>


                                    <p>

                                        <strong>
                                            Status:
                                        </strong>{" "}

                                        {detection.status ||
                                            "Unread"}

                                    </p>


                                    <p>

                                        <strong>
                                            Detected At:
                                        </strong>{" "}

                                        {detection.created_at
                                            ? new Date(
                                                detection.created_at
                                            ).toLocaleString()
                                            : "Unknown"}

                                    </p>


    {canDelete() && (
    <button
        type="button"
        className="delete-btn"
        onClick={() =>
            deleteDetection(
                detection.id
            )
        }
    >
        🗑 Delete
    </button>
)}

                                </div>

                            </div>

                        )
                    )}

                </>

            )}


            {/* =====================================
                IMAGE OVERLAY
            ===================================== */}

            {selectedDetection && (

                <div
                    className="image-overlay"
                    onClick={(event) => {

                        if (
                            event.target.className ===
                            "image-overlay"
                        ) {

                            closeImage();

                        }

                    }}
                >


                    <div className="image-container">


                        {/* ==========================
                            CLOSE
                        ========================== */}

                        <button
                            type="button"
                            className="close-btn"
                            onClick={closeImage}
                            aria-label="Close image"
                        >
                            ✕
                        </button>


                        {/* ==========================
                            PREVIOUS
                        ========================== */}

                        <button
                            type="button"
                            className="prev-btn"
                            onClick={showPrevious}
                            disabled={
                                selectedIndex === 0
                            }
                            aria-label="Previous image"
                        >
                            ‹
                        </button>


                        {/* ==========================
                            FULL IMAGE
                        ========================== */}

                        <img
                            src={imageUrls[selectedDetection.id] || ""}
                            alt="Human Detection"
                            className="full-image"
                        />


                        {/* ==========================
                            NEXT
                        ========================== */}

                        <button
                            type="button"
                            className="next-btn"
                            onClick={showNext}
                            disabled={
                                selectedIndex ===
                                detections.length - 1
                            }
                            aria-label="Next image"
                        >
                            ›
                        </button>


                        {/* ==========================
                            IMAGE INFORMATION
                        ========================== */}

                        <div className="image-info">

                            <h2>
                                Human Detection
                            </h2>


                            <p>

                                <strong>
                                    Camera:
                                </strong>{" "}

                                {selectedDetection.camera_name ||
                                    "Camera 1"}

                            </p>


                            <p>

                                <strong>
                                    Message:
                                </strong>{" "}

                                {selectedDetection.message ||
                                    "Person detected"}

                            </p>


                            <p>

                                <strong>
                                    Status:
                                </strong>{" "}

                                {selectedDetection.status ||
                                    "Read"}

                            </p>


                            <p>

                                <strong>
                                    Detected At:
                                </strong>{" "}

                                {selectedDetection.created_at
                                    ? new Date(
                                        selectedDetection.created_at
                                    ).toLocaleString()
                                    : "Unknown"}

                            </p>


                            {/* ==========================
                                DOWNLOAD
                            ========================== */}

                            <a
                                href={imageUrls[selectedDetection.id] || "#"}
                                download={
                                    selectedDetection.image_name
                                }
                                className="download-btn"
                            >
                                ⬇ Download Snapshot
                            </a>


                            {/* ==========================
                                DELETE
                            ========================== */}

                            <button
                                type="button"
                                className="delete-btn"
                                onClick={() =>
                                    deleteDetection(
                                        selectedDetection.id
                                    )
                                }
                            >
                                🗑 Delete
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );
}

export default HumanDetection;
