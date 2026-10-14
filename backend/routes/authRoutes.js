const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const {
    requireAuth,
    requireHOD
} = require("../middleware/authMiddleware");

// ==========================================
// LOGIN
// ==========================================

router.post(
    "/login",
    authController.login
);

// ==========================================
// ADMINISTRATOR PROFILE
// ==========================================

router.get(
    "/profile",
    requireAuth,
    authController.getProfile
);

// ==========================================
// CREATE ADMINISTRATOR ACCOUNT
// ==========================================

router.post(
    "/create-account",
    requireAuth,
    requireHOD,
    authController.createAccount
);

// ==========================================
// LOGIN ACTIVITY
// ==========================================

router.get(
    "/login-activities",
    requireAuth,
    requireHOD,
    authController.getLoginActivities
);

// ==========================================
// LATEST LOGIN
// ==========================================

router.get(
    "/last-login",
    requireAuth,
    authController.getLastLogin
);

// ==========================================
// TOTAL LOGIN COUNT
// ==========================================

router.get(
    "/login-count",
    requireAuth,
    authController.getLoginCount
);

// ==========================================
// CHANGE PASSWORD
// ==========================================

router.put(
    "/change-password",
    requireAuth,
    authController.changePassword
);

// ==========================================
// UPDATE ADMINISTRATOR PROFILE
// ==========================================

router.put(
    "/update-profile",
    requireAuth,
    authController.updateProfile
);

// ==========================================
// GET ALL ACCOUNTS
// HOD ONLY
// ==========================================

router.get(
    "/accounts",
    requireAuth,
    requireHOD,
    authController.getAccounts
);

router.get(
    "/accounts/:id",
    requireAuth,
    requireHOD,
    authController.getAccountDetails
);

router.put(
    "/accounts/:id/status",
    requireAuth,
    requireHOD,
    authController.updateAccountStatus
);

router.delete(
    "/accounts/:id",
    requireAuth,
    requireHOD,
    authController.deleteAccount
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
