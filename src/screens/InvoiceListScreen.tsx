// ==========================================
// Invoice List Screen
// With filter chips and improved empty states
// ==========================================

import React, { useCallback, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Searchbar, Card, Text, useTheme, Chip, Surface, Button } from 'react-native-paper';
import { useCompanyStore } from '../store/companyStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { formatCurrency } from '../utils/calculator';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Invoice, PaymentStatus } from '../models/types';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; icon: string }> = {
    PAID: { label: 'PAID', color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle' },
    PARTIAL: { label: 'PARTIAL', color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline' },
    UNPAID: { label: 'UNPAID', color: '#C62828', bg: '#FFEBEE', icon: 'alert-circle-outline' },
};

type FilterOption = 'ALL' | PaymentStatus;

const FILTER_OPTIONS: { key: FilterOption; label: string; icon: string }[] = [
    { key: 'ALL', label: 'All', icon: 'format-list-bulleted' },
    { key: 'UNPAID', label: 'Unpaid', icon: 'alert-circle-outline' },
    { key: 'PARTIAL', label: 'Partial', icon: 'clock-outline' },
    { key: 'PAID', label: 'Paid', icon: 'check-circle' },
];

const PAGE_SIZE = 20;

export default function InvoiceListScreen({ navigation }: any) {
    const theme = useTheme();
    const { activeCompany } = useCompanyStore();
    const { invoices, loading, totalCount, loadInvoices, loadMoreInvoices, searchQuery, setSearchQuery } = useInvoiceStore();
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

    useFocusEffect(
        useCallback(() => {
            if (activeCompany?.id) {
                loadInvoices(activeCompany.id, searchQuery);
            }
        }, [activeCompany?.id, searchQuery])
    );

    // Client-side filter — we already have all loaded invoices
    const filteredInvoices = useMemo(() => {
        if (activeFilter === 'ALL') return invoices;
        return invoices.filter(inv => inv.paymentStatus === activeFilter);
    }, [invoices, activeFilter]);

    // Count by status for filter badges
    const statusCounts = useMemo(() => {
        const counts = { ALL: invoices.length, PAID: 0, PARTIAL: 0, UNPAID: 0 };
        invoices.forEach(inv => {
            const s = inv.paymentStatus || 'UNPAID';
            if (s in counts) counts[s as PaymentStatus]++;
        });
        return counts;
    }, [invoices]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (activeCompany?.id) {
            await loadInvoices(activeCompany.id, searchQuery);
        }
        setRefreshing(false);
    };

    const loadMore = () => {
        if (invoices.length < totalCount && activeCompany?.id) {
            loadMoreInvoices(activeCompany.id, searchQuery, invoices.length);
        }
    };

    const renderItem = ({ item }: { item: Invoice }) => {
        const statusCfg = STATUS_CONFIG[item.paymentStatus] || STATUS_CONFIG.UNPAID;

        return (
            <Card
                style={[styles.card, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
            >
                <Card.Content>
                    <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                                {item.clientName}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                {item.invoiceNumber}
                            </Text>
                        </View>
                        <Chip
                            mode="flat"
                            compact
                            icon={() => (
                                <MaterialCommunityIcons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                            )}
                            style={{
                                backgroundColor: statusCfg.bg,
                            }}
                            textStyle={{
                                color: statusCfg.color,
                                fontSize: 10,
                                fontWeight: '600',
                            }}
                        >
                            {statusCfg.label}
                        </Chip>
                    </View>

                    <View style={styles.cardBottom}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>
                                {formatCurrency(item.grandTotal)}
                            </Text>
                            {item.paymentStatus !== 'PAID' && item.balance > 0 && (
                                <Text variant="labelSmall" style={{ color: '#FF6B6B' }}>
                                    Due: {formatCurrency(item.balance)}
                                </Text>
                            )}
                        </View>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    if (!activeCompany) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <MaterialCommunityIcons name="office-building-outline" size={64} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, fontWeight: '600' }}>
                    No company selected
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                    Go to the Profile tab to add or select a company
                </Text>
            </View>
        );
    }

    const isEmptyState = invoices.length === 0 && !loading;
    const isFilterEmpty = filteredInvoices.length === 0 && invoices.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder="Search by client name or invoice #"
                onChangeText={handleSearch}
                value={searchQuery}
                style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
                elevation={1}
            />

            {/* Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                {FILTER_OPTIONS.map((filter) => {
                    const isActive = activeFilter === filter.key;
                    const count = statusCounts[filter.key];
                    return (
                        <Chip
                            key={filter.key}
                            mode={isActive ? 'flat' : 'outlined'}
                            selected={isActive}
                            compact
                            onPress={() => setActiveFilter(filter.key)}
                            icon={() => (
                                <MaterialCommunityIcons
                                    name={filter.icon as any}
                                    size={14}
                                    color={isActive ? '#FFFFFF' : theme.colors.onSurfaceVariant}
                                />
                            )}
                            style={[
                                styles.filterChip,
                                isActive && { backgroundColor: theme.colors.primary },
                                !isActive && { borderColor: theme.colors.outlineVariant },
                            ]}
                            textStyle={[
                                { fontWeight: '600', fontSize: 11 },
                                isActive && { color: '#FFFFFF' },
                                !isActive && { color: theme.colors.onSurfaceVariant },
                            ]}
                        >
                            {filter.label} ({count})
                        </Chip>
                    );
                })}
            </ScrollView>

            {isEmptyState ? (
                /* ─── Empty State: No invoices at all ─── */
                <View style={styles.center}>
                    <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <MaterialCommunityIcons name="file-document-plus-outline" size={64} color={theme.colors.primary} />
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: 16, fontWeight: '700' }}>
                            {searchQuery ? 'No invoices found' : 'No invoices yet!'}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }}>
                            {searchQuery
                                ? 'Try a different search term or clear the search'
                                : 'Create your first invoice by tapping the button below. It only takes a minute!'}
                        </Text>
                        {!searchQuery && (
                            <Button
                                mode="contained"
                                icon="plus"
                                onPress={() => navigation.navigate('CreateInvoice')}
                                style={{ marginTop: 20, borderRadius: 12 }}
                                contentStyle={{ paddingVertical: 4 }}
                            >
                                Create First Invoice
                            </Button>
                        )}
                    </Surface>
                </View>
            ) : isFilterEmpty ? (
                /* ─── Empty State: Filter has no results ─── */
                <View style={styles.center}>
                    <MaterialCommunityIcons
                        name={FILTER_OPTIONS.find(f => f.key === activeFilter)?.icon as any || 'filter-outline'}
                        size={48}
                        color={theme.colors.onSurfaceVariant}
                    />
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12, fontWeight: '600' }}>
                        No {activeFilter.toLowerCase()} invoices
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => setActiveFilter('ALL')}
                        style={{ marginTop: 8 }}
                    >
                        Show All Invoices
                    </Button>
                </View>
            ) : (
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={(item) => item.id?.toString() || ''}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListFooterComponent={
                        invoices.length < totalCount ? (
                            <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 16 }}>
                                Loading more...
                            </Text>
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    searchBar: { marginHorizontal: 16, marginTop: 10, marginBottom: 2, borderRadius: 12 },
    filterRow: {
        paddingHorizontal: 16,
        paddingBottom: 2,
        gap: 6,
    },
    filterChip: {
        borderRadius: 16,
        height: 32,
    },
    list: { padding: 16, paddingTop: 4 },
    card: { borderRadius: 12, marginBottom: 10 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    emptyCard: {
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        width: '100%',
    },
});
