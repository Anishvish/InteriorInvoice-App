// ==========================================
// Invoice List Screen
// ==========================================

import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, useTheme, Chip, Surface } from 'react-native-paper';
import { useCompanyStore } from '../store/companyStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { formatCurrency } from '../utils/calculator';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Invoice } from '../models/types';

const PAGE_SIZE = 20;

export default function InvoiceListScreen({ navigation }: any) {
    const theme = useTheme();
    const { activeCompany } = useCompanyStore();
    const { invoices, loading, totalCount, loadInvoices, loadMoreInvoices, searchQuery, setSearchQuery } = useInvoiceStore();
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (activeCompany?.id) {
                loadInvoices(activeCompany.id, searchQuery);
            }
        }, [activeCompany?.id, searchQuery])
    );

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
        const isPaid = item.balance <= 0;

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
                            style={{
                                backgroundColor: isPaid ? '#E8F5E9' : '#FFF3E0',
                            }}
                            textStyle={{
                                color: isPaid ? '#2E7D32' : '#E65100',
                                fontSize: 10,
                                fontWeight: '600',
                            }}
                        >
                            {isPaid ? 'PAID' : 'PENDING'}
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
                            {!isPaid && (
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
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    No company selected
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder="Search by client name or invoice #"
                onChangeText={handleSearch}
                value={searchQuery}
                style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
                elevation={1}
            />

            {invoices.length === 0 && !loading ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="file-document-outline" size={64} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                        {searchQuery ? 'No invoices found' : 'No invoices yet'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={invoices}
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
    searchBar: { margin: 16, marginBottom: 8, borderRadius: 12 },
    list: { padding: 16, paddingTop: 8 },
    card: { borderRadius: 12, marginBottom: 10 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
});
