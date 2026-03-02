import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../../constants/theme';
import { products } from '../../constants/data';
import AnimatedButton from '../../components/AnimatedButton';

interface CartItem {
    product: typeof products[0];
    quantity: number;
    selectedColor: string;
    selectedSize: string;
}

const initialCart: CartItem[] = [
    {
        product: products[0],
        quantity: 2,
        selectedColor: 'Black',
        selectedSize: 'M',
    },
    {
        product: products[1],
        quantity: 1,
        selectedColor: 'Navy',
        selectedSize: 'L',
    },
];

export default function CartScreen() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
    const [promoCode, setPromoCode] = useState('');

    const updateQuantity = (index: number, delta: number) => {
        setCartItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    const removeItem = (index: number) => {
        setCartItems((prev) => prev.filter((_, i) => i !== index));
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );
    const delivery = 15000;
    const total = subtotal + delivery;

    if (cartItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyHeader}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cart</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContent}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="bag-outline" size={64} color={Colors.gray} />
                    </View>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <AnimatedButton
                        onPress={() => router.push('/(tabs)')}
                        title="Go Shopping"
                        style={styles.goShoppingButton}
                        textStyle={styles.goShoppingText}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cart</Text>
                <TouchableOpacity onPress={() => setCartItems([])}>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Cart Items */}
                {cartItems.map((item, index) => (
                    <View key={index} style={styles.cartItem}>
                        <Image
                            source={{ uri: item.product.image }}
                            style={styles.itemImage}
                        />
                        <View style={styles.itemInfo}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                    {item.product.name}
                                </Text>
                                <TouchableOpacity onPress={() => removeItem(index)}>
                                    <Ionicons name="close" size={18} color={Colors.gray} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.itemVariant}>
                                Color: {item.selectedColor} | Size: {item.selectedSize}
                            </Text>
                            <View style={styles.itemFooter}>
                                <Text style={styles.itemPrice}>
                                    {formatRupiah(item.product.price)}
                                </Text>
                                <View style={styles.quantityContainer}>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={() => updateQuantity(index, -1)}
                                    >
                                        <Ionicons name="remove" size={16} color={Colors.primaryText} />
                                    </TouchableOpacity>
                                    <Text style={styles.quantityText}>{item.quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={() => updateQuantity(index, 1)}
                                    >
                                        <Ionicons name="add" size={16} color={Colors.primaryText} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Promo Code */}
                <View style={styles.promoContainer}>
                    <TextInput
                        style={styles.promoInput}
                        placeholder="Promo Code"
                        placeholderTextColor={Colors.gray}
                        value={promoCode}
                        onChangeText={setPromoCode}
                    />
                    <TouchableOpacity style={styles.applyButton}>
                        <Text style={styles.applyText}>Apply</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Sub Total :</Text>
                        <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery :</Text>
                        <Text style={styles.summaryValue}>{formatRupiah(delivery)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total :</Text>
                        <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Checkout Button */}
            <View style={styles.checkoutContainer}>
                <AnimatedButton
                    onPress={() => router.push('/checkout')}
                    title="Checkout"
                    style={styles.checkoutButton}
                    textStyle={styles.checkoutText}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    emptyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl,
        paddingTop: 60,
        paddingBottom: Spacing.lg,
    },
    emptyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    emptyTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginBottom: Spacing.xxl,
    },
    goShoppingButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxxl,
        borderRadius: BorderRadius.xl,
    },
    goShoppingText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl,
        paddingTop: 60,
        paddingBottom: Spacing.lg,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.xl,
        color: Colors.primaryText,
    },
    clearText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 120,
    },
    cartItem: {
        flexDirection: 'row',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.lightGray,
    },
    itemInfo: {
        flex: 1,
        marginLeft: Spacing.lg,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        flex: 1,
        marginRight: Spacing.sm,
    },
    itemVariant: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        marginTop: 4,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    itemPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        minWidth: 20,
        textAlign: 'center',
    },
    promoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xxl,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    promoInput: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        backgroundColor: Colors.lightGray,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    applyButton: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
    },
    applyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
    summaryContainer: {
        marginTop: Spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    summaryLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
    },
    summaryValue: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    totalLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    totalValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    checkoutContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.lg,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    checkoutButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    checkoutText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
});
