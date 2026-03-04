// ==========================================
// Create / Edit Invoice Screen
// Performance-optimized with FlatList + memoized components
// ==========================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Animated, Pressable, Alert } from 'react-native';
import {
    TextInput, Button, Text, useTheme, Surface,
    FAB, ActivityIndicator,
} from 'react-native-paper';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { useCompanyStore } from '../store/companyStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { createInvoice } from '../repository/invoiceRepository';
import { incrementInvoiceCounter } from '../repository/companyRepository';
import { generateInvoiceNumber } from '../utils/invoiceNumber';
import { calculateArea, calculateLineTotal, calculateInvoiceTotals, formatCurrency, round2 } from '../utils/calculator';
import { InvoiceItem } from '../models/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toast } from '../components/Toast';
import { InvoiceItemCard } from '../components/InvoiceItemCard';
import InvoiceSummary from '../components/InvoiceSummary';
import FloatingTotalBar from '../components/FloatingTotalBar';

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
    const [newItemIndex, setNewItemIndex] = useState<number | null>(null);
    const [allExpanded, setAllExpanded] = useState(true);
    const [expandKey, setExpandKey] = useState(0);
    const [hasScrolled, setHasScrolled] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const addButtonScale = useRef(new Animated.Value(1)).current;
    const formDirtyRef = useRef(false);

    // Determine if we're in edit mode
    const invoiceId = route?.params?.invoiceId;
    const isEditMode = !!invoiceId;

    const { control, handleSubmit, reset, formState: { errors, isDirty }, getValues } = useForm<InvoiceForm>({
        defaultValues: {
            clientName: '',
            clientPhone: '',
            clientAddress: '',
            advance: '0',
            gstPercent: activeCompany?.defaultGstPercent?.toString() || '18',
            items: [{ ...defaultItem }],
        },
    });

    // Track form dirty state in a ref so the back handler picks it up
    useEffect(() => {
        formDirtyRef.current = isDirty;
    }, [isDirty]);

    // ─── Discard Confirmation on Back Press ───
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            // If we just saved or the form is clean, let the user leave
            if (saving || !formDirtyRef.current) return;

            e.preventDefault();

            Alert.alert(
                'Discard changes?',
                'You have unsaved changes. Are you sure you want to go back?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });
        return unsubscribe;
    }, [navigation, saving]);

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

    const { fields, append, remove, insert } = useFieldArray({ control, name: 'items' });

    // Stable remove callback for memoized children
    const handleRemoveItem = useCallback((index: number) => {
        remove(index);
    }, [remove]);

    // Duplicate an existing item (copies all field values)
    const handleDuplicateItem = useCallback((index: number) => {
        const currentValues = getValues(`items.${index}`);
        if (currentValues) {
            const duplicated = { ...currentValues, description: currentValues.description ? `${currentValues.description} (copy)` : '' };
            insert(index + 1, duplicated);
            setNewItemIndex(index + 1);

            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: index + 1, animated: true, viewPosition: 0.3 });
            }, 200);

            // Clear new flag after auto-focus has fired
            setTimeout(() => setNewItemIndex(null), 1000);
        }
    }, [getValues, insert]);

    const handleAddItem = useCallback(() => {
        Animated.sequence([
            Animated.timing(addButtonScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
            Animated.spring(addButtonScale, { toValue: 1, tension: 300, friction: 8, useNativeDriver: true }),
        ]).start();

        append({ ...defaultItem });
        const newIdx = fields.length;
        setNewItemIndex(newIdx);

        // Auto-scroll to new item
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);

        // Clear new flag after auto-focus has fired
        setTimeout(() => setNewItemIndex(null), 1000);
    }, [append, addButtonScale, fields.length]);

    const toggleAllExpanded = useCallback(() => {
        setAllExpanded(prev => !prev);
        setExpandKey(prev => prev + 1);
    }, []);

    const getItemCalcs = (item: ItemForm) => {
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
    };

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

    // Render each item card — memoized component only updates when its own data changes
    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
        <InvoiceItemCard
            key={`${item.id}-${expandKey}`}
            index={index}
            control={control}
            remove={handleRemoveItem}
            duplicate={handleDuplicateItem}
            fieldsLength={fields.length}
            isNew={newItemIndex === index}
            defaultExpanded={allExpanded}
        />
    ), [control, handleRemoveItem, handleDuplicateItem, fields.length, newItemIndex, allExpanded, expandKey]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    // Client details header
    const ListHeader = useCallback(() => (
        <View>
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
                {fields.length > 1 && (
                    <Pressable
                        onPress={toggleAllExpanded}
                        style={({ pressed }) => [{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 16,
                            backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                        }]}
                    >
                        <MaterialCommunityIcons
                            name={allExpanded ? 'unfold-less-horizontal' : 'unfold-more-horizontal'}
                            size={16}
                            color={theme.colors.primary}
                        />
                        <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4, fontWeight: '600' }}>
                            {allExpanded ? 'Collapse All' : 'Expand All'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    ), [control, errors.clientName, fields.length, theme]);

    // Summary + Save button footer
    const ListFooter = useCallback(() => (
        <View>
            {/* Inline Add Item Button */}
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

            {/* Summary — isolated re-renders */}
            <InvoiceSummary
                control={control}
                hasGST={activeCompany?.hasGST || false}
            />

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
    ), [control, activeCompany?.hasGST, handleAddItem, handleSubmit, saving, isEditMode, theme]);

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
            {/* Floating Running Total — visible when scrolled */}
            {hasScrolled && (
                <FloatingTotalBar
                    control={control}
                    hasGST={activeCompany?.hasGST || false}
                    itemCount={fields.length}
                />
            )}

            <FlatList
                ref={flatListRef}
                data={fields}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                contentContainerStyle={[styles.contentContainer, hasScrolled && { paddingTop: 56 }]}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={7}
                initialNumToRender={8}
                updateCellsBatchingPeriod={50}
                onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    if (y > 200 && !hasScrolled) setHasScrolled(true);
                    else if (y <= 200 && hasScrolled) setHasScrolled(false);
                }}
                scrollEventThrottle={100}
            />

            {/* Floating Add Item Button — always visible */}
            <Animated.View style={[styles.fabContainer, { transform: [{ scale: addButtonScale }] }]}>
                <FAB
                    icon="plus"
                    label={`Add Item (${fields.length})`}
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
    contentContainer: { padding: 16, paddingBottom: 80 },
    section: { borderRadius: 16, padding: 20, marginBottom: 16 },
    sectionTitle: { fontWeight: '700', marginBottom: 16 },
    input: { marginBottom: 10 },
    itemsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
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
