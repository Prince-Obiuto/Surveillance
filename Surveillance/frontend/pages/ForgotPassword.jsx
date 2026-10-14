import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

function ForgotPassword() {

    const navigate = useNavigate();

    // ==========================================
    // STAGE STATE
    // ==========================================

    const [verified, setVerified] = useState(false);

    const [answerVerified, setAnswerVerified] = useState(false);


    // ==========================================
    // FORM STATE
    // ==========================================

    const [identifier, setIdentifier] = useState("");

    const [securityQuestion, setSecurityQuestion] =
        useState("");

    const [adminId, setAdminId] =
        useState("");

    const [securityAnswer, setSecurityAnswer] =
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
    // VERIFY ACCOUNT
    // ==========================================

    const handleVerifyAccount = async (e) => {

        e.preventDefault();

        setMessage("");
        setMessageType("");


        // --------------------------------------
        // CHECK IDENTIFIER
        // --------------------------------------

        if (!identifier.trim()) {

            setMessage(
                "Please enter your username or email."
            );

            setMessageType("error");

            return;
        }


        try {

            setLoading(true);


            // --------------------------------------
            // SEND REQUEST TO BACKEND
            // --------------------------------------

            const response = await fetch(
                "/api/auth/verify-forgot-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        identifier:
                            identifier.trim(),
                    }),
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

                setMessage(
                    data.message ||
                    "Account could not be verified."
                );

                setMessageType("error");

                return;
            }


            // --------------------------------------
            // ACCOUNT VERIFIED
            // --------------------------------------

            setAdminId(
                data.admin_id
            );

            setSecurityQuestion(
                data.security_question
            );

            setVerified(true);

            setMessage(
                "Account verified successfully."
            );

            setMessageType("success");


        } catch (error) {

            console.error(
                "Forgot password verification error:",
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
    // VERIFY SECURITY ANSWER
    // ==========================================

    const handleVerifyAnswer = async (e) => {

        e.preventDefault();

        setMessage("");
        setMessageType("");


        // --------------------------------------
        // CHECK SECURITY ANSWER
        // --------------------------------------

        if (!securityAnswer.trim()) {

            setMessage(
                "Please enter your security answer."
            );

            setMessageType("error");

            return;
        }


        try {

            setLoading(true);


            // --------------------------------------
            // SEND ANSWER TO BACKEND
            // --------------------------------------

            const response = await fetch(
                "/api/auth/verify-security-answer",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        admin_id:
                            adminId,

                        security_answer:
                            securityAnswer.trim(),

                    }),
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

                setMessage(
                    data.message ||
                    "Security answer is incorrect."
                );

                setMessageType("error");

                return;
            }


            // --------------------------------------
            // SECURITY ANSWER VERIFIED
            // --------------------------------------

            setAnswerVerified(true);

            setMessage(
                "Security answer verified successfully."
            );

            setMessageType("success");


        } catch (error) {

            console.error(
                "Security answer verification error:",
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
    // RESET PASSWORD
    // ==========================================

    const handleResetPassword = async (e) => {

        e.preventDefault();

        setMessage("");
        setMessageType("");


        // --------------------------------------
        // CHECK NEW PASSWORD
        // --------------------------------------

        if (!newPassword) {

            setMessage(
                "Please enter a new password."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK CONFIRM PASSWORD
        // --------------------------------------

        if (!confirmPassword) {

            setMessage(
                "Please confirm your new password."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK PASSWORD MATCH
        // --------------------------------------

        if (
            newPassword !==
            confirmPassword
        ) {

            setMessage(
                "Passwords do not match."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // PASSWORD LENGTH
        // --------------------------------------

        if (newPassword.length < 6) {

            setMessage(
                "Password must be at least 6 characters."
            );

            setMessageType("error");

            return;
        }


        try {

            setLoading(true);


            // --------------------------------------
            // SEND NEW PASSWORD TO BACKEND
            // --------------------------------------
const response = await fetch(
    "/api/auth/reset-forgotten-password",
    {
        method: "PUT",

        headers: {
            "Content-Type": "application/json",
        },

        body: JSON.stringify({
            admin_id: adminId,
            new_password: newPassword,
        }),
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

                setMessage(
                    data.message ||
                    "Unable to reset password."
                );

                setMessageType("error");

                return;
            }


            // --------------------------------------
            // SUCCESS
            // --------------------------------------

            setMessage(
                "Password reset successfully. Returning to login..."
            );

            setMessageType("success");


            // --------------------------------------
            // RETURN TO LOGIN
            // --------------------------------------

            setTimeout(() => {

                navigate("/");

            }, 1500);


        } catch (error) {

            console.error(
                "Reset password error:",
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

        <div className="forgot-password-page">


            {/* ==================================
                TOP BAR
            ================================== */}

            <div className="forgot-password-top">

                <Link
                    to="/"
                    className="forgot-password-back"
                >
                    ← Back
                </Link>


                <h1>
                    Forgot Password
                </h1>

            </div>


            {/* ==================================
                MAIN CARD
            ================================== */}

            <div className="forgot-password-card">


                {/* ==================================
                    STAGE 1
                    USERNAME OR EMAIL
                ================================== */}

                {!verified && (

                    <form
                        onSubmit={
                            handleVerifyAccount
                        }
                    >

                        <div className="forgot-password-group">

                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) =>
                                    setIdentifier(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter username or email"
                                autoComplete="username"
                                required
                            />

                        </div>


                        {/* MESSAGE */}

                        {message && (

                            <div
                                className={
                                    messageType === "success"
                                        ? "forgot-password-message forgot-password-success"
                                        : "forgot-password-message forgot-password-error"
                                }
                            >
                                {message}
                            </div>

                        )}


                        {/* BUTTONS */}

                        <div className="forgot-password-buttons">

                            <button
                                type="submit"
                                className="forgot-password-submit"
                                disabled={loading}
                            >

                                {loading
                                    ? "Verifying..."
                                    : "Reset"}

                            </button>


                            <button
                                type="button"
                                className="forgot-password-cancel"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                )}


                {/* ==================================
                    STAGE 2
                    SECURITY QUESTION
                ================================== */}

                {verified &&
                    !answerVerified && (

                    <form
                        onSubmit={
                            handleVerifyAnswer
                        }
                    >

                        <h2>
                            Security Question
                        </h2>


                        {/* SECURITY QUESTION */}

                        <div className="forgot-password-group">

                            <input
                                type="text"
                                value={
                                    securityQuestion
                                }
                                readOnly
                            />

                        </div>


                        {/* SECURITY ANSWER */}

                        <div className="forgot-password-group">

                            <label
                                htmlFor="security-answer"
                            >
                                Security Answer
                            </label>


                            <input
                                id="security-answer"
                                type="text"
                                value={
                                    securityAnswer
                                }
                                onChange={(e) =>
                                    setSecurityAnswer(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your answer"
                                autoComplete="off"
                                required
                            />

                        </div>


                        {/* MESSAGE */}

                        {message && (

                            <div
                                className={
                                    messageType === "success"
                                        ? "forgot-password-message forgot-password-success"
                                        : "forgot-password-message forgot-password-error"
                                }
                            >
                                {message}
                            </div>

                        )}


                        {/* BUTTONS */}

                        <div className="forgot-password-buttons">

                            <button
                                type="submit"
                                className="forgot-password-submit"
                                disabled={loading}
                            >

                                {loading
                                    ? "Verifying..."
                                    : "Verify Answer"}

                            </button>


                            <button
                                type="button"
                                className="forgot-password-cancel"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                )}


                {/* ==================================
                    STAGE 3
                    NEW PASSWORD
                ================================== */}

                {answerVerified && (

                    <form
                        onSubmit={
                            handleResetPassword
                        }
                    >

                        {/* NEW PASSWORD */}

                        <div className="forgot-password-group">
                            <label
                                htmlFor="new-password"
                            >
                                New Password
                            </label>


                            <input
                                id="new-password"
                                type="password"
                                value={
                                    newPassword
                                }
                                onChange={(e) =>
                                    setNewPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                required
                            />

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <div className="forgot-password-group">

                            <label
                                htmlFor="confirm-password"
                            >
                                Confirm New Password
                            </label>


                            <input
                                id="confirm-password"
                                type="password"
                                value={
                                    confirmPassword
                                }
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                required
                            />

                        </div>


                        {/* MESSAGE */}

                        {message && (

                            <div
                                className={
                                    messageType === "success"
                                        ? "forgot-password-message forgot-password-success"
                                        : "forgot-password-message forgot-password-error"
                                }
                            >
                                {message}
                            </div>

                        )}


                        {/* BUTTONS */}

                        <div className="forgot-password-buttons">

                            <button
                                type="submit"
                                className="forgot-password-submit"
                                disabled={loading}
                            >

                                {loading
                                    ? "Saving..."
                                    : "Save Password"}

                            </button>


                            <button
                                type="button"
                                className="forgot-password-cancel"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                )}

            </div>

        </div>

    );
}

export default ForgotPassword;