const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrms_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('hrms_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('غير مصرح');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'خطأ غير معروف' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(path: string, body: any) {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Auth
  login(username: string, password: string) {
    return this.post<{ access_token: string; user: any }>('/auth/login', { username, password });
  }

  getProfile() {
    return this.get<any>('/auth/profile');
  }

  switchCompany(companyId: string) {
    return this.post<{ access_token: string; currentCompanyId: string }>('/auth/switch-company', { companyId });
  }

  // Companies
  getCompanies() {
    return this.get<any[]>('/companies');
  }

  // Employees
  getEmployees(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any[]>(`/employees${query}`);
  }

  getEmployee(id: string) {
    return this.get<any>(`/employees/${id}`);
  }

  getEmployeeStats() {
    return this.get<any>('/employees/stats');
  }

  createEmployee(data: any) {
    return this.post<any>('/employees', data);
  }

  updateEmployee(id: string, data: any) {
    return this.put<any>(`/employees/${id}`, data);
  }

  // Attendance
  getDailyAttendance(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.get<any>(`/attendance/daily${query}`);
  }

  importZkteco(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<any>('/attendance/import/zkteco', formData);
  }

  // Leave
  getLeaveBalances(employeeId: string, year?: number) {
    const query = year ? `?year=${year}` : '';
    return this.get<any[]>(`/leave/balances/${employeeId}${query}`);
  }

  getLeaveRequests(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any[]>(`/leave/requests${query}`);
  }

  createLeaveRequest(data: any) {
    return this.post<any>('/leave/requests', data);
  }

  approveLeaveRequest(id: string, comment?: string) {
    return this.post<any>(`/leave/requests/${id}/approve`, { comment });
  }

  rejectLeaveRequest(id: string, comment: string) {
    return this.post<any>(`/leave/requests/${id}/reject`, { comment });
  }

  // Payroll
  getPayrollRuns() {
    return this.get<any[]>('/payroll/runs');
  }

  createPayrollRun(month: number, year: number) {
    return this.post<any>('/payroll/runs', { month, year });
  }

  previewPayroll(runId: string) {
    return this.post<any>(`/payroll/runs/${runId}/preview`);
  }

  commitPayroll(runId: string) {
    return this.post<any>(`/payroll/runs/${runId}/commit`);
  }

  getPayrollRunDetails(runId: string) {
    return this.get<any>(`/payroll/runs/${runId}`);
  }

  getPayslip(runId: string, employeeId: string) {
    return this.get<any>(`/payroll/runs/${runId}/payslip/${employeeId}`);
  }

  // Reports
  getDashboard() {
    return this.get<any>('/reports/dashboard');
  }

  getHeadcountTrend(months?: number) {
    const query = months ? `?months=${months}` : '';
    return this.get<any[]>(`/reports/headcount-trend${query}`);
  }

  getPayrollCostTrend() {
    return this.get<any[]>('/reports/payroll-cost-trend');
  }
}

export const api = new ApiClient();
