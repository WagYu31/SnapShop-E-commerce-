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

const paymentCards = [
    { id: '1', type: 'visa', last4: '4242', expiry: '12/27', holder: 'JOHN DOE', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8888', expiry: '03/26', holder: 'JOHN DOE', isDefault: false },
    { id: '3', type: 'bca', last4: '1234', expiry: '', holder: 'Virtual Account', isDefault: false },
];

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const [cards, setCards] = useState(paymentCards);

    const getCardIcon = (type: string) => {
        switch (type) {
            case 'visa': return 'card';
            case 'mastercard': return 'card-outline';
            case 'bca': return 'wallet-outline';
            default: return 'card-outline';
        }
    };

    const getCardColor = (type: string) => {
        switch (type) {
            case 'visa': return '#1A1F71';
            case 'mastercard': return '#EB001B';
            case 'bca': return '#003399';
            default: return Colors.primary;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {cards.map((card, index) => (
                    <FadeInView key={card.id} delay={index * 100}>
                        <TouchableOpacity style={[styles.cardItem, card.isDefault && styles.cardDefault]}>
                            <View style={[styles.cardIcon, { backgroundColor: getCardColor(card.type) }]}>
                                <Ionicons name={getCardIcon(card.type) as any} size={22} color="#fff" />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardType}>{card.type.toUpperCase()}</Text>
                                <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                                {card.expiry ? <Text style={styles.cardExpiry}>Expires {card.expiry}</Text> : null}
                            </View>
                            <View style={styles.cardRight}>
                                {card.isDefault && (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultText}>Default</Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
                            </View>
                        </TouchableOpacity>
                    </FadeInView>
                ))}

                <FadeInView delay={400}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => Alert.alert('Add Card', 'Payment integration coming soon!')}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                        <Text style={styles.addButtonText}>Add New Payment Method</Text>
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
    scrollContent: { padding: Spacing.xxl, paddingTop: Spacing.sm },
    cardItem: {
        flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md, borderWidth: 1.5, borderColor: 'transparent',
    },
    cardDefault: { borderColor: Colors.primary, backgroundColor: '#F8F8FF' },
    cardIcon: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    cardInfo: { flex: 1, marginLeft: Spacing.lg },
    cardType: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.sm, color: Colors.secondaryText, marginBottom: 2 },
    cardNumber: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primaryText, letterSpacing: 1 },
    cardExpiry: { fontFamily: 'Inter_400Regular', fontSize: FontSize.xs, color: Colors.secondaryText, marginTop: 2 },
    cardRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    defaultBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    defaultText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.xs, color: Colors.white },
    addButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
        borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
        marginTop: Spacing.sm, gap: Spacing.sm,
    },
    addButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primary },
});
