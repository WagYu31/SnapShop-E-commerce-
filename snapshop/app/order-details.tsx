import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../constants/theme';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    variant_info?: string;
    product?: {
        name: string;
        image_url?: string;
        images?: { url: string }[];
    };
}

interface OrderAddress {
    label: string;
    recipient_name: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    postal_code: string;
}

interface OrderData {
    id: number;
    order_number: string;
    status: string;
    subtotal: number;
    shipping_cost: number;
    discount: number;
    total: number;
    courier_name: string;
    courier_service: string;
    payment_method: string;
    notes: string;
    created_at: string;
    updated_at: string;
    address: OrderAddress;
    items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    'waiting_payment': { label: 'Menunggu Pembayaran', color: '#F59E0B' },
    'paid': { label: 'Sudah Dibayar', color: '#6366F1' },
    'confirmed': { label: 'Dikonfirmasi', color: '#6366F1' },
    'processing': { label: 'Sedang Diproses', color: '#3B82F6' },
    'shipped': { label: 'Sedang Dikirim', color: '#F59E0B' },
    'delivered': { label: 'Diterima', color: '#22C55E' },
    'completed': { label: 'Selesai', color: '#22C55E' },
    'cancelled': { label: 'Dibatalkan', color: '#EF4444' },
};

const TIMELINE_STEPS = [
    'waiting_payment',
    'paid',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'returned',
];

const TIMELINE_LABELS: Record<string, string> = {
    'waiting_payment': 'Pesanan Dibuat',
    'paid': 'Sudah Dibayar',
    'confirmed': 'Dikonfirmasi',
    'processing': 'Sedang Diproses',
    'shipped': 'Sedang Dikirim',
    'delivered': 'Diterima',
    'returned': 'Retur Diajukan',
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const getPaymentLabel = (method: string) => {
    switch (method) {
        case 'midtrans': return 'Bayar Online (Midtrans)';
        case 'cod': return 'Bayar di Tempat (COD)';
        default: return method;
    }
};

export default function OrderDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ orderId: string }>();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, []);

    const fetchOrder = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token || !params.orderId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/orders/${params.orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && data.data) {
                const orderData = data.data;
                setOrder(orderData);

                // Auto-verify if order is still waiting_payment with midtrans
                if (orderData.status === 'waiting_payment' && orderData.payment_method === 'midtrans') {
                    try {
                        const verifyRes = await fetch(`${API_URL}/payment/${orderData.id}/verify`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success && verifyData.data?.status && verifyData.data.status !== 'waiting_payment') {
                            // Re-fetch order to get updated data
                            const refreshRes = await fetch(`${API_URL}/orders/${params.orderId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            const refreshData = await refreshRes.json();
                            if (refreshData.success && refreshData.data) {
                                setOrder(refreshData.data);
                            }
                        }
                    } catch (e) {
                        console.log('[AutoVerify] error', e);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch order', e);
        }
        setLoading(false);
    };

    const handlePayNow = async () => {
        if (!order) return;
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/payment/${order.id}/token`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.data?.redirect_url) {
                router.push({
                    pathname: '/payment-webview',
                    params: {
                        url: data.data.redirect_url,
                        orderId: String(order.id),
                        orderNumber: order.order_number,
                    },
                });
            } else {
                Alert.alert('Error', 'Gagal mendapatkan link pembayaran');
            }
        } catch (e) {
            Alert.alert('Error', 'Gagal terhubung ke server');
        }
    };

    // Determine timeline progress
    const getTimelineStatus = (step: string) => {
        if (!order) return 'pending';
        const orderIdx = TIMELINE_STEPS.indexOf(order.status);
        const stepIdx = TIMELINE_STEPS.indexOf(step);
        if (order.status === 'cancelled') return step === 'waiting_payment' ? 'completed' : 'pending';
        if (stepIdx < orderIdx) return 'completed';
        if (stepIdx === orderIdx) return 'current';
        return 'pending';
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="receipt-outline" size={48} color={Colors.gray} />
                <Text style={styles.emptyText}>Order tidak ditemukan</Text>
                <TouchableOpacity style={styles.backBtnAlt} onPress={() => router.back()}>
                    <Text style={styles.backBtnAltText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: Colors.gray };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Pesanan</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                {/* Order ID + Status */}
                <View style={styles.orderIdRow}>
                    <Text style={styles.orderId}>#{order.order_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18' }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                </View>

                {/* Product Items */}
                {order.items.map((item) => (
                    <View key={item.id} style={styles.productCard}>
                        <Image
                            source={{ uri: item.product?.image_url || item.product?.images?.[0]?.url || 'https://via.placeholder.com/100' }}
                            style={styles.productImage}
                        />
                        <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={2}>{item.product?.name || 'Produk'}</Text>
                            {item.variant_info ? <Text style={styles.productVariant}>{item.variant_info}</Text> : null}
                            <View style={styles.priceRow}>
                                <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
                                <Text style={styles.productQty}>x{item.quantity}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Status Timeline */}
                <View style={styles.timelineSection}>
                    <Text style={styles.sectionTitle}>Status Pesanan</Text>
                    <View style={styles.timeline}>
                        {TIMELINE_STEPS.map((step, index) => {
                            const status = getTimelineStatus(step);
                            const dotColor = status === 'completed' ? '#22C55E' : status === 'current' ? '#F59E0B' : Colors.border;
                            return (
                                <View key={step} style={styles.timelineStep}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineDot, { backgroundColor: dotColor }]}>
                                            {status === 'completed' && (
                                                <Ionicons name="checkmark" size={12} color={Colors.white} />
                                            )}
                                        </View>
                                        {index < TIMELINE_STEPS.length - 1 && (
                                            <View style={[styles.timelineLine, { backgroundColor: status === 'completed' ? '#22C55E' : Colors.border }]} />
                                        )}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <Text style={[styles.timelineLabel, status === 'pending' && { color: Colors.gray }]}>
                                            {TIMELINE_LABELS[step]}
                                        </Text>
                                        <Text style={styles.timelineDate}>
                                            {status === 'completed' || status === 'current'
                                                ? formatDate(order.created_at)
                                                : '—'
                                            }
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Delivery Info */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Pengiriman</Text>
                        <Text style={styles.infoValue}>{order.courier_name} {order.courier_service}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Alamat</Text>
                        <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', marginLeft: 20 }]} numberOfLines={2}>
                            {order.address?.street ? `${order.address.street}, ${order.address.city}` : 'Alamat tidak tersedia'}
                        </Text>
                    </View>
                    {order.address?.recipient_name ? (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Penerima</Text>
                                <Text style={styles.infoValue}>{order.address.recipient_name} ({order.address.phone})</Text>
                            </View>
                        </>
                    ) : null}
                </View>

                {/* Payment Method */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Pembayaran</Text>
                        <View style={styles.paymentInfo}>
                            <Ionicons
                                name={order.payment_method === 'cod' ? 'cash-outline' : 'card'}
                                size={18}
                                color={Colors.primaryText}
                            />
                            <Text style={styles.infoValue}>{getPaymentLabel(order.payment_method)}</Text>
                        </View>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatRupiah(order.subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
                        <Text style={styles.summaryValue}>{formatRupiah(order.shipping_cost)}</Text>
                    </View>
                    {order.discount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Diskon</Text>
                            <Text style={[styles.summaryValue, { color: Colors.green }]}>
                                -{formatRupiah(order.discount)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatRupiah(order.total)}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                    {order.status === 'waiting_payment' && order.payment_method === 'midtrans' && (
                        <TouchableOpacity style={styles.payButton} onPress={handlePayNow} activeOpacity={0.8}>
                            <Ionicons name="card" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => router.push('/track-order')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="location" size={18} color={Colors.primary} />
                        <Text style={styles.trackButtonText}>Lacak Pesanan</Text>
                    </TouchableOpacity>
                    {order.status === 'delivered' && (
                        <TouchableOpacity
                            style={[styles.trackButton, { borderColor: '#EF4444' }]}
                            onPress={() => router.push({
                                pathname: '/return-request',
                                params: {
                                    orderId: String(order.id),
                                    orderNumber: order.order_number,
                                    productName: order.items?.[0]?.product?.name || 'Produk',
                                    total: String(order.total),
                                },
                            })}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-undo" size={18} color="#EF4444" />
                            <Text style={[styles.trackButtonText, { color: '#EF4444' }]}>Ajukan Pengembalian</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingTop: Platform.OS === 'ios' ? 54 : 40,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.xl,
        color: Colors.white,
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: Spacing.xxl,
        paddingBottom: 40,
    },
    orderIdRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    orderId: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.xs,
    },
    // Product Card
    productCard: {
        flexDirection: 'row',
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    productImage: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.white,
        marginRight: Spacing.lg,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 4,
    },
    productVariant: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    productPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    productQty: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    // Timeline
    timelineSection: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginBottom: Spacing.lg,
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineStep: {
        flexDirection: 'row',
        minHeight: 56,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: Spacing.lg,
        width: 24,
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: Spacing.lg,
    },
    timelineLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    timelineDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    // Info
    infoSection: {
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    infoValue: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    // Summary
    summarySection: {
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    summaryLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    summaryValue: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    totalLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    totalValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    // Buttons
    buttonGroup: {
        gap: Spacing.md,
    },
    payButton: {
        flexDirection: 'row',
        backgroundColor: '#22C55E',
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    trackButton: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        gap: 8,
    },
    trackButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primary,
    },
    emptyText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.lg,
        color: Colors.gray,
        marginTop: Spacing.lg,
    },
    backBtnAlt: {
        marginTop: Spacing.xl,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    backBtnAltText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
});
