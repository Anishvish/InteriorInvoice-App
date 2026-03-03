// ==========================================
// Invoice Calculation Engine
// ==========================================

import { InvoiceItem } from '../models/types';

/**
 * Calculate area from feet and inches dimensions
 */
export function calculateArea(
    lengthFeet: number,
    lengthInches: number,
    widthFeet: number,
    widthInches: number
): number {
    const lengthInFeet = lengthFeet + lengthInches / 12;
    const widthInFeet = widthFeet + widthInches / 12;
    return round2(lengthInFeet * widthInFeet);
}

/**
 * Calculate line total for an invoice item
 */
export function calculateLineTotal(item: Partial<InvoiceItem>): number {
    if (item.calculationMode === 'AREA') {
        const area = calculateArea(
            item.lengthFeet || 0,
            item.lengthInches || 0,
            item.widthFeet || 0,
            item.widthInches || 0
        );
        return round2(area * (item.quantity || 0) * (item.rate || 0));
    } else {
        return round2((item.quantity || 0) * (item.rate || 0));
    }
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(
    items: Partial<InvoiceItem>[],
    hasGST: boolean,
    gstPercent: number,
    advance: number
) {
    const subtotal = round2(
        items.reduce((sum, item) => sum + calculateLineTotal(item), 0)
    );

    const gstAmount = hasGST ? round2(subtotal * (gstPercent / 100)) : 0;
    const grandTotal = round2(subtotal + gstAmount);
    const balance = round2(grandTotal - advance);

    return { subtotal, gstAmount, grandTotal, balance };
}

/**
 * Round to 2 decimal places
 */
export function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
