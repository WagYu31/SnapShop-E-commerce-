import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    style?: ViewStyle;
    slideUp?: boolean;
}

export default function FadeInView({
    children,
    delay = 0,
    duration = 500,
    style,
    slideUp = true,
}: FadeInViewProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(slideUp ? 20 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
            }),
            ...(slideUp
                ? [
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        delay,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }),
                ]
                : []),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}
