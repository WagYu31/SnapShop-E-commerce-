import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../constants/theme';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RETURN_REASONS = [
    'Barang rusak / cacat',
    'Barang tidak sesuai deskripsi',
    'Ukuran tidak sesuai',
    'Warna berbeda dari foto',
    'Salah kirim produk',
    'Barang tidak lengkap',
    'Lainnya',
];

export default function ReturnRequestScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        orderId: string;
        orderNumber: string;
        productName: string;
        total: string;
    }>();

    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        const reason = selectedReason === 'Lainnya'
            ? customReason.trim()
            : selectedReason;

        if (!reason) {
            Alert.alert('Error', 'Pilih alasan pengembalian');
            return;
        }

        Alert.alert(
            'Konfirmasi Pengembalian',
            `Apakah kamu yakin ingin mengajukan pengembalian untuk order ${params.orderNumber}?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Ya, Ajukan',
                    style: 'destructive',
                    onPress: async () => {
                        setSubmitting(true);
                        const token = await AsyncStorage.getItem('token');
                        if (!token) return;

                        try {
                            const fullReason = additionalNotes
                                ? `${reason}\n\nCatatan: ${additionalNotes}`
                                : reason;

                            const res = await fetch(`${API_URL}/returns`, {
                                method: 'POST',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    order_id: parseInt(params.orderId),
                                    reason: fullReason,
                                    refund_amount: parseInt(params.total || '0'),
                                }),
                            });
                            const data = await res.json();

                            if (res.ok && data.success !== false) {
                                Alert.alert(
                                    'Berhasil! 🎉',
                                    'Permintaan pengembalian berhasil diajukan. Admin akan meninjau permintaan kamu.',
                                    [{ text: 'OK', onPress: () => router.back() }]
                                );
                            } else {
                                Alert.alert('Gagal', data.message || 'Tidak bisa mengajukan pengembalian. Pastikan order sudah diterima.');
                            }
                        } catch (e) {
                            Alert.alert('Error', 'Gagal terhubung ke server');
                        }
                        setSubmitting(false);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajukan Pengembalian</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={styles.orderInfo}>
                    <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.orderNumber}>#{params.orderNumber}</Text>
                        <Text style={styles.orderProduct}>{params.productName}</Text>
                    </View>
                    <Text style={styles.orderTotal}>{formatRupiah(parseInt(params.total || '0'))}</Text>
                </View>

                {/* Reason Selection */}
                <Text style={styles.sectionTitle}>Alasan Pengembalian</Text>
                <View style={styles.reasonList}>
                    {RETURN_REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason}
                            style={[styles.reasonItem, selectedReason === reason && styles.reasonItemActive]}
                            onPress={() => setSelectedReason(reason)}
                        >
                            <View style={[styles.radio, selectedReason === reason && styles.radioSelected]}>
                                {selectedReason === reason && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                                {reason}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom Reason */}
                {selectedReason === 'Lainnya' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Jelaskan alasan kamu</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Tulis alasan pengembalian..."
                            placeholderTextColor={Colors.gray}
                            multiline
                            numberOfLines={3}
                            value={customReason}
                            onChangeText={setCustomReason}
                        />
                    </View>
                )}

                {/* Additional Notes */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Catatan Tambahan (opsional)</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Tambahkan informasi lain jika perlu..."
                        placeholderTextColor={Colors.gray}
                        multiline
                        numberOfLines={3}
                        value={additionalNotes}
                        onChangeText={setAdditionalNotes}
                    />
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#6366F1" />
                    <Text style={styles.infoText}>
                        Admin akan meninjau permintaan kamu dalam 1-3 hari kerja. Jika disetujui, refund akan diproses.
                    </Text>
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons name="arrow-undo" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.submitText}>Ajukan Pengembalian</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    // Order Info
    orderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    orderNumber: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    orderProduct: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        marginTop: 2,
    },
    orderTotal: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    // Reasons
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginBottom: Spacing.md,
    },
    reasonList: {
        gap: Spacing.sm,
        marginBottom: Spacing.xxl,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    reasonItemActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '08',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
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
    reasonText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    reasonTextActive: {
        fontFamily: 'Inter_500Medium',
        color: Colors.primary,
    },
    // Input
    inputGroup: {
        marginBottom: Spacing.xxl,
    },
    inputLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: Spacing.sm,
    },
    textArea: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    // Info
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#6366F1' + '12',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: '#6366F1',
        lineHeight: 20,
    },
    // Footer
    footer: {
        padding: Spacing.xxl,
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.xxl,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.white,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
});
