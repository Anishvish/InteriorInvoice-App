// ==========================================
// Animated Toast Notification Component
// ==========================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
    message: string;
    type: ToastType;
    duration?: number;
    action?: { label: string; onPress: () => void };
}

interface ToastState extends ToastConfig {
    id: number;
}

// Global toast controller
let globalShowToast: ((config: ToastConfig) => void) | null = null;

export const showToast = (config: ToastConfig) => {
    if (globalShowToast) {
        globalShowToast(config);
    }
};

// Convenience methods
export const toast = {
    success: (message: string, action?: ToastConfig['action']) =>
        showToast({ message, type: 'success', action }),
    error: (message: string, action?: ToastConfig['action']) =>
        showToast({ message, type: 'error', action }),
    info: (message: string, action?: ToastConfig['action']) =>
        showToast({ message, type: 'info', action }),
    warning: (message: string, action?: ToastConfig['action']) =>
        showToast({ message, type: 'warning', action }),
};

const TOAST_ICONS: Record<ToastType, string> = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'information',
    warning: 'alert',
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: '#1B3D2F', border: '#2ECC71', icon: '#2ECC71' },
    error: { bg: '#3D1B1B', border: '#FF5252', icon: '#FF5252' },
    info: { bg: '#1B2D3D', border: '#29B6F6', icon: '#29B6F6' },
    warning: { bg: '#3D351B', border: '#FFB347', icon: '#FFB347' },
};

const TOAST_COLORS_LIGHT: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: '#E8F8F0', border: '#2ECC71', icon: '#1B8A4A' },
    error: { bg: '#FDECEC', border: '#E53935', icon: '#C62828' },
    info: { bg: '#E3F2FD', border: '#29B6F6', icon: '#0277BD' },
    warning: { bg: '#FFF8E1', border: '#FFB347', icon: '#E65100' },
};

function SingleToast({ toast: toastData, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
    const theme = useTheme();
    const isDark = theme.dark;
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;
    const progressWidth = useRef(new Animated.Value(100)).current;

    const colors = isDark ? TOAST_COLORS[toastData.type] : TOAST_COLORS_LIGHT[toastData.type];
    const duration = toastData.duration || 3000;

    useEffect(() => {
        // Entrance animation — fast slide-in with smooth timing
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                tension: 120,
                friction: 12,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 120,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();

        // Progress bar countdown
        Animated.timing(progressWidth, {
            toValue: 0,
            duration: duration,
            useNativeDriver: false,
        }).start();

        // Auto dismiss
        const timer = setTimeout(() => {
            dismissToast();
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const dismissToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -80,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 0.9,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss());
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.border,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={dismissToast}
                style={styles.toastContent}
            >
                <View style={[styles.iconContainer, { backgroundColor: colors.border + '20' }]}>
                    <MaterialCommunityIcons
                        name={TOAST_ICONS[toastData.type] as any}
                        size={22}
                        color={colors.icon}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text
                        variant="bodyMedium"
                        style={[styles.toastMessage, { color: isDark ? '#F0F0F5' : '#1A1A2E' }]}
                        numberOfLines={3}
                    >
                        {toastData.message}
                    </Text>
                </View>
                {toastData.action && (
                    <TouchableOpacity
                        onPress={() => {
                            toastData.action?.onPress();
                            dismissToast();
                        }}
                        style={[styles.actionButton, { backgroundColor: colors.border + '25' }]}
                    >
                        <Text style={[styles.actionText, { color: colors.icon }]}>
                            {toastData.action.label}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            backgroundColor: colors.border,
                            width: progressWidth.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
        </Animated.View>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastState[]>([]);
    const idCounter = useRef(0);

    const addToast = useCallback((config: ToastConfig) => {
        const id = ++idCounter.current;
        setToasts((prev) => [...prev.slice(-2), { ...config, id }]); // Keep max 3
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        globalShowToast = addToast;
        return () => {
            globalShowToast = null;
        };
    }, [addToast]);

    return (
        <View style={{ flex: 1 }}>
            {children}
            <View style={styles.toastsWrapper} pointerEvents="box-none">
                {toasts.map((t) => (
                    <SingleToast
                        key={t.id}
                        toast={t}
                        onDismiss={() => removeToast(t.id)}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    toastsWrapper: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        pointerEvents: 'box-none',
    },
    toastContainer: {
        width: SCREEN_WIDTH - 32,
        borderRadius: 14,
        borderLeftWidth: 4,
        borderWidth: 1,
        marginBottom: 8,
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    toastMessage: {
        fontWeight: '600',
        lineHeight: 20,
    },
    actionButton: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        marginLeft: 10,
    },
    actionText: {
        fontWeight: '700',
        fontSize: 13,
    },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    progressBar: {
        height: 3,
        borderRadius: 2,
    },
});
