import { Suspense } from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">⏳</div>
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  );
}
