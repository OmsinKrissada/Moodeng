import { BACKEND_URL } from "../scripts/config.js";


/**
 * Helper function to send HTTP requests.
 * @param {string} endpoint - The API endpoint (e.g., "/users/login").
 * @param {string} method - HTTP method (GET, POST, etc.).
 * @param {Object} [body] - Request body for POST/PUT methods.
 * @returns {Promise<Object>} - The API response as a JSON object.
 */
async function sendRequest(endpoint, method, body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error occurred");
        }

        return await response.json();
    } catch (err) {
        console.error(`Error with ${method} ${endpoint}:`, err);
        throw err; // Propagate the error to handle it in the calling function
    }
}

export async function registerUser(username, password) {
    return await sendRequest("/users/register", "POST", { username, password });
}

export async function loginUser(username, password) {
    return await sendRequest("/users/login", "POST", { username, password });
}

export async function fetchUser(username) {
    return await sendRequest(`/users/${username}`, "GET");
}


/**
 * Fetch the leaderboard from the backend.
 * @returns {Promise<Object[]>} - Array of leaderboard entries sorted by score.
 */
export async function fetchLeaderboard() {
    return await sendRequest("/scores/leaderboard", "GET");
}

export async function submitScore(username, highscore) {
    return await sendRequest("/scores/submit", "POST", { username, highscore });
}