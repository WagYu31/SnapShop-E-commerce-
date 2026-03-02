import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { accountMenuItems } from '../../constants/data';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        AsyncStorage.getItem('user').then((data) => {
            if (data) setUser(JSON.parse(data));
        });
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        router.replace('/login');
    };

    return (
        <View style={[styles.container, isDark && { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Account</Text>
                    <TouchableOpacity>
                        <Ionicons name="settings-outline" size={24} color={Colors.primaryText} />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name || 'Guest'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || 'Not logged in'}</Text>
                    </View>
                    <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
                        <Ionicons name="create-outline" size={18} color={Colors.primaryText} />
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {accountMenuItems.map((item) => {
                        const handlePress = () => {
                            switch (item.title) {
                                case 'My Orders':
                                    router.push('/orders');
                                    break;
                                case 'Wishlist':
                                    router.push('/(tabs)/wishlist');
                                    break;
                                case 'Delivery Address':
                                    router.push('/addresses');
                                    break;
                                case 'Payment Methods':
                                    router.push('/payment-methods');
                                    break;
                                case 'Notifications':
                                    router.push('/notifications');
                                    break;
                                case 'Language':
                                    router.push('/language');
                                    break;
                                case 'Help Center':
                                    router.push('/help-center');
                                    break;
                                case 'About Us':
                                    router.push('/about-us');
                                    break;
                                default:
                                    break;
                            }
                        };
                        return (
                            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={handlePress}>
                                <View style={styles.menuIconContainer}>
                                    <Ionicons name={item.icon as any} size={20} color={Colors.primaryText} />
                                </View>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <View style={styles.menuRight}>
                                    {item.badge && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{item.badge}</Text>
                                        </View>
                                    )}
                                    <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => router.replace('/login')}
                >
                    <Ionicons name="log-out-outline" size={20} color={Colors.red} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContent: {
        paddingBottom: 40,
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
        fontSize: FontSize.h3,
        color: Colors.primaryText,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.xl,
        marginHorizontal: Spacing.xxl,
        marginBottom: Spacing.xxl,
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    profileInfo: {
        flex: 1,
        marginLeft: Spacing.lg,
    },
    profileName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    profileEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuSection: {
        paddingHorizontal: Spacing.xxl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.lg,
    },
    menuTitle: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.xs,
        color: Colors.white,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xxxl,
        paddingVertical: Spacing.lg,
        marginHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.red,
    },
    logoutText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.red,
    },
});
