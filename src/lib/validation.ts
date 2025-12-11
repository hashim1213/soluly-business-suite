// Password validation rules
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score < 3) return "weak";
  if (score < 5) return "medium";
  return "strong";
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Slug validation for organization URLs
export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug || slug.length < 3) {
    return { isValid: false, error: "URL must be at least 3 characters" };
  }

  if (slug.length > 50) {
    return { isValid: false, error: "URL must be less than 50 characters" };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: "URL can only contain lowercase letters, numbers, and hyphens" };
  }

  if (slug.startsWith("-") || slug.endsWith("-")) {
    return { isValid: false, error: "URL cannot start or end with a hyphen" };
  }

  return { isValid: true };
}

// Safe number parsing with bounds
export function parseNumber(
  value: string | number,
  options: { min?: number; max?: number; defaultValue?: number } = {}
): number {
  const { min, max, defaultValue = 0 } = options;

  const parsed = typeof value === "number" ? value : parseFloat(value);

  if (isNaN(parsed)) {
    return defaultValue;
  }

  if (min !== undefined && parsed < min) {
    return min;
  }

  if (max !== undefined && parsed > max) {
    return max;
  }

  return parsed;
}

// Safe integer parsing
export function parseInteger(
  value: string | number,
  options: { min?: number; max?: number; defaultValue?: number } = {}
): number {
  const { min, max, defaultValue = 0 } = options;

  const parsed = typeof value === "number" ? Math.floor(value) : parseInt(value, 10);

  if (isNaN(parsed)) {
    return defaultValue;
  }

  if (min !== undefined && parsed < min) {
    return min;
  }

  if (max !== undefined && parsed > max) {
    return max;
  }

  return parsed;
}
