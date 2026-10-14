export const AUTH_TOKEN_KEY = "authToken";

export function hasActiveSession() {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return false;

    try {
        const encodedPayload = token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const paddedPayload = encodedPayload.padEnd(
            Math.ceil(encodedPayload.length / 4) * 4,
            "="
        );
        const payload = JSON.parse(atob(paddedPayload));
        if (!payload.exp || payload.exp * 1000 <= Date.now()) {
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
            return false;
        }
        return true;
    } catch (_error) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        return false;
    }
}

export function clearSession() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("role");
    localStorage.removeItem("isLoggedIn");
}

export async function fetchProtectedFile(url, options = {}) {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        clearSession();
        window.location.assign("/");
        throw new Error("Your session has expired. Please sign in again.");
    }
    if (!response.ok) throw new Error(`Unable to load protected file (${response.status}).`);
    return URL.createObjectURL(await response.blob());
}
