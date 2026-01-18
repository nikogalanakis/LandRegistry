const API_URL = "/api";

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");
    const headers = options.headers || {};

    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    // If body is FormData (image upload), don't set Content-Type header manually
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const config = {
        ...options,
        headers: headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem("access_token");
            alert("Your session has expired or you are not authorized. Please log in again.");
            window.location.href = "/login";
            return;
        }

        if (response.status === 403) {
            const data = await response.json();
            alert(data.detail || "You do not have permission to perform this action.");
            return;
    }
        return response;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}