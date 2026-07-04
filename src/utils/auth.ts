/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hash a password securely using SHA-256 standard via Web Crypto API.
 * This guarantees passwords are never stored in cleartext in localStorage or state.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "aqar_secure_salt_2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate phone number format (simple check for arab region digits).
 */
export function validatePhone(phone: string): boolean {
  // Accepts standard formats like +966500000000, 0500000000, 01000000000, +201000000000
  const phoneRegex = /^(\+?\d{1,4})?\d{9,10}$/;
  return phoneRegex.test(phone.trim().replace(/\s+/g, ''));
}
