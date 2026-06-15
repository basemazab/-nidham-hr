import { Suspense } from "react";
import { RegisterPage } from "./register-page";

export function RegisterWrapper() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />}>
      <RegisterPage />
    </Suspense>
  );
}
