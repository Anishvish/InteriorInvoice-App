// ==========================================
// Isolated Invoice Summary Component
// Re-renders only when items/totals change,
// without triggering item card re-renders.
// ==========================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text, useTheme, Surface, Divider } from 'react-native-paper';
import { Controller, useWatch, Control } from 'react-hook-form';
import { calculateArea, calculateLineTotal, calculateInvoiceTotals, formatCurrency } from '../utils/calculator';
import { InvoiceItem } from '../models/types';

interface InvoiceSummaryProps {
    control: Control<any>;
    hasGST: boolean;
}

export default function InvoiceSummary({ control, hasGST }: InvoiceSummaryProps) {
    const theme = useTheme();

    // These watches are isolated to this component — changing items
    // will re-render this summary, but NOT the parent or sibling ItemCards
    const watchedItems = useWatch({ control, name: 'items' }) || [];
    const watchedAdvance = useWatch({ control, name: 'advance' }) || '0';
    const watchedGstPercent = useWatch({ control, name: 'gstPercent' }) || '18';

    const partialItems = watchedItems.map((item: any) => {
        const isInchesOnly = item.measurementUnit === 'INCHES_ONLY';
        return {
            calculationMode: item.calculationMode,
            lengthFeet: isInchesOnly ? 0 : (parseFloat(item.lengthFeet) || 0),
            lengthInches: parseFloat(item.lengthInches) || 0,
            widthFeet: isInchesOnly ? 0 : (parseFloat(item.widthFeet) || 0),
            widthInches: parseFloat(item.widthInches) || 0,
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
        };
    });

    const totals = calculateInvoiceTotals(
        partialItems,
        hasGST,
        parseFloat(watchedGstPercent) || 0,
        parseFloat(watchedAdvance) || 0
    );

    return (
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Summary
            </Text>

            <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Subtotal</Text>
                <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{formatCurrency(totals.subtotal)}</Text>
            </View>

            {hasGST && (
                <View style={styles.summaryRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>GST </Text>
                        <Controller
                            control={control}
                            name="gstPercent"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    right={<TextInput.Affix text="%" />}
                                    style={{ width: 80, marginLeft: 8 }}
                                    dense
                                />
                            )}
                        />
                    </View>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{formatCurrency(totals.gstAmount)}</Text>
                </View>
            )}

            <Divider style={{ marginVertical: 8 }} />

            <View style={styles.summaryRow}>
                <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>Grand Total</Text>
                <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>{formatCurrency(totals.grandTotal)}</Text>
            </View>

            <Controller
                control={control}
                name="advance"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        label="Advance Paid"
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        keyboardType="numeric"
                        left={<TextInput.Affix text="₹" />}
                        style={styles.input}
                    />
                )}
            />

            <View style={styles.summaryRow}>
                <Text variant="titleSmall" style={{ fontWeight: '700', color: totals.balance > 0 ? '#FF6B6B' : '#4CAF50' }}>
                    Balance Due
                </Text>
                <Text variant="titleSmall" style={{ fontWeight: '700', color: totals.balance > 0 ? '#FF6B6B' : '#4CAF50' }}>
                    {formatCurrency(totals.balance)}
                </Text>
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    section: { borderRadius: 16, padding: 20, marginBottom: 16 },
    sectionTitle: { fontWeight: '700', marginBottom: 16 },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    input: { marginBottom: 10 },
});
