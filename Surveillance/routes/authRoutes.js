const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const { rateLimit } = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again in 15 minutes."
    }
});
// ==========================================
// LOGIN
// ==========================================

router.post(
    "/login",
    authController.login
);

router.post(
    "/login",
    loginLimiter,
    authController.login
);// ==========================================
// ADMINISTRATOR PROFILE
// ==========================================

router.get(
    "/profile",
    authController.getProfile
);

// ==========================================
// CREATE ADMINISTRATOR ACCOUNT
// ==========================================

router.post(
    "/create-account",
    authController.createAccount
);

// ==========================================
// LOGIN ACTIVITY
// ==========================================

router.get(
    "/login-activities",
    authController.getLoginActivities
);

// ==========================================
// LATEST LOGIN
// ==========================================

router.get(
    "/last-login",
    authController.getLastLogin
);

// ==========================================
// TOTAL LOGIN COUNT
// ==========================================

router.get(
    "/login-count",
    authController.getLoginCount
);

// ==========================================
// CHANGE PASSWORD
// ==========================================

router.put(
    "/change-password",
    authController.changePassword
);

// ==========================================
// UPDATE ADMINISTRATOR PROFILE
// ==========================================

router.put(
    "/update-profile",
    authController.updateProfile
);

// ==========================================
// FORGOT PASSWORD
// STEP 1
// ==========================================

router.post(
    "/verify-forgot-password",
    authController.verifyForgotPassword
);

// ==========================================
// FORGOT PASSWORD
// STEP 2
// ==========================================

router.post(
    "/verify-security-answer",
    authController.verifySecurityAnswer
);

// ==========================================
// FORGOT PASSWORD
// STEP 3
// ==========================================

router.put(
    "/reset-forgotten-password",
    authController.resetForgottenPassword
);

// ==========================================
// GET ALL ACCOUNTS
// HOD ONLY
// ==========================================

router.get(
    "/accounts",
    authController.getAccounts
);

router.get(
    "/accounts/:id",
    authController.getAccountDetails
);

router.put(
    "/accounts/:id/status",
    authController.updateAccountStatus
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
