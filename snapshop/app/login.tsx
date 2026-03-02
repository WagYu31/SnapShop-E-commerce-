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
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'web' ? 'http://localhost:8080/api/v1' : 'http://localhost:8080/api/v1';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignIn = async () => {
        setError('');
        if (!email.trim()) { setError('Please enter your email'); return; }
        if (!password.trim()) { setError('Please enter your password'); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || data.error || 'Invalid email or password');
                setLoading(false);
                return;
            }
            await AsyncStorage.setItem('token', data.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
            router.replace('/(tabs)');
        } catch (err) {
            setError('Cannot connect to server. Please try again.');
        }
        setLoading(false);
    };

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
                    <Text style={styles.welcomeText}>Welcome back!</Text>
                    <Text style={styles.signInText}>Sign In</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.gray}
                                value={email}
                                onChangeText={(t) => { setEmail(t); setError(''); }}
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
                                onChangeText={(t) => { setPassword(t); setError(''); }}
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

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot-password' as any)}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {error ? <Text style={{ color: '#e74c3c', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</Text> : null}

                    <AnimatedButton
                        onPress={handleSignIn}
                        title={loading ? 'Signing in...' : 'Sign In'}
                        style={loading ? { ...styles.signInButton, opacity: 0.7 } : styles.signInButton}
                        textStyle={styles.signInButtonText}
                    />

                    <View style={styles.orContainer}>
                        <View style={styles.orLine} />
                        <Text style={styles.orText}>Or</Text>
                        <View style={styles.orLine} />
                    </View>

                    <View style={styles.socialButtons}>
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

                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text style={styles.signUpLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
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
        marginBottom: 40,
    },
    welcomeText: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h1,
        color: Colors.primaryText,
        marginBottom: 4,
    },
    signInText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.h3,
        color: Colors.secondaryText,
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
    },
    eyeButton: {
        padding: Spacing.sm,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xxl,
    },
    forgotPasswordText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    signInButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    signInButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    orText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginHorizontal: Spacing.lg,
    },
    socialButtons: {
        gap: Spacing.md,
        marginBottom: Spacing.xxxl,
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
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
    },
    signUpLink: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
});
