import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';

export default function OrderSuccessScreen() {
    const router = useRouter();

    // Animations
    const iconScale = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(20)).current;
    const orderAnim = useRef(new Animated.Value(0)).current;
    const descAnim = useRef(new Animated.Value(0)).current;
    const descSlide = useRef(new Animated.Value(15)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const buttonSlide = useRef(new Animated.Value(20)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Staggered entrance animation sequence
        Animated.sequence([
            // 1. Icon circle scales in with bounce
            Animated.parallel([
                Animated.spring(iconScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 6,
                }),
                Animated.timing(iconOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Checkmark scales in
            Animated.spring(checkScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 6,
                delay: 100,
            }),
            // 3. Title fades up
            Animated.parallel([
                Animated.timing(titleAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.spring(titleSlide, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
            ]),
            // 4. Order number fades in
            Animated.timing(orderAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            // 5. Description fades up
            Animated.parallel([
                Animated.timing(descAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(descSlide, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
            ]),
            // 6. Button slides up
            Animated.parallel([
                Animated.timing(buttonAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonSlide, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
            ]),
        ]).start();

        // Gentle pulse on icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Success Icon with Animated Entrance */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            opacity: iconOpacity,
                            transform: [
                                { scale: Animated.multiply(iconScale, pulseAnim) },
                            ],
                        },
                    ]}
                >
                    <View style={styles.iconCircle}>
                        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                            <Ionicons name="bag-check" size={48} color={Colors.primaryText} />
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Success Text */}
                <Animated.Text
                    style={[
                        styles.title,
                        {
                            opacity: titleAnim,
                            transform: [{ translateY: titleSlide }],
                        },
                    ]}
                >
                    Order Successful!
                </Animated.Text>

                <Animated.Text style={[styles.orderNumber, { opacity: orderAnim }]}>
                    Order #SL65242
                </Animated.Text>

                <Animated.Text
                    style={[
                        styles.description,
                        {
                            opacity: descAnim,
                            transform: [{ translateY: descSlide }],
                        },
                    ]}
                >
                    Your order has been placed successfully.{'\n'}
                    You can track your order in the "My Orders" section.
                </Animated.Text>

                {/* Continue Button */}
                <Animated.View
                    style={[
                        styles.buttonWrapper,
                        {
                            opacity: buttonAnim,
                            transform: [{ translateY: buttonSlide }],
                        },
                    ]}
                >
                    <AnimatedButton
                        onPress={() => router.replace('/(tabs)')}
                        title="Continue Home"
                        style={styles.continueButton}
                        textStyle={styles.continueText}
                    />
                </Animated.View>
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
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    iconContainer: {
        marginBottom: Spacing.xxxl,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h3,
        color: Colors.primaryText,
        marginBottom: Spacing.sm,
    },
    orderNumber: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
        marginBottom: Spacing.xxl,
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xxxl,
    },
    buttonWrapper: {
        width: '100%',
    },
    continueButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    continueText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
});
