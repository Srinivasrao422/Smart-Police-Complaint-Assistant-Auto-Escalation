export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const storeSession = (token: string, user: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const broadcastSessionChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("spcaes:session-change"));
};

export const logoutUser = (redirectTo = "/auth") => {
  if (typeof window === "undefined") return;
  clearSession();
  broadcastSessionChange();
  if (window.location.pathname !== redirectTo) {
    window.location.assign(redirectTo);
  }
};
