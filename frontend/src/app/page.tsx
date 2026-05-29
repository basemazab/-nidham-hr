'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('hrms_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-800">
      <div className="text-center">
        <h1 className="text-4xl font-cairo font-bold text-gold-500 mb-4">HR BASEM AZAB</h1>
        <p className="text-navy-300">جاري التحميل...</p>
      </div>
    </div>
  );
}
