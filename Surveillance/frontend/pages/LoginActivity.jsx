import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/LoginActivity.css";

function LoginActivity() {
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoginActivities = async () => {
    try {
      const response = await fetch(
        "/api/auth/login-activities"
      );

      const data = await response.json();

      if (data.success) {
        setLogins(data.activities);
      }
    } catch (error) {
      console.error("Error fetching login activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginActivities();

    const interval = setInterval(() => {
      fetchLoginActivities();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="login-page">

      <div className="top-bar">

        <Link to="/dashboard" className="back-btn">
          ← Back
        </Link>

        <h1>Login Activity</h1>

      </div>

      <div className="table-container">

        <table>

          <thead>

            <tr>

              <th>Username</th>
              <th>IP Address</th>
              <th>Device</th>
              <th>Browser</th>
              <th>Status</th>
              <th>Login Time</th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Loading...
                </td>
              </tr>

            ) : logins.length > 0 ? (

              logins.map((login) => (

                <tr key={login.id}>

                  <td>{login.username}</td>

                  <td>{login.ip_address}</td>

                  {/* Short Device */}
                  <td title={login.device}>
                    {login.device
                      ? login.device.length > 25
                        ? login.device.substring(0, 25) + "..."
                        : login.device
                      : "Unknown"}
                  </td>

                  {/* Short Browser */}
                  <td title={login.browser}>
                    {login.browser
                      ? login.browser.length > 20
                        ? login.browser.substring(0, 20) + "..."
                        : login.browser
                      : "Unknown"}
                  </td>

                  <td>
                    <span
                      className={
                        login.status === "Successful"
                          ? "success"
                          : "failed"
                      }
                    >
                      {login.status}
                    </span>
                  </td>

                  <td>
                    {login.login_time
                      ? new Date(login.login_time).toLocaleString()
                      : "N/A"}
                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td colSpan="6" style={{ textAlign: "center" }}>
                  No Login Activity Found
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default LoginActivity;