import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';

export default function NewPasswordScreen() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.title}>New Password</Text>
                <Text style={styles.description}>
                    Your password must different from previous password.
                </Text>

                {/* New Password */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Enter new password"
                            placeholderTextColor={Colors.gray}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNew}
                        />
                        <TouchableOpacity
                            onPress={() => setShowNew(!showNew)}
                            style={styles.eyeButton}
                        >
                            <Ionicons
                                name={showNew ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color={Colors.gray}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Confirm new password"
                            placeholderTextColor={Colors.gray}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirm}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirm(!showConfirm)}
                            style={styles.eyeButton}
                        >
                            <Ionicons
                                name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color={Colors.gray}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.hint}>
                    The password needs to be at least 8 characters long, include some
                    numbers, one special character, and one capital letter.
                </Text>

                {/* Continue Button */}
                <AnimatedButton
                    onPress={() => router.push('/success' as any)}
                    title="Continue"
                    style={styles.continueButton}
                    textStyle={styles.continueButtonText}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 40,
    },
    header: {
        paddingTop: 60,
        paddingBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
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
        marginBottom: Spacing.xxxl,
    },
    inputContainer: {
        marginBottom: Spacing.xl,
    },
    inputLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
        marginBottom: Spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: Spacing.sm,
    },
    input: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        paddingVertical: Spacing.sm,
    },
    eyeButton: {
        padding: Spacing.sm,
    },
    hint: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        lineHeight: 18,
        marginBottom: Spacing.xxxl,
    },
    continueButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    continueButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
});
