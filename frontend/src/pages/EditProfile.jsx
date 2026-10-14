import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "../styles/EditProfile.css";

function EditProfile() {

    const navigate = useNavigate();

    // ==========================================
    // THEME
    // ==========================================

    const { darkMode } = useTheme();


    // ==========================================
    // FORM STATE
    // ==========================================

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);


    // ==========================================
    // SAVE PROFILE
    // ==========================================

    const handleSave = async (e) => {

        e.preventDefault();

        setMessage("");
        setMessageType("");


        // --------------------------------------
        // CHECK REQUIRED FIELDS
        // --------------------------------------

        if (
            !username.trim() ||
            !fullName.trim() ||
            !email.trim() ||
            !currentPassword
        ) {

            setMessage(
                "Please fill in all fields."
            );

            setMessageType("error");

            return;
        }


        try {

            setLoading(true);


            const adminId =
                localStorage.getItem("admin_id");


            // --------------------------------------
            // SEND TO BACKEND
            // --------------------------------------

            const response =
                await fetch(
                    "http://localhost:5000/api/auth/update-profile",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            admin_id:
                                adminId,

                            username:
                                username.trim(),

                            full_name:
                                fullName.trim(),

                            email:
                                email.trim(),

                            current_password:
                                currentPassword

                        })
                    }
                );


            const data =
                await response.json();


            // --------------------------------------
            // BACKEND ERROR
            // --------------------------------------

            if (!response.ok || !data.success) {

                setMessage(
                    data.message ||
                    "Unable to update profile."
                );

                setMessageType("error");

                return;
            }


            // --------------------------------------
            // SUCCESS
            // --------------------------------------

            setMessage(
                "Profile updated successfully."
            );

            setMessageType("success");


            // --------------------------------------
            // UPDATE LOCAL STORAGE
            // --------------------------------------

            localStorage.setItem(
                "username",
                username.trim()
            );


            // --------------------------------------
            // CLEAR PASSWORD
            // --------------------------------------

            setCurrentPassword("");


        } catch (error) {

            console.error(
                "Update profile error:",
                error
            );

            setMessage(
                "Unable to connect to the server."
            );

            setMessageType("error");

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div
            className={
                darkMode
                    ? "edit-profile-page dark"
                    : "edit-profile-page"
            }
        >


            {/* ==================================
                TOP BAR
            ================================== */}

            <div className="edit-profile-top">

                <Link
                    to="/settings"
                    className="back-btn"
                >
                    ← Back
                </Link>

                <h1>
                    Edit Profile
                </h1>

            </div>


            {/* ==================================
                PROFILE CARD
            ================================== */}

            <div className="edit-profile-card">

                <h2>
                    Administrator Profile
                </h2>

                <form
                    onSubmit={handleSave}
                >


                    {/* ==========================
                        USERNAME
                    ========================== */}

                    <div className="form-group">

                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(
                                    e.target.value
                                )
                            }
                            placeholder="Enter username"
                        />

                    </div>


                    {/* ==========================
                        FULL NAME
                    ========================== */}

                    <div className="form-group">

                        <label>
                            Full Name
                        </label>

                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) =>
                                setFullName(
                                    e.target.value
                                )
                            }
                            placeholder="Enter full name"
                        />

                    </div>


                    {/* ==========================
                        EMAIL
                    ========================== */}

                    <div className="form-group">

                        <label>
                            Email Address
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            placeholder="Enter email address"
                        />

                    </div>


                    {/* ==========================
                        CURRENT PASSWORD
                    ========================== */}

                    <div className="form-group">

                        <label>
                            Current Password
                        </label>

                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) =>
                                setCurrentPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter current password"
                        />

                    </div>


                    {/* ==========================
                        MESSAGE
                    ========================== */}

                    {message && (

                        <div
                            className={
                                messageType === "success"
                                    ? "profile-message success"
                                    : "profile-message error"
                            }
                        >
                            {message}
                        </div>

                    )}


                    {/* ==========================
                        BUTTONS
                    ========================== */}

                    <div className="profile-buttons">

                        <button
                            type="submit"
                            className="save-profile-btn"
                            disabled={loading}
                        >

                            {loading
                                ? "Saving..."
                                : "Save"}

                        </button>


                        <button
                            type="button"
                            className="cancel-profile-btn"
                            onClick={() =>
                                navigate(
                                    "/settings"
                                )
                            }
                        >
                            Cancel
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}

export default EditProfile;