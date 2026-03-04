import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../constants/theme';
import { storeLocations, vouchers } from '../constants/data';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedButton from '../components/AnimatedButton';
import FadeInView from '../components/FadeInView';

type DeliveryMethod = 'pickup' | 'courier';
type PaymentMethodType = 'midtrans' | 'cod';

interface ShippingService {
    courier: string;
    courier_name: string;
    service: string;
    description: string;
    cost: number;
    etd: string;
}

interface UserAddress {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    street: string;
    city: string;
    city_id: number;
    province: string;
    postal_code: string;
    is_default: boolean;
}

export default function CheckoutScreen() {
    const router = useRouter();
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');
    const [selectedStore, setSelectedStore] = useState('1');
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>('midtrans');
    const [promoCode, setPromoCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<typeof vouchers[0] | null>(null);
    const [showVouchers, setShowVouchers] = useState(false);
    const [promoError, setPromoError] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // RajaOngkir courier state
    const [selectedCourierType, setSelectedCourierType] = useState('jne');
    const [shippingServices, setShippingServices] = useState<ShippingService[]>([]);
    const [selectedService, setSelectedService] = useState<ShippingService | null>(null);
    const [loadingShipping, setLoadingShipping] = useState(false);

    // Address state
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

    // Cart state
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [subtotal, setSubtotal] = useState(0);

    const courierTypes = [
        { id: 'jne', name: 'JNE', icon: 'cube-outline' },
        { id: 'tiki', name: 'TIKI', icon: 'airplane-outline' },
        { id: 'pos', name: 'POS', icon: 'mail-outline' },
    ];

    // Fetch addresses and cart every time screen focuses (e.g. after adding address)
    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
            fetchCart();
        }, [])
    );

    const fetchAddresses = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/addresses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.data) {
                setAddresses(data.data);
                const defaultAddr = data.data.find((a: UserAddress) => a.is_default) || data.data[0];
                if (defaultAddr) setSelectedAddress(defaultAddr);
            }
        } catch (e) { console.error('Failed to fetch addresses', e); }
    };

    const fetchCart = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.data) {
                const items = data.data.items || [];
                setCartItems(items);
                setSubtotal(data.data.subtotal || 0);
            }
        } catch (e) { console.error('Failed to fetch cart', e); }
    };

    // Fetch shipping costs when courier type or address changes (Binderbyte uses city name)
    const fetchShippingCosts = useCallback(async (courier: string, cityName: string) => {
        const token = await AsyncStorage.getItem('token');
        if (!token || !cityName) return;
        setLoadingShipping(true);
        setShippingServices([]);
        setSelectedService(null);
        try {
            // Calculate total weight in kg (default 1kg per item)
            const totalWeightKg = cartItems.reduce((w: number, item: any) => w + item.quantity, 0) || 1;
            const res = await fetch(`${API_URL}/shipping/cost`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: cityName,
                    weight: totalWeightKg,
                    courier,
                }),
            });
            const data = await res.json();
            if (data.data && Array.isArray(data.data)) {
                setShippingServices(data.data);
                if (data.data.length > 0) setSelectedService(data.data[0]);
            }
        } catch (e) { console.error('Failed to fetch shipping costs', e); }
        setLoadingShipping(false);
    }, [cartItems]);

    useEffect(() => {
        if (selectedAddress?.city && deliveryMethod === 'courier') {
            fetchShippingCosts(selectedCourierType, selectedAddress.city);
        }
    }, [selectedCourierType, selectedAddress, deliveryMethod]);

    const shipping = deliveryMethod === 'pickup' ? 0 : (selectedService?.cost || 0);
    const voucherDiscount = appliedVoucher
        ? appliedVoucher.discountType === 'percentage'
            ? Math.min((subtotal * appliedVoucher.discountValue) / 100, appliedVoucher.maxDiscount)
            : appliedVoucher.discountType === 'fixed'
                ? appliedVoucher.discountValue
                : shipping
        : 0;
    const discount = -voucherDiscount;
    const total = subtotal + shipping + discount;

    const selectedStoreData = storeLocations.find(s => s.id === selectedStore);

    // Place order handler
    const handlePlaceOrder = async () => {
        if (isPlacingOrder) return;
        if (!selectedAddress && deliveryMethod === 'courier') {
            Alert.alert('Error', 'Pilih alamat pengiriman dulu');
            return;
        }
        if (deliveryMethod === 'courier' && !selectedService) {
            Alert.alert('Error', 'Pilih kurir pengiriman dulu');
            return;
        }
        if (subtotal === 0) {
            Alert.alert('Error', 'Keranjang masih kosong');
            return;
        }

        setIsPlacingOrder(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            setIsPlacingOrder(false);
            router.push('/login');
            return;
        }

        try {
            const body: any = {
                address_id: selectedAddress?.id || 1,
                courier_name: selectedService?.courier_name || 'Pickup',
                courier_service: selectedService?.service || '',
                shipping_cost: shipping,
                voucher_code: appliedVoucher?.code || '',
                notes: '',
                payment_method: selectedPayment,
            };

            if (deliveryMethod === 'pickup') {
                body.store_id = parseInt(selectedStore);
                body.courier_name = 'Store Pickup';
                body.shipping_cost = 0;
            }

            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                Alert.alert('Error', data.message || 'Gagal membuat order');
                setIsPlacingOrder(false);
                return;
            }

            const order = data.data?.order;

            if (selectedPayment === 'midtrans' && order) {
                // Get Midtrans Snap token
                const tokenRes = await fetch(`${API_URL}/payment/${order.id}/token`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                const tokenData = await tokenRes.json();

                if (tokenData.data?.redirect_url) {
                    router.push({
                        pathname: '/payment-webview',
                        params: {
                            url: tokenData.data.redirect_url,
                            orderId: String(order.id),
                            orderNumber: order.order_number,
                        },
                    });
                } else {
                    // Fallback if no redirect URL
                    router.push('/order-success');
                }
            } else {
                // COD — go to success
                router.push('/order-success');
            }
        } catch (e) {
            Alert.alert('Error', 'Terjadi kesalahan jaringan');
        }
        setIsPlacingOrder(false);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Delivery Method Toggle */}
                <FadeInView delay={100}>
                    <Text style={styles.sectionTitle}>Delivery Method</Text>
                    <View style={styles.methodToggle}>
                        <TouchableOpacity
                            style={[
                                styles.methodCard,
                                deliveryMethod === 'pickup' && styles.methodCardActive,
                            ]}
                            onPress={() => setDeliveryMethod('pickup')}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.methodIconBg,
                                deliveryMethod === 'pickup' && styles.methodIconBgActive,
                            ]}>
                                <Ionicons
                                    name="storefront"
                                    size={22}
                                    color={deliveryMethod === 'pickup' ? Colors.white : Colors.primaryText}
                                />
                            </View>
                            <Text style={[
                                styles.methodLabel,
                                deliveryMethod === 'pickup' && styles.methodLabelActive,
                            ]}>Store Pickup</Text>
                            <Text style={[
                                styles.methodSub,
                                deliveryMethod === 'pickup' && styles.methodSubActive,
                            ]}>FREE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.methodCard,
                                deliveryMethod === 'courier' && styles.methodCardActive,
                            ]}
                            onPress={() => setDeliveryMethod('courier')}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.methodIconBg,
                                deliveryMethod === 'courier' && styles.methodIconBgActive,
                            ]}>
                                <Ionicons
                                    name="car"
                                    size={22}
                                    color={deliveryMethod === 'courier' ? Colors.white : Colors.primaryText}
                                />
                            </View>
                            <Text style={[
                                styles.methodLabel,
                                deliveryMethod === 'courier' && styles.methodLabelActive,
                            ]}>Courier</Text>
                            <Text style={[
                                styles.methodSub,
                                deliveryMethod === 'courier' && styles.methodSubActive,
                            ]}>3rd Party</Text>
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                {/* Store Pickup Section */}
                {deliveryMethod === 'pickup' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Select Store</Text>
                            <View style={styles.storeBadge}>
                                <Text style={styles.storeBadgeText}>{storeLocations.length} stores</Text>
                            </View>
                        </View>
                        <View style={styles.storeList}>
                            {storeLocations.map((store) => (
                                <TouchableOpacity
                                    key={store.id}
                                    style={[
                                        styles.storeCard,
                                        selectedStore === store.id && styles.storeCardActive,
                                    ]}
                                    onPress={() => setSelectedStore(store.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.storeTop}>
                                        <View style={styles.storeInfo}>
                                            <Text style={styles.storeName}>{store.name}</Text>
                                            <Text style={styles.storeAddress}>{store.address}</Text>
                                            <Text style={styles.storeCity}>{store.city}</Text>
                                        </View>
                                        <View style={[
                                            styles.radio,
                                            selectedStore === store.id && styles.radioSelected,
                                        ]}>
                                            {selectedStore === store.id && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.storeBottom}>
                                        <View style={styles.storeTag}>
                                            <Ionicons name="time-outline" size={12} color={Colors.secondaryText} />
                                            <Text style={styles.storeTagText}>{store.hours}</Text>
                                        </View>
                                        <View style={styles.storeTag}>
                                            <Ionicons name="navigate-outline" size={12} color={Colors.secondaryText} />
                                            <Text style={styles.storeTagText}>{store.distance}</Text>
                                        </View>
                                        <View style={styles.storeTag}>
                                            <Ionicons name="call-outline" size={12} color={Colors.secondaryText} />
                                            <Text style={styles.storeTagText}>Call</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Courier Delivery Section */}
                {deliveryMethod === 'courier' && (
                    <>
                        {/* Delivery Address */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Delivery Address</Text>
                                <TouchableOpacity onPress={() => router.push('/add-address')}>
                                    <Ionicons name="create-outline" size={18} color={Colors.primaryText} />
                                </TouchableOpacity>
                            </View>
                            {selectedAddress ? (
                                <View style={styles.addressCard}>
                                    <View style={styles.addressIcon}>
                                        <Ionicons name="location" size={20} color={Colors.primaryText} />
                                    </View>
                                    <View style={styles.addressInfo}>
                                        <Text style={styles.addressName}>
                                            {selectedAddress.recipient_name} • {selectedAddress.label || 'Alamat'}
                                        </Text>
                                        <Text style={styles.addressDetail}>
                                            {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.province}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.addressCard, { justifyContent: 'center' }]}
                                    onPress={() => router.push('/add-address')}
                                >
                                    <Ionicons name="add-circle" size={24} color={Colors.primary} />
                                    <Text style={[styles.addressName, { color: Colors.primary, marginLeft: 8 }]}>
                                        Tambah Alamat
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Courier Type Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Pilih Kurir</Text>
                            <View style={styles.courierTypeRow}>
                                {courierTypes.map((ct) => (
                                    <TouchableOpacity
                                        key={ct.id}
                                        style={[
                                            styles.courierTypeBtn,
                                            selectedCourierType === ct.id && styles.courierTypeBtnActive,
                                        ]}
                                        onPress={() => setSelectedCourierType(ct.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name={ct.icon as any} size={16} color={selectedCourierType === ct.id ? Colors.primary : Colors.primaryText} />
                                        <Text style={[styles.courierTypeName, selectedCourierType === ct.id && { color: Colors.primary }]}>{ct.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Service Options */}
                            {loadingShipping ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator color={Colors.primary} />
                                    <Text style={[styles.courierEta, { marginTop: 8 }]}>Menghitung ongkir...</Text>
                                </View>
                            ) : shippingServices.length > 0 ? (
                                <View style={styles.courierList}>
                                    {shippingServices.map((svc, idx) => (
                                        <TouchableOpacity
                                            key={`${svc.courier}-${svc.service}-${idx}`}
                                            style={[
                                                styles.courierCard,
                                                selectedService?.service === svc.service && selectedService?.courier === svc.courier && styles.courierCardActive,
                                            ]}
                                            onPress={() => setSelectedService(svc)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.courierLeft}>
                                                <View style={[
                                                    styles.courierIcon,
                                                    selectedService?.service === svc.service && selectedService?.courier === svc.courier && styles.courierIconActive,
                                                ]}>
                                                    <Ionicons
                                                        name="cube-outline"
                                                        size={18}
                                                        color={selectedService?.service === svc.service && selectedService?.courier === svc.courier ? Colors.white : Colors.primaryText}
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.courierName} numberOfLines={1}>{svc.courier_name}</Text>
                                                    <Text style={styles.courierServiceName} numberOfLines={1}>{svc.service} — {svc.description || svc.etd}</Text>
                                                    <Text style={styles.courierEta}>
                                                        <Ionicons name="time-outline" size={11} color={Colors.secondaryText} />
                                                        {' '}{svc.etd}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.courierRight}>
                                                <Text style={[
                                                    styles.courierPrice,
                                                    selectedService?.service === svc.service && selectedService?.courier === svc.courier && styles.courierPriceActive,
                                                ]}>
                                                    {formatRupiah(svc.cost)}
                                                </Text>
                                                <View style={[
                                                    styles.radio,
                                                    selectedService?.service === svc.service && selectedService?.courier === svc.courier && styles.radioSelected,
                                                ]}>
                                                    {selectedService?.service === svc.service && selectedService?.courier === svc.courier && (
                                                        <View style={styles.radioInner} />
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : selectedAddress?.city ? (
                                <Text style={[styles.courierEta, { textAlign: 'center', padding: 16 }]}>
                                    Tidak ada layanan tersedia untuk kota ini
                                </Text>
                            ) : (
                                <Text style={[styles.courierEta, { textAlign: 'center', padding: 16 }]}>
                                    Tambah alamat untuk melihat ongkir
                                </Text>
                            )}
                        </View>
                    </>
                )}

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
                    <View style={styles.paymentList}>
                        <TouchableOpacity
                            style={styles.paymentItem}
                            onPress={() => setSelectedPayment('midtrans')}
                        >
                            <View style={styles.paymentLeft}>
                                <View style={[styles.paymentIcon, selectedPayment === 'midtrans' && { backgroundColor: '#0078D4' }]}>
                                    <Ionicons name="card" size={20} color={selectedPayment === 'midtrans' ? Colors.white : Colors.primaryText} />
                                </View>
                                <View>
                                    <Text style={styles.paymentName}>Bayar Online</Text>
                                    <Text style={[styles.courierEta, { marginTop: 1 }]}>Midtrans — VA, E-Wallet, Credit Card</Text>
                                </View>
                            </View>
                            <View style={[
                                styles.radio,
                                selectedPayment === 'midtrans' && styles.radioSelected,
                            ]}>
                                {selectedPayment === 'midtrans' &&
                                    <View style={styles.radioInner} />
                                }
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.paymentItem}
                            onPress={() => setSelectedPayment('cod')}
                        >
                            <View style={styles.paymentLeft}>
                                <View style={[styles.paymentIcon, selectedPayment === 'cod' && { backgroundColor: '#25D366' }]}>
                                    <Ionicons name="cash" size={20} color={selectedPayment === 'cod' ? Colors.white : Colors.primaryText} />
                                </View>
                                <View>
                                    <Text style={styles.paymentName}>Cash on Delivery</Text>
                                    <Text style={[styles.courierEta, { marginTop: 1 }]}>Bayar saat barang sampai</Text>
                                </View>
                            </View>
                            <View style={[
                                styles.radio,
                                selectedPayment === 'cod' && styles.radioSelected,
                            ]}>
                                {selectedPayment === 'cod' &&
                                    <View style={styles.radioInner} />
                                }
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Promo Code Section */}
                <FadeInView delay={300}>
                    <Text style={styles.sectionTitle}>Promo Code</Text>
                    <View style={styles.promoRow}>
                        <TextInput
                            style={styles.promoInput}
                            placeholder="Enter promo code"
                            placeholderTextColor={Colors.gray}
                            value={promoCode}
                            onChangeText={(text) => { setPromoCode(text.toUpperCase()); setPromoError(''); }}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[styles.promoApplyBtn, !promoCode && styles.promoApplyDisabled]}
                            disabled={!promoCode}
                            onPress={() => {
                                const found = vouchers.find(v => v.code === promoCode && !v.isUsed);
                                if (found) {
                                    if (subtotal < found.minPurchase) {
                                        setPromoError(`Min. belanja ${formatRupiah(found.minPurchase)}`);
                                    } else {
                                        setAppliedVoucher(found);
                                        setPromoError('');
                                    }
                                } else {
                                    setPromoError('Kode promo tidak valid');
                                }
                            }}
                        >
                            <Text style={styles.promoApplyText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                    {promoError ? <Text style={styles.promoErrorText}>{promoError}</Text> : null}
                    {appliedVoucher && (
                        <View style={styles.appliedVoucher}>
                            <View style={styles.appliedVoucherInfo}>
                                <Ionicons name="pricetag" size={16} color={Colors.primary} />
                                <Text style={styles.appliedVoucherText}>{appliedVoucher.title} — {appliedVoucher.code}</Text>
                            </View>
                            <TouchableOpacity onPress={() => { setAppliedVoucher(null); setPromoCode(''); }}>
                                <Ionicons name="close-circle" size={20} color={Colors.gray} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity style={styles.seeVouchersBtn} onPress={() => setShowVouchers(true)}>
                        <Ionicons name="ticket-outline" size={18} color={Colors.primary} />
                        <Text style={styles.seeVouchersText}>See available vouchers</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </FadeInView>

                {/* Voucher Modal */}
                <Modal visible={showVouchers} animationType="slide" transparent>
                    <View style={styles.voucherModalOverlay}>
                        <View style={styles.voucherModalContent}>
                            <View style={styles.voucherModalHeader}>
                                <Text style={styles.voucherModalTitle}>Available Vouchers</Text>
                                <TouchableOpacity onPress={() => setShowVouchers(false)}>
                                    <Ionicons name="close" size={24} color={Colors.primaryText} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {vouchers.filter(v => !v.isUsed).map(v => (
                                    <TouchableOpacity
                                        key={v.id}
                                        style={[
                                            styles.voucherCard,
                                            appliedVoucher?.id === v.id && styles.voucherCardActive,
                                        ]}
                                        onPress={() => {
                                            if (subtotal >= v.minPurchase) {
                                                setAppliedVoucher(v);
                                                setPromoCode(v.code);
                                                setPromoError('');
                                                setShowVouchers(false);
                                            } else {
                                                setPromoError(`Min. belanja ${formatRupiah(v.minPurchase)}`);
                                            }
                                        }}
                                    >
                                        <View style={[
                                            styles.voucherBadge,
                                            v.discountType === 'shipping' ? { backgroundColor: '#25D366' } : { backgroundColor: Colors.primary },
                                        ]}>
                                            <Ionicons
                                                name={v.discountType === 'shipping' ? 'car-outline' : 'pricetag'}
                                                size={18}
                                                color="#fff"
                                            />
                                        </View>
                                        <View style={styles.voucherInfo}>
                                            <Text style={styles.voucherTitle}>{v.title}</Text>
                                            <Text style={styles.voucherDesc}>{v.description}</Text>
                                            <Text style={styles.voucherExpiry}>Valid until {v.validUntil} • Min. {formatRupiah(v.minPurchase)}</Text>
                                        </View>
                                        <View style={styles.voucherCodeBadge}>
                                            <Text style={styles.voucherCodeText}>{v.code}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Order Summary */}
                <FadeInView delay={400}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Shipping</Text>
                            {deliveryMethod === 'pickup' ? (
                                <View style={styles.freeShippingBadge}>
                                    <Text style={styles.freeShippingText}>FREE</Text>
                                </View>
                            ) : (
                                <Text style={styles.summaryValue}>{formatRupiah(shipping)}</Text>
                            )}
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Discount</Text>
                            <Text style={[styles.summaryValue, { color: Colors.green }]}>
                                -{formatRupiah(Math.abs(discount))}
                            </Text>
                        </View>
                        {deliveryMethod === 'pickup' && selectedStoreData && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.pickupInfoRow}>
                                    <Ionicons name="storefront-outline" size={14} color={Colors.secondaryText} />
                                    <Text style={styles.pickupInfoText}>
                                        Pickup at: {selectedStoreData.name}
                                    </Text>
                                </View>
                            </>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
                        </View>
                    </View>
                </FadeInView>
            </ScrollView>

            {/* Place Order Button */}
            <View style={styles.bottomContainer}>
                <View style={styles.totalRow}>
                    <Text style={styles.bottomTotalLabel}>TOTAL</Text>
                    <Text style={styles.bottomTotalValue}>{formatRupiah(total)}</Text>
                </View>
                <AnimatedButton
                    onPress={handlePlaceOrder}
                    title={isPlacingOrder ? 'Memproses...' : (
                        selectedPayment === 'midtrans'
                            ? (deliveryMethod === 'pickup' ? 'Bayar — Pickup' : 'Bayar — Delivery')
                            : (deliveryMethod === 'pickup' ? 'Order COD — Pickup' : 'Order COD — Delivery')
                    )}
                    style={{ ...styles.placeOrderButton, ...(isPlacingOrder ? { opacity: 0.6 } : {}) }}
                    textStyle={styles.placeOrderText}
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
    scrollContent: {
        paddingBottom: 160,
    },
    section: {
        paddingHorizontal: Spacing.xxl,
        marginBottom: Spacing.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginBottom: Spacing.md,
    },

    // === Delivery Method Toggle ===
    methodToggle: {
        flexDirection: 'row',
        gap: 12,
    },
    methodCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    methodCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F5F0FF',
    },
    methodIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    methodIconBgActive: {
        backgroundColor: Colors.primary,
    },
    methodLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    methodLabelActive: {
        color: Colors.primary,
    },
    methodSub: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
    },
    methodSubActive: {
        color: Colors.primary,
    },

    // === Store Picker ===
    storeBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    storeBadgeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.xs,
        color: '#2E7D32',
    },
    storeList: {
        gap: 10,
    },
    storeCard: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    storeCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#FAFAFE',
    },
    storeTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    storeInfo: {
        flex: 1,
        marginRight: 12,
    },
    storeName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 3,
    },
    storeAddress: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: 1,
    },
    storeCity: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    storeBottom: {
        flexDirection: 'row',
        gap: 12,
    },
    storeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.lightGray,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    storeTagText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: Colors.secondaryText,
    },

    // === Address Card ===
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
    },
    addressIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    addressInfo: {
        flex: 1,
    },
    addressName: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    addressDetail: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },

    // === Courier Selection ===
    courierList: {
        gap: 8,
    },
    courierTypeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    courierTypeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    courierTypeBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F5F0FF',
    },
    courierTypeName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    courierCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        gap: 12,
    },
    courierCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#FAFAFE',
    },
    courierLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    courierIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    courierIconActive: {
        backgroundColor: Colors.primary,
    },
    courierName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    courierServiceName: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        marginTop: 1,
    },
    courierEta: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        marginTop: 2,
    },
    courierRight: {
        alignItems: 'flex-end',
        gap: 6,
        flexShrink: 0,
    },
    courierPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    courierPriceActive: {
        color: Colors.primary,
    },

    // === Payment ===
    paymentList: {
        gap: Spacing.sm,
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    paymentIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentName: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },

    // === Radio ===
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: Colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },

    // === Summary ===
    summaryCard: {
        padding: Spacing.lg,
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    freeShippingBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    freeShippingText: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.sm,
        color: '#2E7D32',
    },
    pickupInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.md,
    },
    pickupInfoText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        flex: 1,
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

    // === Bottom ===
    bottomContainer: {
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
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    bottomTotalLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        letterSpacing: 1,
    },
    bottomTotalValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h3,
        color: Colors.primaryText,
    },
    placeOrderButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    placeOrderText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    promoRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    promoInput: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    promoApplyBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
    },
    promoApplyDisabled: {
        opacity: 0.4,
    },
    promoApplyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
    promoErrorText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: '#E53935',
        marginBottom: Spacing.sm,
    },
    appliedVoucher: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EEF2FF',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    appliedVoucherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    appliedVoucherText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    seeVouchersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },
    seeVouchersText: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    voucherModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    voucherModalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: Spacing.xl,
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    voucherModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    voucherModalTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.xl,
        color: Colors.primaryText,
    },
    voucherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    voucherCardActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F8F8FF',
    },
    voucherBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    voucherInfo: {
        flex: 1,
    },
    voucherTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    voucherDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: 2,
    },
    voucherExpiry: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.gray,
    },
    voucherCodeBadge: {
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    voucherCodeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.xs,
        color: Colors.primaryText,
    },
});
