/**
 * Danacode (דאנאקוד) utility functions.
 *
 * Long format:  12 digits — PPPPIIIIIIIC
 *   PPPP  = publisher (4 digits, zero-padded)
 *   IIIIIII = internal number (7 digits, zero-padded)
 *   C     = control digit
 *
 * Short format: PPPP-IIIIIII  (no control digit, dash-separated)
 */

/**
 * Calculates the Danacode control digit for an 11-digit base string.
 * Odd positions (1-based) × 7, even positions × 9, sum → last digit.
 */
export function calcDanacodeControlDigit(base11: string): number {
  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(base11[i], 10);
    if ((i + 1) % 2 === 1) {
      oddSum += digit;
    } else {
      evenSum += digit;
    }
  }
  const total = oddSum * 7 + evenSum * 9;
  return total % 10;
}

/**
 * Converts any accepted input (long 12-digit or short PPPP-IIIIIII) to the
 * canonical long 12-digit format.
 * Returns null if input is invalid.
 */
export function toLongDanacode(input: string): string | null {
  const trimmed = input.trim();

  const longMatch = trimmed.match(/^(\d{12})$/);
  if (longMatch) {
    return longMatch[1];
  }

  const shortMatch = trimmed.match(/^(\d{1,4})-(\d{1,7})$/);
  if (shortMatch) {
    const publisher = shortMatch[1].padStart(4, '0');
    const internal = shortMatch[2].padStart(7, '0');
    const base11 = publisher + internal;
    const control = calcDanacodeControlDigit(base11);
    return base11 + String(control);
  }

  return null;
}

/**
 * Converts a long 12-digit danacode to short display format: P-I (leading zeros stripped).
 * Returns the input unchanged if it is not exactly 12 digits.
 */
export function toShortDanacode(long: string): string {
  if (!/^\d{12}$/.test(long)) return long;
  const publisher = String(parseInt(long.substring(0, 4), 10));
  const internal = String(parseInt(long.substring(4, 11), 10));
  return `${publisher}-${internal}`;
}

/**
 * Validates that a 12-digit danacode has a correct control digit.
 */
export function validateDanacode(long: string): boolean {
  if (!/^\d{12}$/.test(long)) return false;
  const base11 = long.substring(0, 11);
  const given = parseInt(long[11], 10);
  return calcDanacodeControlDigit(base11) === given;
}

/**
 * Extracts a danacode from OCR text.
 * Strategy (highest to lowest confidence):
 * 1. Number following a "דאנאקוד" label on the same line (short or long)
 * 2. Any short-format digits-dash-digits on its own token
 * 3. Any 12-digit run (with optional spaces stripped) that passes control digit validation
 * Returns the matched string in whatever format found (normalized on save via toLongDanacode).
 */
export function extractDanacode(text: string): string | null {
  const lines = text.split('\n');

  for (const line of lines) {
    if (/דאנאקוד/i.test(line) || /danacode/i.test(line)) {
      const labeled = line.match(/(\d{1,4}-\d{1,7})/);
      if (labeled) return labeled[1];
      const labeledLong = line.replace(/\s/g, '').match(/(\d{12})/);
      if (labeledLong && validateDanacode(labeledLong[1])) return labeledLong[1];
    }
  }

  const shortMatch = text.match(/\b(\d{1,4}-\d{1,7})\b/);
  if (shortMatch) return shortMatch[1];

  const spaceless = text.replace(/\s/g, '');
  const longCandidates = spaceless.match(/\d{12}/g);
  if (longCandidates) {
    for (const candidate of longCandidates) {
      if (validateDanacode(candidate)) return candidate;
    }
  }

  return null;
}
