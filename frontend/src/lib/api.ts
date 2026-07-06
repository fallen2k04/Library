import { AuthState, User } from "../types";

const TOKEN_KEY = "lms_token";
const USER_KEY = "lms_user";
const REFRESH_TOKEN_KEY = "lms_refresh_token";

export function getStoredAuth(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  let user: User | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      // ignore
    }
  }
  return { token, user };
}

export function setStoredAuth(token: string | null, user: User | null, refreshToken?: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }

  if (refreshToken !== undefined) {
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

let isRefreshing = false;
let failedQueue: { resolve: (token: string | null) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<{ success: boolean; data?: T; message: string; pagination?: any; errors?: string[] }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, config);

    if (response.status === 411 || response.status === 401) {
      if (endpoint === "/api/auth/refresh-token" || endpoint === "/api/auth/login") {
        setStoredAuth(null, null, null);
        window.dispatchEvent(new Event("auth_expired"));
        return { success: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
      }

      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        setStoredAuth(null, null, null);
        window.dispatchEvent(new Event("auth_expired"));
        return { success: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (newToken) {
              headers["Authorization"] = `Bearer ${newToken}`;
            }
            return apiRequest(endpoint, method, body);
          })
          .catch(() => {
            return { success: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
          });
      }

      isRefreshing = true;
      try {
        const refreshRes = await fetch("/api/auth/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data) {
            setStoredAuth(refreshData.data.token, refreshData.data.user, refreshData.data.refreshToken);
            processQueue(null, refreshData.data.token);
            isRefreshing = false;
            // Retry the original request
            return await apiRequest(endpoint, method, body);
          }
        }
      } catch (err) {
        console.error("Token refresh failed", err);
      }

      processQueue(new Error("Refresh failed"), null);
      isRefreshing = false;
      setStoredAuth(null, null, null);
      window.dispatchEvent(new Event("auth_expired"));
      return { success: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API error at " + endpoint, error);
    return { success: false, message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng." };
  }
}
export { TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY };
