// ==========================================
// Zustand Store - Invoice State Management
// ==========================================

import { create } from 'zustand';
import { Invoice, InvoiceWithItems, DashboardStats } from '../models/types';
import * as invoiceRepo from '../repository/invoiceRepository';

interface InvoiceStore {
    invoices: Invoice[];
    currentInvoice: InvoiceWithItems | null;
    dashboardStats: DashboardStats | null;
    loading: boolean;
    totalCount: number;
    searchQuery: string;

    loadInvoices: (companyId: number, search?: string, offset?: number) => Promise<void>;
    loadMoreInvoices: (companyId: number, search?: string, offset?: number) => Promise<void>;
    loadInvoiceDetail: (invoiceId: number) => Promise<void>;
    loadDashboardStats: (companyId: number) => Promise<void>;
    removeInvoice: (invoiceId: number) => Promise<void>;
    editInvoice: (invoiceId: number, invoice: Partial<Omit<Invoice, 'id'>>, items: any[]) => Promise<void>;
    recordPayment: (invoiceId: number, amount: number) => Promise<void>;
    markAsPaid: (invoiceId: number) => Promise<void>;
    markAsUnpaid: (invoiceId: number) => Promise<void>;
    setSearchQuery: (query: string) => void;
    clearCurrentInvoice: () => void;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
    invoices: [],
    currentInvoice: null,
    dashboardStats: null,
    loading: false,
    totalCount: 0,
    searchQuery: '',

    loadInvoices: async (companyId, search, offset = 0) => {
        set({ loading: true });
        const invoices = await invoiceRepo.getInvoicesByCompany(companyId, search, offset);
        const totalCount = await invoiceRepo.getInvoiceCount(companyId, search);
        set({ invoices, totalCount, loading: false });
    },

    loadMoreInvoices: async (companyId, search, offset = 0) => {
        const moreInvoices = await invoiceRepo.getInvoicesByCompany(companyId, search, offset);
        set((state) => ({
            invoices: [...state.invoices, ...moreInvoices],
        }));
    },

    loadInvoiceDetail: async (invoiceId) => {
        set({ loading: true });
        const invoice = await invoiceRepo.getInvoiceWithItems(invoiceId);
        set({ currentInvoice: invoice, loading: false });
    },

    loadDashboardStats: async (companyId) => {
        const stats = await invoiceRepo.getDashboardStats(companyId);
        set({ dashboardStats: stats });
    },

    removeInvoice: async (invoiceId) => {
        await invoiceRepo.deleteInvoice(invoiceId);
        set((state) => ({
            invoices: state.invoices.filter((inv) => inv.id !== invoiceId),
        }));
    },

    editInvoice: async (invoiceId, invoice, items) => {
        await invoiceRepo.updateInvoice(invoiceId, invoice, items);
        const updated = await invoiceRepo.getInvoiceWithItems(invoiceId);
        set({ currentInvoice: updated });
    },

    recordPayment: async (invoiceId, amount) => {
        await invoiceRepo.recordPayment(invoiceId, amount);
        // Refresh the current invoice detail
        const updated = await invoiceRepo.getInvoiceWithItems(invoiceId);
        set({ currentInvoice: updated });
    },

    markAsPaid: async (invoiceId) => {
        await invoiceRepo.markAsPaid(invoiceId);
        const updated = await invoiceRepo.getInvoiceWithItems(invoiceId);
        set({ currentInvoice: updated });
    },

    markAsUnpaid: async (invoiceId) => {
        await invoiceRepo.markAsUnpaid(invoiceId);
        const updated = await invoiceRepo.getInvoiceWithItems(invoiceId);
        set({ currentInvoice: updated });
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    clearCurrentInvoice: () => set({ currentInvoice: null }),
}));
