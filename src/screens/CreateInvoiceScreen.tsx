// ==========================================
// Create / Edit Invoice Screen
// ==========================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Animated, Pressable } from 'react-native';
import {
    TextInput, Button, Text, useTheme, Surface, SegmentedButtons,
    IconButton, Divider, Card, FAB, ActivityIndicator,
} from 'react-native-paper';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useCompanyStore } from '../store/companyStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { createInvoice } from '../repository/invoiceRepository';
import { incrementInvoiceCounter } from '../repository/companyRepository';
import { generateInvoiceNumber } from '../utils/invoiceNumber';
import { calculateArea, calculateLineTotal, calculateInvoiceTotals, formatCurrency, round2 } from '../utils/calculator';
import { InvoiceItem } from '../models/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toast } from '../components/Toast';

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

interface InvoiceForm {
    clientName: string;
    clientPhone: string;
    clientAddress: string;
    advance: string;
    gstPercent: string;
    items: ItemForm[];
}

const defaultItem: ItemForm = {
    description: '',
    calculationMode: 'AREA',
    measurementUnit: 'FEET_INCHES',
    lengthFeet: '',
    lengthInches: '0',
    widthFeet: '',
    widthInches: '0',
    quantity: '1',
    rate: '',
};

export default function CreateInvoiceScreen({ navigation, route }: any) {
    const theme = useTheme();
    const { activeCompany, refreshActiveCompany } = useCompanyStore();
    const { loadInvoiceDetail, currentInvoice, editInvoice, clearCurrentInvoice } = useInvoiceStore();
    const [saving, setSaving] = useState(false);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const addButtonScale = useRef(new Animated.Value(1)).current;

    // Determine if we're in edit mode
    const invoiceId = route?.params?.invoiceId;
    const isEditMode = !!invoiceId;

    const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<InvoiceForm>({
        defaultValues: {
            clientName: '',
            clientPhone: '',
            clientAddress: '',
            advance: '0',
            gstPercent: activeCompany?.defaultGstPercent?.toString() || '18',
            items: [{ ...defaultItem }],
        },
    });

    // Load existing invoice data in edit mode
    useEffect(() => {
        if (isEditMode && invoiceId) {
            setLoadingInvoice(true);
            loadInvoiceDetail(invoiceId).then(() => {
                setLoadingInvoice(false);
            });
        }
        return () => {
            if (isEditMode) clearCurrentInvoice();
        };
    }, [invoiceId]);

    // Pre-fill form when invoice data is loaded
    useEffect(() => {
        if (isEditMode && currentInvoice) {
            reset({
                clientName: currentInvoice.clientName,
                clientPhone: currentInvoice.clientPhone,
                clientAddress: currentInvoice.clientAddress,
                advance: currentInvoice.advance.toString(),
                gstPercent: currentInvoice.gstPercent.toString(),
                items: currentInvoice.items.map((item) => ({
                    description: item.description,
                    calculationMode: item.calculationMode,
                    measurementUnit: (item as any).measurementUnit || 'FEET_INCHES',
                    lengthFeet: item.lengthFeet.toString(),
                    lengthInches: item.lengthInches.toString(),
                    widthFeet: item.widthFeet.toString(),
                    widthInches: item.widthInches.toString(),
                    quantity: item.quantity.toString(),
                    rate: item.rate.toString(),
                })),
            });
        }
    }, [currentInvoice, isEditMode]);

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });
    const watchedItems = watch('items');
    const watchedAdvance = watch('advance');
    const watchedGstPercent = watch('gstPercent');

    const handleAddItem = useCallback(() => {
        // Bounce animation on the FAB
        Animated.sequence([
            Animated.timing(addButtonScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
            Animated.spring(addButtonScale, { toValue: 1, tension: 300, friction: 8, useNativeDriver: true }),
        ]).start();

        append({ ...defaultItem });

        // Auto-scroll to bottom after a short delay to let the new item render
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 200);
    }, [append, addButtonScale]);

    const getItemCalcs = (item: ItemForm) => {
        let lFeet = parseFloat(item.lengthFeet) || 0;
        let lInches = parseFloat(item.lengthInches) || 0;
        let wFeet = parseFloat(item.widthFeet) || 0;
        let wInches = parseFloat(item.widthInches) || 0;

        // For inches-only mode, treat the inches field as total inches
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
    };

    const getTotals = () => {
        const partialItems = (watchedItems || []).map((item) => {
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
        return calculateInvoiceTotals(
            partialItems,
            activeCompany?.hasGST || false,
            parseFloat(watchedGstPercent) || 0,
            parseFloat(watchedAdvance) || 0
        );
    };

    const totals = getTotals();

    const onSubmit = async (data: InvoiceForm) => {
        if (!activeCompany?.id) return;

        if (data.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setSaving(true);
        try {
            const items = data.items.map((item) => {
                const calcs = getItemCalcs(item);
                const isInchesOnly = item.measurementUnit === 'INCHES_ONLY';
                return {
                    description: item.description,
                    calculationMode: item.calculationMode as 'AREA' | 'DIRECT',
                    lengthFeet: isInchesOnly ? 0 : (parseFloat(item.lengthFeet) || 0),
                    lengthInches: parseFloat(item.lengthInches) || 0,
                    widthFeet: isInchesOnly ? 0 : (parseFloat(item.widthFeet) || 0),
                    widthInches: parseFloat(item.widthInches) || 0,
                    area: calcs.area,
                    quantity: parseFloat(item.quantity) || 0,
                    rate: parseFloat(item.rate) || 0,
                    lineTotal: calcs.lineTotal,
                };
            });

            const finalTotals = calculateInvoiceTotals(
                items,
                activeCompany.hasGST,
                parseFloat(data.gstPercent) || 0,
                parseFloat(data.advance) || 0
            );

            if (isEditMode) {
                // --- UPDATE existing invoice ---
                await editInvoice(
                    invoiceId,
                    {
                        clientName: data.clientName,
                        clientPhone: data.clientPhone,
                        clientAddress: data.clientAddress,
                        subtotal: finalTotals.subtotal,
                        gstPercent: activeCompany.hasGST ? (parseFloat(data.gstPercent) || 0) : 0,
                        gstAmount: finalTotals.gstAmount,
                        grandTotal: finalTotals.grandTotal,
                        advance: parseFloat(data.advance) || 0,
                        balance: finalTotals.balance,
                    },
                    items
                );

                toast.success('Invoice updated successfully!');

                setTimeout(() => {
                    navigation.goBack();
                }, 1000);
            } else {
                // --- CREATE new invoice ---
                const invoiceNumber = generateInvoiceNumber(
                    activeCompany.invoicePrefix || 'INV',
                    activeCompany.invoiceCounter || 1
                );

                const newInvoiceId = await createInvoice(
                    {
                        companyId: activeCompany.id,
                        invoiceNumber,
                        clientName: data.clientName,
                        clientPhone: data.clientPhone,
                        clientAddress: data.clientAddress,
                        subtotal: finalTotals.subtotal,
                        gstPercent: activeCompany.hasGST ? (parseFloat(data.gstPercent) || 0) : 0,
                        gstAmount: finalTotals.gstAmount,
                        grandTotal: finalTotals.grandTotal,
                        advance: parseFloat(data.advance) || 0,
                        balance: finalTotals.balance,
                        createdAt: new Date().toISOString(),
                    },
                    items
                );

                await incrementInvoiceCounter(activeCompany.id);
                await refreshActiveCompany();

                toast.success(`Invoice ${invoiceNumber} created!`, {
                    label: 'View',
                    onPress: () => navigation.replace('InvoiceDetail', { invoiceId: newInvoiceId }),
                });

                setTimeout(() => {
                    navigation.goBack();
                }, 1500);
            }
        } catch (error) {
            toast.error(isEditMode ? 'Failed to update invoice.' : 'Failed to create invoice.');
        } finally {
            setSaving(false);
        }
    };

    if (isEditMode && loadingInvoice) {
        return (
            <View style={[styles.wrapper, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>Loading invoice...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.container}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.content}>
                    {/* Client Details */}
                    <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                            Client Details
                        </Text>

                        <Controller
                            control={control}
                            name="clientName"
                            rules={{ required: 'Client name is required' }}
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Client Name *"
                                    value={value}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    style={styles.input}
                                    error={!!errors.clientName}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="clientPhone"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Phone"
                                    value={value}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    keyboardType="phone-pad"
                                    style={styles.input}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="clientAddress"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Address"
                                    value={value}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    multiline
                                    style={styles.input}
                                />
                            )}
                        />
                    </Surface>

                    {/* Items Header */}
                    <View style={styles.itemsHeader}>
                        <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onBackground }}>
                            Invoice Items ({fields.length})
                        </Text>
                    </View>

                    {fields.map((field, index) => {
                        const item = watchedItems?.[index];
                        const calcs = item ? getItemCalcs(item) : { area: 0, lineTotal: 0 };

                        return (
                            <Card key={field.id} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
                                <Card.Content>
                                    <View style={styles.itemHeader}>
                                        <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.primary }}>
                                            Item #{index + 1}
                                        </Text>
                                        {fields.length > 1 && (
                                            <IconButton
                                                icon="close-circle"
                                                size={20}
                                                iconColor={theme.colors.error}
                                                onPress={() => remove(index)}
                                            />
                                        )}
                                    </View>

                                    <Controller
                                        control={control}
                                        name={`items.${index}.description`}
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
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
                                            {/* Measurement Unit Toggle */}
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
                                                <>
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
                                                </>
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
                                </Card.Content>
                            </Card>
                        );
                    })}

                    {/* Inline Add Item Button — easy to reach after filling last item */}
                    <Pressable
                        onPress={handleAddItem}
                        style={({ pressed }) => [
                            styles.inlineAddButton,
                            {
                                borderColor: theme.colors.primary + '60',
                                backgroundColor: pressed ? theme.colors.primary + '12' : 'transparent',
                            },
                        ]}
                    >
                        <MaterialCommunityIcons name="plus-circle-outline" size={22} color={theme.colors.primary} />
                        <Text
                            variant="bodyMedium"
                            style={{ color: theme.colors.primary, fontWeight: '600', marginLeft: 8 }}
                        >
                            Add Another Item
                        </Text>
                    </Pressable>

                    {/* Summary & Payment */}
                    <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                            Summary
                        </Text>

                        <View style={styles.summaryRow}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Subtotal</Text>
                            <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{formatCurrency(totals.subtotal)}</Text>
                        </View>

                        {activeCompany?.hasGST && (
                            <>
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
                            </>
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

                    <Button
                        mode="contained"
                        onPress={handleSubmit(onSubmit)}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                        contentStyle={styles.saveButtonContent}
                        icon={isEditMode ? 'pencil-outline' : 'content-save'}
                        labelStyle={{ fontSize: 16, fontWeight: '700' }}
                    >
                        {isEditMode ? 'Update Invoice' : 'Save Invoice'}
                    </Button>
                </View>
            </ScrollView>

            {/* Floating Add Item Button — always visible */}
            <Animated.View style={[styles.fabContainer, { transform: [{ scale: addButtonScale }] }]}>
                <FAB
                    icon="plus"
                    label="Add Item"
                    onPress={handleAddItem}
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    color="#FFFFFF"
                    customSize={48}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1 },
    container: { flex: 1 },
    contentContainer: { paddingBottom: 80 },
    content: { padding: 16, paddingBottom: 40 },
    section: { borderRadius: 16, padding: 20, marginBottom: 16 },
    sectionTitle: { fontWeight: '700', marginBottom: 16 },
    input: { marginBottom: 10 },
    row: { flexDirection: 'row' },
    segmented: { marginBottom: 12 },
    calcResult: { borderRadius: 8, padding: 10, marginBottom: 8 },
    lineTotal: { borderRadius: 8, padding: 12, alignItems: 'center' },
    itemsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemCard: { borderRadius: 16, marginBottom: 12 },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    saveButton: { borderRadius: 12, marginTop: 8 },
    saveButtonContent: { paddingVertical: 8 },
    inlineAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 14,
        paddingVertical: 16,
        marginBottom: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 100,
    },
    fab: {
        borderRadius: 16,
        elevation: 6,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
});
