import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CameraView from "./pages/CameraView";
import Notifications from "./pages/Notifications";
import LoginActivity from "./pages/LoginActivity";
import Settings from "./pages/Settings";
import Playback from "./pages/Playback";
import HumanDetections from "./pages/HumanDetections";
import EditProfile from "./pages/EditProfile";
import ForgotPassword from "./pages/ForgotPassword";
import CreateAccount from "./pages/CreateAccount";
import ChangePassword from "./pages/ChangePassword";
import DetectionSchedule from "./pages/DetectionSchedule";
import Accounts from "./pages/Accounts";
import AccountDetails from "./pages/AccountDetails";
import { hasActiveSession } from "./utils/auth";

function AuthGuard() {
    return hasActiveSession() ? <Outlet /> : <Navigate to="/" replace />;
}

function App() {

    return (

        <ThemeProvider>

            <BrowserRouter>

                <Routes>

                    {/* ==============================
                        LOGIN
                    ============================== */}

                    <Route
                        path="/"
                        element={<Login />}
                    />

                    <Route element={<AuthGuard />}>


                    {/* ==============================
                        DASHBOARD
                    ============================== */}

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />


                    {/* ==============================
                        CAMERA
                    ============================== */}

                    <Route
                        path="/camera/:id"
                        element={<CameraView />}
                    />


                    {/* ==============================
                        DETECTION SCHEDULE
                    ============================== */}

                    <Route
                        path="/detection-schedule"
                        element={<DetectionSchedule />}
                    />


                    {/* ==============================
                        NOTIFICATIONS
                    ============================== */}

                    <Route
                        path="/notifications"
                        element={<Notifications />}
                    />


                    {/* ==============================
                        LOGIN ACTIVITY
                    ============================== */}

                    <Route
                        path="/login-activity"
                        element={<LoginActivity />}
                    />


                    {/* ==============================
                        SETTINGS
                    ============================== */}

                    <Route
                        path="/settings"
                        element={<Settings />}
                    />


                    {/* ==============================
                        EDIT PROFILE
                    ============================== */}

                    <Route
                        path="/edit-profile"
                        element={<EditProfile />}
                    />


                    {/* ==============================
                        FORGOT PASSWORD
                    ============================== */}

                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />


                    {/* ==============================
                        CREATE ACCOUNT
                    ============================== */}

                    <Route
                        path="/create-account"
                        element={<CreateAccount />}
                    />


                    {/* ==============================
                        CHANGE PASSWORD
                    ============================== */}

                    <Route
                        path="/change-password"
                        element={<ChangePassword />}
                    />


                    {/* ==============================
                        PLAYBACK
                    ============================== */}

                    <Route
                        path="/playback"
                        element={<Playback />}
                    />


                    {/* ==============================
                        ACCOUNTS
                    ============================== */}

                    <Route
                        path="/accounts"
                        element={<Accounts />}
                    />


                    {/* ==============================
                        ACCOUNT DETAILS
                    ============================== */}

                    <Route
                        path="/account-details/:id"
                        element={<AccountDetails />}
                    />


                    {/* ==============================
                        HUMAN DETECTIONS
                    ============================== */}

                    <Route
                        path="/human-detections"
                        element={<HumanDetections />}
                    />

                    </Route>

                </Routes>

            </BrowserRouter>

        </ThemeProvider>

    );

}

export default App;
