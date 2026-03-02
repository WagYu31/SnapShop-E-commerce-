import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../constants/theme';

interface Order {
    id: string;
    orderNumber: string;
    date: string;
    quantity: number;
    price: number;
    status: 'In Transit' | 'Delivered' | 'Canceled' | 'Preparing';
    image: string;
    productName: string;
}

const upcomingOrders: Order[] = [
    {
        id: '1',
        orderNumber: 'B5678987',
        date: '3/12/2024',
        quantity: 1,
        price: 750000,
        status: 'In Transit',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
        productName: 'Jeka Jacket',
    },
    {
        id: '2',
        orderNumber: 'GC092921',
        date: '3/10/2024',
        quantity: 2,
        price: 1800000,
        status: 'Preparing',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
        productName: 'Running Shoes',
    },
    {
        id: '3',
        orderNumber: 'U578997',
        date: '3/8/2024',
        quantity: 1,
        price: 1275000,
        status: 'In Transit',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
        productName: 'Premium Sneakers',
    },
];

const completedOrders: Order[] = [
    {
        id: '4',
        orderNumber: 'A123456',
        date: '2/28/2024',
        quantity: 1,
        price: 3525000,
        status: 'Delivered',
        image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=500&fit=crop',
        productName: 'Jordan 1 Retro',
    },
    {
        id: '5',
        orderNumber: 'B789012',
        date: '2/20/2024',
        quantity: 3,
        price: 2700000,
        status: 'Delivered',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
        productName: 'Casual Shirt',
    },
    {
        id: '6',
        orderNumber: 'C345678',
        date: '2/15/2024',
        quantity: 1,
        price: 675000,
        status: 'Canceled',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop',
        productName: 'Sport Cap',
    },
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'In Transit':
            return '#F59E0B';
        case 'Delivered':
            return Colors.green;
        case 'Canceled':
            return Colors.red;
        case 'Preparing':
            return '#6366F1';
        default:
            return Colors.gray;
    }
};

export default function OrdersScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [statusFilter, setStatusFilter] = useState('All');

    const allOrders = activeTab === 'upcoming' ? upcomingOrders : completedOrders;
    const orders = statusFilter === 'All'
        ? allOrders
        : allOrders.filter(o => o.status === statusFilter);

    const statusTabs = activeTab === 'upcoming'
        ? ['All', 'In Transit', 'Preparing']
        : ['All', 'Delivered', 'Canceled'];

    const handleOrderPress = (order: Order) => {
        router.push({
            pathname: '/order-details',
            params: {
                orderId: order.orderNumber,
                productName: order.productName,
                status: order.status,
                image: order.image,
                price: order.price.toString(),
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
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'upcoming' && styles.activeTabText,
                        ]}
                    >
                        Upcoming
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'completed' && styles.activeTabText,
                        ]}
                    >
                        Completed
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                {statusTabs.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.filterChip, statusFilter === tab && styles.filterChipActive]}
                        onPress={() => setStatusFilter(tab)}
                    >
                        <Text style={[styles.filterChipText, statusFilter === tab && styles.filterChipTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Order List */}
            <ScrollView
                style={styles.orderList}
                contentContainerStyle={styles.orderListContent}
                showsVerticalScrollIndicator={false}
            >
                {orders.map((order) => (
                    <TouchableOpacity
                        key={order.id}
                        style={styles.orderCard}
                        onPress={() => handleOrderPress(order)}
                        activeOpacity={0.7}
                    >
                        <Image source={{ uri: order.image }} style={styles.orderImage} />
                        <View style={styles.orderInfo}>
                            <View style={styles.orderTopRow}>
                                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: FontSize.sm, color: getStatusColor(order.status) }}>
                                    {order.status}
                                </Text>
                            </View>
                            <Text style={styles.orderDate}>
                                Ordered on: {order.date}
                            </Text>
                            <Text style={styles.orderNumber}>
                                Order: {order.orderNumber}
                            </Text>
                            <Text style={styles.orderQuantity}>
                                Quantity: {order.quantity}
                            </Text>
                        </View>
                        <View style={styles.orderPriceContainer}>
                            <Text style={styles.orderPrice}>{formatRupiah(order.price)}</Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={Colors.gray}
                            />
                        </View>
                    </TouchableOpacity>
                ))}
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
        fontSize: FontSize.lg,
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
        width: 72,
        height: 72,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.lightGray,
        marginRight: Spacing.lg,
    },
    orderInfo: {
        flex: 1,
    },
    orderTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    orderDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: 2,
    },
    orderNumber: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    orderQuantity: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    orderPriceContainer: {
        alignItems: 'flex-end',
        gap: 8,
    },
    orderPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.lg,
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
});
