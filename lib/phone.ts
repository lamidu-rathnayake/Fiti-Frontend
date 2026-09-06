/**
 * Utility for formatting and validating Sri Lankan phone numbers matching backend schema:
 * ^(?:\+94|0)[0-9]{9}$
 */

export const PHONE_REGEX = /^(?:\+94|0)[0-9]{9}$/;

/**
 * Normalizes a raw phone string into standard Sri Lankan format (+94XXXXXXXXX or 0XXXXXXXXX).
 * Returns null if the phone is empty or whitespace.
 */
export function normalizePhoneNumber(rawPhone: string | null | undefined): string | null {
    if (!rawPhone) return null;
    const trimmed = rawPhone.trim();
    if (!trimmed) return null;

    // Check if it already matches +94XXXXXXXXX or 0XXXXXXXXX exactly
    if (PHONE_REGEX.test(trimmed)) {
        return trimmed;
    }

    // Strip out non-digit characters except leading '+'
    const hasPlus = trimmed.startsWith("+");
    const digits = trimmed.replace(/\D/g, "");

    if (!digits) return null;

    if (hasPlus) {
        if (trimmed.startsWith("+94")) {
            let subDigits = digits.substring(2); // drop country code 94
            if (subDigits.startsWith("0")) {
                subDigits = subDigits.substring(1);
            }
            if (subDigits.length === 9) {
                return `+94${subDigits}`;
            }
        }
    } else {
        // e.g. 94771234567
        if (digits.startsWith("94") && digits.length === 11) {
            return `+94${digits.substring(2)}`;
        }
        // e.g. 0771234567
        if (digits.startsWith("0") && digits.length === 10) {
            return digits;
        }
        // e.g. 771234567
        if (!digits.startsWith("0") && digits.length === 9) {
            return `+94${digits}`;
        }
    }

    // If normalization couldn't produce a standard length, return trimmed input so validation catches it
    return trimmed;
}

/**
 * Validates whether a phone number (normalized or raw) is valid for the backend.
 */
export function validatePhoneNumber(phone: string | null | undefined): {
    isValid: boolean;
    normalized: string | null;
    error?: string;
} {
    if (!phone || !phone.trim()) {
        return { isValid: true, normalized: null };
    }

    const normalized = normalizePhoneNumber(phone);
    if (!normalized || !PHONE_REGEX.test(normalized)) {
        return {
            isValid: false,
            normalized,
            error: "Phone number must be a valid Sri Lankan format (e.g., 0771234567 or +94771234567).",
        };
    }

    return { isValid: true, normalized };
}
