// ==========================================
// Invoice Detail Screen
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Surface, Button, Divider, DataTable, ActivityIndicator, IconButton } from 'react-native-paper';
import { useInvoiceStore } from '../store/invoiceStore';
import { useCompanyStore } from '../store/companyStore';
import { formatCurrency } from '../utils/calculator';
import { sharePDF, previewPDF } from '../services/pdfService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toast } from '../components/Toast';

export default function InvoiceDetailScreen({ navigation, route }: any) {
    const theme = useTheme();
    const { invoiceId } = route.params;
    const { currentInvoice, loadInvoiceDetail, removeInvoice, clearCurrentInvoice, loading } = useInvoiceStore();
    const { activeCompany } = useCompanyStore();
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        loadInvoiceDetail(invoiceId);
        return () => clearCurrentInvoice();
    }, [invoiceId]);

    // Reload when returning from edit screen
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadInvoiceDetail(invoiceId);
        });
        return unsubscribe;
    }, [navigation, invoiceId]);

    const handleEdit = () => {
        navigation.navigate('EditInvoice', { invoiceId });
    };

    const handlePreviewPDF = async () => {
        if (!currentInvoice || !activeCompany) return;
        setPdfLoading(true);
        try {
            await previewPDF(currentInvoice, activeCompany);
        } catch (error) {
            toast.error('Failed to preview PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleSharePDF = async () => {
        if (!currentInvoice || !activeCompany) return;
        setPdfLoading(true);
        try {
            await sharePDF(currentInvoice, activeCompany);
        } catch (error) {
            toast.error('Failed to share PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await removeInvoice(invoiceId);
                    navigation.goBack();
                },
            },
        ]);
    };

    if (loading || !currentInvoice) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const invoice = currentInvoice;
    const isGST = activeCompany?.hasGST && invoice.gstAmount > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Invoice Header */}
                <Surface style={[styles.headerCard, { backgroundColor: theme.colors.primary }]} elevation={3}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                {isGST ? 'TAX INVOICE' : 'INVOICE'}
                            </Text>
                            <Text variant="headlineSmall" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                                {invoice.invoiceNumber}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.7)' }}>Date</Text>
                            <Text variant="bodyMedium" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                                {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </Text>
                        </View>
                    </View>
                </Surface>

                {/* Client Info */}
                <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <View style={styles.sectionRow}>
                        <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.primary} />
                        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                            Bill To
                        </Text>
                    </View>
                    <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                        {invoice.clientName}
                    </Text>
                    {invoice.clientPhone ? (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>📱 {invoice.clientPhone}</Text>
                    ) : null}
                    {invoice.clientAddress ? (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>📍 {invoice.clientAddress}</Text>
                    ) : null}
                </Surface>

                {/* Items Table */}
                <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <View style={styles.sectionRow}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={20} color={theme.colors.primary} />
                        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                            Items
                        </Text>
                    </View>

                    {invoice.items.map((item, index) => (
                        <View key={item.id || index} style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                                <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                                    {index + 1}. {item.description || 'Item'}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {item.calculationMode === 'AREA'
                                        ? `${item.lengthFeet}'${item.lengthInches}" × ${item.widthFeet}'${item.widthInches}" = ${item.area.toFixed(2)} sqft`
                                        : 'Direct'}
                                    {' • '}Qty: {item.quantity} × {formatCurrency(item.rate)}
                                </Text>
                            </View>
                            <Text variant="bodyMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
                                {formatCurrency(item.lineTotal)}
                            </Text>
                        </View>
                    ))}
                </Surface>

                {/* Totals */}
                <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <View style={styles.totalRow}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Subtotal</Text>
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                            {formatCurrency(invoice.subtotal)}
                        </Text>
                    </View>

                    {isGST && (
                        <View style={styles.totalRow}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                GST ({invoice.gstPercent}%)
                            </Text>
                            <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                                {formatCurrency(invoice.gstAmount)}
                            </Text>
                        </View>
                    )}

                    <Divider style={{ marginVertical: 8 }} />

                    <View style={styles.totalRow}>
                        <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>Grand Total</Text>
                        <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
                            {formatCurrency(invoice.grandTotal)}
                        </Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Advance Paid</Text>
                        <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#4CAF50' }}>
                            - {formatCurrency(invoice.advance)}
                        </Text>
                    </View>

                    <Divider style={{ marginVertical: 8 }} />

                    <View style={styles.totalRow}>
                        <Text variant="titleSmall" style={{ fontWeight: '700', color: invoice.balance > 0 ? '#FF6B6B' : '#4CAF50' }}>
                            Balance Due
                        </Text>
                        <Text variant="titleSmall" style={{ fontWeight: '700', color: invoice.balance > 0 ? '#FF6B6B' : '#4CAF50' }}>
                            {formatCurrency(invoice.balance)}
                        </Text>
                    </View>
                </Surface>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <Button
                        mode="contained"
                        icon="pencil-outline"
                        onPress={handleEdit}
                        style={[styles.actionBtn, { flex: 1 }]}
                        contentStyle={styles.actionBtnContent}
                    >
                        Edit
                    </Button>
                    <Button
                        mode="contained"
                        icon="printer"
                        onPress={handlePreviewPDF}
                        loading={pdfLoading}
                        style={[styles.actionBtn, { flex: 1, marginLeft: 8 }]}
                        contentStyle={styles.actionBtnContent}
                    >
                        Preview
                    </Button>
                    <Button
                        mode="contained-tonal"
                        icon="share-variant"
                        onPress={handleSharePDF}
                        loading={pdfLoading}
                        style={[styles.actionBtn, { flex: 1, marginLeft: 8 }]}
                        contentStyle={styles.actionBtnContent}
                    >
                        Share
                    </Button>
                </View>

                <Button
                    mode="outlined"
                    icon="delete-outline"
                    onPress={handleDelete}
                    textColor={theme.colors.error}
                    style={[styles.deleteBtn, { borderColor: theme.colors.error }]}
                >
                    Delete Invoice
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    headerCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    section: { borderRadius: 16, padding: 16, marginBottom: 12 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionLabel: { fontWeight: '700', marginLeft: 8 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    itemLeft: { flex: 1, marginRight: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    actionsRow: { flexDirection: 'row', marginBottom: 12 },
    actionBtn: { borderRadius: 12 },
    actionBtnContent: { paddingVertical: 6 },
    deleteBtn: { borderRadius: 12 },
});
