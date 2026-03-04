import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../constants/theme';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    product?: {
        id: number;
        name: string;
        image_url?: string;
    };
}

interface Order {
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
    created_at: string;
    items?: OrderItem[];
}

const STATUS_MAP: Record<string, string> = {
    'waiting_payment': 'Menunggu Bayar',
    'paid': 'Dibayar',
    'confirmed': 'Dikonfirmasi',
    'processing': 'Diproses',
    'shipped': 'Dikirim',
    'delivered': 'Diterima',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
    'returned': 'Retur',
};

const getStatusLabel = (status: string) => STATUS_MAP[status] || status;

const getStatusColor = (status: string) => {
    switch (status) {
        case 'waiting_payment':
            return '#F59E0B';
        case 'paid':
        case 'confirmed':
            return '#6366F1';
        case 'processing':
            return '#3B82F6';
        case 'shipped':
            return '#F59E0B';
        case 'delivered':
        case 'completed':
            return Colors.green;
        case 'cancelled':
        case 'returned':
            return Colors.red;
        default:
            return Colors.gray;
    }
};

const isUpcoming = (status: string) =>
    ['waiting_payment', 'paid', 'confirmed', 'processing', 'shipped'].includes(status);

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const getOrderImage = (order: Order): string => {
    if (order.items && order.items.length > 0) {
        const item = order.items[0];
        if (item.product?.image_url) {
            return item.product.image_url;
        }
    }
    return 'https://via.placeholder.com/100x100?text=No+Image';
};

const getProductName = (order: Order): string => {
    if (order.items && order.items.length > 0 && order.items[0].product) {
        return order.items[0].product.name;
    }
    return 'Order #' + order.order_number;
};

const getTotalQuantity = (order: Order): number => {
    if (!order.items) return 0;
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
};

export default function OrdersScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [statusFilter, setStatusFilter] = useState('All');
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                setAllOrders(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch orders', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(false);
    };

    const upcomingOrders = allOrders.filter(o => isUpcoming(o.status));
    const completedOrders = allOrders.filter(o => !isUpcoming(o.status));

    const displayOrders = activeTab === 'upcoming' ? upcomingOrders : completedOrders;
    const filteredOrders = statusFilter === 'All'
        ? displayOrders
        : displayOrders.filter(o => o.status === statusFilter);

    const upcomingStatuses = ['All', ...Array.from(new Set(upcomingOrders.map(o => o.status)))];
    const completedStatuses = ['All', ...Array.from(new Set(completedOrders.map(o => o.status)))];
    const statusTabs = activeTab === 'upcoming' ? upcomingStatuses : completedStatuses;

    const handleOrderPress = (order: Order) => {
        router.push({
            pathname: '/order-details',
            params: {
                orderId: String(order.id),
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => { setActiveTab('upcoming'); setStatusFilter('All'); }}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                        Upcoming {upcomingOrders.length > 0 ? `(${upcomingOrders.length})` : ''}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => { setActiveTab('completed'); setStatusFilter('All'); }}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                        Completed {completedOrders.length > 0 ? `(${completedOrders.length})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Status Filter Chips */}
            {statusTabs.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                    {statusTabs.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.filterChip, statusFilter === tab && styles.filterChipActive]}
                            onPress={() => setStatusFilter(tab)}
                        >
                            <Text style={[styles.filterChipText, statusFilter === tab && styles.filterChipTextActive]}>
                                {tab === 'All' ? 'Semua' : getStatusLabel(tab)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Order List */}
            {loading ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.emptyText}>Memuat pesanan...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.orderList}
                    contentContainerStyle={styles.orderListContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                >
                    {filteredOrders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color={Colors.gray} />
                            <Text style={styles.emptyText}>Belum ada pesanan</Text>
                        </View>
                    ) : (
                        filteredOrders.map((order) => (
                            <TouchableOpacity
                                key={order.id}
                                style={styles.orderCard}
                                onPress={() => handleOrderPress(order)}
                                activeOpacity={0.7}
                            >
                                <Image source={{ uri: getOrderImage(order) }} style={styles.orderImage} />
                                <View style={styles.orderInfo}>
                                    <View style={styles.orderTopRow}>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '18' }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                                {getStatusLabel(order.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.productName} numberOfLines={1}>
                                        {getProductName(order)}{order.items && order.items.length > 1 ? ` +${order.items.length - 1} lainnya` : ''}
                                    </Text>
                                    <Text style={styles.orderDate}>
                                        {formatDate(order.created_at)} • {order.order_number}
                                    </Text>
                                    <View style={styles.orderMeta}>
                                        <Text style={styles.orderQuantity}>
                                            {getTotalQuantity(order)} item
                                        </Text>
                                        <Text style={styles.orderCourier}>
                                            {order.courier_name} {order.courier_service}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.orderPriceContainer}>
                                    <Text style={styles.orderPrice}>{formatRupiah(order.total)}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
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
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.gray,
    },
    activeTabText: {
        color: Colors.primaryText,
        fontFamily: 'Inter_600SemiBold',
    },
    // Order List
    orderList: {
        flex: 1,
    },
    orderListContent: {
        padding: Spacing.xxl,
        gap: Spacing.lg,
    },
    orderCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    orderImage: {
        width: 68,
        height: 68,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.lightGray,
        marginRight: Spacing.md,
    },
    orderInfo: {
        flex: 1,
    },
    orderTopRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
    },
    productName: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    orderDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        marginBottom: 2,
    },
    orderMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    orderNumber: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    orderQuantity: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
    },
    orderCourier: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
    },
    orderPriceContainer: {
        alignItems: 'flex-end',
        gap: 8,
        marginLeft: 8,
    },
    orderPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    filterScroll: {
        maxHeight: 44,
        backgroundColor: Colors.white,
    },
    filterContent: {
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.lightGray,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
    },
    filterChipText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    filterChipTextActive: {
        color: Colors.white,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        gap: 12,
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.gray,
    },
});
