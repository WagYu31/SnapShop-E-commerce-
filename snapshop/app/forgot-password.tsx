import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone'>('email');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Forgot Password</Text>
                <Text style={styles.description}>
                    Don't worry! It happens. Please select your email or phone number so we can send you a code.
                </Text>

                {/* Email Option */}
                <TouchableOpacity
                    style={[
                        styles.optionCard,
                        selectedMethod === 'email' && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedMethod('email')}
                    activeOpacity={0.7}
                >
                    <View style={styles.optionIcon}>
                        <Ionicons name="mail" size={24} color={Colors.primaryText} />
                    </View>
                    <View style={styles.optionInfo}>
                        <Text style={styles.optionLabel}>Email</Text>
                        <Text style={styles.optionValue}>Your email: *****dyne@mail.com</Text>
                    </View>
                    {selectedMethod === 'email' && (
                        <View style={styles.checkCircle}>
                            <Ionicons name="checkmark" size={14} color={Colors.white} />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Phone Option */}
                <TouchableOpacity
                    style={[
                        styles.optionCard,
                        selectedMethod === 'phone' && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedMethod('phone')}
                    activeOpacity={0.7}
                >
                    <View style={styles.optionIcon}>
                        <Ionicons name="call" size={24} color={Colors.primaryText} />
                    </View>
                    <View style={styles.optionInfo}>
                        <Text style={styles.optionLabel}>Phone Number</Text>
                        <Text style={styles.optionValue}>Your phone: ********4566</Text>
                    </View>
                    {selectedMethod === 'phone' && (
                        <View style={styles.checkCircle}>
                            <Ionicons name="checkmark" size={14} color={Colors.white} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Next Button */}
            <View style={styles.bottomContainer}>
                <AnimatedButton
                    onPress={() => router.push('/verify-phone' as any)}
                    title="Next"
                    style={styles.nextButton}
                    textStyle={styles.nextButtonText}
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
        paddingHorizontal: Spacing.xxl,
        paddingTop: 60,
        paddingBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xxl,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h2,
        color: Colors.primaryText,
        marginBottom: Spacing.md,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
        lineHeight: 22,
        marginBottom: Spacing.xxxl,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: Spacing.lg,
    },
    optionCardSelected: {
        borderColor: Colors.primary,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.lg,
    },
    optionInfo: {
        flex: 1,
    },
    optionLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 4,
    },
    optionValue: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 40,
    },
    nextButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    nextButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
});
