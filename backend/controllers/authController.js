const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const comparePassword = async (plainPassword, passwordHash) => {
    try {
        return await bcrypt.compare(plainPassword, passwordHash);
    } catch (_error) {
        return false;
    }
};

// ==========================================
// Login Administrator
// ==========================================
const login = (req, res) => {

    const { username, password } = req.body;

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required.",
        });
    }

    const ip = req.ip;

    const device = req.headers["user-agent"];
    const browser = req.headers["user-agent"];

    const sql = "SELECT * FROM administrators WHERE username = ? LIMIT 1";

    db.query(sql, [username.trim()], async (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }

        if (result.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid Username or Password",
            });
        }

        const user = result[0];

        const passwordMatches = await comparePassword(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid Username or Password"
            });
        }

        // ----------------------------------
        // Check if account is blocked
        // ----------------------------------

        if (Number(user.login_allowed) !== 1) {

            console.log(
                "Blocked account attempted login:",
                username
            );

            return res.status(403).json({
                success: false,
                message:
                    "This account has been blocked. Please contact the HOD.",
            });
        }

        // ----------------------------------
        // Record successful login
        // ----------------------------------

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                message: "Authentication is not configured."
            });
        }

        const token = jwt.sign({}, jwtSecret, {
            algorithm: "HS256",
            subject: String(user.id),
            expiresIn: "8h"
        });

        const safeUser = {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };

        const insertSql = `
            INSERT INTO login_activity
            (username, ip_address, device, browser, status)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [
                username,
                ip,
                device,
                browser,
                "Successful",
            ],
            (insertErr) => {

                if (insertErr) {

                    console.error(
                        "Login activity error:",
                        insertErr
                    );

                    return res.status(500).json({
                        success: false,
                        message: insertErr.message,
                    });
                }

                return res.json({
                    success: true,
                    message: "Login Successful",
                    token,
                    user: safeUser,
                });
            }
        );
    });
};

// ==========================================
// Get All Login Activities
// ==========================================

const getLoginActivities = (req, res) => {

    db.query(
        `
        SELECT *
        FROM login_activity
        ORDER BY login_time DESC
        `,
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message,
                });
            }

            res.json({
                success: true,
                activities: rows,
            });
        }
    );
};


// ==========================================
// Get Latest Login
// ==========================================

const getLastLogin = (req, res) => {

    db.query(
        `
        SELECT username, login_time
        FROM login_activity
        WHERE status = 'Successful'
        ORDER BY login_time DESC
        LIMIT 1
        `,
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message,
                });
            }

            res.json({
                success: true,
                lastLogin: rows.length ? rows[0] : null,
            });
        }
    );
};


// ==========================================
// Get Total Login Count
// ==========================================

const getLoginCount = (req, res) => {

    db.query(
        `
        SELECT COUNT(*) AS total
        FROM login_activity
        WHERE status = 'Successful'
        `,
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message,
                });
            }

            res.json({
                success: true,
                total: rows[0].total,
            });
        }
    );
};


// ==========================================
// Change Administrator Password
// ==========================================

const changePassword = (req, res) => {

    const { current_password, new_password } = req.body;
    const admin_id = req.admin.id;

    // ------------------------------------------
    // Check required fields
    // ------------------------------------------

    if (
        !current_password ||
        !new_password
    ) {

        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });
    }

    // ------------------------------------------
    // Check current password
    // ------------------------------------------

    const checkSql = "SELECT password FROM administrators WHERE id = ? LIMIT 1";

    db.query(
        checkSql,
        [admin_id],
        async (err, result) => {

            if (err) {

                console.error(
                    "Check password error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            // ----------------------------------
            // Current password is incorrect
            // ----------------------------------

            if (result.length === 0 || !(await comparePassword(current_password, result[0].password))) {

                return res.status(401).json({
                    success: false,
                    message: "Current password is incorrect."
                });
            }

            // ----------------------------------
            // Update password
            // ----------------------------------

            const updateSql = `
                UPDATE administrators
                SET password = ?
                WHERE id = ?
            `;

            const hashedPassword = await bcrypt.hash(new_password, 12);
            db.query(
                updateSql,
                [hashedPassword, admin_id],
                (updateErr) => {

                    if (updateErr) {

                        console.error(
                            "Update password error:",
                            updateErr
                        );

                        return res.status(500).json({
                            success: false,
                            message: updateErr.message
                        });
                    }

                    return res.json({
                        success: true,
                        message: "Password changed successfully."
                    });
                }
            );
        }
    );
};


// ==========================================
// Create Administrator Account
// ==========================================

const createAccount = async (req, res) => {

    const {
        full_name,
        email,
        role,
        username,
        password,
        security_question,
        security_answer
    } = req.body;

    // ------------------------------------------
    // Check required fields
    // ------------------------------------------

    if (
        !full_name ||
        !email ||
        !role ||
        !username ||
        !password ||
        !security_question ||
        !security_answer
    ) {

        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });
    }

    // ------------------------------------------
    // Check username
    // 4 - 9 letters only
    // ------------------------------------------

    const usernamePattern = /^[A-Za-z]{4,9}$/;

    if (!usernamePattern.test(username)) {

        return res.status(400).json({
            success: false,
            message:
                "Username must contain 4 to 9 letters only."
        });
    }

    // ------------------------------------------
    // Check role
    // ------------------------------------------

    const allowedRoles = [
        "HOD",
        "Lecturer",
        "Student"
    ];

    if (!allowedRoles.includes(role)) {

        return res.status(400).json({
            success: false,
            message: "Invalid role selected."
        });
    }

    // ------------------------------------------
    // Check password length
    // ------------------------------------------

    if (password.length < 6) {

        return res.status(400).json({
            success: false,
            message:
                "Password must be at least 6 characters."
        });
    }

    // ------------------------------------------
    // Check email
    // ------------------------------------------

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // ------------------------------------------
    // Check if username or email exists
    // ------------------------------------------

    const checkSql = `
        SELECT id
        FROM administrators
        WHERE username = ?
        OR email = ?
    `;

    db.query(
        checkSql,
        [username.trim(), email.trim()],
        (err, result) => {

            if (err) {

                console.error(
                    "Check account error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            // ----------------------------------
            // Existing account
            // ----------------------------------

            if (result.length > 0) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Username or email already exists."
                });
            }

            // ----------------------------------
            // Create account
            // ----------------------------------

            const insertSql = `
                INSERT INTO administrators
                (
                    full_name,
                    email,
                    role,
                    username,
                    password,
                    security_question,
                    security_answer
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    full_name.trim(),
                    email.trim(),
                    role,
                    username.trim(),
                    hashedPassword,
                    security_question.trim(),
                    security_answer.trim()
                ],
                (insertErr, result) => {

                    if (insertErr) {

                        console.error(
                            "Create account error:",
                            insertErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                insertErr.message
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message:
                            "Administrator account created successfully.",
                        admin_id: result.insertId
                    });
                }
            );
        }
    );
};


// ==========================================
// Verify Account for Forgot Password
// ==========================================

const verifyForgotPassword = (req, res) => {

    const { identifier } = req.body;

    // ------------------------------------------
    // Check required field
    // ------------------------------------------

    if (!identifier || !identifier.trim()) {

        return res.status(400).json({
            success: false,
            message:
                "Please enter your username or email."
        });
    }

    // ------------------------------------------
    // Find administrator
    // ------------------------------------------

    const sql = `
        SELECT
            id,
            username,
            email,
            security_question
        FROM administrators
        WHERE username = ?
        OR email = ?
        LIMIT 1
    `;

    const value = identifier.trim();

    db.query(
        sql,
        [value, value],
        (err, result) => {

            if (err) {

                console.error(
                    "Forgot password account verification error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            // ----------------------------------
            // Account not found
            // ----------------------------------

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "No administrator account was found with that username or email."
                });
            }

            // ----------------------------------
            // Account found
            // ----------------------------------

            return res.json({
                success: true,
                message: "Account verified.",
                admin_id: result[0].id,
                username: result[0].username,
                security_question:
                    result[0].security_question
            });
        }
    );
};


// ==========================================
// Verify Security Answer
// ==========================================

const verifySecurityAnswer = (req, res) => {

    const {
        admin_id,
        security_answer
    } = req.body;

    // ------------------------------------------
    // Check required fields
    // ------------------------------------------

    if (
        !admin_id ||
        !security_answer ||
        !security_answer.trim()
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Please enter your security answer."
        });
    }

    // ------------------------------------------
    // Find administrator
    // ------------------------------------------

    const sql = `
        SELECT
            id,
            username,
            security_answer
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [admin_id],
        (err, result) => {

            if (err) {

                console.error(
                    "Security answer verification error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            // ----------------------------------
            // Account not found
            // ----------------------------------

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            // ----------------------------------
            // Compare security answer
            // ----------------------------------

            const savedAnswer =
                result[0].security_answer.trim();

            const enteredAnswer =
                security_answer.trim();

            if (
                savedAnswer.toLowerCase() !==
                enteredAnswer.toLowerCase()
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Security answer is incorrect."
                });
            }

            // ----------------------------------
            // Security answer correct
            // ----------------------------------

            return res.json({
                success: true,
                message:
                    "Security answer verified successfully.",
                admin_id: result[0].id,
                username: result[0].username
            });
        }
    );
};


// ==========================================
// Reset Password After Security Verification
// ==========================================

const resetForgottenPassword = async (req, res) => {

    const {
        admin_id,
        new_password
    } = req.body;

    // ==========================================
    // CHECK REQUIRED FIELDS
    // ==========================================

    if (
        !admin_id ||
        !new_password
    ) {

        return res.status(400).json({
            success: false,
            message: "Please enter a new password."
        });
    }

    // ==========================================
    // CHECK PASSWORD LENGTH
    // ==========================================

    if (new_password.length < 6) {

        return res.status(400).json({
            success: false,
            message:
                "Password must be at least 6 characters."
        });
    }

    // ==========================================
    // UPDATE PASSWORD
    // ==========================================

    const sql = `
        UPDATE administrators
        SET password = ?
        WHERE id = ?
    `;

    const hashedPassword = await bcrypt.hash(new_password, 12);

    db.query(
        sql,
        [hashedPassword, admin_id],
        (err, result) => {

            if (err) {

                console.error(
                    "Forgot password reset error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            // ==================================
            // ACCOUNT NOT FOUND
            // ==================================

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            // ==================================
            // PASSWORD UPDATED
            // ==================================

            return res.json({
                success: true,
                message:
                    "Password reset successfully."
            });
        }
    );
};


// ==========================================
// GET ADMINISTRATOR PROFILE
// ==========================================

const getProfile = (req, res) => {

    const admin_id = req.admin.id;

    if (!admin_id) {

        return res.status(400).json({
            success: false,
            message: "Administrator ID is required."
        });
    }

    const sql = `
        SELECT
            id,
            full_name,
            email,
            role,
            username
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [admin_id],
        (err, result) => {

            if (err) {

                console.error(
                    "Get profile error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            return res.json({
                success: true,
                user: result[0]
            });
        }
    );
};


// ==========================================
// CHECK USER ROLE
// ==========================================

const checkRole = (req, res, next) => {

    const admin_id = req.admin.id;

    if (!admin_id) {

        return res.status(400).json({
            success: false,
            message: "Administrator ID is required."
        });
    }

    const sql = `
        SELECT
            id,
            username,
            role
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [admin_id],
        (err, result) => {

            if (err) {

                console.error(
                    "Role check error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            req.user = result[0];

            next();
        }
    );
};


// ==========================================
// UPDATE ADMINISTRATOR PROFILE
// ==========================================

const updateProfile = (req, res) => {

    const {
        username,
        full_name,
        email,
        current_password
    } = req.body;
    const admin_id = req.admin.id;

    // ------------------------------------------
    // CHECK REQUIRED FIELDS
    // ------------------------------------------

    if (
        !username ||
        !full_name ||
        !email ||
        !current_password
    ) {

        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });
    }

    // ------------------------------------------
    // CHECK CURRENT PASSWORD
    // ------------------------------------------

    const checkPasswordSql = `
        SELECT id, password
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        checkPasswordSql,
        [admin_id],
        async (err, result) => {

            if (err) {

                console.error(
                    "Profile password check error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            // ----------------------------------
            // WRONG PASSWORD
            // ----------------------------------

            if (result.length === 0 || !(await comparePassword(current_password, result[0].password))) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Current password is incorrect."
                });
            }

            // ----------------------------------
            // CHECK USERNAME OR EMAIL
            // ----------------------------------

            const checkExistingSql = `
                SELECT id
                FROM administrators
                WHERE
                    (username = ? OR email = ?)
                    AND id != ?
                LIMIT 1
            `;

            db.query(
                checkExistingSql,
                [
                    username.trim(),
                    email.trim(),
                    admin_id
                ],
                (checkErr, existingResult) => {

                    if (checkErr) {

                        console.error(
                            "Profile duplicate check error:",
                            checkErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                checkErr.message
                        });
                    }

                    // ----------------------------------
                    // USERNAME OR EMAIL ALREADY EXISTS
                    // ----------------------------------

                    if (existingResult.length > 0) {

                        return res.status(409).json({
                            success: false,
                            message:
                                "Username or email already exists."
                        });
                    }

                    // ----------------------------------
                    // UPDATE PROFILE
                    // ----------------------------------

                    const updateSql = `
                        UPDATE administrators
                        SET
                            username = ?,
                            full_name = ?,
                            email = ?
                        WHERE id = ?
                    `;

                    db.query(
                        updateSql,
                        [
                            username.trim(),
                            full_name.trim(),
                            email.trim(),
                            admin_id
                        ],
                        (updateErr) => {

                            if (updateErr) {

                                console.error(
                                    "Update profile error:",
                                    updateErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        updateErr.message
                                });
                            }

                            // ----------------------------------
                            // SUCCESS
                            // ----------------------------------

                            return res.json({
                                success: true,
                                message:
                                    "Profile updated successfully."
                            });
                        }
                    );
                }
            );
        }
    );
};

// ==========================================
// GET ALL ACCOUNTS
// HOD ONLY
// ==========================================

const getAccounts = (req, res) => {

    const admin_id = req.admin.id;

    console.log("===== GET ACCOUNTS REQUEST =====");
    console.log("admin_id:", admin_id);

    // ------------------------------------------
    // CHECK ADMIN ID
    // ------------------------------------------

    if (!admin_id) {

        return res.status(401).json({
            success: false,
            message: "Administrator ID is required."
        });
    }

    // ------------------------------------------
    // VERIFY CURRENT USER
    // ------------------------------------------

    const userSql = `
        SELECT
            id,
            username,
            role
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        userSql,
        [admin_id],
        (userErr, userResult) => {

            if (userErr) {

                console.error(
                    "Account authorization error:",
                    userErr
                );

                return res.status(500).json({
                    success: false,
                    message: userErr.message
                });
            }

            // ----------------------------------
            // USER NOT FOUND
            // ----------------------------------

            if (userResult.length === 0) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            // ----------------------------------
            // HOD ONLY
            // ----------------------------------

            const userRole = String(
                userResult[0].role || ""
            )
                .trim()
                .toUpperCase();

            console.log("Account access role:", userRole);

            if (userRole !== "HOD") {

                return res.status(403).json({
                    success: false,
                    message:
                        "Only the HOD can access the Accounts section."
                });
            }

            // ----------------------------------
            // GET ALL ACCOUNTS
            // ----------------------------------
            //
            // DO NOT RETURN:
            // password
            // security_question
            // security_answer
            //
            // We also don't use created_at because
            // that column has not been confirmed.
            // ----------------------------------

            const accountsSql = `
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    username
                FROM administrators
                ORDER BY id DESC
            `;

            db.query(
                accountsSql,
                (accountsErr, accounts) => {

                    if (accountsErr) {

                        console.error(
                            "Get accounts error:",
                            accountsErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                accountsErr.message
                        });
                    }

                    console.log(
                        "Accounts found:",
                        accounts.length
                    );

                    return res.json({
                        success: true,
                        accounts: accounts
                    });
                }
            );
        }
    );
};


// ==========================================
// EXPORT ALL CONTROLLERS
// ==========================================

// ----------------------------------
// Get Account Details
// ----------------------------------

const getAccountDetails = (req, res) => {

    const accountId = req.params.id;
    const admin_id = req.admin.id;

    console.log("===== GET ACCOUNT DETAILS REQUEST =====");
    console.log("Requested account ID:", accountId);
    console.log("Requesting admin ID:", admin_id);

    // ----------------------------------
    // CHECK ADMIN ID
    // ----------------------------------

    if (!admin_id) {
        return res.status(401).json({
            success: false,
            message: "Administrator ID is required."
        });
    }

    // ----------------------------------
    // CHECK ACCOUNT ID
    // ----------------------------------

    if (!accountId) {
        return res.status(400).json({
            success: false,
            message: "Account ID is required."
        });
    }

    // ----------------------------------
    // VERIFY CURRENT USER
    // ----------------------------------

    const userSql = `
        SELECT
            id,
            username,
            role
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        userSql,
        [admin_id],
        (userErr, userResult) => {

            if (userErr) {
                console.error(
                    "Account details authorization error:",
                    userErr
                );

                return res.status(500).json({
                    success: false,
                    message: userErr.message
                });
            }

            // ----------------------------------
            // USER NOT FOUND
            // ----------------------------------

            if (userResult.length === 0) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            // ----------------------------------
            // HOD ONLY
            // ----------------------------------

            const userRole = String(
                userResult[0].role || ""
            )
                .trim()
                .toUpperCase();

            if (userRole !== "HOD") {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only the HOD can view account details."
                });
            }

            // ----------------------------------
            // GET ACCOUNT
            // ----------------------------------

            const accountSql = `
                SELECT
                    id,
                    full_name,
                    email,
                    role,
                    username,
                    created_at,
                    login_allowed
                FROM administrators
                WHERE id = ?
                LIMIT 1
            `;

            db.query(
                accountSql,
                [accountId],
                (accountErr, accountResult) => {

                    if (accountErr) {
                        console.error(
                            "Get account details error:",
                            accountErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                accountErr.message
                        });
                    }

                    // ----------------------------------
                    // ACCOUNT NOT FOUND
                    // ----------------------------------

                    if (accountResult.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message:
                                "Account not found."
                        });
                    }

                    const account = accountResult[0];

                    // ----------------------------------
                    // GET LAST SUCCESSFUL LOGIN
                    // ----------------------------------

                    const loginSql = `
                        SELECT
                            ip_address,
                            login_time
                        FROM login_activity
                        WHERE username = ?
                        AND status = 'Successful'
                        ORDER BY login_time DESC
                        LIMIT 1
                    `;

                    db.query(
                        loginSql,
                        [account.username],
                        (loginErr, loginResult) => {

                            if (loginErr) {
                                console.error(
                                    "Get last login error:",
                                    loginErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        loginErr.message
                                });
                            }

                            let lastLogin = null;
                            let lastLoginIp = null;

                            if (loginResult.length > 0) {
                                lastLogin =
                                    loginResult[0].login_time;

                                lastLoginIp =
                                    loginResult[0].ip_address;
                            }

                            // ----------------------------------
                            // RETURN ACCOUNT DETAILS
                            // ----------------------------------

                            return res.json({
                                success: true,
                                account: {
                                    id: account.id,
                                    username: account.username,
                                    full_name: account.full_name,
                                    email: account.email,
                                    role: account.role,
                                    created_at: account.created_at,
                                    last_login: lastLogin,
                                    last_login_ip: lastLoginIp,
                                    login_allowed:
                                        Number(
                                            account.login_allowed
                                        ) === 1
                                }
                            });
                        }
                    );
                }
            );
        }
    );
};

// ----------------------------------
// Update Account Login Status
// ----------------------------------

const updateAccountStatus = (req, res) => {

    const accountId = req.params.id;
    const admin_id = req.admin.id;
    const { login_allowed } = req.body;

    console.log("===== UPDATE ACCOUNT STATUS REQUEST =====");
    console.log("Account ID:", accountId);
    console.log("Requesting admin ID:", admin_id);
    console.log("New login status:", login_allowed);

    // ----------------------------------
    // CHECK ADMIN ID
    // ----------------------------------

    if (!admin_id) {
        return res.status(401).json({
            success: false,
            message: "Administrator ID is required."
        });
    }

    // ----------------------------------
    // CHECK ACCOUNT ID
    // ----------------------------------

    if (!accountId) {
        return res.status(400).json({
            success: false,
            message: "Account ID is required."
        });
    }

    // ----------------------------------
    // CHECK LOGIN STATUS
    // ----------------------------------

    if (
        login_allowed !== 0 &&
        login_allowed !== 1 &&
        login_allowed !== true &&
        login_allowed !== false
    ) {
        return res.status(400).json({
            success: false,
            message:
                "login_allowed must be 0, 1, true, or false."
        });
    }

    const newStatus =
        login_allowed === true ||
        login_allowed === 1
            ? 1
            : 0;

    // ----------------------------------
    // VERIFY CURRENT USER
    // ----------------------------------

    const userSql = `
        SELECT
            id,
            username,
            role
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        userSql,
        [admin_id],
        (userErr, userResult) => {

            if (userErr) {

                console.error(
                    "Account status authorization error:",
                    userErr
                );

                return res.status(500).json({
                    success: false,
                    message: userErr.message
                });
            }

            // ----------------------------------
            // USER NOT FOUND
            // ----------------------------------

            if (userResult.length === 0) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            // ----------------------------------
            // HOD ONLY
            // ----------------------------------

            const userRole = String(
                userResult[0].role || ""
            )
                .trim()
                .toUpperCase();

            if (userRole !== "HOD") {

                return res.status(403).json({
                    success: false,
                    message:
                        "Only the HOD can change account login status."
                });
            }

            // ----------------------------------
            // PREVENT HOD FROM BLOCKING SELF
            // ----------------------------------

            if (String(accountId) === String(admin_id)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "You cannot block your own HOD account."
                });
            }

            // ----------------------------------
            // CHECK TARGET ACCOUNT
            // ----------------------------------

            const accountSql = `
                SELECT
                    id,
                    username,
                    role
                FROM administrators
                WHERE id = ?
                LIMIT 1
            `;

            db.query(
                accountSql,
                [accountId],
                (accountErr, accountResult) => {

                    if (accountErr) {

                        console.error(
                            "Target account lookup error:",
                            accountErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                accountErr.message
                        });
                    }

                    if (accountResult.length === 0) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Account not found."
                        });
                    }

                    // ----------------------------------
                    // UPDATE LOGIN STATUS
                    // ----------------------------------

                    const updateSql = `
                        UPDATE administrators
                        SET login_allowed = ?
                        WHERE id = ?
                    `;

                    db.query(
                        updateSql,
                        [newStatus, accountId],
                        (updateErr) => {

                            if (updateErr) {

                                console.error(
                                    "Update account status error:",
                                    updateErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        updateErr.message
                                });
                            }

                            return res.json({
                                success: true,
                                message:
                                    newStatus === 1
                                        ? "Account login has been allowed."
                                        : "Account login has been blocked.",
                                login_allowed:
                                    newStatus === 1
                            });
                        }
                    );
                }
            );
        }
    );
};

// ----------------------------------
// Delete Account
// ----------------------------------

const deleteAccount = (req, res) => {

    const accountId = req.params.id;
    const admin_id = req.admin.id;

    console.log("===== DELETE ACCOUNT REQUEST =====");
    console.log("Account ID:", accountId);
    console.log("Requesting admin ID:", admin_id);

    // ----------------------------------
    // CHECK ADMIN ID
    // ----------------------------------

    if (!admin_id) {
        return res.status(401).json({
            success: false,
            message: "Administrator ID is required."
        });
    }

    // ----------------------------------
    // CHECK ACCOUNT ID
    // ----------------------------------

    if (!accountId) {
        return res.status(400).json({
            success: false,
            message: "Account ID is required."
        });
    }

    // ----------------------------------
    // VERIFY CURRENT USER
    // ----------------------------------

    const userSql = `
        SELECT
            id,
            username,
            role
        FROM administrators
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        userSql,
        [admin_id],
        (userErr, userResult) => {

            if (userErr) {

                console.error(
                    "Delete authorization error:",
                    userErr
                );

                return res.status(500).json({
                    success: false,
                    message: userErr.message
                });
            }

            // ----------------------------------
            // USER NOT FOUND
            // ----------------------------------

            if (userResult.length === 0) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Administrator account not found."
                });
            }

            // ----------------------------------
            // HOD ONLY
            // ----------------------------------

            const userRole = String(
                userResult[0].role || ""
            )
                .trim()
                .toUpperCase();

            if (userRole !== "HOD") {

                return res.status(403).json({
                    success: false,
                    message:
                        "Only the HOD can delete accounts."
                });
            }

            // ----------------------------------
            // PREVENT HOD FROM DELETING SELF
            // ----------------------------------

            if (String(accountId) === String(admin_id)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "You cannot delete your own HOD account."
                });
            }

            // ----------------------------------
            // CHECK TARGET ACCOUNT
            // ----------------------------------

            const accountSql = `
                SELECT
                    id,
                    username,
                    role
                FROM administrators
                WHERE id = ?
                LIMIT 1
            `;

            db.query(
                accountSql,
                [accountId],
                (accountErr, accountResult) => {

                    if (accountErr) {

                        console.error(
                            "Target account lookup error:",
                            accountErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                accountErr.message
                        });
                    }

                    // ----------------------------------
                    // ACCOUNT NOT FOUND
                    // ----------------------------------

                    if (accountResult.length === 0) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Account not found."
                        });
                    }

                    // ----------------------------------
                    // DELETE ACCOUNT
                    // ----------------------------------

                    const deleteSql = `
                        DELETE FROM administrators
                        WHERE id = ?
                    `;

                    db.query(
                        deleteSql,
                        [accountId],
                        (deleteErr, deleteResult) => {

                            if (deleteErr) {

                                console.error(
                                    "Delete account error:",
                                    deleteErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        deleteErr.message
                                });
                            }

                            if (
                                deleteResult.affectedRows === 0
                            ) {

                                return res.status(404).json({
                                    success: false,
                                    message:
                                        "Account not found."
                                });
                            }

                            return res.json({
                                success: true,
                                message:
                                    "Account deleted successfully."
                            });
                        }
                    );
                }
            );
        }
    );
};
module.exports = {

    login,

    getLoginActivities,

    getLastLogin,

    getLoginCount,

    changePassword,

    createAccount,

    verifyForgotPassword,

    verifySecurityAnswer,

    resetForgottenPassword,

    getProfile,

    checkRole,

    updateProfile,

    getAccounts,

    getAccountDetails, 

    updateAccountStatus,

    deleteAccount
};
