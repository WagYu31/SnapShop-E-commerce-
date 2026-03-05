import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';
import FadeInView from '../components/FadeInView';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (!email || !email.includes('@')) {
            Alert.alert('Error', 'Masukkan email yang valid');
            return;
        }
        // Show success message (actual email sending would require backend SMTP)
        Alert.alert(
            'Email Terkirim! ✉️',
            `Link reset password telah dikirim ke ${email}. Silakan cek inbox Anda.`,
            [{ text: 'OK', onPress: () => router.back() }]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <FadeInView delay={0}>
                    <View style={styles.iconSection}>
                        <View style={styles.lockIcon}>
                            <Ionicons name="lock-open-outline" size={40} color={Colors.primary} />
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={100}>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.description}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                </FadeInView>

                {/* Email Input */}
                <FadeInView delay={200}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.gray}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>
                </FadeInView>
            </View>

            {/* Submit Button */}
            <View style={styles.bottomContainer}>
                <FadeInView delay={300}>
                    <AnimatedButton
                        onPress={handleSubmit}
                        title={loading ? 'Sending...' : 'Send Reset Link'}
                        style={styles.submitButton}
                        textStyle={styles.submitButtonText}
                    />
                </FadeInView>
                <FadeInView delay={400}>
                    <TouchableOpacity
                        style={styles.backToLogin}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                        <Text style={styles.backToLoginText}>Back to Sign In</Text>
                    </TouchableOpacity>
                </FadeInView>
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
    iconSection: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    lockIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
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
    inputGroup: {
        marginBottom: Spacing.xl,
    },
    inputLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        paddingVertical: Spacing.lg,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 40,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    submitButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
    },
    backToLoginText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primary,
    },
});
