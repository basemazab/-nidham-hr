"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchEmployees, fetchEmployeeStats, fetchDepartments } from "@/lib/hrms-api";
import { Employee, EmployeeListResponse, EmployeeStats, Department, EmployeeStatus, EMPLOYEE_STATUS_LABELS } from "@/lib/hrms-types";
import { StatusBadge } from "@/components/hrms/StatusBadge";
import { StatCard } from "@/components/hrms/StatCard";
import { Users, UserCheck, UserMinus, TrendingUp } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadData();
  }, [page, filterDept, filterStatus]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = { page, page_size: 10 };
      if (filterDept) params.department_id = filterDept;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const [empRes, statsRes, deptRes] = await Promise.all([
        fetchEmployees(params),
        fetchEmployeeStats(),
        fetchDepartments(),
      ]);

      setEmployees((empRes as EmployeeListResponse).items);
      setTotalPages((empRes as EmployeeListResponse).total_pages);
      setTotal((empRes as EmployeeListResponse).total);
      setStats(statsRes as EmployeeStats);
      setDepartments(deptRes as Department[]);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    try {
      const params: any = { page: 1, page_size: 10 };
      if (filterDept) params.department_id = filterDept;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const res = await fetchEmployees(params);
      setEmployees((res as EmployeeListResponse).items);
      setTotalPages((res as EmployeeListResponse).total_pages);
      setTotal((res as EmployeeListResponse).total);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  function formatSalary(val?: string) {
    if (!val) return "٠";
    return Number(val).toLocaleString("ar-EG");
  }

  function getFullName(emp: Employee) {
    return emp.full_name_arabic || `${emp.first_name} ${emp.middle_name} ${emp.last_name}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0D1B2A]">إدارة الموظفين</h1>
              <p className="text-gray-500 mt-1">عرض وإدارة بيانات الموظفين</p>
            </div>
            <Link
              href="/employees/new"
              className="bg-[#C9A84C] hover:bg-[#B8943A] text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <span className="text-lg">+</span>
              إضافة موظف
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="إجمالي الموظفين"
              value={stats.total_employees}
              icon={<Users className="w-6 h-6 text-white" />}
            />
            <StatCard
              title="نشط"
              value={stats.active_employees}
              icon={<UserCheck className="w-6 h-6 text-white" />}
              color="bg-emerald-500"
            />
            <StatCard
              title="إجازة طويلة"
              value={stats.on_leave}
              icon={<UserMinus className="w-6 h-6 text-white" />}
              color="bg-amber-500"
            />
            <StatCard
              title="متوسط الراتب"
              value={`${formatSalary(stats.avg_salary)} ج.م`}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              color="bg-[#0D1B2A]"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="بحث بالاسم أو الكود أو الرقم القومي..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
              />
            </div>
            <select
              value={filterDept}
              onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A84C] bg-white"
            >
              <option value="">كل الأقسام</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name_ar}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A84C] bg-white"
            >
              <option value="">كل الحالات</option>
              {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0D1B2A] text-white rounded-lg text-sm hover:bg-[#1a2d42] transition-colors"
            >
              بحث
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">جاري التحميل...</div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-gray-500">لا توجد نتائج</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">القسم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المسمى الوظيفي</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الراتب الأساسي</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التعيين</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-[#0D1B2A]">{emp.employee_code}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#0D1B2A] text-sm font-bold">
                              {emp.first_name?.[0] || "?"}
                            </div>
                            <span className="text-sm font-medium text-[#0D1B2A]">{getFullName(emp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.department_name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.job_title_arabic || "-"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#0D1B2A]">{formatSalary(emp.basic_salary)} ج.م</td>
                        <td className="px-4 py-3">
                          {emp.status && <StatusBadge status={emp.status as EmployeeStatus} />}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{emp.hiring_date || "-"}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="text-[#C9A84C] hover:text-[#B8943A] text-sm font-medium"
                          >
                            عرض
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    عرض {((page - 1) * 10) + 1} - {Math.min(page * 10, total)} من {total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      السابق
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 text-sm border rounded ${
                          p === page
                            ? "bg-[#C9A84C] text-white border-[#C9A84C]"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
