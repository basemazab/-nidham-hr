const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request(method: string, path: string, body?: Record<string, unknown>) {
  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeaders.Authorization) {
    headers.Authorization = authHeaders.Authorization;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "حدث خطأ غير متوقع" }));
      throw new Error(error.detail || "حدث خطأ غير متوقع");
    }

    return res.json();
  } catch (err: any) {
    if (err instanceof TypeError) {
      throw new Error("تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم أو الاتصال بالإنترنت");
    }
    throw err;
  }
}

export const api = {
  auth: {
    register: (data: { email: string; full_name: string; password: string }) =>
      request("POST", "/api/auth/register", data),
    login: (data: { email: string; password: string }) =>
      request("POST", "/api/auth/login", data),
    getMe: () => request("GET", "/api/auth/me"),
  },

  ai: {
    chat: (message: string, conversationId?: string) =>
      request("POST", "/api/ai/chat", { message, conversation_id: conversationId }),
    getConversations: () => request("GET", "/api/ai/conversations"),
    getConversation: (id: string) => request("GET", `/api/ai/conversations/${id}`),
  },

  calc: {
    endOfService: (fields: Record<string, unknown>) =>
      request("POST", "/api/calc/end-of-service", { fields }),
    insurance: (fields: Record<string, unknown>) =>
      request("POST", "/api/calc/insurance", { fields }),
    leaves: (fields: Record<string, unknown>) =>
      request("POST", "/api/calc/leaves", { fields }),
    netSalary: (fields: Record<string, unknown>) =>
      request("POST", "/api/calc/net-salary", { fields }),
  },

  templates: {
    list: () => request("GET", "/api/templates"),
    get: (id: string) => request("GET", `/api/templates/${id}`),
    generate: (id: string, customFields: Record<string, unknown>, format: "docx" | "pdf") =>
      request("POST", `/api/templates/${id}/generate`, { custom_fields: customFields, format }),
  },

  subscriptions: {
    getPlans: () => request("GET", "/api/subscriptions/plans"),
    getMySubscription: () => request("GET", "/api/subscriptions/my-subscription"),
    getUsage: () => request("GET", "/api/subscriptions/usage"),
    subscribe: (plan: string, paymentReference?: string) =>
      request("POST", "/api/subscriptions/subscribe", { plan, payment_reference: paymentReference }),
  },

  admin: {
    getStats: () => request("GET", "/api/subscriptions/admin/stats"),
    getPending: () => request("GET", "/api/subscriptions/admin/pending"),
    activateSubscription: (id: string) =>
      request("POST", `/api/subscriptions/admin/activate/${id}`),
  },
};
