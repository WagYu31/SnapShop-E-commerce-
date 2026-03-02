import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import FadeInView from '../components/FadeInView';

const faqData = [
    { id: '1', question: 'Bagaimana cara melacak pesanan saya?', answer: 'Buka menu "My Orders" di halaman Profile, lalu pilih pesanan yang ingin dilacak. Anda bisa melihat status pengiriman secara real-time.' },
    { id: '2', question: 'Berapa lama estimasi pengiriman?', answer: 'Estimasi pengiriman tergantung kurir yang dipilih:\n• JNE Regular: 2-3 hari\n• J&T Express: 1-2 hari\n• SiCepat REG: 1-3 hari\n• GoSend: Same day\n• GrabExpress: Same day' },
    { id: '3', question: 'Bagaimana cara mengembalikan barang?', answer: 'Anda bisa mengajukan pengembalian barang dalam waktu 7 hari setelah barang diterima. Hubungi customer service kami melalui menu Help Center.' },
    { id: '4', question: 'Metode pembayaran apa saja yang diterima?', answer: 'Kami menerima berbagai metode pembayaran:\n• Visa / Mastercard\n• BCA Virtual Account\n• GoPay\n• OVO\n• DANA\n• Transfer Bank' },
    { id: '5', question: 'Apakah bisa ambil di store?', answer: 'Ya! Saat checkout, pilih "Store Pickup" dan pilih cabang SnapShop terdekat. Pengambilan gratis tanpa ongkos kirim.' },
    { id: '6', question: 'Bagaimana cara menghubungi customer service?', answer: 'Anda bisa menghubungi kami melalui:\n• WhatsApp: +62 812-3456-7890\n• Email: help@snapshop.id\n• Live Chat di aplikasi' },
];

export default function HelpCenterScreen() {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFaq = faqData.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Search */}
                <FadeInView delay={0}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={Colors.gray} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari pertanyaan..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={Colors.gray}
                        />
                    </View>
                </FadeInView>

                {/* Contact Cards */}
                <FadeInView delay={100}>
                    <View style={styles.contactRow}>
                        <TouchableOpacity style={styles.contactCard}>
                            <View style={[styles.contactIcon, { backgroundColor: '#25D366' }]}>
                                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                            </View>
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactCard}>
                            <View style={[styles.contactIcon, { backgroundColor: Colors.blue }]}>
                                <Ionicons name="mail-outline" size={24} color="#fff" />
                            </View>
                            <Text style={styles.contactLabel}>Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactCard}>
                            <View style={[styles.contactIcon, { backgroundColor: Colors.primary }]}>
                                <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
                            </View>
                            <Text style={styles.contactLabel}>Live Chat</Text>
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                {/* FAQ */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                {filteredFaq.map((faq, index) => (
                    <FadeInView key={faq.id} delay={200 + index * 80}>
                        <TouchableOpacity
                            style={styles.faqItem}
                            onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={Colors.gray}
                                />
                            </View>
                            {expandedId === faq.id && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    </FadeInView>
                ))}
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
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    searchInput: { flex: 1, marginLeft: Spacing.sm, fontFamily: 'Inter_400Regular', fontSize: FontSize.md, color: Colors.primaryText },
    contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xxl },
    contactCard: {
        flex: 1, alignItems: 'center', padding: Spacing.lg,
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        marginHorizontal: 4,
    },
    contactIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    contactLabel: { fontFamily: 'Inter_500Medium', fontSize: FontSize.sm, color: Colors.primaryText },
    sectionTitle: {
        fontFamily: 'Inter_700Bold', fontSize: FontSize.lg, color: Colors.primaryText, marginBottom: Spacing.lg,
    },
    faqItem: {
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, marginBottom: Spacing.sm,
    },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    faqQuestion: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primaryText, marginRight: Spacing.sm },
    faqAnswer: {
        fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.secondaryText,
        lineHeight: 20, marginTop: Spacing.md, paddingTop: Spacing.md,
        borderTopWidth: 1, borderTopColor: Colors.border,
    },
});
