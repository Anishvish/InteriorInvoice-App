// ==========================================
// Invoice Repository - Database Operations
// ==========================================

import { getDatabase } from '../database/db';
import { Invoice, InvoiceItem, InvoiceWithItems, DashboardStats } from '../models/types';

export async function createInvoice(
    invoice: Omit<Invoice, 'id'>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
): Promise<number> {
    const db = await getDatabase();

    const result = await db.runAsync(
        `INSERT INTO invoices (companyId, invoiceNumber, clientName, clientPhone, clientAddress, subtotal, gstPercent, gstAmount, grandTotal, advance, balance, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            invoice.companyId,
            invoice.invoiceNumber,
            invoice.clientName,
            invoice.clientPhone || '',
            invoice.clientAddress || '',
            invoice.subtotal,
            invoice.gstPercent,
            invoice.gstAmount,
            invoice.grandTotal,
            invoice.advance,
            invoice.balance,
            invoice.createdAt || new Date().toISOString(),
        ]
    );

    const invoiceId = result.lastInsertRowId;

    for (const item of items) {
        await db.runAsync(
            `INSERT INTO invoice_items (invoiceId, description, calculationMode, lengthFeet, lengthInches, widthFeet, widthInches, area, quantity, rate, lineTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceId,
                item.description,
                item.calculationMode,
                item.lengthFeet || 0,
                item.lengthInches || 0,
                item.widthFeet || 0,
                item.widthInches || 0,
                item.area || 0,
                item.quantity || 0,
                item.rate || 0,
                item.lineTotal || 0,
            ]
        );
    }

    return invoiceId;
}

export async function updateInvoice(
    invoiceId: number,
    invoice: Partial<Omit<Invoice, 'id'>>,
    items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]
): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `UPDATE invoices SET clientName = ?, clientPhone = ?, clientAddress = ?, subtotal = ?, gstPercent = ?, gstAmount = ?, grandTotal = ?, advance = ?, balance = ? WHERE id = ?`,
        [
            invoice.clientName || '',
            invoice.clientPhone || '',
            invoice.clientAddress || '',
            invoice.subtotal || 0,
            invoice.gstPercent || 0,
            invoice.gstAmount || 0,
            invoice.grandTotal || 0,
            invoice.advance || 0,
            invoice.balance || 0,
            invoiceId,
        ]
    );

    // Delete existing items and re-insert
    await db.runAsync('DELETE FROM invoice_items WHERE invoiceId = ?', [invoiceId]);

    for (const item of items) {
        await db.runAsync(
            `INSERT INTO invoice_items (invoiceId, description, calculationMode, lengthFeet, lengthInches, widthFeet, widthInches, area, quantity, rate, lineTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceId,
                item.description,
                item.calculationMode,
                item.lengthFeet || 0,
                item.lengthInches || 0,
                item.widthFeet || 0,
                item.widthInches || 0,
                item.area || 0,
                item.quantity || 0,
                item.rate || 0,
                item.lineTotal || 0,
            ]
        );
    }
}

export async function getInvoicesByCompany(
    companyId: number,
    search?: string,
    offset: number = 0,
    limit: number = 20
): Promise<Invoice[]> {
    const db = await getDatabase();
    let query = 'SELECT * FROM invoices WHERE companyId = ?';
    const params: any[] = [companyId];

    if (search && search.trim()) {
        query += ' AND (clientName LIKE ? OR invoiceNumber LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await db.getAllAsync<any>(query, params);
    return rows.map(mapRowToInvoice);
}

export async function getInvoiceWithItems(invoiceId: number): Promise<InvoiceWithItems | null> {
    const db = await getDatabase();
    const invoiceRow = await db.getFirstAsync<any>('SELECT * FROM invoices WHERE id = ?', [invoiceId]);

    if (!invoiceRow) return null;

    const itemRows = await db.getAllAsync<any>(
        'SELECT * FROM invoice_items WHERE invoiceId = ? ORDER BY id',
        [invoiceId]
    );

    return {
        ...mapRowToInvoice(invoiceRow),
        items: itemRows.map(mapRowToInvoiceItem),
    };
}

export async function getDashboardStats(companyId: number): Promise<DashboardStats> {
    const db = await getDatabase();

    const countResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM invoices WHERE companyId = ?',
        [companyId]
    );

    const revenueResult = await db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(grandTotal), 0) as total FROM invoices WHERE companyId = ?',
        [companyId]
    );

    const pendingResult = await db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(balance), 0) as total FROM invoices WHERE companyId = ? AND balance > 0',
        [companyId]
    );

    const recentRows = await db.getAllAsync<any>(
        'SELECT * FROM invoices WHERE companyId = ? ORDER BY createdAt DESC LIMIT 5',
        [companyId]
    );

    return {
        totalInvoices: countResult?.count || 0,
        totalRevenue: revenueResult?.total || 0,
        totalPending: pendingResult?.total || 0,
        recentInvoices: recentRows.map(mapRowToInvoice),
    };
}

export async function deleteInvoice(invoiceId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM invoice_items WHERE invoiceId = ?', [invoiceId]);
    await db.runAsync('DELETE FROM invoices WHERE id = ?', [invoiceId]);
}

export async function getInvoiceCount(companyId: number, search?: string): Promise<number> {
    const db = await getDatabase();
    let query = 'SELECT COUNT(*) as count FROM invoices WHERE companyId = ?';
    const params: any[] = [companyId];

    if (search && search.trim()) {
        query += ' AND (clientName LIKE ? OR invoiceNumber LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm);
    }

    const result = await db.getFirstAsync<{ count: number }>(query, params);
    return result?.count || 0;
}

function mapRowToInvoice(row: any): Invoice {
    return {
        id: row.id,
        companyId: row.companyId,
        invoiceNumber: row.invoiceNumber || '',
        clientName: row.clientName || '',
        clientPhone: row.clientPhone || '',
        clientAddress: row.clientAddress || '',
        subtotal: row.subtotal || 0,
        gstPercent: row.gstPercent || 0,
        gstAmount: row.gstAmount || 0,
        grandTotal: row.grandTotal || 0,
        advance: row.advance || 0,
        balance: row.balance || 0,
        createdAt: row.createdAt || '',
    };
}

function mapRowToInvoiceItem(row: any): InvoiceItem {
    return {
        id: row.id,
        invoiceId: row.invoiceId,
        description: row.description || '',
        calculationMode: row.calculationMode || 'DIRECT',
        lengthFeet: row.lengthFeet || 0,
        lengthInches: row.lengthInches || 0,
        widthFeet: row.widthFeet || 0,
        widthInches: row.widthInches || 0,
        area: row.area || 0,
        quantity: row.quantity || 0,
        rate: row.rate || 0,
        lineTotal: row.lineTotal || 0,
    };
}
