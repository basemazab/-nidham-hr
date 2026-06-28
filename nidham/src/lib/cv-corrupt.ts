// ============================================================================
// cv-corrupt.ts — single source of truth for "is this CV text garbage?"
// ============================================================================
// A PDF can render fine on screen yet carry a CORRUPT internal text layer
// (subsetted/broken font, bad encoding). Byte-level extraction then returns
// symbol-salad — often ENDING with the embedded font / MIT license dump, whose
// real English words used to fool a plain word-ratio check (so the garbage was
// judged "clean" and shown/stored). Every CV flow — apply storage, the
// applicant-page display gate, cv-analyzer, cv-translator — imports THIS so the
// detection stays consistent and never diverges again.

export function looksLikeCorruptText(text: string): boolean {
  if (!text) return false;

  // 1) Count "binary-noise" chars: the U+FFFD replacement char (65533) and C0
  //    control bytes (except tab=9, LF=10, CR=13). These are the dead giveaway
  //    of a broken text layer — real CVs have ~none, salad is littered with
  //    them. Counted by char CODE so the source carries no control characters.
  let weird = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (c === 65533 || (c < 32 && c !== 9 && c !== 10 && c !== 13)) weird += 1;
  }
  if (weird >= 8 || weird / Math.max(text.length, 1) > 0.01) return true;

  // 2) Embedded font-program / license dumps leak into broken-font extractions
  //    and would otherwise inflate the word ratio below. These exact phrases
  //    never appear in a real CV.
  if (
    /Monotype Type Drawing|Layout Logic Software|Times New Roman is a trademark|OpenType Layout logic|Biblical Hebrew Layout/i.test(
      text,
    )
  ) {
    return true;
  }

  // 3) Real-word ratio: real CVs (any language) are full of 4+ letter words;
  //    corrupt salad has almost none.
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 20) return false;
  let realWords = 0;
  for (const t of tokens) if (/\p{L}{4,}/u.test(t)) realWords += 1;
  return realWords / tokens.length < 0.12;
}
