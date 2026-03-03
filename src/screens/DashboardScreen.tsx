// ==========================================
// Dashboard Screen
// ==========================================

import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, FAB, useTheme, Surface, Divider } from 'react-native-paper';
import { useCompanyStore } from '../store/companyStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { formatCurrency } from '../utils/calculator';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
    const theme = useTheme();
    const { activeCompany } = useCompanyStore();
    const { dashboardStats, loadDashboardStats, loading } = useInvoiceStore();
    const [refreshing, setRefreshing] = React.useState(false);

    const loadData = useCallback(async () => {
        if (activeCompany?.id) {
            await loadDashboardStats(activeCompany.id);
        }
    }, [activeCompany?.id]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    if (!activeCompany) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <MaterialCommunityIcons name="office-building-outline" size={64} color={theme.colors.primary} />
                <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, marginTop: 16 }}>
                    No Company Selected
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    Please add or select a company to get started
                </Text>
            </View>
        );
    }

    const stats = dashboardStats || { totalInvoices: 0, totalRevenue: 0, totalPending: 0, recentInvoices: [] };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {/* Company Header */}
                <Surface style={[styles.companyHeader, { backgroundColor: theme.colors.primary }]} elevation={3}>
                    <View style={styles.companyHeaderContent}>
                        <MaterialCommunityIcons name="domain" size={32} color="#FFFFFF" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text variant="titleLarge" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                                {activeCompany.companyName}
                            </Text>
                            <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                {activeCompany.hasGST ? `GSTIN: ${activeCompany.gstNumber}` : 'Non-GST Company'}
                            </Text>
                        </View>
                    </View>
                </Surface>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <MaterialCommunityIcons name="file-document-outline" size={28} color={theme.colors.primary} />
                        <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.primary }]}>
                            {stats.totalInvoices}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Total Invoices</Text>
                    </Surface>

                    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <MaterialCommunityIcons name="currency-inr" size={28} color="#4CAF50" />
                        <Text variant="headlineMedium" style={[styles.statValue, { color: '#4CAF50' }]}>
                            {formatCurrency(stats.totalRevenue)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Total Revenue</Text>
                    </Surface>
                </View>

                <View style={styles.statsRow}>
                    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface, flex: 1 }]} elevation={1}>
                        <MaterialCommunityIcons name="clock-alert-outline" size={28} color="#FF6B6B" />
                        <Text variant="headlineMedium" style={[styles.statValue, { color: '#FF6B6B' }]}>
                            {formatCurrency(stats.totalPending)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Pending Balance</Text>
                    </Surface>
                </View>

                {/* Recent Invoices */}
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onBackground }}>
                        Recent Invoices
                    </Text>
                </View>

                {stats.recentInvoices.length === 0 ? (
                    <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <MaterialCommunityIcons name="receipt" size={48} color={theme.colors.onSurfaceVariant} />
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                            No invoices yet. Create your first invoice!
                        </Text>
                    </Surface>
                ) : (
                    stats.recentInvoices.map((invoice) => (
                        <Card
                            key={invoice.id}
                            style={[styles.invoiceCard, { backgroundColor: theme.colors.surface }]}
                            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
                        >
                            <Card.Content style={styles.invoiceCardContent}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                                        {invoice.clientName}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        {invoice.invoiceNumber} • {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>
                                        {formatCurrency(invoice.grandTotal)}
                                    </Text>
                                    {invoice.balance > 0 && (
                                        <Text variant="labelSmall" style={{ color: '#FF6B6B' }}>
                                            Due: {formatCurrency(invoice.balance)}
                                        </Text>
                                    )}
                                </View>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#FFFFFF"
                onPress={() => navigation.navigate('CreateInvoice')}
                label="New Invoice"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    companyHeader: { borderRadius: 16, padding: 20, marginBottom: 16 },
    companyHeaderContent: { flexDirection: 'row', alignItems: 'center' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
    statValue: { fontWeight: '700', marginTop: 8, marginBottom: 4, fontSize: 18 },
    sectionHeader: { marginTop: 8, marginBottom: 12 },
    emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center' },
    invoiceCard: { borderRadius: 12, marginBottom: 8 },
    invoiceCardContent: { flexDirection: 'row', alignItems: 'center' },
    fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
});
