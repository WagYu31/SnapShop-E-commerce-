import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

const timelineSteps = [
    {
        label: 'Order Confirmed',
        date: '8:00 PM, May 28 2021',
        status: 'completed' as const,
    },
    {
        label: 'Preparing',
        date: '2:00 PM, May 29 2021',
        status: 'completed' as const,
    },
    {
        label: 'Shipped',
        date: '5:00 PM, May 30 2021',
        status: 'current' as const,
    },
    {
        label: 'Delivered',
        date: 'Estimated: June 1 2021',
        status: 'pending' as const,
    },
];

const getStepColor = (status: string) => {
    switch (status) {
        case 'completed':
            return Colors.green;
        case 'current':
            return '#F59E0B';
        default:
            return Colors.border;
    }
};

const getStepIcon = (status: string) => {
    if (status === 'completed') return 'checkmark';
    if (status === 'current') return 'ellipse';
    return 'ellipse-outline';
};

export default function OrderDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderId = (params.orderId as string) || 'GC092921';
    const productName = (params.productName as string) || 'Jeka Jacket';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Order ID */}
                <Text style={styles.orderId}>#Order ID {orderId}</Text>

                {/* Product Card */}
                <View style={styles.productCard}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop' }}
                        style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                        <View style={styles.productHeader}>
                            <Text style={styles.productName}>{productName}</Text>
                            <TouchableOpacity>
                                <Text style={styles.removeText}>REMOVE</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.productVariant}>Size: S, Color: Green</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.productPrice}>$12</Text>
                            <View style={styles.qtyControls}>
                                <TouchableOpacity style={styles.qtyBtn}>
                                    <Ionicons
                                        name="remove"
                                        size={14}
                                        color={Colors.primaryText}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>1</Text>
                                <TouchableOpacity style={styles.qtyBtn}>
                                    <Ionicons
                                        name="add"
                                        size={14}
                                        color={Colors.primaryText}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Status Timeline */}
                <View style={styles.timelineSection}>
                    <Text style={styles.sectionTitle}>Order Status</Text>
                    <View style={styles.timeline}>
                        {timelineSteps.map((step, index) => (
                            <View key={index} style={styles.timelineStep}>
                                {/* Dot + Line */}
                                <View style={styles.timelineLeft}>
                                    <View
                                        style={[
                                            styles.timelineDot,
                                            {
                                                backgroundColor:
                                                    getStepColor(step.status),
                                            },
                                        ]}
                                    >
                                        {step.status === 'completed' && (
                                            <Ionicons
                                                name="checkmark"
                                                size={12}
                                                color={Colors.white}
                                            />
                                        )}
                                    </View>
                                    {index < timelineSteps.length - 1 && (
                                        <View
                                            style={[
                                                styles.timelineLine,
                                                {
                                                    backgroundColor:
                                                        step.status === 'completed'
                                                            ? Colors.green
                                                            : Colors.border,
                                                },
                                            ]}
                                        />
                                    )}
                                </View>
                                {/* Text */}
                                <View style={styles.timelineRight}>
                                    <Text
                                        style={[
                                            styles.timelineLabel,
                                            step.status === 'pending' && {
                                                color: Colors.gray,
                                            },
                                        ]}
                                    >
                                        {step.label}
                                    </Text>
                                    <Text style={styles.timelineDate}>
                                        {step.date}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Delivery Info */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Delivery Date</Text>
                        <Text style={styles.infoValue}>20 March, 5:30 PM</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Delivery Location</Text>
                        <Text style={styles.infoValue}>
                            Moon Road, West Subidbazar
                        </Text>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Payment Method</Text>
                        <View style={styles.paymentInfo}>
                            <Ionicons
                                name="card"
                                size={18}
                                color={Colors.primaryText}
                            />
                            <Text style={styles.infoValue}>
                                Visa **** 4567
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>$50.00</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Shipping Fee</Text>
                        <Text style={styles.summaryValue}>$5.00</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Coupon Discount</Text>
                        <Text style={[styles.summaryValue, { color: Colors.green }]}>
                            -$5.00
                        </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total Cost</Text>
                        <Text style={styles.totalValue}>$50.00</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.reorderButton}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.reorderButtonText}>Reorder</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => router.push('/track-order')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="location" size={18} color={Colors.primary} />
                        <Text style={styles.trackButtonText}>Track Order</Text>
                    </TouchableOpacity>
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
    orderId: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: Spacing.lg,
    },
    // Product Card
    productCard: {
        flexDirection: 'row',
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl,
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
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    productName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    removeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.xs,
        color: Colors.red,
    },
    productVariant: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    productPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    qtyText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    // Timeline
    timelineSection: {
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
    reorderButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    reorderButtonText: {
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
});
