import React, { useRef } from 'react';
import {
    TouchableOpacity,
    Animated,
    ViewStyle,
    TextStyle,
    Text,
    ActivityIndicator,
} from 'react-native';

interface AnimatedButtonProps {
    onPress: () => void;
    title: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    loading?: boolean;
    children?: React.ReactNode;
}

export default function AnimatedButton({
    onPress,
    title,
    style,
    textStyle,
    disabled = false,
    loading = false,
    children,
}: AnimatedButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.97,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.85,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 40,
                friction: 4,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
            }}
        >
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                disabled={disabled || loading}
                style={[style, disabled && { opacity: 0.5 }]}
            >
                {children ? (
                    children
                ) : loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={textStyle}>{title}</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}
