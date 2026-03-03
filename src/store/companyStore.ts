// ==========================================
// Zustand Store - Company State Management
// ==========================================

import { create } from 'zustand';
import { Company } from '../models/types';
import * as companyRepo from '../repository/companyRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CompanyStore {
    companies: Company[];
    activeCompany: Company | null;
    loading: boolean;
    loadCompanies: () => Promise<void>;
    setActiveCompany: (company: Company) => Promise<void>;
    loadActiveCompany: () => Promise<void>;
    addCompany: (company: Omit<Company, 'id'>) => Promise<number>;
    editCompany: (id: number, company: Partial<Company>) => Promise<void>;
    removeCompany: (id: number) => Promise<void>;
    refreshActiveCompany: () => Promise<void>;
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
    companies: [],
    activeCompany: null,
    loading: false,

    loadCompanies: async () => {
        set({ loading: true });
        const companies = await companyRepo.getAllCompanies();
        set({ companies, loading: false });
    },

    setActiveCompany: async (company: Company) => {
        set({ activeCompany: company });
        if (company.id) {
            await AsyncStorage.setItem('activeCompanyId', company.id.toString());
        }
    },

    loadActiveCompany: async () => {
        const idStr = await AsyncStorage.getItem('activeCompanyId');
        if (idStr) {
            const company = await companyRepo.getCompanyById(parseInt(idStr, 10));
            if (company) {
                set({ activeCompany: company });
                return;
            }
        }
        // If no saved company, load the first one
        const companies = await companyRepo.getAllCompanies();
        if (companies.length > 0) {
            set({ activeCompany: companies[0] });
            await AsyncStorage.setItem('activeCompanyId', companies[0].id!.toString());
        }
    },

    addCompany: async (company) => {
        const id = await companyRepo.createCompany(company);
        await get().loadCompanies();
        return id;
    },

    editCompany: async (id, company) => {
        await companyRepo.updateCompany(id, company);
        await get().loadCompanies();
        // Refresh active company if it's the one being edited
        const active = get().activeCompany;
        if (active && active.id === id) {
            await get().refreshActiveCompany();
        }
    },

    removeCompany: async (id) => {
        await companyRepo.deleteCompany(id);
        const active = get().activeCompany;
        if (active && active.id === id) {
            set({ activeCompany: null });
            await AsyncStorage.removeItem('activeCompanyId');
        }
        await get().loadCompanies();
        // Set first available company as active
        if (get().activeCompany === null) {
            const companies = get().companies;
            if (companies.length > 0) {
                await get().setActiveCompany(companies[0]);
            }
        }
    },

    refreshActiveCompany: async () => {
        const active = get().activeCompany;
        if (active?.id) {
            const updated = await companyRepo.getCompanyById(active.id);
            if (updated) {
                set({ activeCompany: updated });
            }
        }
    },
}));
