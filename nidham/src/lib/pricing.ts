// ============================================================================
// Pricing — SINGLE SOURCE OF TRUTH for Nidham HR plan prices (EGP / month).
// ============================================================================
// Every price display (pricing page, signup, FAQ, landing pages) must read
// from here so the numbers never drift out of sync again. To change a price,
// change it ONCE here.
//
// Annual billing = pay for 10 months, get 12 (≈ 17% off / 2 months free).

export const PLAN_PRICE_EGP = {
  free: 0,
  starter: 750,
  pro: 2500,
  business: 6000,
} as const;

export const PLAN_EMPLOYEE_CAP = {
  free: 5,
  starter: 25,
  pro: 100,
  business: 500,
} as const;

/** Annual monthly-equivalent (2 months free). */
export function annualMonthlyEgp(monthly: number): number {
  return Math.round((monthly * 10) / 12);
}

/** "2,500 ج/شهر" or "مجاناً" — Arabic-Indic digits. */
export function formatMonthlyEgp(egp: number): string {
  return egp === 0 ? "مجاناً" : `${egp.toLocaleString("ar-EG")} ج/شهر`;
}
