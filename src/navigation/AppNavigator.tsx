// ==========================================
// App Navigation Setup
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import InvoiceListScreen from '../screens/InvoiceListScreen';
import CompanyListScreen from '../screens/CompanyListScreen';
import CompanyFormScreen from '../screens/CompanyFormScreen';
import CreateInvoiceScreen from '../screens/CreateInvoiceScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.outline,
                    borderTopWidth: 0.5,
                    height: 60 + insets.bottom,
                    paddingBottom: 8 + insets.bottom,
                    paddingTop: 4,
                    elevation: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: theme.colors.onSurface,
                headerTitleStyle: {
                    fontWeight: '700',
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                    headerTitle: 'Dashboard',
                }}
            />
            <Tab.Screen
                name="Invoices"
                component={InvoiceListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="file-document-multiple" size={size} color={color} />
                    ),
                    headerTitle: 'Invoices',
                }}
            />
            <Tab.Screen
                name="Companies"
                component={CompanyListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="domain" size={size} color={color} />
                    ),
                    headerTitle: 'Companies',
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const theme = useTheme();

    const stackScreenOptions = {
        headerStyle: {
            backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
            fontWeight: '700' as const,
        },
        headerShadowVisible: false,
    };

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={stackScreenOptions}>
                <Stack.Screen
                    name="Home"
                    component={HomeTabs}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="CreateInvoice"
                    component={CreateInvoiceScreen}
                    options={{ headerTitle: 'New Invoice' }}
                />
                <Stack.Screen
                    name="EditInvoice"
                    component={CreateInvoiceScreen}
                    options={{ headerTitle: 'Edit Invoice' }}
                />
                <Stack.Screen
                    name="InvoiceDetail"
                    component={InvoiceDetailScreen}
                    options={{ headerTitle: 'Invoice Details' }}
                />
                <Stack.Screen
                    name="AddCompany"
                    component={CompanyFormScreen}
                    options={{ headerTitle: 'Add Company' }}
                />
                <Stack.Screen
                    name="EditCompany"
                    component={CompanyFormScreen}
                    options={{ headerTitle: 'Edit Company' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
