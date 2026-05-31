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
   * للإجازات — اختيار الحقول الأساسية
   */
  leaveSelect: {
    id: true,
    employeeId: true,
    type: true,
    startDate: true,
    endDate: true,
    status: true,
    reason: true,
  },
};

// ============================================================================
// Response Compression
// ============================================================================

/**
 * shouldCompress — التحقق من ما إذا كان يجب ضغط الاستجابة
 */
export function shouldCompress(contentLength: number): boolean {
  // ضغط الاستجابات الأكبر من 1KB
  return contentLength > 1024;
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * checkRateLimit — التحقق من حد المعدل
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // نافذة جديدة
    const newEntry = {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count < maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

// ============================================================================
// Database Query Caching
// ============================================================================

/**
 * cachedQuery — تنفيذ استعلام مع caching
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // التحقق من الذاكرة المؤقتة
  const cached = getCachedData<T>(key);
  if (cached) {
    return cached;
  }

  // تنفيذ الاستعلام
  const data = await queryFn();

  // تخزين النتيجة
  setCachedData(key, data, ttlSeconds);

  return data;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * batchProcess — معالجة دفعية للعمليات
 */
export async function batchProcess<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
  }

  return results;
}
