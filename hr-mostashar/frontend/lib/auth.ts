"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "بريد إلكتروني أو كلمة مرور غير صحيحة" }));
        throw new Error(error.detail || "بريد إلكتروني أو كلمة مرور غير صحيحة");
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      setUser(data.user);
      return data;
    } catch (err: any) {
      if (err instanceof TypeError) throw new Error("تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم أو الاتصال بالإنترنت");
      throw err;
    }
  };

  const register = async (email: string, full_name: string, password: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name, password }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "البريد الإلكتروني مسجل بالفعل" }));
        throw new Error(error.detail || "البريد الإلكتروني مسجل بالفعل");
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      setUser(data.user);
      return data;
    } catch (err: any) {
      if (err instanceof TypeError) throw new Error("تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم أو الاتصال بالإنترنت");
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    router.push("/");
  };

  return { user, loading, login, register, logout };
}
