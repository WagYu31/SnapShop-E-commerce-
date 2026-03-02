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

export default function SignUpScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);

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
                    <Text style={styles.subtitleText}>Which part of country that you call home?</Text>
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
                                onChangeText={setName}
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
                                onChangeText={setEmail}
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
                                onChangeText={setPassword}
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
                        onPress={() => setAgreed(!agreed)}
                    >
                        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                            {agreed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </View>
                        <Text style={styles.checkboxText}>
                            I agree to the <Text style={styles.linkText}>Terms & Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>

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
                        onPress={() => router.replace('/(tabs)')}
                        title="Sign Up"
                        style={styles.signUpButton}
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
