// ==========================================
// Invoice Detail Screen
// With payment status & "Record Payment" / "Mark as Paid" actions
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Surface, Button, Divider, ActivityIndicator, Chip, TextInput, Portal, Modal } from 'react-native-paper';
import { useInvoiceStore } from '../store/invoiceStore';
import { useCompanyStore } from '../store/companyStore';
import { formatCurrency } from '../utils/calculator';
import { sharePDF, previewPDF } from '../services/pdfService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toast } from '../components/Toast';
import { PaymentStatus } from '../models/types';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; icon: string }> = {
    PAID: { label: 'PAID', color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle' },
    PARTIAL: { label: 'PARTIAL', color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline' },
    UNPAID: { label: 'UNPAID', color: '#C62828', bg: '#FFEBEE', icon: 'alert-circle-outline' },
};

export default function InvoiceDetailScreen({ navigation, route }: any) {
    const theme = useTheme();
    const { invoiceId } = route.params;
    const { currentInvoice, loadInvoiceDetail, removeInvoice, clearCurrentInvoice, loading, recordPayment, markAsPaid, markAsUnpaid } = useInvoiceStore();
    const { activeCompany } = useCompanyStore();
    const [pdfLoading, setPdfLoading] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);

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

    const handleMarkAsPaid = () => {
        Alert.alert('Mark as Paid', 'This will mark the full amount as received. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark Paid',
                onPress: async () => {
                    await markAsPaid(invoiceId);
                    toast.success('Invoice marked as paid!');
                },
            },
        ]);
    };

    const handleMarkAsUnpaid = () => {
        Alert.alert('Mark as Unpaid', 'This will reset the payment to zero. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    await markAsUnpaid(invoiceId);
                    toast.success('Invoice marked as unpaid.');
                },
            },
        ]);
    };

    const handleRecordPayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        setPaymentLoading(true);
        try {
            await recordPayment(invoiceId, amount);
            toast.success(`Payment of ${formatCurrency(amount)} recorded!`);
            setPaymentModalVisible(false);
            setPaymentAmount('');
        } catch (error) {
            toast.error('Failed to record payment');
        } finally {
            setPaymentLoading(false);
        }
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
    const status = STATUS_CONFIG[invoice.paymentStatus] || STATUS_CONFIG.UNPAID;

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
                            <Chip
                                mode="flat"
                                compact
                                icon={() => <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />}
                                style={{ backgroundColor: status.bg, marginBottom: 6 }}
                                textStyle={{ color: status.color, fontSize: 11, fontWeight: '700' }}
                            >
                                {status.label}
                            </Chip>
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
                                        ? (item.lengthFeet === 0 && item.widthFeet === 0
                                            ? `${item.lengthInches}" × ${item.widthInches}" = ${item.area.toFixed(2)} sqft`
                                            : `${item.lengthFeet}'${item.lengthInches}" × ${item.widthFeet}'${item.widthInches}" = ${item.area.toFixed(2)} sqft`)
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
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Amount Received</Text>
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

                {/* Payment Actions */}
                <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <View style={styles.sectionRow}>
                        <MaterialCommunityIcons name="cash-multiple" size={20} color={theme.colors.primary} />
                        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.primary }]}>
                            Payment
                        </Text>
                        <Chip
                            mode="flat"
                            compact
                            style={{ backgroundColor: status.bg, marginLeft: 'auto' }}
                            textStyle={{ color: status.color, fontSize: 10, fontWeight: '700' }}
                        >
                            {status.label}
                        </Chip>
                    </View>

                    {invoice.paymentStatus !== 'PAID' ? (
                        <View style={styles.paymentActions}>
                            <Button
                                mode="contained"
                                icon="cash-plus"
                                onPress={() => setPaymentModalVisible(true)}
                                style={[styles.paymentBtn, { flex: 1 }]}
                                contentStyle={{ paddingVertical: 4 }}
                                buttonColor="#FF9800"
                            >
                                Record Payment
                            </Button>
                            <Button
                                mode="contained"
                                icon="check-circle"
                                onPress={handleMarkAsPaid}
                                style={[styles.paymentBtn, { flex: 1, marginLeft: 8 }]}
                                contentStyle={{ paddingVertical: 4 }}
                                buttonColor="#4CAF50"
                            >
                                Mark Paid
                            </Button>
                        </View>
                    ) : (
                        <View style={styles.paymentActions}>
                            <Surface style={[styles.paidBanner, { backgroundColor: '#E8F5E9' }]} elevation={0}>
                                <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                                <Text variant="bodyMedium" style={{ color: '#2E7D32', fontWeight: '700', marginLeft: 8 }}>
                                    Fully Paid
                                </Text>
                            </Surface>
                            <Button
                                mode="outlined"
                                icon="undo"
                                onPress={handleMarkAsUnpaid}
                                style={[styles.paymentBtn, { marginTop: 8 }]}
                                textColor={theme.colors.error}
                            >
                                Reset Payment
                            </Button>
                        </View>
                    )}
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

            {/* Record Payment Modal */}
            <Portal>
                <Modal
                    visible={paymentModalVisible}
                    onDismiss={() => {
                        setPaymentModalVisible(false);
                        setPaymentAmount('');
                    }}
                    contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
                >
                    <Text variant="titleLarge" style={{ fontWeight: '700', color: theme.colors.onSurface, marginBottom: 8 }}>
                        Record Payment
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                        Balance due: {formatCurrency(invoice.balance)}
                    </Text>

                    <TextInput
                        label="Payment Amount"
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                        mode="outlined"
                        keyboardType="numeric"
                        left={<TextInput.Affix text="₹" />}
                        style={{ marginBottom: 8 }}
                        autoFocus
                    />

                    {/* Quick fill buttons */}
                    <View style={styles.quickFillRow}>
                        <Button
                            mode="outlined"
                            compact
                            onPress={() => setPaymentAmount(invoice.balance.toString())}
                            style={styles.quickFillBtn}
                        >
                            Full Balance
                        </Button>
                        {invoice.balance > 0 && (
                            <Button
                                mode="outlined"
                                compact
                                onPress={() => setPaymentAmount(Math.round(invoice.balance / 2).toString())}
                                style={[styles.quickFillBtn, { marginLeft: 8 }]}
                            >
                                Half
                            </Button>
                        )}
                    </View>

                    <View style={styles.modalActions}>
                        <Button
                            mode="text"
                            onPress={() => {
                                setPaymentModalVisible(false);
                                setPaymentAmount('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleRecordPayment}
                            loading={paymentLoading}
                            disabled={paymentLoading}
                            buttonColor="#4CAF50"
                        >
                            Record Payment
                        </Button>
                    </View>
                </Modal>
            </Portal>
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
    paymentActions: { marginTop: 4 },
    paymentBtn: { borderRadius: 12 },
    paidBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: 16,
    },
    modal: {
        margin: 20,
        borderRadius: 20,
        padding: 24,
    },
    quickFillRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    quickFillBtn: { borderRadius: 8 },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
});
