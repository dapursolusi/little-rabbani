/**
 * PII detection and handling utilities.
 *
 * This template provides infrastructure for detecting and handling
 * personally identifiable information (PII) in the Little Rabbani
 * preschool LMS, which inherently processes kid and guardian data.
 */

/** Known PII field patterns — extend this as new data surfaces are added. */
export const PII_PATTERNS = [
  // Identity
  { field: 'name', type: 'person_name' },
  { field: 'fullName', type: 'person_name' },
  { field: 'firstName', type: 'person_name' },
  { field: 'lastName', type: 'person_name' },
  { field: 'email', type: 'email' },
  { field: 'phone', type: 'phone' },
  { field: 'phoneNumber', type: 'phone' },
  { field: 'mobile', type: 'phone' },
  // Address
  { field: 'address', type: 'address' },
  { field: 'street', type: 'address' },
  { field: 'city', type: 'address' },
  { field: 'zipCode', type: 'address' },
  { field: 'postalCode', type: 'address' },
  // Children
  { field: 'childName', type: 'person_name' },
  { field: 'studentName', type: 'person_name' },
  { field: 'age', type: 'age' },
  { field: 'dateOfBirth', type: 'date_of_birth' },
  { field: 'dob', type: 'date_of_birth' },
  // Documents
  { field: 'ssn', type: 'national_id' },
  { field: 'idNumber', type: 'national_id' },
  { field: 'passportNumber', type: 'national_id' },
];

export type PIIFieldType =
  | 'person_name'
  | 'email'
  | 'phone'
  | 'address'
  | 'age'
  | 'date_of_birth'
  | 'national_id';

/**
 * Detect if a field name matches known PII patterns.
 * Returns the PII type if matched, null otherwise.
 */
export function detectPiiField(fieldName: string): PIIFieldType | null {
  const match = PII_PATTERNS.find(
    (p) => p.field.toLowerCase() === fieldName.toLowerCase()
  );
  return match ? (match.type as PIIFieldType) : null;
}

/**
 * Mask a string value based on PII type.
 * - person_name: Shows first char, replaces rest with asterisks
 * - email: Shows first char of local part + domain
 * - phone: Shows last 4 digits
 * - address: Shows first 3 chars
 * - date_of_birth: Shows year only
 * - national_id: Shows last 4 chars
 * - age: Unchanged (not sensitive on its own)
 */
export function maskPiiValue(value: string, type: PIIFieldType): string {
  if (!value) return value;

  switch (type) {
    case 'person_name':
      return value.length > 1 ? value[0] + '*'.repeat(value.length - 1) : value;
    case 'email': {
      const [local, domain] = value.split('@');
      if (!domain) return '***';
      return `${local[0]}***@${domain}`;
    }
    case 'phone':
      return value.length >= 4
        ? '*'.repeat(value.length - 4) + value.slice(-4)
        : value;
    case 'address':
      return value.length > 3
        ? value.slice(0, 3) + '*'.repeat(value.length - 3)
        : value;
    case 'date_of_birth':
      // Keep only the year if present (YYYY-MM-DD -> YYYY)
      return value.split('-')[0] || '****';
    case 'national_id':
      return value.length >= 4
        ? '*'.repeat(value.length - 4) + value.slice(-4)
        : value;
    case 'age':
      return value;
  }
}

/**
 * Scan an object's keys for PII fields and return masked copy.
 * The original object is not modified.
 */
export function maskPiiFields<T extends Record<string, unknown>>(
  data: T,
  options?: { maskValues?: boolean }
): Partial<T> {
  const result: Partial<T> = {};
  const shouldMask = options?.maskValues ?? true;

  for (const [key, value] of Object.entries(data)) {
    const piiType = detectPiiField(key);
    if (piiType && shouldMask && typeof value === 'string') {
      result[key as keyof T] = maskPiiValue(value, piiType) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}
