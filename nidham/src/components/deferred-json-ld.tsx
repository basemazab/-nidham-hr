"use client";
import { useEffect, useRef } from "react";

export function DeferredJsonLd({ schema }: { schema: object }) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    const inject = () => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(inject, { timeout: 3000 });
    } else {
      setTimeout(inject, 3000);
    }
  }, [schema]);

  return null;
}
