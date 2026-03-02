import React, { useRef } from 'react';
import { Animated, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';

interface AnimatedCardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    delay?: number;
}

export default function AnimatedCard({
    children,
    onPress,
    style,
    delay = 0,
}: AnimatedCardProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 4,
        }).start();
    };

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: opacityAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: slideAnim },
                    ],
                },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                disabled={!onPress}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}
