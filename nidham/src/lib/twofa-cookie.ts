// ============================================================================
// nidham_2fa_pass cookie signing — proves a session cleared its TOTP step
// ============================================================================
//
// The cookie value used to be the static string "ok". That's trivially
// forgeable: anyone who phished a password could set the cookie by hand and
// skip the second factor entirely. Here we bind the "2FA cleared" flag to the
// specific user id with an HMAC over a server secret, so a value minted for
// one user (or out of thin air) won't validate for another.
//
// Web Crypto (crypto.subtle) is used deliberately so the SAME helper runs in
// BOTH the Node server action that SETS the cookie and the Edge proxy that
// VERIFIES it.

const SECRET =
  process.env.TWOFA_COOKIE_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Value to store in the `nidham_2fa_pass` cookie for this user. */
export async function signTwoFaPass(userId: string): Promise<string> {
  return hmacHex(`2fa-pass:${userId}`);
}

/** True only if `cookieValue` is the valid 2FA-pass token for `userId`. */
export async function verifyTwoFaPass(
  userId: string,
  cookieValue: string | undefined | null,
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await signTwoFaPass(userId);
  // Constant-time compare (lengths are fixed hex, but guard anyway).
  if (expected.length !== cookieValue.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ cookieValue.charCodeAt(i);
  }
  return diff === 0;
}
