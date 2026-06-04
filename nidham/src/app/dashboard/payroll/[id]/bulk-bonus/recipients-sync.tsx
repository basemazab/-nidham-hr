"use client";

import { useEffect, useRef } from "react";

// Keeps the hidden `recipients` field in sync with the chosen
// "recipients_mode" radio. Was an inline <script> in a Server Component —
// which never re-ran on client-side navigation, so a department choice
// silently did nothing and the bonus always went to "all". As a client
// component the useEffect re-binds on every mount (client nav included).
export function RecipientsSync() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hidden = ref.current;
    if (!hidden) return;

    const compute = (r: HTMLInputElement) => {
      if (r.value === "all") {
        hidden.value = "all";
        return;
      }
      if (r.value.startsWith("dept:")) {
        const dept = r.value.slice(5);
        hidden.value = Array.from(
          document.querySelectorAll("[data-employee-dept]"),
        )
          .filter((el) => el.getAttribute("data-employee-dept") === dept)
          .map((el) => el.getAttribute("data-entry-id"))
          .filter(Boolean)
          .join(",");
      }
    };

    const radios = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[name=recipients_mode]"),
    );
    const onChange = (e: Event) => compute(e.target as HTMLInputElement);
    radios.forEach((r) => r.addEventListener("change", onChange));
    // Seed from whichever radio is already checked.
    const checked = radios.find((r) => r.checked);
    if (checked) compute(checked);

    return () => radios.forEach((r) => r.removeEventListener("change", onChange));
  }, []);

  return <input ref={ref} type="hidden" name="recipients" defaultValue="all" />;
}
