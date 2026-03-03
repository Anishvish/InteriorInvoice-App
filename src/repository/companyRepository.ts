// ==========================================
// Company Repository - Database Operations
// ==========================================

import { getDatabase } from '../database/db';
import { Company } from '../models/types';

export async function getAllCompanies(): Promise<Company[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM companies ORDER BY companyName');
    return rows.map(mapRowToCompany);
}

export async function getCompanyById(id: number): Promise<Company | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM companies WHERE id = ?', [id]);
    return row ? mapRowToCompany(row) : null;
}

export async function createCompany(company: Omit<Company, 'id'>): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO companies (companyName, ownerName, phone, address, hasGST, gstNumber, defaultGstPercent, logoPath, invoicePrefix, invoiceCounter, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            company.companyName,
            company.ownerName || '',
            company.phone || '',
            company.address || '',
            company.hasGST ? 1 : 0,
            company.gstNumber || null,
            company.defaultGstPercent || null,
            company.logoPath || null,
            company.invoicePrefix || 'INV',
            company.invoiceCounter || 1,
            company.createdAt || new Date().toISOString(),
        ]
    );
    return result.lastInsertRowId;
}

export async function updateCompany(id: number, company: Partial<Company>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (company.companyName !== undefined) { fields.push('companyName = ?'); values.push(company.companyName); }
    if (company.ownerName !== undefined) { fields.push('ownerName = ?'); values.push(company.ownerName); }
    if (company.phone !== undefined) { fields.push('phone = ?'); values.push(company.phone); }
    if (company.address !== undefined) { fields.push('address = ?'); values.push(company.address); }
    if (company.hasGST !== undefined) { fields.push('hasGST = ?'); values.push(company.hasGST ? 1 : 0); }
    if (company.gstNumber !== undefined) { fields.push('gstNumber = ?'); values.push(company.gstNumber); }
    if (company.defaultGstPercent !== undefined) { fields.push('defaultGstPercent = ?'); values.push(company.defaultGstPercent); }
    if (company.logoPath !== undefined) { fields.push('logoPath = ?'); values.push(company.logoPath); }
    if (company.invoicePrefix !== undefined) { fields.push('invoicePrefix = ?'); values.push(company.invoicePrefix); }
    if (company.invoiceCounter !== undefined) { fields.push('invoiceCounter = ?'); values.push(company.invoiceCounter); }

    if (fields.length === 0) return;

    values.push(id);
    await db.runAsync(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function incrementInvoiceCounter(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE companies SET invoiceCounter = invoiceCounter + 1 WHERE id = ?', [id]);
}

export async function deleteCompany(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM invoice_items WHERE invoiceId IN (SELECT id FROM invoices WHERE companyId = ?)', [id]);
    await db.runAsync('DELETE FROM invoices WHERE companyId = ?', [id]);
    await db.runAsync('DELETE FROM companies WHERE id = ?', [id]);
}

function mapRowToCompany(row: any): Company {
    return {
        id: row.id,
        companyName: row.companyName,
        ownerName: row.ownerName || '',
        phone: row.phone || '',
        address: row.address || '',
        hasGST: row.hasGST === 1,
        gstNumber: row.gstNumber,
        defaultGstPercent: row.defaultGstPercent,
        logoPath: row.logoPath,
        invoicePrefix: row.invoicePrefix || 'INV',
        invoiceCounter: row.invoiceCounter || 1,
        createdAt: row.createdAt || '',
    };
}
