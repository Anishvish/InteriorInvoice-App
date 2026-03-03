// ==========================================
// Company Form Screen (Add / Edit)
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Switch, Text, useTheme, Surface, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useCompanyStore } from '../store/companyStore';
import * as companyRepo from '../repository/companyRepository';
import { Company } from '../models/types';
import { toast } from '../components/Toast';

interface FormData {
    companyName: string;
    ownerName: string;
    phone: string;
    address: string;
    hasGST: boolean;
    gstNumber: string;
    defaultGstPercent: string;
    invoicePrefix: string;
}

export default function CompanyFormScreen({ navigation, route }: any) {
    const theme = useTheme();
    const companyId = route.params?.companyId;
    const isEdit = !!companyId;
    const { addCompany, editCompany, setActiveCompany } = useCompanyStore();
    const [loading, setLoading] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            companyName: '',
            ownerName: '',
            phone: '',
            address: '',
            hasGST: false,
            gstNumber: '',
            defaultGstPercent: '18',
            invoicePrefix: 'INV',
        },
    });

    const hasGST = watch('hasGST');

    useEffect(() => {
        if (isEdit) {
            loadCompany();
        }
    }, [companyId]);

    const loadCompany = async () => {
        const company = await companyRepo.getCompanyById(companyId);
        if (company) {
            reset({
                companyName: company.companyName,
                ownerName: company.ownerName,
                phone: company.phone,
                address: company.address,
                hasGST: company.hasGST,
                gstNumber: company.gstNumber || '',
                defaultGstPercent: company.defaultGstPercent?.toString() || '18',
                invoicePrefix: company.invoicePrefix || 'INV',
            });
        }
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const companyData: any = {
                companyName: data.companyName,
                ownerName: data.ownerName,
                phone: data.phone,
                address: data.address,
                hasGST: data.hasGST,
                gstNumber: data.hasGST ? data.gstNumber : null,
                defaultGstPercent: data.hasGST ? parseFloat(data.defaultGstPercent) || 18 : null,
                invoicePrefix: data.invoicePrefix || 'INV',
            };

            if (isEdit) {
                await editCompany(companyId, companyData);
                toast.success('Company updated successfully!');
            } else {
                companyData.invoiceCounter = 1;
                companyData.createdAt = new Date().toISOString();
                const id = await addCompany(companyData);
                const newCompany = await companyRepo.getCompanyById(id);
                if (newCompany) {
                    await setActiveCompany(newCompany);
                }
                toast.success('Company created successfully!');
            }
            navigation.goBack();
        } catch (error) {
            toast.error('Failed to save company');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                        Company Details
                    </Text>

                    <Controller
                        control={control}
                        name="companyName"
                        rules={{ required: 'Company name is required' }}
                        render={({ field: { onChange, value } }) => (
                            <>
                                <TextInput
                                    label="Company Name *"
                                    value={value}
                                    onChangeText={onChange}
                                    mode="outlined"
                                    style={styles.input}
                                    error={!!errors.companyName}
                                />
                                {errors.companyName && (
                                    <HelperText type="error">{errors.companyName.message}</HelperText>
                                )}
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="ownerName"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label="Owner Name"
                                value={value}
                                onChangeText={onChange}
                                mode="outlined"
                                style={styles.input}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="phone"
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
                        name="address"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label="Address"
                                value={value}
                                onChangeText={onChange}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.input}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="invoicePrefix"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label="Invoice Prefix"
                                value={value}
                                onChangeText={onChange}
                                mode="outlined"
                                placeholder="e.g., INV, EI"
                                style={styles.input}
                            />
                        )}
                    />
                </Surface>

                <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                        GST Settings
                    </Text>

                    <Controller
                        control={control}
                        name="hasGST"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.switchRow}>
                                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, flex: 1 }}>
                                    Enable GST
                                </Text>
                                <Switch value={value} onValueChange={onChange} color={theme.colors.primary} />
                            </View>
                        )}
                    />

                    {hasGST && (
                        <>
                            <Controller
                                control={control}
                                name="gstNumber"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        label="GST Number"
                                        value={value}
                                        onChangeText={onChange}
                                        mode="outlined"
                                        style={styles.input}
                                        autoCapitalize="characters"
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="defaultGstPercent"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        label="Default GST Percentage"
                                        value={value}
                                        onChangeText={onChange}
                                        mode="outlined"
                                        keyboardType="numeric"
                                        right={<TextInput.Affix text="%" />}
                                        style={styles.input}
                                    />
                                )}
                            />
                        </>
                    )}
                </Surface>

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={loading}
                    disabled={loading}
                    style={styles.saveButton}
                    contentStyle={styles.saveButtonContent}
                    labelStyle={{ fontSize: 16, fontWeight: '700' }}
                >
                    {isEdit ? 'Update Company' : 'Create Company'}
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    section: { borderRadius: 16, padding: 20, marginBottom: 16 },
    sectionTitle: { fontWeight: '700', marginBottom: 16 },
    input: { marginBottom: 12 },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 4 },
    saveButton: { borderRadius: 12, marginTop: 8 },
    saveButtonContent: { paddingVertical: 8 },
});
