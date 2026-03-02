import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import FadeInView from '../components/FadeInView';

const addressesData = [
    {
        id: '1',
        label: 'Rumah',
        name: 'John Doe',
        phone: '+62 812 3456 7890',
        address: 'Jl. Sudirman No. 123, RT 05/RW 02, Menteng',
        city: 'Jakarta Pusat, DKI Jakarta 10310',
        isDefault: true,
    },
    {
        id: '2',
        label: 'Kantor',
        name: 'John Doe',
        phone: '+62 812 3456 7890',
        address: 'Jl. Gatot Subroto Kav. 44-46, Tower B Lt. 15',
        city: 'Jakarta Selatan, DKI Jakarta 12930',
        isDefault: false,
    },
];

export default function AddressesScreen() {
    const router = useRouter();
    const [addresses, setAddresses] = useState(addressesData);

    const setDefault = (id: string) => {
        setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    };

    const deleteAddress = (id: string) => {
        Alert.alert('Hapus Alamat', 'Yakin ingin menghapus alamat ini?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: () => setAddresses(prev => prev.filter(a => a.id !== id)) },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {addresses.map((addr, index) => (
                    <FadeInView key={addr.id} delay={index * 100}>
                        <View style={[styles.addressCard, addr.isDefault && styles.addressDefault]}>
                            <View style={styles.addressHeader}>
                                <View style={styles.labelBadge}>
                                    <Ionicons name={addr.label === 'Rumah' ? 'home-outline' : 'business-outline'} size={14} color={Colors.primary} />
                                    <Text style={styles.labelText}>{addr.label}</Text>
                                </View>
                                {addr.isDefault && (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultText}>Default</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.addressName}>{addr.name}</Text>
                            <Text style={styles.addressPhone}>{addr.phone}</Text>
                            <Text style={styles.addressText}>{addr.address}</Text>
                            <Text style={styles.addressCity}>{addr.city}</Text>
                            <View style={styles.addressActions}>
                                {!addr.isDefault && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => setDefault(addr.id)}>
                                        <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
                                        <Text style={styles.actionText}>Set Default</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="create-outline" size={16} color={Colors.secondaryText} />
                                    <Text style={[styles.actionText, { color: Colors.secondaryText }]}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteAddress(addr.id)}>
                                    <Ionicons name="trash-outline" size={16} color="#E53935" />
                                    <Text style={[styles.actionText, { color: '#E53935' }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FadeInView>
                ))}

                <FadeInView delay={300}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/add-address')}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                        <Text style={styles.addButtonText}>Add New Address</Text>
                    </TouchableOpacity>
                </FadeInView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl, paddingTop: 60, paddingBottom: Spacing.lg,
    },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: FontSize.xl, color: Colors.primaryText },
    scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
    addressCard: {
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1.5, borderColor: 'transparent',
    },
    addressDefault: { borderColor: Colors.primary, backgroundColor: '#F8F8FF' },
    addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: 8 },
    labelText: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.xs, color: Colors.primary },
    defaultBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    defaultText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.xs, color: Colors.white },
    addressName: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primaryText, marginBottom: 2 },
    addressPhone: { fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.secondaryText, marginBottom: Spacing.sm },
    addressText: { fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.secondaryText, lineHeight: 18 },
    addressCity: { fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.gray, marginTop: 2 },
    addressActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.sm, color: Colors.primary },
    addButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
        borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
        marginTop: Spacing.sm, gap: Spacing.sm,
    },
    addButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primary },
});
