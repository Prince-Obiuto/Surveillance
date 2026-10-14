import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // ==========================================
    // LOGIN
    // ==========================================

    const handleLogin = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError("");

        try {

            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        username,
                        password,
                    }),
                }
            );

            const data = await response.json();

            // ==================================
            // SUCCESSFUL LOGIN
            // ==================================

            if (data.success) {

                // Save Login Session
                localStorage.setItem(
                    "isLoggedIn",
                    "true"
                );
		localStorage.setItem("token", data.token);
                // Save Logged-in User
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                // Save Username
                localStorage.setItem(
                    "username",
                    data.user.username
                );

                // Save Admin ID
                localStorage.setItem(
                    "admin_id",
                    data.user.id
                );

                // Redirect to Dashboard
                navigate("/dashboard");

            } else {

                setError(
                    data.message ||
                    "Invalid Username or Password."
                );

            }

        } catch (err) {

            console.error(
                "Login error:",
                err
            );

            setError(
                "Unable to connect to the server."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="login-container">

            <div className="login-box">

                {/* ==================================
                    TITLE
                ================================== */}

                <h1>
                    Smart Surveillance System
                </h1>

                <p>
                    Administrator Portal
                </p>


                {/* ==================================
                    LOGIN FORM
                ================================== */}

                <form onSubmit={handleLogin}>

                    {/* USERNAME */}

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) =>
                            setUsername(
                                e.target.value
                            )
                        }
                        required
                    />


                    {/* PASSWORD */}

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        required
                    />


                    {/* ==================================
                        LOGIN OPTIONS
                    ================================== */}

                    <div className="options">

                        <div className="remember">

                            <input
                                type="checkbox"
                                id="remember"
                            />

                            <label htmlFor="remember">
                                Remember Me
                            </label>

                        </div>


                        <div className="forgot">

                            <Link to="/forgot-password">
                                Forgot Password?
                            </Link>

                        </div>

                    </div>


                    {/* ==================================
                        ERROR MESSAGE
                    ================================== */}

                    {error && (

                        <p className="error-message">
                            {error}
                        </p>

                    )}

                    
                    {/* ==================================
                        CREATE ACCOUNT
                    ================================== */}

                    <div className="create-account-link">

                        <span>
                            Don't have an account?
                        </span>

                        <Link to="/create-account">
                            Create Account
                        </Link>

                    </div>


                    {/* ==================================
                        LOGIN BUTTON
                    ================================== */}

                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"}

                    </button>



                </form>

            </div>

        </div>

    );

}

export default Login;
