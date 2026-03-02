import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import FadeInView from '../components/FadeInView';

export default function AboutUsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About Us</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Logo & Version */}
                <FadeInView delay={0}>
                    <View style={styles.logoSection}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="camera" size={36} color={Colors.primaryText} />
                        </View>
                        <Text style={styles.appName}>SnapShop</Text>
                        <Text style={styles.appVersion}>Version 1.0.0</Text>
                        <Text style={styles.appTagline}>Your Premium Shopping Destination</Text>
                    </View>
                </FadeInView>

                {/* About */}
                <FadeInView delay={150}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tentang SnapShop</Text>
                        <Text style={styles.sectionText}>
                            SnapShop adalah platform e-commerce premium yang menyediakan produk-produk berkualitas tinggi dari brand ternama. Kami berkomitmen untuk memberikan pengalaman belanja terbaik dengan pilihan produk terkurasi, pengiriman cepat, dan layanan pelanggan yang responsif.
                        </Text>
                    </View>
                </FadeInView>

                {/* Info Cards */}
                <FadeInView delay={250}>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoNumber}>5+</Text>
                            <Text style={styles.infoLabel}>Store Locations</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoNumber}>100K+</Text>
                            <Text style={styles.infoLabel}>Happy Customers</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoNumber}>1000+</Text>
                            <Text style={styles.infoLabel}>Products</Text>
                        </View>
                    </View>
                </FadeInView>

                {/* Links */}
                <FadeInView delay={350}>
                    <View style={styles.linksSection}>
                        <TouchableOpacity style={styles.linkItem}>
                            <Ionicons name="document-text-outline" size={20} color={Colors.primaryText} />
                            <Text style={styles.linkText}>Terms & Conditions</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.linkItem}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primaryText} />
                            <Text style={styles.linkText}>Privacy Policy</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.linkItem}>
                            <Ionicons name="star-outline" size={20} color={Colors.primaryText} />
                            <Text style={styles.linkText}>Rate Us on App Store</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                {/* Social */}
                <FadeInView delay={450}>
                    <Text style={styles.socialTitle}>Follow Us</Text>
                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialIcon}>
                            <Ionicons name="logo-instagram" size={24} color={Colors.primaryText} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}>
                            <Ionicons name="logo-twitter" size={24} color={Colors.primaryText} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}>
                            <Ionicons name="logo-facebook" size={24} color={Colors.primaryText} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}>
                            <Ionicons name="logo-tiktok" size={24} color={Colors.primaryText} />
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                <Text style={styles.copyright}>© 2026 SnapShop. All rights reserved.</Text>
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
    logoSection: { alignItems: 'center', paddingVertical: Spacing.xxxl },
    logoCircle: {
        width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.lightGray,
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
    },
    appName: { fontFamily: 'Inter_700Bold', fontSize: FontSize.h2, color: Colors.primaryText },
    appVersion: { fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.secondaryText, marginTop: 4 },
    appTagline: { fontFamily: 'Inter_500Medium', fontSize: FontSize.md, color: Colors.secondaryText, marginTop: Spacing.sm },
    section: { marginBottom: Spacing.xxl },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: FontSize.lg, color: Colors.primaryText, marginBottom: Spacing.md },
    sectionText: { fontFamily: 'Inter_400Regular', fontSize: FontSize.md, color: Colors.secondaryText, lineHeight: 22 },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xxl },
    infoCard: {
        flex: 1, alignItems: 'center', padding: Spacing.lg,
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg, marginHorizontal: 4,
    },
    infoNumber: { fontFamily: 'Inter_700Bold', fontSize: FontSize.h3, color: Colors.primaryText },
    infoLabel: { fontFamily: 'Inter_400Regular', fontSize: FontSize.xs, color: Colors.secondaryText, marginTop: 4, textAlign: 'center' },
    linksSection: { marginBottom: Spacing.xxl },
    linkItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    linkText: { flex: 1, marginLeft: Spacing.lg, fontFamily: 'Inter_500Medium', fontSize: FontSize.md, color: Colors.primaryText },
    socialTitle: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primaryText, textAlign: 'center', marginBottom: Spacing.lg },
    socialRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, marginBottom: Spacing.xxl },
    socialIcon: {
        width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.lightGray,
        justifyContent: 'center', alignItems: 'center',
    },
    copyright: { fontFamily: 'Inter_400Regular', fontSize: FontSize.xs, color: Colors.gray, textAlign: 'center', marginTop: Spacing.lg },
});
