// ==========================================
// Invoice Number Generator
// ==========================================

/**
 * Generate invoice number in format: {PREFIX}-{YEAR}-{0001}
 * @param prefix - Company-specific prefix (e.g., "INT")
 * @param counter - Current invoice counter
 * @returns Formatted invoice number string
 */
export function generateInvoiceNumber(prefix: string, counter: number): string {
    const year = new Date().getFullYear();
    const paddedCounter = counter.toString().padStart(4, '0');
    return `${prefix}-${year}-${paddedCounter}`;
}
