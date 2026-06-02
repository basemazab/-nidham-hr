/**
 * Typed ActionResult — lets service functions return errors without
 * calling `redirect()` (which couples business logic to Next.js HTTP).
 *
 * Usage (service layer):
 *   return ok(data);
 *   return err("رسالة الخطأ");
 *
 * Usage (action layer — thin wrapper that calls revalidatePath + redirect):
 *   const result = await service.doSomething(...);
 *   if (!result.success) redirect(`/page?error=${encodeURIComponent(result.error)}`);
 *   revalidatePath(...);
 *   redirect(`/page?success=1`);
 */

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export const voidOk = { success: true as const, data: undefined as void };

export function err(error: string): ActionResult<never> {
  return { success: false, error };
}
