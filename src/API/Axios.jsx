import axios from "axios";

const api = axios.create({
  baseURL: "https://api.labmanagement.online",
  timeout: 15000,
});

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    return null;
  }
};

const setStoredUser = (user) => {
  try {
    if (!user) {
      localStorage.removeItem("user");
      console.log("[Auth] User cleared from localStorage");
    } else {
      localStorage.setItem("user", JSON.stringify(user));
      console.log("[Auth] User updated in localStorage:", user);
    }
  } catch (e) {
    console.error("Error saving user to localStorage", e);
  }
};

api.interceptors.request.use(
  (config) => {
    try {
      const userData = getStoredUser();
      const token = userData?.accessToken;
      if (token) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
        console.log("[Auth] Request with token:", token);
      }
    } catch (error) {
      console.error("Lỗi khi lấy token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshPromise = null;
let subscribers = [];

function subscribeTokenRefresh(cb) {
  subscribers.push(cb);
}
function onRefreshed(token) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

async function callRefreshEndpoint() {
  const stored = getStoredUser() || {};
  const storedRefreshToken = stored.refreshToken;

  const refreshUrl = "/auth/refresh-token";

  try {
    let res;
    if (storedRefreshToken) {
      res = await axios.post(api.defaults.baseURL + refreshUrl, {
        refreshToken: storedRefreshToken,
      });
    } else {
      res = await axios.post(
        api.defaults.baseURL + refreshUrl,
        {},
        { withCredentials: true }
      );
    }

    const newAccessToken = res?.data?.accessToken || res?.data?.token || null;
    const newRefreshToken =
      res?.data?.refreshToken || res?.data?.refresh_token || null;

    if (!newAccessToken) {
      throw new Error("Refresh endpoint did not return accessToken");
    }

    const updatedUser = { ...(stored || {}), accessToken: newAccessToken };
    if (newRefreshToken) updatedUser.refreshToken = newRefreshToken;

    setStoredUser(updatedUser); // log sẽ hiển thị ở đây
    console.log("[Auth] Token refreshed:", newAccessToken);

    return newAccessToken;
  } catch (err) {
    console.error("[Auth] Refresh failed:", err);
    // throw err;
  }
}

// response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) return Promise.reject(error);

    const status = error.response.status;
    console.log("[Auth] Response error status:", status);

    if (
      (status === 401 || status === 403) &&
      !originalRequest.__isRetryRequest
    ) {
      originalRequest.__isRetryRequest = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const token = await callRefreshEndpoint();
            onRefreshed(token);
            return token;
          } catch (refreshErr) {
            console.error("[Auth] Refresh token thất bại:", refreshErr);
            setStoredUser(null);
            throw refreshErr;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
      }

      try {
        const newToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        console.log("[Auth] Retrying request with new token:", newToken);
        return api(originalRequest);
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
