import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';

export default function SuccessScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="checkmark" size={48} color={Colors.white} />
                    </View>
                </View>

                <Text style={styles.title}>Success!</Text>
                <Text style={styles.description}>
                    You have successfully registered in our app and can start working in it
                </Text>
            </View>

            {/* Continue Button */}
            <View style={styles.bottomContainer}>
                <AnimatedButton
                    onPress={() => router.replace('/login' as any)}
                    title="Continue"
                    style={styles.continueButton}
                    textStyle={styles.continueButtonText}
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxxl,
    },
    iconContainer: {
        marginBottom: Spacing.xxxl,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h2,
        color: Colors.primaryText,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
        textAlign: 'center',
        lineHeight: 22,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 40,
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
