// ==========================================
// Company List Screen
// ==========================================

import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Text, FAB, useTheme, IconButton, Chip, Surface } from 'react-native-paper';
import { useCompanyStore } from '../store/companyStore';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Company } from '../models/types';

export default function CompanyListScreen({ navigation }: any) {
    const theme = useTheme();
    const { companies, activeCompany, loadCompanies, setActiveCompany, removeCompany } = useCompanyStore();

    useFocusEffect(
        useCallback(() => {
            loadCompanies();
        }, [])
    );

    const handleSwitch = async (company: Company) => {
        await setActiveCompany(company);
    };

    const handleDelete = (company: Company) => {
        Alert.alert(
            'Delete Company',
            `Are you sure you want to delete "${company.companyName}"? All invoices for this company will be permanently deleted.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => company.id && removeCompany(company.id),
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: Company }) => {
        const isActive = activeCompany?.id === item.id;

        return (
            <Card
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: isActive ? theme.colors.primary : 'transparent',
                        borderWidth: isActive ? 2 : 0,
                    },
                ]}
                onPress={() => handleSwitch(item)}
            >
                <Card.Content style={styles.cardContent}>
                    <View style={[styles.avatar, { backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant }]}>
                        <MaterialCommunityIcons
                            name="domain"
                            size={24}
                            color={isActive ? '#FFFFFF' : theme.colors.onSurfaceVariant}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.nameRow}>
                            <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface, flex: 1 }}>
                                {item.companyName}
                            </Text>
                            {isActive && (
                                <Chip
                                    mode="flat"
                                    compact
                                    style={{ backgroundColor: theme.colors.primaryContainer }}
                                    textStyle={{ color: theme.colors.primary, fontSize: 10 }}
                                >
                                    Active
                                </Chip>
                            )}
                        </View>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {item.ownerName} • {item.phone}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {item.hasGST ? `GST: ${item.gstNumber}` : 'Non-GST'}
                        </Text>
                    </View>
                    <View style={styles.actions}>
                        <IconButton
                            icon="pencil-outline"
                            size={20}
                            onPress={() => navigation.navigate('EditCompany', { companyId: item.id })}
                        />
                        <IconButton
                            icon="delete-outline"
                            size={20}
                            iconColor={theme.colors.error}
                            onPress={() => handleDelete(item)}
                        />
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {companies.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="office-building-plus-outline" size={64} color={theme.colors.primary} />
                    <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, marginTop: 16 }}>
                        No Companies
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                        Create your first company to start invoicing
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={companies}
                    keyExtractor={(item) => item.id?.toString() || ''}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#FFFFFF"
                onPress={() => navigation.navigate('AddCompany')}
                label="Add Company"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    list: { padding: 16, paddingBottom: 100 },
    card: { borderRadius: 16, marginBottom: 12 },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actions: { flexDirection: 'row' },
    fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
});
