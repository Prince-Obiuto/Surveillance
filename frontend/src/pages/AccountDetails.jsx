import {
    useCallback,
    useEffect,
    useState
} from "react";
import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import {
    useTheme
} from "../context/ThemeContext";

import {
    FaUser,
    FaEnvelope,
    FaShieldAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaTrash,
    FaArrowLeft,
    FaGlobe,
    FaClock,
    FaCalendarAlt,
    FaIdCard,
    FaToggleOn,
    FaToggleOff
} from "react-icons/fa";

import "../styles/AccountDetails.css";


// =====================================================
// ACCOUNT DETAILS
// =====================================================

function AccountDetails() {

    // =====================================================
    // NAVIGATION
    // =====================================================

    const navigate =
        useNavigate();


    // =====================================================
    // ACCOUNT ID FROM URL
    // =====================================================

    const {
        id
    } = useParams();


    // =====================================================
    // THEME
    // =====================================================

    const {
        darkMode
    } = useTheme();


    // =====================================================
    // ACCOUNT
    // =====================================================

    const [
        account,
        setAccount
    ] = useState(null);


    // =====================================================
    // LOADING
    // =====================================================

    const [
        loading,
        setLoading
    ] = useState(true);


    // =====================================================
    // UPDATING PERMISSION
    // =====================================================

    const [
        updatingPermission,
        setUpdatingPermission
    ] = useState(false);


    // =====================================================
    // DELETING ACCOUNT
    // =====================================================

    const [
        deleting,
        setDeleting
    ] = useState(false);


    // =====================================================
    // MESSAGE
    // =====================================================

    const [
        message,
        setMessage
    ] = useState("");


    // =====================================================
    // MESSAGE TYPE
    // =====================================================

    const [
        messageType,
        setMessageType
    ] = useState("");


    // =====================================================
    // FORMAT DATE AND TIME
    // =====================================================

    const formatDateTime =
        useCallback(
            (dateValue) => {

                if (!dateValue) {

                    return "Never";

                }


                const date =
                    new Date(
                        dateValue
                    );


                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {

                    return "Not available";

                }


                const formattedDate =
                    date.toLocaleDateString(
                        "en-GB",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );


                const formattedTime =
                    date.toLocaleTimeString(
                        "en-GB",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );


                return `${formattedDate} at ${formattedTime}`;

            },
            []
        );


    // =====================================================
    // GET ROLE CLASS
    // =====================================================

    const getRoleClass =
        useCallback(
            (role) => {

                const normalizedRole =
                    String(
                        role || ""
                    )
                        .trim()
                        .toLowerCase();


                if (
                    normalizedRole === "hod"
                ) {

                    return "account-details-role hod";

                }


                if (
                    normalizedRole === "lecturer"
                ) {

                    return "account-details-role lecturer";

                }


                if (
                    normalizedRole === "student"
                ) {

                    return "account-details-role student";

                }


                return "account-details-role";

            },
            []
        );


    // =====================================================
    // GET ACCOUNT DETAILS
    // =====================================================

    const fetchAccountDetails =
        useCallback(
            async () => {

                try {

                    setLoading(true);

                    setMessage("");

                    setMessageType("");


                    // =====================================
                    // GET ADMIN ID
                    // =====================================

                    const adminId =
                        localStorage.getItem(
                            "admin_id"
                        );


                    if (!adminId) {

                        throw new Error(
                            "Administrator ID was not found."
                        );

                    }


                    // =====================================
                    // CHECK ACCOUNT ID
                    // =====================================

                    if (!id) {

                        throw new Error(
                            "Account ID was not found."
                        );

                    }


                    // =====================================
                    // REQUEST ACCOUNT DETAILS
                    // =====================================

                    const response =
                        await fetch(
                            `http://localhost:5000/api/auth/accounts/${id}?admin_id=${encodeURIComponent(
                                adminId
                            )}`
                        );


                    // =====================================
                    // UNAUTHORIZED
                    // =====================================

                    if (
                        response.status === 401
                    ) {

                        localStorage.removeItem(
                            "isLoggedIn"
                        );

                        localStorage.removeItem(
                            "user"
                        );

                        localStorage.removeItem(
                            "username"
                        );

                        localStorage.removeItem(
                            "admin_id"
                        );


                        window.location.href =
                            "/";

                        return;

                    }


                    // =====================================
                    // FORBIDDEN
                    // =====================================

                    if (
                        response.status === 403
                    ) {

                        setMessage(
                            "Only the HOD account can view account details."
                        );

                        setMessageType(
                            "error"
                        );

                        return;

                    }


                    // =====================================
                    // READ RESPONSE
                    // =====================================

                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to load account details."
                        );

                    }


                    // =====================================
                    // SAVE ACCOUNT
                    // =====================================

                    setAccount(
                        data.account
                    );


                } catch (error) {

                    console.error(
                        "Fetch Account Details Error:",
                        error
                    );


                    setAccount(
                        null
                    );


                    setMessage(
                        `Unable to load account details: ${error.message}`
                    );

                    setMessageType(
                        "error"
                    );


                } finally {

                    setLoading(false);

                }

            },
            [
                id
            ]
        );


    // =====================================================
    // LOAD ACCOUNT DETAILS
    // =====================================================

    useEffect(() => {

        fetchAccountDetails();

    }, [
        fetchAccountDetails
    ]);


    // =====================================================
    // UPDATE LOGIN PERMISSION
    // =====================================================

    const handleLoginPermission =
        useCallback(
            async () => {

                if (!account) {

                    return;

                }


                try {

                    setUpdatingPermission(
                        true
                    );

                    setMessage("");

                    setMessageType("");


                    // =====================================
                    // GET ADMIN ID
                    // =====================================

                    const adminId =
                        localStorage.getItem(
                            "admin_id"
                        );


                    if (!adminId) {

                        throw new Error(
                            "Administrator ID was not found."
                        );

                    }


                    // =====================================
                    // NEW LOGIN STATUS
                    // =====================================

                    const newStatus =
                        !account.login_allowed;


                    // =====================================
                    // UPDATE ACCOUNT STATUS
                    // =====================================

                    const response =
                        await fetch(
                            `http://localhost:5000/api/auth/accounts/${id}/status?admin_id=${encodeURIComponent(
                                adminId
                            )}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        login_allowed:
                                            newStatus
                                    })
                            }
                        );


                    // =====================================
                    // READ RESPONSE
                    // =====================================

                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to update login permission."
                        );

                    }


                    // =====================================
                    // UPDATE LOCAL ACCOUNT
                    // =====================================

                    setAccount(
                        previousAccount => ({
                            ...previousAccount,

                            login_allowed:
                                data.login_allowed
                        })
                    );


                    // =====================================
                    // SUCCESS MESSAGE
                    // =====================================

                    setMessage(
                        data.message ||
                        (
                            data.login_allowed
                                ? "Login permission enabled."
                                : "Login permission disabled."
                        )
                    );

                    setMessageType(
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Update Login Permission Error:",
                        error
                    );


                    setMessage(
                        error.message
                    );

                    setMessageType(
                        "error"
                    );


                } finally {

                    setUpdatingPermission(
                        false
                    );

                }

            },
            [
                account,
                id
            ]
        );


    // =====================================================
    // DELETE ACCOUNT
    // =====================================================

    const handleDeleteAccount =
        useCallback(
            async () => {

                if (!account) {

                    return;

                }


                // =========================================
                // CONFIRM DELETE
                // =========================================

                const confirmed =
                    window.confirm(
                        `Are you sure you want to delete ${account.full_name || account.username}'s account?\n\nThis action cannot be undone.`
                    );


                if (!confirmed) {

                    return;

                }


                try {

                    setDeleting(
                        true
                    );

                    setMessage("");

                    setMessageType("");


                    // =====================================
                    // GET ADMIN ID
                    // =====================================

                    const adminId =
                        localStorage.getItem(
                            "admin_id"
                        );


                    if (!adminId) {

                        throw new Error(
                            "Administrator ID was not found."
                        );

                    }


                    // =====================================
                    // DELETE ACCOUNT
                    // =====================================

                    const response =
                        await fetch(
                            `http://localhost:5000/api/auth/accounts/${id}?admin_id=${encodeURIComponent(
                                adminId
                            )}`,
                            {
                                method: "DELETE"
                            }
                        );


                    // =====================================
                    // READ RESPONSE
                    // =====================================

                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to delete account."
                        );

                    }


                    // =====================================
                    // SUCCESS
                    // =====================================

                    alert(
                        data.message ||
                        "Account deleted successfully."
                    );


                    // =====================================
                    // RETURN TO ACCOUNTS
                    // =====================================

                    navigate(
                        "/accounts"
                    );


                } catch (error) {

                    console.error(
                        "Delete Account Error:",
                        error
                    );


                    setMessage(
                        error.message
                    );

                    setMessageType(
                        "error"
                    );


                } finally {

                    setDeleting(
                        false
                    );

                }

            },
            [
                account,
                id,
                navigate
            ]
        );


    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {

        return (

            <div
                className={
                    darkMode
                        ? "account-details-page dark"
                        : "account-details-page"
                }
            >

                <div className="account-details-top-bar">

                    <Link
                        to="/accounts"
                        className="account-details-back-button"
                    >

                        <FaArrowLeft />

                        <span>
                            Back to Accounts
                        </span>

                    </Link>


                    <div>

                        <h1>
                            Account Details
                        </h1>

                    </div>

                </div>


                <div className="account-details-loading">

                    Loading account details...

                </div>

            </div>

        );

    }


    // =====================================================
    // ACCOUNT NOT FOUND
    // =====================================================

    if (!account) {

        return (

            <div
                className={
                    darkMode
                        ? "account-details-page dark"
                        : "account-details-page"
                }
            >

                <div className="account-details-top-bar">

                    <Link
                        to="/accounts"
                        className="account-details-back-button"
                    >

                        <FaArrowLeft />

                        <span>
                            Back to Accounts
                        </span>

                    </Link>


                    <div>

                        <h1>
                            Account Details
                        </h1>

                    </div>

                </div>


                {message && (

                    <div className="account-details-message error">

                        <FaTimesCircle />

                        <span>
                            {message}
                        </span>

                    </div>

                )}

            </div>

        );

    }


    // =====================================================
    // MAIN PAGE
    // =====================================================

    return (

        <div
            className={
                darkMode
                    ? "account-details-page dark"
                    : "account-details-page"
            }
        >


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="account-details-top-bar">

                <Link
                    to="/accounts"
                    className="account-details-back-button"
                >

                    <FaArrowLeft />

                    <span>
                        Back to Accounts
                    </span>

                </Link>


                <div>

                    <h1>
                        Account Details
                    </h1>

                </div>

            </div>


            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (

                <div
                    className={
                        messageType === "success"
                            ? "account-details-message success"
                            : "account-details-message error"
                    }
                >

                    {messageType === "success"
                        ? <FaCheckCircle />
                        : <FaTimesCircle />
                    }

                    <span>
                        {message}
                    </span>

                </div>

            )}


            {/* =================================================
                ACCOUNT HEADER CARD
            ================================================= */}

            <div className="account-details-profile-card">

                <div className="account-details-profile-icon">

                    <FaUser />

                </div>


                <div className="account-details-profile-information">

                    <h2>

                        {account.full_name ||
                            "Unknown User"}

                    </h2>


                    <p>

                        @{account.username ||
                            "unknown"}

                    </p>


                    <span
                        className={
                            getRoleClass(
                                account.role
                            )
                        }
                    >

                        <FaShieldAlt />

                        {account.role ||
                            "Unknown"}

                    </span>

                </div>


                <div
                    className={
                        account.login_allowed
                            ? "account-details-status allowed"
                            : "account-details-status blocked"
                    }
                >

                    {account.login_allowed
                        ? <FaCheckCircle />
                        : <FaTimesCircle />
                    }

                    <span>

                        {account.login_allowed
                            ? "Login Allowed"
                            : "Login Blocked"}

                    </span>

                </div>

            </div>


            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <div className="account-details-card">

                <div className="account-details-card-header">

                    <div>

                        <h2>
                            Account Information
                        </h2>

                    </div>

                </div>


                <div className="account-details-grid">


                    {/* =========================================
                        FULL NAME
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaUser />

                        </div>


                        <div>

                            <span>
                                Full Name
                            </span>

                            <strong>

                                {account.full_name ||
                                    "—"}

                            </strong>

                        </div>

                    </div>


                    {/* =========================================
                        USERNAME
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaIdCard />

                        </div>


                        <div>

                            <span>
                                Username
                            </span>

                            <strong>

                                {account.username ||
                                    "—"}

                            </strong>

                        </div>

                    </div>


                    {/* =========================================
                        EMAIL
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaEnvelope />

                        </div>


                        <div>

                            <span>
                                Email
                            </span>

                            <strong>

                                {account.email ||
                                    "—"}

                            </strong>

                        </div>

                    </div>


                    {/* =========================================
                        ROLE
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaShieldAlt />

                        </div>


                        <div>

                            <span>
                                Role
                            </span>

                            <strong>

                                {account.role ||
                                    "—"}

                            </strong>

                        </div>

                    </div>


                    {/* =========================================
                        ACCOUNT ID
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaIdCard />

                        </div>


                        <div>

                            <span>
                                Account ID
                            </span>

                            <strong>

                                {account.id ||
                                    "—"}

                            </strong>

                        </div>

                    </div>


                    {/* =========================================
                        IP ADDRESS
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaGlobe />

                        </div>


                        <div>

                            <span>
                                Last Login IP Address
                            </span>

                            <strong>

                                {account.last_login_ip ||
                                    "Not available"}

                            </strong>

                        </div>

                    </div>


                    {/* =========================================
                        LAST LOGIN
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaClock />

                        </div>


                        <div>

                            <span>
                                Last Login
                            </span>

                            <strong>

                                {formatDateTime(
                                    account.last_login
                                )}

                            </strong>

                        </div>

                    </div>


                    {/* =========================================
                        ACCOUNT CREATED
                    ========================================= */}

                    <div className="account-details-item">

                        <div className="account-details-item-icon">

                            <FaCalendarAlt />

                        </div>


                        <div>

                            <span>
                                Account Created
                            </span>

                            <strong>

                                {formatDateTime(
                                    account.created_at
                                )}

                            </strong>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                LOGIN PERMISSION
            ================================================= */}

            <div className="account-details-card">

                <div className="account-details-card-header">

                    <div>

                        <h2>
                            Login Permission
                        </h2>

                    </div>

                </div>


                <div className="account-details-permission">

                    <div className="account-details-permission-information">

                        <div
                            className={
                                account.login_allowed
                                    ? "account-details-permission-icon allowed"
                                    : "account-details-permission-icon blocked"
                            }
                        >

                            {account.login_allowed
                                ? <FaToggleOn />
                                : <FaToggleOff />
                            }

                        </div>


                        <div>

                            <strong>

                                {account.login_allowed
                                    ? "Login Allowed"
                                    : "Login Blocked"}

                            </strong>


                            <p>

                                {account.login_allowed
                                    ? "This account is currently allowed to log in."
                                    : "This account is currently blocked from logging in."
                                }

                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        className={
                            account.login_allowed
                                ? "account-details-permission-button allowed"
                                : "account-details-permission-button blocked"
                        }
                        onClick={
                            handleLoginPermission
                        }
                        disabled={
                            updatingPermission
                        }
                    >

                        {updatingPermission
                            ? "Updating..."
                            : account.login_allowed
                                ? "Turn OFF"
                                : "Turn ON"
                        }

                    </button>

                </div>

            </div>


            {/* =================================================
                ACCOUNT ACTIONS
            ================================================= */}

            <div className="account-details-card account-details-danger-card">

                <div className="account-details-card-header">

                    <div>

                        <h2>
                            Account Actions
                        </h2>

                    </div>

                </div>


                <div className="account-details-delete-section">

                    <div>

                        <strong>
                            Delete Account
                        </strong>

                        <p>
                            This action permanently deletes the account and cannot be undone.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="account-details-delete-button"
                        onClick={
                            handleDeleteAccount
                        }
                        disabled={
                            deleting
                        }
                    >

                        <FaTrash />

                        <span>

                            {deleting
                                ? "Deleting..."
                                : "Delete Account"
                            }

                        </span>

                    </button>

                </div>

            </div>


        </div>

    );

}


// =====================================================
// EXPORT
// =====================================================

export default AccountDetails;