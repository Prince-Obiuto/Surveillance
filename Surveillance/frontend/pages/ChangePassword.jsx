import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "../styles/ChangePassword.css";

function ChangePassword() {

    const navigate = useNavigate();

    // ==========================================
    // THEME
    // ==========================================

    const { darkMode } = useTheme();


    // ==========================================
    // FORM STATE
    // ==========================================

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");


    // ==========================================
    // MESSAGE STATE
    // ==========================================

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    // ==========================================
    // CHANGE PASSWORD
    // ==========================================

    const handleChangePassword = async (e) => {

        e.preventDefault();

        setMessage("");
        setMessageType("");


        // --------------------------------------
        // CHECK REQUIRED FIELDS
        // --------------------------------------

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            setMessage(
                "Please fill in all fields."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK NEW PASSWORD LENGTH
        // --------------------------------------

        if (newPassword.length < 6) {

            setMessage(
                "New password must be at least 6 characters long."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK PASSWORD MATCH
        // --------------------------------------

        if (
            newPassword !== confirmPassword
        ) {

            setMessage(
                "New password and confirm password do not match."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK SAME PASSWORD
        // --------------------------------------

        if (
            currentPassword === newPassword
        ) {

            setMessage(
                "New password must be different from your current password."
            );

            setMessageType("error");

            return;
        }


        try {

            setLoading(true);


            // --------------------------------------
            // GET ADMIN ID
            // --------------------------------------

            const adminId =
                localStorage.getItem("admin_id");


            // --------------------------------------
            // CHECK ADMIN ID
            // --------------------------------------

            if (!adminId) {

                setMessage(
                    "Administrator session not found. Please log in again."
                );

                setMessageType("error");

                return;
            }


            // --------------------------------------
            // SEND TO BACKEND
            // --------------------------------------

            const response =
                await fetch(
                    "/api/auth/change-password",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            admin_id:
                                adminId,

                            current_password:
                                currentPassword,

                            new_password:
                                newPassword,

                            confirm_password:
                                confirmPassword

                        })
                    }
                );


            // --------------------------------------
            // READ RESPONSE
            // --------------------------------------

            const data =
                await response.json();


            // --------------------------------------
            // BACKEND ERROR
            // --------------------------------------

            if (
                !response.ok ||
                !data.success
            ) {

                setMessage(
                    data.message ||
                    "Unable to change password."
                );

                setMessageType("error");

                return;
            }


            // --------------------------------------
            // SUCCESS
            // --------------------------------------

            setMessage(
                data.message ||
                "Password changed successfully."
            );

            setMessageType("success");


            // --------------------------------------
            // CLEAR PASSWORD FIELDS
            // --------------------------------------

            setCurrentPassword("");

            setNewPassword("");

            setConfirmPassword("");


        } catch (error) {

            console.error(
                "Change password error:",
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
                    ? "change-password-page dark"
                    : "change-password-page"
            }
        >


            {/* ==================================
                TOP BAR
            ================================== */}

            <div className="top-bar">

                <Link
                    to="/settings"
                    className="back-btn"
                >
                    ← Back
                </Link>


                <h1>
                    Change Password
                </h1>

            </div>


            {/* ==================================
                MAIN CARD
            ================================== */}

            <div className="settings-card">

                <h2>
                    Change Password
                </h2>


                <form
                    onSubmit={handleChangePassword}
                >


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
                            autoComplete="current-password"
                        />

                    </div>


                    {/* ==========================
                        NEW PASSWORD
                    ========================== */}

                    <div className="form-group">

                        <label>
                            New Password
                        </label>

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter new password"
                            autoComplete="new-password"
                        />

                    </div>


                    {/* ==========================
                        CONFIRM NEW PASSWORD
                    ========================== */}

                    <div className="form-group">

                        <label>
                            Confirm New Password
                        </label>

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Confirm new password"
                            autoComplete="new-password"
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

                    <div className="button-group">


                        {/* ======================
                            CHANGE PASSWORD
                        ====================== */}

                        <button
                            type="submit"
                            className="save-profile-btn"
                            disabled={loading}
                        >

                            {loading
                                ? "Changing..."
                                : "Change Password"}

                        </button>


                        {/* ======================
                            CANCEL
                        ====================== */}

                        <button
                            type="button"
                            className="cancel-profile-btn"
                            onClick={() =>
                                navigate(
                                    "/settings"
                                )
                            }
                            disabled={loading}
                        >
                            Cancel
                        </button>


                    </div>


                </form>

            </div>

        </div>

    );

}

export default ChangePassword;