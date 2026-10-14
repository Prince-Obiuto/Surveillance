import {
    useCallback,
    useEffect,
    useState
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    useTheme
} from "../context/ThemeContext";

import {
    FaUsers,
    FaUser,
    FaEnvelope,
    FaShieldAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaSyncAlt
} from "react-icons/fa";

import "../styles/Accounts.css";


// =====================================================
// ACCOUNTS
// =====================================================

function Accounts() {

    // =====================================================
    // NAVIGATION
    // =====================================================

    const navigate = useNavigate();


    // =====================================================
    // THEME
    // =====================================================

    const {
        darkMode
    } = useTheme();


    // =====================================================
    // CURRENT LOGGED-IN USER
    // =====================================================

    const [
        currentUser,
        setCurrentUser
    ] = useState(null);


    // =====================================================
    // ACCOUNTS
    // =====================================================

    const [
        accounts,
        setAccounts
    ] = useState([]);


    // =====================================================
    // LOADING
    // =====================================================

    const [
        loading,
        setLoading
    ] = useState(true);


    // =====================================================
    // REFRESHING
    // =====================================================

    const [
        refreshing,
        setRefreshing
    ] = useState(false);


    // =====================================================
    // MESSAGE
    // =====================================================

    const [
        message,
        setMessage
    ] = useState("");


    // =====================================================
    // CHECK WHETHER CURRENT USER IS HOD
    // =====================================================

    const isHOD =
        String(currentUser?.role || "")
            .trim()
            .toLowerCase() === "hod";


    // =====================================================
    // LOAD CURRENT LOGGED-IN USER
    // =====================================================

    useEffect(() => {

        const loggedIn =
            localStorage.getItem("isLoggedIn");


        if (!loggedIn) {

            window.location.href = "/";

            return;

        }


        const savedUser =
            localStorage.getItem("user");


        if (savedUser) {

            try {

                const user =
                    JSON.parse(savedUser);


                setCurrentUser(user);


                // =========================================
                // HOD ONLY
                // =========================================

                const userRole =
                    String(user?.role || "")
                        .trim()
                        .toLowerCase();


                if (userRole !== "hod") {

                    window.location.href =
                        "/dashboard";

                }


            } catch (error) {

                console.error(
                    "Unable to read logged-in user:",
                    error
                );


                window.location.href = "/";

            }

        } else {

            // =============================================
            // FALLBACK
            // =============================================

            const username =
                localStorage.getItem("username");


            const role =
                localStorage.getItem("role");


            const fallbackUser = {

                username:
                    username || "Admin",

                role:
                    role || "Administrator"

            };


            setCurrentUser(
                fallbackUser
            );


            // =============================================
            // CHECK FALLBACK ROLE
            // =============================================

            if (
                String(
                    fallbackUser.role || ""
                )
                    .trim()
                    .toLowerCase() !== "hod"
            ) {

                window.location.href =
                    "/dashboard";

            }

        }

    }, []);


    // =====================================================
    // FETCH ACCOUNTS
    // =====================================================

    const fetchAccounts =
        useCallback(
            async (
                isRefresh = false
            ) => {

                try {

                    // =====================================
                    // HOD PERMISSION CHECK
                    // =====================================

                    if (!isHOD) {

                        setMessage(
                            "Only the HOD account can access Accounts."
                        );

                        return;

                    }


                    if (isRefresh) {

                        setRefreshing(true);

                    } else {

                        setLoading(true);

                    }


                    setMessage("");


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
                    // REQUEST ACCOUNTS
                    // =====================================

                    const response =
                        await fetch(
                            `/api/auth/accounts?admin_id=${encodeURIComponent(
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
                            "Only the HOD account can access Accounts."
                        );


                        window.location.href =
                            "/dashboard";

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
                            "Unable to load accounts."
                        );

                    }


                    // =====================================
                    // SAVE ACCOUNTS
                    // =====================================

                    const loadedAccounts =
                        Array.isArray(
                            data.accounts
                        )
                            ? data.accounts
                            : [];


                    setAccounts(
                        loadedAccounts
                    );


                    setMessage("");


                } catch (error) {

                    console.error(
                        "Fetch Accounts Error:",
                        error
                    );


                    setAccounts(
                        []
                    );


                    setMessage(
                        `Unable to load accounts: ${error.message}`
                    );


                } finally {

                    setLoading(false);

                    setRefreshing(false);

                }

            },
            [
                isHOD
            ]
        );


    // =====================================================
    // LOAD ACCOUNTS
    // =====================================================

    useEffect(() => {

        if (currentUser) {

            fetchAccounts();

        }

    }, [
        currentUser,
        fetchAccounts
    ]);


    // =====================================================
    // REFRESH ACCOUNTS
    // =====================================================

    const refreshAccounts =
        useCallback(
            () => {

                fetchAccounts(
                    true
                );

            },
            [
                fetchAccounts
            ]
        );


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate =
        useCallback(
            (dateValue) => {

                if (!dateValue) {

                    return "—";

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

                    return "—";

                }


                return date.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );

            },
            []
        );


    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime =
        useCallback(
            (dateValue) => {

                if (!dateValue) {

                    return "";

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

                    return "";

                }


                return date.toLocaleTimeString(
                    "en-GB",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

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

                    return "account-role hod";

                }


                if (
                    normalizedRole === "lecturer"
                ) {

                    return "account-role lecturer";

                }


                if (
                    normalizedRole === "student"
                ) {

                    return "account-role student";

                }


                return "account-role";

            },
            []
        );


    // =====================================================
    // OPEN ACCOUNT DETAILS
    // =====================================================

    const openAccountDetails =
        useCallback(
            (accountId) => {

                if (!accountId) {

                    return;

                }


                navigate(
                    `/account-details/${accountId}`
                );

            },
            [
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
                        ? "accounts-page dark"
                        : "accounts-page"
                }
            >

                <div className="accounts-top-bar">

                    <Link
                        to="/dashboard"
                        className="accounts-back-button"
                    >
                        ← Back
                    </Link>


                    <div>

                        <h1>
                            Accounts
                        </h1>

                    </div>

                </div>


                <div className="accounts-loading">

                    Loading accounts...

                </div>

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
                    ? "accounts-page dark"
                    : "accounts-page"
            }
        >


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="accounts-top-bar">

                <Link
                    to="/dashboard"
                    className="accounts-back-button"
                >
                    ← Back
                </Link>


                <div>

                    <h1>
                        Accounts
                    </h1>

                </div>


                {/* =============================================
                    REFRESH
                ============================================= */}

                <button
                    type="button"
                    className="accounts-refresh-button"
                    onClick={
                        refreshAccounts
                    }
                    disabled={
                        refreshing
                    }
                >

                    <FaSyncAlt
                        className={
                            refreshing
                                ? "accounts-refresh-icon spinning"
                                : "accounts-refresh-icon"
                        }
                    />

                    <span>

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </span>

                </button>

            </div>


            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (

                <div className="accounts-message">

                    <FaTimesCircle />

                    <span>

                        {message}

                    </span>

                </div>

            )}


            {/* =================================================
                ACCOUNT SUMMARY
            ================================================= */}

            <div className="accounts-summary-card">

                <div className="accounts-summary-icon">

                    <FaUsers />

                </div>


                <div className="accounts-summary-information">

                    <span>
                        Total Accounts
                    </span>

                    <strong>
                        {accounts.length}
                    </strong>

                </div>

            </div>


            {/* =================================================
                ACCOUNTS SECTION
            ================================================= */}

            <div className="accounts-card">

                <div className="accounts-section-header">

                    <div>

                        <h2>
                            System Accounts
                        </h2>

                        <p>
                            All accounts registered
                            in the surveillance system.
                        </p>

                    </div>


                    <span className="accounts-count">

                        {accounts.length}

                        {" "}

                        {accounts.length === 1
                            ? "Account"
                            : "Accounts"}

                    </span>

                </div>


                {/* =================================================
                    NO ACCOUNTS
                ================================================= */}

                {accounts.length === 0 ? (

                    <div className="accounts-empty">

                        <FaUsers />

                        <h3>
                            No Accounts Found
                        </h3>

                        <p>
                            There are currently no
                            accounts available.
                        </p>

                    </div>

                ) : (

                    /* =============================================
                       ACCOUNT LIST
                    ============================================= */

                    <div className="accounts-list">

                        {accounts.map(
                            (
                                account,
                                index
                            ) => (

                                <div
                                    className="account-row"
                                    key={
                                        account.id ||
                                        index
                                    }
                                    onClick={() =>
                                        openAccountDetails(
                                            account.id
                                        )
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {

                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {

                                            event.preventDefault();

                                            openAccountDetails(
                                                account.id
                                            );

                                        }

                                    }}
                                >


                                    {/* =================================
                                        ACCOUNT INFORMATION
                                    ================================= */}

                                    <div className="account-information">

                                        <div className="account-avatar">

                                            <FaUser />

                                        </div>


                                        <div>

                                            <h3>

                                                {account.username ||
                                                    "Unknown User"}

                                            </h3>

                                            <span>

                                                ID:{" "}

                                                {account.id ||
                                                    "—"}

                                            </span>

                                        </div>

                                    </div>


                                    {/* =================================
                                        FULL NAME
                                    ================================= */}

                                    <div className="account-detail">

                                        <span className="account-detail-label">

                                            Full Name

                                        </span>


                                        <div className="account-detail-value">

                                            <FaUser />

                                            <span>

                                                {account.full_name ||
                                                    "—"}

                                            </span>

                                        </div>

                                    </div>


                                    {/* =================================
                                        EMAIL
                                    ================================= */}

                                    <div className="account-detail">

                                        <span className="account-detail-label">

                                            Email

                                        </span>


                                        <div className="account-detail-value">

                                            <FaEnvelope />

                                            <span>

                                                {account.email ||
                                                    "—"}

                                            </span>

                                        </div>

                                    </div>


                                    {/* =================================
                                        ROLE
                                    ================================= */}

                                    <div className="account-detail">

                                        <span className="account-detail-label">

                                            Role

                                        </span>


                                        <div>

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

                                    </div>


                                    {/* =================================
                                        STATUS
                                    ================================= */}

                                    <div className="account-detail">

                                        <span className="account-detail-label">

                                            Status

                                        </span>


                                        <div>

                                            <span className="account-status active">

                                                <FaCheckCircle />

                                                Active

                                            </span>

                                        </div>

                                    </div>


                                    {/* =================================
                                        DATE CREATED
                                    ================================= */}

                                    <div className="account-detail">

                                        <span className="account-detail-label">

                                            Date Created

                                        </span>


                                        <div className="account-date">

                                            <span>

                                                {formatDate(
                                                    account.created_at
                                                )}

                                            </span>


                                            <small>

                                                {formatTime(
                                                    account.created_at
                                                )}

                                            </small>

                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>

    );

}


// =====================================================
// EXPORT
// =====================================================

export default Accounts;