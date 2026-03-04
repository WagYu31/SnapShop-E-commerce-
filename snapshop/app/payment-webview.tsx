import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentWebViewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ url: string; orderId: string; orderNumber: string }>();
    const [loading, setLoading] = useState(true);

    const verifyPayment = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token || !params.orderId) return;
            // Small delay to allow Midtrans to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            const res = await fetch(`${API_URL}/payment/${params.orderId}/verify`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log('[PaymentVerify]', data);
        } catch (e) {
            console.log('[PaymentVerify] error', e);
        }
    };

    const handleNavigationChange = async (navState: any) => {
        const { url } = navState;

        // Midtrans success patterns
        if (url.includes('transaction_status=settlement') ||
            url.includes('transaction_status=capture') ||
            url.includes('status_code=200') ||
            url.includes('#/success') ||
            url.includes('/finish') ||
            url.includes('payment-finish')) {
            await verifyPayment();
            router.replace('/order-success');
            return;
        }

        if (url.includes('transaction_status=pending')) {
            Alert.alert(
                'Pembayaran Pending',
                'Silakan selesaikan pembayaran sebelum batas waktu.',
                [{ text: 'OK', onPress: () => router.replace('/orders') }]
            );
            return;
        }

        if (url.includes('transaction_status=deny') ||
            url.includes('transaction_status=cancel') ||
            url.includes('transaction_status=expire') ||
            url.includes('#/cancel') ||
            url.includes('/unfinish') ||
            url.includes('/error')) {
            Alert.alert(
                'Pembayaran Gagal',
                'Pembayaran tidak berhasil. Silakan coba lagi.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            return;
        }
    };

    const handleClose = () => {
        Alert.alert(
            'Batalkan Pembayaran?',
            'Kamu bisa melanjutkan pembayaran nanti dari halaman Order.',
            [
                { text: 'Lanjutkan Bayar', style: 'cancel' },
                { text: 'Keluar', style: 'destructive', onPress: () => router.replace('/orders') },
            ]
        );
    };

    if (!params.url) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="alert-circle" size={48} color={Colors.gray} />
                <Text style={styles.errorText}>Payment URL not found</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Ionicons name="lock-closed" size={14} color="#25D366" />
                    <Text style={styles.headerTitle}>Secure Payment</Text>
                </View>
                <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{params.orderNumber || 'Order'}</Text>
                </View>
            </View>

            {/* WebView */}
            <WebView
                source={{ uri: params.url }}
                onNavigationStateChange={handleNavigationChange}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Memuat halaman pembayaran...</Text>
                    </View>
                )}
            />

            {loading && (
                <View style={styles.loadingBar}>
                    <View style={styles.loadingBarInner} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl,
        paddingTop: 60,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.white,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    orderBadge: {
        backgroundColor: Colors.lightGray,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    orderBadgeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    loadingText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
        marginTop: Spacing.md,
    },
    loadingBar: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: Colors.lightGray,
    },
    loadingBarInner: {
        width: '30%',
        height: '100%',
        backgroundColor: Colors.primary,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.lg,
        color: Colors.secondaryText,
        marginTop: Spacing.lg,
    },
    backBtn: {
        marginTop: Spacing.xl,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    backBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
});
