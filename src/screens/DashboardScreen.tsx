// ==========================================
// Dashboard Screen
// With payment status stats
// ==========================================

import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, FAB, useTheme, Surface, Divider, Chip } from 'react-native-paper';
import { useCompanyStore } from '../store/companyStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { formatCurrency } from '../utils/calculator';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentStatus } from '../models/types';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; icon: string }> = {
    PAID: { label: 'PAID', color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle' },
    PARTIAL: { label: 'PARTIAL', color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline' },
    UNPAID: { label: 'UNPAID', color: '#C62828', bg: '#FFEBEE', icon: 'alert-circle-outline' },
};

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

    const stats = dashboardStats || {
        totalInvoices: 0, totalRevenue: 0, totalPending: 0, totalCollected: 0,
        paidInvoices: 0, partialInvoices: 0, unpaidInvoices: 0, recentInvoices: [],
    };

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

                {/* Revenue Stats */}
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
                    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <MaterialCommunityIcons name="cash-check" size={28} color="#4CAF50" />
                        <Text variant="headlineMedium" style={[styles.statValue, { color: '#4CAF50' }]}>
                            {formatCurrency(stats.totalCollected)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Collected</Text>
                    </Surface>

                    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <MaterialCommunityIcons name="clock-alert-outline" size={28} color="#FF6B6B" />
                        <Text variant="headlineMedium" style={[styles.statValue, { color: '#FF6B6B' }]}>
                            {formatCurrency(stats.totalPending)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Pending</Text>
                    </Surface>
                </View>

                {/* Payment Status Breakdown */}
                <Surface style={[styles.statusBreakdown, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface, marginBottom: 12 }}>
                        Payment Status
                    </Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusItem, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#2E7D32" />
                            <Text variant="titleMedium" style={{ fontWeight: '700', color: '#2E7D32' }}>
                                {stats.paidInvoices}
                            </Text>
                            <Text variant="labelSmall" style={{ color: '#2E7D32' }}>Paid</Text>
                        </View>
                        <View style={[styles.statusItem, { backgroundColor: '#FFF3E0' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#E65100" />
                            <Text variant="titleMedium" style={{ fontWeight: '700', color: '#E65100' }}>
                                {stats.partialInvoices}
                            </Text>
                            <Text variant="labelSmall" style={{ color: '#E65100' }}>Partial</Text>
                        </View>
                        <View style={[styles.statusItem, { backgroundColor: '#FFEBEE' }]}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#C62828" />
                            <Text variant="titleMedium" style={{ fontWeight: '700', color: '#C62828' }}>
                                {stats.unpaidInvoices}
                            </Text>
                            <Text variant="labelSmall" style={{ color: '#C62828' }}>Unpaid</Text>
                        </View>
                    </View>
                </Surface>

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
                    stats.recentInvoices.map((invoice) => {
                        const statusCfg = STATUS_CONFIG[invoice.paymentStatus] || STATUS_CONFIG.UNPAID;
                        return (
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
                                        <Chip
                                            mode="flat"
                                            compact
                                            style={{
                                                backgroundColor: statusCfg.bg,
                                                marginTop: 4,
                                                height: 22,
                                            }}
                                            textStyle={{
                                                color: statusCfg.color,
                                                fontSize: 9,
                                                fontWeight: '700',
                                            }}
                                        >
                                            {statusCfg.label}
                                        </Chip>
                                    </View>
                                </Card.Content>
                            </Card>
                        );
                    })
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
    statusBreakdown: { borderRadius: 16, padding: 16, marginBottom: 12 },
    statusRow: { flexDirection: 'row', gap: 8 },
    statusItem: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },
    sectionHeader: { marginTop: 8, marginBottom: 12 },
    emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center' },
    invoiceCard: { borderRadius: 12, marginBottom: 8 },
    invoiceCardContent: { flexDirection: 'row', alignItems: 'center' },
    fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
});
