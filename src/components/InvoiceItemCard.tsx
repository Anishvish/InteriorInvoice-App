// ==========================================
// Memoized Invoice Item Card Component
// Features: Collapsible, Duplicate, Auto-focus
// ==========================================

import React, { memo, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, LayoutAnimation, Platform, UIManager, TextInput as RNTextInput } from 'react-native';
import {
    TextInput, Text, useTheme, Surface, SegmentedButtons,
    IconButton, Card, TouchableRipple,
} from 'react-native-paper';
import { Controller, useWatch, Control } from 'react-hook-form';
import { calculateArea, calculateLineTotal, formatCurrency } from '../utils/calculator';
import { InvoiceItem } from '../models/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ItemForm {
    description: string;
    calculationMode: 'AREA' | 'DIRECT';
    measurementUnit: 'FEET_INCHES' | 'INCHES_ONLY';
    lengthFeet: string;
    lengthInches: string;
    widthFeet: string;
    widthInches: string;
    quantity: string;
    rate: string;
}

interface InvoiceItemCardProps {
    index: number;
    control: Control<any>;
    remove: (index: number) => void;
    duplicate: (index: number) => void;
    fieldsLength: number;
    isNew?: boolean;
    defaultExpanded?: boolean;
}

function getItemCalcs(item: ItemForm) {
    let lFeet = parseFloat(item.lengthFeet) || 0;
    let lInches = parseFloat(item.lengthInches) || 0;
    let wFeet = parseFloat(item.widthFeet) || 0;
    let wInches = parseFloat(item.widthInches) || 0;

    if (item.measurementUnit === 'INCHES_ONLY') {
        lFeet = 0;
        wFeet = 0;
    }

    const partialItem: Partial<InvoiceItem> = {
        calculationMode: item.calculationMode,
        lengthFeet: lFeet,
        lengthInches: lInches,
        widthFeet: wFeet,
        widthInches: wInches,
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
    };
    const area = item.calculationMode === 'AREA'
        ? calculateArea(lFeet, lInches, wFeet, wInches)
        : 0;
    const lineTotal = calculateLineTotal(partialItem);
    return { area, lineTotal };
}

function InvoiceItemCardInner({ index, control, remove, duplicate, fieldsLength, isNew, defaultExpanded }: InvoiceItemCardProps) {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(defaultExpanded !== false);
    const descriptionRef = useRef<RNTextInput>(null);

    // Watch ONLY this item's fields
    const item = useWatch({ control, name: `items.${index}` }) as ItemForm | undefined;
    const calcs = item ? getItemCalcs(item) : { area: 0, lineTotal: 0 };

    // Auto-focus description field on new items
    useEffect(() => {
        if (isNew && expanded) {
            const timer = setTimeout(() => {
                descriptionRef.current?.focus();
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [isNew]);

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const hasContent = !!(item?.description || calcs.lineTotal > 0);

    // ─── COLLAPSED VIEW ─────────────────────────────
    if (!expanded) {
        return (
            <Card style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
                <TouchableRipple onPress={toggleExpanded} borderless style={{ borderRadius: 16 }}>
                    <View style={styles.collapsedContent}>
                        <View style={styles.collapsedLeft}>
                            <View style={[styles.itemBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                                    {index + 1}
                                </Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text
                                    variant="bodyMedium"
                                    style={{ fontWeight: '600', color: theme.colors.onSurface }}
                                    numberOfLines={1}
                                >
                                    {item?.description || 'Untitled Item'}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    {item?.calculationMode === 'AREA' ? `${calcs.area.toFixed(1)} sqft` : 'Direct'}
                                    {' • '}Qty: {item?.quantity || '0'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>
                                {formatCurrency(calcs.lineTotal)}
                            </Text>
                            <MaterialCommunityIcons
                                name="chevron-down"
                                size={18}
                                color={theme.colors.onSurfaceVariant}
                                style={{ marginTop: 2 }}
                            />
                        </View>
                    </View>
                </TouchableRipple>
            </Card>
        );
    }

    // ─── EXPANDED VIEW ──────────────────────────────
    return (
        <Card style={[styles.itemCard, styles.itemCardExpanded, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary + '30' }]}>
            <Card.Content>
                {/* Header Row: tap to collapse, actions on right */}
                <TouchableRipple onPress={toggleExpanded} borderless style={{ borderRadius: 8, marginBottom: 8 }}>
                    <View style={styles.itemHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={[styles.itemBadge, { backgroundColor: theme.colors.primary }]}>
                                <Text variant="labelSmall" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                                    {index + 1}
                                </Text>
                            </View>
                            <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.primary, marginLeft: 8 }}>
                                {item?.description || `Item #${index + 1}`}
                            </Text>
                            <MaterialCommunityIcons
                                name="chevron-up"
                                size={18}
                                color={theme.colors.primary}
                                style={{ marginLeft: 4 }}
                            />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <IconButton
                                icon="content-copy"
                                size={18}
                                iconColor={theme.colors.primary}
                                onPress={() => duplicate(index)}
                                style={{ margin: 0 }}
                            />
                            {fieldsLength > 1 && (
                                <IconButton
                                    icon="close-circle"
                                    size={18}
                                    iconColor={theme.colors.error}
                                    onPress={() => remove(index)}
                                    style={{ margin: 0 }}
                                />
                            )}
                        </View>
                    </View>
                </TouchableRipple>

                <Controller
                    control={control}
                    name={`items.${index}.description`}
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            ref={descriptionRef as any}
                            label="Description"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            style={styles.input}
                            dense
                        />
                    )}
                />

                <Controller
                    control={control}
                    name={`items.${index}.calculationMode`}
                    render={({ field: { onChange, value } }) => (
                        <SegmentedButtons
                            value={value}
                            onValueChange={onChange}
                            buttons={[
                                { value: 'AREA', label: 'Area Mode', icon: 'rectangle-outline' },
                                { value: 'DIRECT', label: 'Direct Mode', icon: 'calculator' },
                            ]}
                            style={styles.segmented}
                        />
                    )}
                />

                {item?.calculationMode === 'AREA' && (
                    <>
                        <Controller
                            control={control}
                            name={`items.${index}.measurementUnit`}
                            render={({ field: { onChange, value } }) => (
                                <SegmentedButtons
                                    value={value || 'FEET_INCHES'}
                                    onValueChange={onChange}
                                    buttons={[
                                        { value: 'FEET_INCHES', label: "Feet & Inches", icon: 'ruler' },
                                        { value: 'INCHES_ONLY', label: 'Inches Only', icon: 'ruler-square' },
                                    ]}
                                    style={{ marginBottom: 12 }}
                                    density="small"
                                />
                            )}
                        />

                        {item?.measurementUnit === 'INCHES_ONLY' ? (
                            <View style={styles.row}>
                                <Controller
                                    control={control}
                                    name={`items.${index}.lengthInches`}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            label="Length (inches)"
                                            value={value}
                                            onChangeText={onChange}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            style={[styles.input, { flex: 1 }]}
                                            dense
                                        />
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name={`items.${index}.widthInches`}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            label="Width (inches)"
                                            value={value}
                                            onChangeText={onChange}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            style={[styles.input, { flex: 1, marginLeft: 8 }]}
                                            dense
                                        />
                                    )}
                                />
                            </View>
                        ) : (
                            <>
                                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, marginBottom: 4 }}>
                                    Length
                                </Text>
                                <View style={styles.row}>
                                    <Controller
                                        control={control}
                                        name={`items.${index}.lengthFeet`}
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
                                                label="Feet"
                                                value={value}
                                                onChangeText={onChange}
                                                mode="outlined"
                                                keyboardType="numeric"
                                                style={[styles.input, { flex: 1 }]}
                                                dense
                                            />
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name={`items.${index}.lengthInches`}
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
                                                label="Inches"
                                                value={value}
                                                onChangeText={onChange}
                                                mode="outlined"
                                                keyboardType="numeric"
                                                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                                                dense
                                            />
                                        )}
                                    />
                                </View>

                                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                                    Width
                                </Text>
                                <View style={styles.row}>
                                    <Controller
                                        control={control}
                                        name={`items.${index}.widthFeet`}
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
                                                label="Feet"
                                                value={value}
                                                onChangeText={onChange}
                                                mode="outlined"
                                                keyboardType="numeric"
                                                style={[styles.input, { flex: 1 }]}
                                                dense
                                            />
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name={`items.${index}.widthInches`}
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
                                                label="Inches"
                                                value={value}
                                                onChangeText={onChange}
                                                mode="outlined"
                                                keyboardType="numeric"
                                                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                                                dense
                                            />
                                        )}
                                    />
                                </View>
                            </>
                        )}

                        <Surface style={[styles.calcResult, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                Calculated Area: <Text style={{ fontWeight: '700', color: theme.colors.primary }}>{calcs.area.toFixed(2)} sq.ft</Text>
                            </Text>
                        </Surface>
                    </>
                )}

                <View style={styles.row}>
                    <Controller
                        control={control}
                        name={`items.${index}.quantity`}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label="Quantity"
                                value={value}
                                onChangeText={onChange}
                                mode="outlined"
                                keyboardType="numeric"
                                style={[styles.input, { flex: 1 }]}
                                dense
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name={`items.${index}.rate`}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label={item?.calculationMode === 'AREA' ? 'Rate (per sqft)' : 'Rate'}
                                value={value}
                                onChangeText={onChange}
                                mode="outlined"
                                keyboardType="numeric"
                                left={<TextInput.Affix text="₹" />}
                                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                                dense
                            />
                        )}
                    />
                </View>

                <Surface style={[styles.lineTotal, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                    <Text variant="bodyMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
                        Line Total: {formatCurrency(calcs.lineTotal)}
                    </Text>
                </Surface>

                {/* Quick action row at bottom */}
                <View style={styles.bottomActions}>
                    <TouchableRipple
                        onPress={() => duplicate(index)}
                        borderless
                        style={[styles.quickAction, { backgroundColor: theme.colors.primaryContainer + '60' }]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="content-copy" size={14} color={theme.colors.primary} />
                            <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4, fontWeight: '600' }}>
                                Duplicate
                            </Text>
                        </View>
                    </TouchableRipple>

                    <TouchableRipple
                        onPress={toggleExpanded}
                        borderless
                        style={[styles.quickAction, { backgroundColor: theme.colors.surfaceVariant + '80' }]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="chevron-up" size={14} color={theme.colors.onSurfaceVariant} />
                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4, fontWeight: '600' }}>
                                Collapse
                            </Text>
                        </View>
                    </TouchableRipple>
                </View>
            </Card.Content>
        </Card>
    );
}

export const InvoiceItemCard = memo(InvoiceItemCardInner);

const styles = StyleSheet.create({
    itemCard: { borderRadius: 16, marginBottom: 8 },
    itemCardExpanded: { borderWidth: 1 },
    collapsedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    collapsedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    itemBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    input: { marginBottom: 10 },
    row: { flexDirection: 'row' },
    segmented: { marginBottom: 12 },
    calcResult: { borderRadius: 8, padding: 10, marginBottom: 8 },
    lineTotal: { borderRadius: 8, padding: 12, alignItems: 'center' },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
    },
    quickAction: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
});
