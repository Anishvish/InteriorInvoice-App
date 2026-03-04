// ==========================================
// Interior Invoice System - Type Definitions
// ==========================================

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Company {
  id?: number;
  companyName: string;
  ownerName: string;
  phone: string;
  address: string;
  hasGST: boolean;
  gstNumber: string | null;
  defaultGstPercent: number | null;
  logoPath: string | null;
  invoicePrefix: string;
  invoiceCounter: number;
  createdAt: string;
}

export interface Invoice {
  id?: number;
  companyId: number;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  advance: number;
  balance: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  description: string;
  calculationMode: 'AREA' | 'DIRECT';
  lengthFeet: number;
  lengthInches: number;
  widthFeet: number;
  widthInches: number;
  area: number;
  quantity: number;
  rate: number;
  lineTotal: number;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  totalPending: number;
  totalCollected: number;
  paidInvoices: number;
  partialInvoices: number;
  unpaidInvoices: number;
  recentInvoices: Invoice[];
}

export type CalculationMode = 'AREA' | 'DIRECT';
