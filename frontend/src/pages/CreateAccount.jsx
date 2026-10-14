import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CreateAccount.css";

function CreateAccount() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);


    // ==========================================
    // CREATE ACCOUNT
    // ==========================================

    const handleCreateAccount = async (e) => {

        e.preventDefault();

        setMessage("");
        setMessageType("");


        // --------------------------------------
        // CHECK REQUIRED FIELDS
        // --------------------------------------

        if (
            !fullName.trim() ||
            !email.trim() ||
            !role ||
            !username.trim() ||
            !password ||
            !confirmPassword ||
            !securityQuestion ||
            !securityAnswer.trim()
        ) {

            setMessage(
                "Please fill in all fields."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK USERNAME
        // --------------------------------------

        const usernamePattern =
            /^[A-Za-z]{4,9}$/;

        if (!usernamePattern.test(username)) {

            setMessage(
                "Username must contain 4 to 9 letters only."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK PASSWORD
        // --------------------------------------

        if (password.length < 6) {

            setMessage(
                "Password must be at least 6 characters."
            );

            setMessageType("error");

            return;
        }


        // --------------------------------------
        // CHECK PASSWORD MATCH
        // --------------------------------------

        if (password !== confirmPassword) {

            setMessage(
                "Password and confirm password do not match."
            );

            setMessageType("error");

            return;
        }


        try {

            setLoading(true);


            // ----------------------------------
            // SEND TO BACKEND
            // ----------------------------------

            const response = await fetch(
                "http://localhost:5000/api/auth/create-account",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        full_name:
                            fullName.trim(),

                        email:
                            email.trim(),

                        role,

                        username:
                            username.trim(),

                        password,

                        security_question:
                            securityQuestion,

                        security_answer:
                            securityAnswer.trim()

                    })
                }
            );


            const data =
                await response.json();


            // ----------------------------------
            // BACKEND ERROR
            // ----------------------------------

            if (!response.ok || !data.success) {

                setMessage(
                    data.message ||
                    "Unable to create account."
                );

                setMessageType("error");

                return;
            }


            // ----------------------------------
            // SUCCESS
            // ----------------------------------

            setMessage(
                "Account created successfully."
            );

            setMessageType("success");


            // ----------------------------------
            // CLEAR FORM
            // ----------------------------------

            setFullName("");
            setEmail("");
            setRole("");
            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setSecurityQuestion("");
            setSecurityAnswer("");


        } catch (error) {

            console.error(
                "Create account error:",
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


    return (

        <div className="create-account-page">


            {/* ==================================
                TOP BAR
            ================================== */}

            <div className="create-account-top">

                <button
                    type="button"
                    className="create-account-back"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    ← Back
                </button>

                <h1>
                    Create Account
                </h1>

            </div>


            {/* ==================================
                MAIN CARD
            ================================== */}

            <div className="create-account-card">

                <h2>
                    Administrator Account
                </h2>

                <p className="create-account-description">
                    Create an account for an administrator
                    to access the surveillance system.
                </p>


                <form
                    className="create-account-form"
                    onSubmit={handleCreateAccount}
                >


                    {/* ==========================
                        FULL NAME
                    ========================== */}

                    <div className="create-account-group">

                        <label htmlFor="full-name">
                            Full Name (Surname First)
                        </label>

                        <input
                            id="full-name"
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

                    <div className="create-account-group">

                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            id="email"
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
                        ROLE
                    ========================== */}

                    <div className="create-account-group">

                        <label htmlFor="role">
                            Role
                        </label>

                        <select
                            id="role"
                            value={role}
                            onChange={(e) =>
                                setRole(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Select role
                            </option>

                            <option value="HOD">
                                HOD
                            </option>

                            <option value="Lecturer">
                                Lecturer
                            </option>

                            <option value="Student">
                                Student
                            </option>

                        </select>

                    </div>


                    {/* ==========================
                        USERNAME
                    ========================== */}

                    <div className="create-account-group">

                        <label htmlFor="username">
                            Choose Username
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(
                                    e.target.value
                                )
                            }
                            placeholder="4-9 letters"
                            maxLength={9}
                        />

                    </div>


                    {/* ==========================
                        PASSWORD
                    ========================== */}

                    <div className="create-account-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter password"
                        />

                    </div>


                    {/* ==========================
                        CONFIRM PASSWORD
                    ========================== */}

                    <div className="create-account-group">

                        <label htmlFor="confirm-password">
                            Confirm Password
                        </label>

                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Confirm password"
                        />

                    </div>


                    {/* ==========================
                        SECURITY QUESTION
                    ========================== */}

                    <div className="create-account-group">

                        <label htmlFor="security-question">
                            Security Question
                        </label>

                        <select
                            id="security-question"
                            value={securityQuestion}
                            onChange={(e) =>
                                setSecurityQuestion(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Select security question
                            </option>

                            <option value="Your Birth Town">
                                Your Birth Town
                            </option>

                            <option value="Your Mother's Maiden Name">
                                Your Mother's Maiden Name
                            </option>

                            <option value="Your Next of Kin (Full Name)">
                                Your Next of Kin (Full Name)
                            </option>

                        </select>

                    </div>


                    {/* ==========================
                        SECURITY ANSWER
                    ========================== */}

                    <div className="create-account-group">

                        <label htmlFor="security-answer">
                            Security Answer
                        </label>

                        <input
                            id="security-answer"
                            type="text"
                            value={securityAnswer}
                            onChange={(e) =>
                                setSecurityAnswer(
                                    e.target.value
                                )
                            }
                            placeholder="Enter your answer"
                        />

                    </div>


                    {/* ==========================
                        MESSAGE
                    ========================== */}

                    {message && (

                        <div
                            className={
                                messageType === "success"
                                    ? "create-account-message create-account-success"
                                    : "create-account-message create-account-error"
                            }
                        >
                            {message}
                        </div>

                    )}


                    {/* ==========================
                        BUTTONS
                    ========================== */}

                    <div className="create-account-buttons">

                        <button
                            type="submit"
                            className="create-account-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Creating..."
                                : "Submit"}

                        </button>


                        <button
                            type="button"
                            className="create-account-cancel"
                            onClick={() =>
                                navigate("/")
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

export default CreateAccount;