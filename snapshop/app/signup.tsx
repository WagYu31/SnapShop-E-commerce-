import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'web' ? 'http://localhost:8080/api/v1' : 'http://localhost:8080/api/v1';

export default function SignUpScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        setError('');
        if (!name.trim()) { setError('Please enter your name'); return; }
        if (!email.trim()) { setError('Please enter your email'); return; }
        if (!password.trim()) { setError('Please enter your password'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (!agreed) { setError('Please agree to the Terms & Privacy Policy'); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || data.error || 'Registration failed. Please try again.');
                setLoading(false);
                return;
            }
            // Auto-login after register
            await AsyncStorage.setItem('token', data.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
            router.replace('/(tabs)');
        } catch (err) {
            setError('Cannot connect to server. Please try again.');
        }
        setLoading(false);
    };

    const clearError = () => { if (error) setError(''); };

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
                <View style={styles.headerSection}>
                    <Text style={styles.titleText}>Create Your Account</Text>
                    <Text style={styles.subtitleText}>Join SnapShop and start shopping!</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Name</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor={Colors.gray}
                                value={name}
                                onChangeText={(t) => { setName(t); clearError(); }}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.gray}
                                value={email}
                                onChangeText={(t) => { setEmail(t); clearError(); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.gray}
                                value={password}
                                onChangeText={(t) => { setPassword(t); clearError(); }}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={Colors.gray}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => { setAgreed(!agreed); clearError(); }}
                    >
                        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                            {agreed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </View>
                        <Text style={styles.checkboxText}>
                            I agree to the <Text style={styles.linkText}>Terms & Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>

                    {error ? <Text style={{ color: '#e74c3c', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

                    <View style={styles.socialSection}>
                        <AnimatedButton
                            onPress={() => { }}
                            title=""
                            style={styles.socialButton}
                        >
                            <View style={styles.socialButtonInner}>
                                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                                <Text style={styles.socialButtonText}>Continue with facebook</Text>
                            </View>
                        </AnimatedButton>

                        <AnimatedButton
                            onPress={() => { }}
                            title=""
                            style={styles.socialButton}
                        >
                            <View style={styles.socialButtonInner}>
                                <Ionicons name="logo-google" size={20} color="#DB4437" />
                                <Text style={styles.socialButtonText}>Continue with Google</Text>
                            </View>
                        </AnimatedButton>

                        <AnimatedButton
                            onPress={() => { }}
                            title=""
                            style={styles.socialButton}
                        >
                            <View style={styles.socialButtonInner}>
                                <Ionicons name="logo-apple" size={20} color="#000" />
                                <Text style={styles.socialButtonText}>Continue with Apple</Text>
                            </View>
                        </AnimatedButton>
                    </View>

                    <AnimatedButton
                        onPress={handleSignUp}
                        title={loading ? 'Creating account...' : 'Sign Up'}
                        style={loading ? { ...styles.signUpButton, opacity: 0.7 } : styles.signUpButton}
                        textStyle={styles.signUpButtonText}
                    />

                    <View style={styles.signInContainer}>
                        <Text style={styles.signInText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.signInLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        paddingTop: 100,
        paddingBottom: 40,
    },
    headerSection: {
        marginBottom: 32,
    },
    titleText: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h2,
        color: Colors.primaryText,
    },
    subtitleText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginTop: 6,
    },
    formSection: {
        flex: 1,
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
        flex: 1,
    },
    eyeButton: {
        padding: Spacing.sm,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
        marginTop: Spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginRight: Spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkboxText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        flex: 1,
    },
    linkText: {
        fontFamily: 'Inter_500Medium',
        color: Colors.primaryText,
    },
    socialSection: {
        gap: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    socialButton: {
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    socialButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    socialButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    signUpButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    signUpButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
    },
    signInLink: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
});
