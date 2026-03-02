import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import FadeInView from '../components/FadeInView';

const notificationsData = [
    { id: '1', title: 'Order Shipped! 🚚', message: 'Your order #SL65242 has been shipped via J&T Express.', time: '2 min ago', read: false, icon: 'cube-outline' },
    { id: '2', title: 'Flash Sale Starts Now! ⚡', message: 'Up to 70% off on selected items. Don\'t miss out!', time: '1 hour ago', read: false, icon: 'flash-outline' },
    { id: '3', title: 'Payment Confirmed ✅', message: 'Your payment of Rp3.218.000 has been confirmed.', time: '3 hours ago', read: true, icon: 'checkmark-circle-outline' },
    { id: '4', title: 'New Collection Available', message: 'Check out our latest Spring Collection arrivals.', time: '1 day ago', read: true, icon: 'shirt-outline' },
    { id: '5', title: 'Delivery Completed 📦', message: 'Your order #SL64891 has been delivered. Rate your experience!', time: '2 days ago', read: true, icon: 'gift-outline' },
    { id: '6', title: 'Welcome to SnapShop! 🎉', message: 'Thanks for joining! Enjoy 10% off your first order.', time: '3 days ago', read: true, icon: 'sparkles-outline' },
];

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(notificationsData);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.markAllText}>Read All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {notifications.map((item, index) => (
                    <FadeInView key={item.id} delay={index * 80}>
                        <TouchableOpacity
                            style={[styles.notifItem, !item.read && styles.notifUnread]}
                            onPress={() => setNotifications(prev =>
                                prev.map(n => n.id === item.id ? { ...n, read: true } : n)
                            )}
                        >
                            <View style={[styles.notifIcon, !item.read && styles.notifIconActive]}>
                                <Ionicons name={item.icon as any} size={22} color={!item.read ? Colors.white : Colors.primaryText} />
                            </View>
                            <View style={styles.notifContent}>
                                <Text style={[styles.notifTitle, !item.read && styles.notifTitleBold]}>{item.title}</Text>
                                <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                                <Text style={styles.notifTime}>{item.time}</Text>
                            </View>
                            {!item.read && <View style={styles.unreadDot} />}
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
    markAllText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.sm, color: Colors.blue },
    scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
    notifItem: {
        flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.lg,
        borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
        backgroundColor: Colors.lightGray,
    },
    notifUnread: { backgroundColor: '#EEF2FF' },
    notifIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center',
    },
    notifIconActive: { backgroundColor: Colors.primary },
    notifContent: { flex: 1, marginLeft: Spacing.md },
    notifTitle: { fontFamily: 'Inter_500Medium', fontSize: FontSize.md, color: Colors.primaryText, marginBottom: 4 },
    notifTitleBold: { fontFamily: 'Inter_700Bold' },
    notifMessage: { fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.secondaryText, lineHeight: 18, marginBottom: 4 },
    notifTime: { fontFamily: 'Inter_400Regular', fontSize: FontSize.xs, color: Colors.gray },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.blue, marginTop: 6 },
});
