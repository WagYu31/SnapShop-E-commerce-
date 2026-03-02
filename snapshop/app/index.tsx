import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../constants/theme';

export default function SplashPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/onboarding');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.iconBox}>
                    <Ionicons name="bag-handle" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.brandName}>SnapShop</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    iconBox: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    brandName: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h2,
        color: Colors.primaryText,
        letterSpacing: -0.5,
    },
});
