// ==========================================
// SQLite Database Initialization & Migrations
// ==========================================

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('interior_invoice.db');
    await runMigrations(db);
    return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
    await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyName TEXT NOT NULL,
      ownerName TEXT,
      phone TEXT,
      address TEXT,
      hasGST INTEGER DEFAULT 0,
      gstNumber TEXT,
      defaultGstPercent REAL,
      logoPath TEXT,
      invoicePrefix TEXT,
      invoiceCounter INTEGER DEFAULT 1,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyId INTEGER NOT NULL,
      invoiceNumber TEXT,
      clientName TEXT NOT NULL,
      clientPhone TEXT,
      clientAddress TEXT,
      subtotal REAL,
      gstPercent REAL,
      gstAmount REAL,
      grandTotal REAL,
      advance REAL,
      balance REAL,
      createdAt TEXT,
      FOREIGN KEY(companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      description TEXT,
      calculationMode TEXT,
      lengthFeet REAL,
      lengthInches REAL,
      widthFeet REAL,
      widthInches REAL,
      area REAL,
      quantity REAL,
      rate REAL,
      lineTotal REAL,
      FOREIGN KEY(invoiceId) REFERENCES invoices(id)
    );
  `);
}

export async function seedSampleCompany(): Promise<void> {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM companies'
    );

    if (result && result.count === 0) {
        await database.runAsync(
            `INSERT INTO companies (companyName, ownerName, phone, address, hasGST, gstNumber, defaultGstPercent, invoicePrefix, invoiceCounter, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Elite Interiors',
                'Rajesh Kumar',
                '+91 98765 43210',
                '123 MG Road, Bangalore, Karnataka 560001',
                1,
                '29ABCDE1234F1Z5',
                18,
                'EI',
                1,
                new Date().toISOString(),
            ]
        );
    }
}
