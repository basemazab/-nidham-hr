"use client";
import { useEffect, useRef } from "react";

export function DeferredJsonLd({ schema }: { schema: object }) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const inject = () => {
      if (cancelled) return;
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    if ("requestIdleCallback" in window) {
      idleId = requestIdleCallback(inject, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(inject, 2000);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [schema]);

  return null;
}
