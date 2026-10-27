export interface RedactionResult {
  redactedText: string;
  piiDetected: boolean;
  redactedCount: number;
}

export class PrivacyService {
  // Common Indian PII patterns
  private static readonly PHONE_REGEX = /(\+?91[\s-]?)?[6-9]\d{9}\b/g;
  private static readonly AADHAAR_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;

  /**
   * Scans text and replaces phone numbers, Aadhaar IDs, and emails with secure redaction tokens.
   */
  public redactPII(text: string): RedactionResult {
    if (!text) return { redactedText: '', piiDetected: false, redactedCount: 0 };

    let count = 0;
    let result = text;

    result = result.replace(PrivacyService.PHONE_REGEX, () => {
      count++;
      return '[PHONE_REDACTED]';
    });

    result = result.replace(PrivacyService.AADHAAR_REGEX, () => {
      count++;
      return '[AADHAAR_REDACTED]';
    });

    result = result.replace(PrivacyService.EMAIL_REGEX, () => {
      count++;
      return '[EMAIL_REDACTED]';
    });

    return {
      redactedText: result,
      piiDetected: count > 0,
      redactedCount: count,
    };
  }

  /**
   * Masks personal identifiable fields based on caller role and anonymous flag.
   */
  public sanitizeGrievanceForDisplay(grievance: any, callerRole?: string): any {
    const isOfficer = ['SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER'].includes(callerRole || '');

    // Clone to avoid mutating original object
    const clean = { ...grievance };

    // Apply text redaction
    const { redactedText } = this.redactPII(clean.description || '');
    clean.redactedDescription = redactedText;

    if (!isOfficer || clean.isAnonymous) {
      clean.complainantName = clean.isAnonymous ? 'Citizen (Identity Withheld)' : 'Citizen (Protected)';
      if (clean.complainantPhone) {
        const lastFour = clean.complainantPhone.slice(-4);
        clean.complainantPhone = `+91 ******${lastFour}`;
      }
      clean.description = redactedText; // Force redacted description for non-admin viewers
    }

    return clean;
  }

  /**
   * Sanitizes logs to prevent sensitive PII leakage in application telemetry.
   */
  public safeLog(message: string, data?: Record<string, any>): void {
    const cleanMsg = this.redactPII(message).redactedText;
    if (data) {
      const sanitizedData = JSON.parse(JSON.stringify(data));
      if (sanitizedData.complainantPhone) sanitizedData.complainantPhone = '[REDACTED]';
      if (sanitizedData.complainantName) sanitizedData.complainantName = '[REDACTED]';
      console.log(`[JANRAKSHA SECURE LOG] ${cleanMsg}`, sanitizedData);
    } else {
      console.log(`[JANRAKSHA SECURE LOG] ${cleanMsg}`);
    }
  }
}

export const privacyService = new PrivacyService();
