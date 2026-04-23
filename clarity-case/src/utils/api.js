import { apiClient } from "@/lib/api";

export const apiFetch = async (url, options = {}) => {
  try {
    const headers = { ...(options.headers || {}) };
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (typeof options.body === "string" && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await apiClient.request({
      url,
      method: options.method || "GET",
      data: options.body,
      headers,
    });

    return {
      ok: true,
      status: response.status,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    };
  } catch (err) {
    const response = err?.response;
    return {
      ok: false,
      status: response?.status || 500,
      json: async () => response?.data || { message: "Request failed" },
      text: async () => JSON.stringify(response?.data || { message: "Request failed" }),
    };
  }
};
