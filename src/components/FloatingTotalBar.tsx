// ==========================================
// Floating Running Total Bar
// Shows total while scrolling invoice items
// ==========================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { useWatch, Control } from 'react-hook-form';
import { calculateInvoiceTotals, formatCurrency } from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FloatingTotalBarProps {
    control: Control<any>;
    hasGST: boolean;
    itemCount: number;
}

export default function FloatingTotalBar({ control, hasGST, itemCount }: FloatingTotalBarProps) {
    const theme = useTheme();

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
        <Surface style={[styles.bar, { backgroundColor: theme.colors.inverseSurface }]} elevation={4}>
            <View style={styles.left}>
                <MaterialCommunityIcons name="receipt" size={16} color={theme.colors.inverseOnSurface} />
                <Text variant="labelSmall" style={{ color: theme.colors.inverseOnSurface, marginLeft: 6, opacity: 0.8 }}>
                    {itemCount} items
                </Text>
            </View>
            <View style={styles.right}>
                <Text variant="labelSmall" style={{ color: theme.colors.inverseOnSurface, opacity: 0.7, marginRight: 6 }}>
                    Total
                </Text>
                <Text variant="titleSmall" style={{ fontWeight: '800', color: theme.colors.inverseOnSurface }}>
                    {formatCurrency(totals.grandTotal)}
                </Text>
                {totals.balance > 0 && totals.balance !== totals.grandTotal && (
                    <Text variant="labelSmall" style={{ color: '#FF8A80', marginLeft: 8 }}>
                        Due {formatCurrency(totals.balance)}
                    </Text>
                )}
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        top: 0,
        left: 12,
        right: 12,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
