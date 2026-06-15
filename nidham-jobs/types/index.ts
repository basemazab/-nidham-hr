import type { User, Job, Application } from "@prisma/client";

export type SafeUser = Omit<User, "password"> & {
  candidate?: {
    id: string;
    title: string | null;
    location: string | null;
    skills: { id: string; name: string }[];
    resumeUrl: string | null;
    aiScore: number | null;
  } | null;
  company?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
};

export type JobWithCompany = Job & {
  company: {
    name: string;
    slug: string;
    logo: string | null;
    location: string | null;
    isVerified: boolean;
  };
  skills: { id: string; name: string }[];
  _count?: {
    applications: number;
  };
};

export type ApplicationWithDetails = Application & {
  job: Job & {
    company: { name: string; slug: string; logo: string | null };
  };
  candidate: {
    user: { name: string | null; email: string; image: string | null };
    title: string | null;
    location: string | null;
    skills: { id: string; name: string }[];
  };
};

export type JobFilters = {
  q?: string;
  type?: string;
  level?: string;
  location?: string;
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  skills?: string[];
};

export interface AIAnalysisResult {
  score: number;
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  interviewQuestions: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatsCard {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}
