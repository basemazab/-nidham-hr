/**
 * تحسينات أداء API
 * - Caching ذكي
 * - Pagination محسّنة
 * - استعلامات قاعدة البيانات المحسّنة
 * - Compression
 */

import { cache } from "react";

// ============================================================================
// Cache Management
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const apiCache = new Map<string, CacheEntry<any>>();

/**
 * getCachedData — الحصول على البيانات المخزنة مؤقتاً
 */
export function getCachedData<T>(key: string): T | null {
  const entry = apiCache.get(key);

  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > entry.ttl;
  if (isExpired) {
    apiCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * setCachedData — تخزين البيانات مؤقتاً
 */
export function setCachedData<T>(
  key: string,
  data: T,
  ttlSeconds: number = 300
): void {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000,
  });
}

/**
 * invalidateCache — إلغاء الذاكرة المؤقتة
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    apiCache.clear();
    return;
  }

  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
}

// ============================================================================
// Pagination Utilities
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * calculatePaginationParams — حساب معاملات الـ pagination
 */
export function calculatePaginationParams(
  page: number,
  limit: number,
  total: number
): PaginatedResponse<any>["pagination"] {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
}

/**
 * getPaginationOffset — الحصول على offset للـ database query
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// ============================================================================
// Query Optimization
// ============================================================================

/**
 * optimizeQuery — تحسين استعلامات Prisma
 * - استخدام select بدلاً من fetchAll
 * - استخدام include بحذر
 * - تجنب N+1 queries
 */
export const queryOptimizations = {
  /**
   * للموظفين — اختيار الحقول الأساسية فقط
   */
  employeeSelect: {
    id: true,
    name: true,
    email: true,
    phone: true,
    position: true,
    department: true,
    status: true,
    hireDate: true,
  },

  /**
   * للرواتب — اختيار الحقول المهمة
   */
  salarySelect: {
    id: true,
    employeeId: true,
    baseSalary: true,
    month: true,
    year: true,
    totalDeductions: true,
    netSalary: true,
  },

  /**
   * للإجازات — اختيار الحقول الأساسية\n   */\n  leaveSelect: {\n    id: true,\n    employeeId: true,\n    type: true,\n    startDate: true,\n    endDate: true,\n    status: true,\n    reason: true,\n  },\n};\n\n// ============================================================================\n// Response Compression\n// ============================================================================\n\n/**\n * shouldCompress — التحقق من ما إذا كان يجب ضغط الاستجابة\n */\nexport function shouldCompress(contentLength: number): boolean {\n  // ضغط الاستجابات الأكبر من 1KB\n  return contentLength > 1024;\n}\n\n// ============================================================================\n// Rate Limiting\n// ============================================================================\n\ninterface RateLimitEntry {\n  count: number;\n  resetTime: number;\n}\n\nconst rateLimitStore = new Map<string, RateLimitEntry>();\n\n/**\n * checkRateLimit — التحقق من حد المعدل\n */\nexport function checkRateLimit(\n  key: string,\n  maxRequests: number = 100,\n  windowSeconds: number = 60\n): { allowed: boolean; remaining: number; resetTime: number } {\n  const now = Date.now();\n  const entry = rateLimitStore.get(key);\n\n  if (!entry || now > entry.resetTime) {\n    // نافذة جديدة\n    const newEntry = {\n      count: 1,\n      resetTime: now + windowSeconds * 1000,\n    };\n    rateLimitStore.set(key, newEntry);\n    return {\n      allowed: true,\n      remaining: maxRequests - 1,\n      resetTime: newEntry.resetTime,\n    };\n  }\n\n  if (entry.count < maxRequests) {\n    entry.count++;\n    return {\n      allowed: true,\n      remaining: maxRequests - entry.count,\n      resetTime: entry.resetTime,\n    };\n  }\n\n  return {\n    allowed: false,\n    remaining: 0,\n    resetTime: entry.resetTime,\n  };\n}\n\n// ============================================================================\n// Database Query Caching\n// ============================================================================\n\n/**\n * cachedQuery — تنفيذ استعلام مع caching\n */\nexport async function cachedQuery<T>(\n  key: string,\n  queryFn: () => Promise<T>,\n  ttlSeconds: number = 300\n): Promise<T> {\n  // التحقق من الذاكرة المؤقتة\n  const cached = getCachedData<T>(key);\n  if (cached) {\n    return cached;\n  }\n\n  // تنفيذ الاستعلام\n  const data = await queryFn();\n\n  // تخزين النتيجة\n  setCachedData(key, data, ttlSeconds);\n\n  return data;\n}\n\n// ============================================================================\n// Batch Operations\n// ============================================================================\n\n/**\n * batchProcess — معالجة دفعية للعمليات\n */\nexport async function batchProcess<T, R>(\n  items: T[],\n  processFn: (item: T) => Promise<R>,\n  batchSize: number = 10\n): Promise<R[]> {\n  const results: R[] = [];\n\n  for (let i = 0; i < items.length; i += batchSize) {\n    const batch = items.slice(i, i + batchSize);\n    const batchResults = await Promise.all(batch.map(processFn));\n    results.push(...batchResults);\n  }\n\n  return results;\n}\n
