const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getHeaders(token?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function handleFetchError(err: any): never {
  if (err instanceof TypeError) {
    throw new Error("تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم أو الاتصال بالإنترنت");
  }
  throw err;
}

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "حدث خطأ غير متوقع" }));
      throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail));
    }
    return res;
  } catch (err: any) {
    handleFetchError(err);
  }
}

// Companies
export async function fetchCompanies() {
  const res = await safeFetch(`${API_BASE}/api/hrms/companies`, { headers: getHeaders(getToken() || undefined) });
  return res.json();
}

export async function createCompany(data: any) {
  const res = await safeFetch(`${API_BASE}/api/hrms/companies`, {
    method: "POST",
    headers: getHeaders(getToken() || undefined),
    body: JSON.stringify(data),
  });
  return res.json();
}

// Departments
export async function fetchDepartments(companyId?: string) {
  const url = companyId
    ? `${API_BASE}/api/hrms/departments?company_id=${companyId}`
    : `${API_BASE}/api/hrms/departments`;
  const res = await safeFetch(url, { headers: getHeaders(getToken() || undefined) });
  return res.json();
}

export async function createDepartment(data: any) {
  const res = await safeFetch(`${API_BASE}/api/hrms/departments`, {
    method: "POST",
    headers: getHeaders(getToken() || undefined),
    body: JSON.stringify(data),
  });
  return res.json();
}

// Positions
export async function fetchPositions() {
  const res = await safeFetch(`${API_BASE}/api/hrms/positions`, { headers: getHeaders(getToken() || undefined) });
  return res.json();
}

export async function createPosition(data: any) {
  const res = await safeFetch(`${API_BASE}/api/hrms/positions`, {
    method: "POST",
    headers: getHeaders(getToken() || undefined),
    body: JSON.stringify(data),
  });
  return res.json();
}

// Work Locations
export async function fetchWorkLocations() {
  const res = await safeFetch(`${API_BASE}/api/hrms/work-locations`, { headers: getHeaders(getToken() || undefined) });
  return res.json();
}

// Employees
export async function fetchEmployees(params?: {
  department_id?: string;
  status?: string;
  employment_type?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.department_id) qs.set("department_id", params.department_id);
  if (params?.status) qs.set("status", params.status);
  if (params?.employment_type) qs.set("employment_type", params.employment_type);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  const res = await safeFetch(`${API_BASE}/api/hrms/employees?${qs}`, { headers: getHeaders(getToken() || undefined) });
  return res.json();
}

export async function fetchEmployee(id: string) {
  const res = await safeFetch(`${API_BASE}/api/hrms/employees/${id}`, { headers: getHeaders(getToken() || undefined) });
  return res.json();
}

export async function createEmployee(data: any) {
  const res = await safeFetch(`${API_BASE}/api/hrms/employees`, {
    method: "POST",
    headers: getHeaders(getToken() || undefined),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEmployee(id: string, data: any) {
  const res = await safeFetch(`${API_BASE}/api/hrms/employees/${id}`, {
    method: "PUT",
    headers: getHeaders(getToken() || undefined),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEmployee(id: string) {
  const res = await safeFetch(`${API_BASE}/api/hrms/employees/${id}`, {
    method: "DELETE",
    headers: getHeaders(getToken() || undefined),
  });
  return res.json();
}

export async function fetchEmployeeStats() {
  const res = await safeFetch(`${API_BASE}/api/hrms/employees/stats`, { headers: getHeaders(getToken() || undefined) });
  return res.json();
}
