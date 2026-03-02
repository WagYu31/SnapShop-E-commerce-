import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';

export default function VerifyPhoneScreen() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(55);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCodeChange = (value: string, index: number) => {
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Verify phone number</Text>
                <Text style={styles.subtitle}>
                    Which part of country that you call home?
                </Text>

                {/* Code Input */}
                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.codeInput,
                                digit ? styles.codeInputFilled : null,
                            ]}
                            value={digit}
                            onChangeText={(value) => handleCodeChange(value, index)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                        />
                    ))}
                </View>

                {/* Resend Timer */}
                <Text style={styles.resendText}>
                    Resend code in {timer} s
                </Text>

                {/* Verify Button */}
                <AnimatedButton
                    onPress={() => router.push('/success' as any)}
                    title="verify"
                    style={styles.verifyButton}
                    textStyle={styles.verifyButtonText}
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
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xxl,
        paddingTop: 100,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h2,
        color: Colors.primaryText,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: 48,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    codeInput: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.h3,
        color: Colors.primaryText,
    },
    codeInputFilled: {
        borderColor: Colors.primary,
        backgroundColor: Colors.lightGray,
    },
    resendText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        textAlign: 'center',
        marginBottom: 48,
    },
    verifyButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    verifyButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
});
