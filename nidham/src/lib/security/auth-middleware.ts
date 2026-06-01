import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface AuthPayload {
  userId: string;
  email: string;
  role: "admin" | "manager" | "hr" | "employee";
  permissions: string[];
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as AuthPayload;
  } catch (error) {
    return null;
  }
}

export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export function hasPermission(auth: AuthPayload, requiredPermission: string): boolean {
  if (auth.role === "admin") {
    return true;
  }
  return auth.permissions.includes(requiredPermission);
}

export function hasRole(
  auth: AuthPayload,
  requiredRoles: ("admin" | "manager" | "hr" | "employee")[]
): boolean {
  return requiredRoles.includes(auth.role);
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "manage_candidates",
    "manage_jobs",
    "manage_employees",
    "manage_contracts",
    "manage_notifications",
    "view_analytics",
    "manage_users",
  ],
  hr: [
    "manage_candidates",
    "manage_jobs",
    "manage_employees",
    "manage_contracts",
    "manage_notifications",
    "view_analytics",
  ],
  manager: [
    "view_candidates",
    "view_employees",
    "view_contracts",
    "approve_leave",
    "view_analytics",
  ],
  employee: ["view_own_profile", "view_own_contracts", "request_leave"],
};

export async function withAuth(
  request: NextRequest,
  requiredPermissions?: string[],
  requiredRoles?: ("admin" | "manager" | "hr" | "employee")[]
): Promise<{ auth: AuthPayload | null; response: NextResponse | null }> {
  const token = extractToken(request);

  if (!token) {
    return {
      auth: null,
      response: NextResponse.json(
        { error: { message: "Unauthorized: No token provided" } },
        { status: 401 }
      ),
    };
  }

  const auth = await verifyToken(token);

  if (!auth) {
    return {
      auth: null,
      response: NextResponse.json(
        { error: { message: "Unauthorized: Invalid token" } },
        { status: 401 }
      ),
    };
  }

  if (requiredRoles && !hasRole(auth, requiredRoles)) {
    return {
      auth,
      response: NextResponse.json(
        { error: { message: "Forbidden: Insufficient role" } },
        { status: 403 }
      ),
    };
  }

  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(auth, permission)
    );

    if (!hasAllPermissions) {
      return {
        auth,
        response: NextResponse.json(
          { error: { message: "Forbidden: Insufficient permissions" } },
          { status: 403 }
        ),
      };
    }
  }

  return { auth, response: null };
}
