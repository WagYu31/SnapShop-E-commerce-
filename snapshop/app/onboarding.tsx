import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    Animated as RNAnimated,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import AnimatedButton from '../components/AnimatedButton';
import { onboardingData } from '../constants/data';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            router.replace('/login');
        }
    };

    const currentSlide = onboardingData[currentIndex];

    return (
        <View style={styles.container}>
            {/* Full screen image */}
            <Image
                source={{ uri: currentSlide.image }}
                style={styles.fullImage}
                key={currentSlide.id}
            />

            {/* Dark gradient overlay for slides 1 & 2 */}
            {currentSlide.dark && (
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradient}
                />
            )}

            {/* Light overlay for slide 3 */}
            {!currentSlide.dark && (
                <View style={styles.lightOverlay} />
            )}

            {/* === SLIDE 1 LAYOUT === */}
            {currentIndex === 0 && (
                <>
                    {/* Pagination dots top left */}
                    <View style={styles.dotsTopLeft}>
                        {onboardingData.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dotLight,
                                    currentIndex === index && styles.dotLightActive,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Content at bottom */}
                    <View style={styles.slide1Bottom}>
                        <Text style={styles.slide1Title}>{currentSlide.title}</Text>
                        <Text style={styles.slide1Subtitle}>{currentSlide.subtitle}</Text>
                        <AnimatedButton
                            onPress={handleNext}
                            title="Next"
                            style={styles.nextButton}
                            textStyle={styles.nextButtonText}
                        />
                    </View>
                </>
            )}

            {/* === SLIDE 2 LAYOUT === */}
            {currentIndex === 1 && (
                <View style={styles.slide2Bottom}>
                    <Text style={styles.slide2Title}>{currentSlide.title}</Text>
                    <Text style={styles.slide2Subtitle}>{currentSlide.subtitle}</Text>
                    <AnimatedButton
                        onPress={handleNext}
                        title=""
                        style={styles.getStartedPill}
                    >
                        <View style={styles.getStartedPillInner}>
                            <Text style={styles.getStartedPillText}>Get Started</Text>
                            <View style={styles.arrowCircle}>
                                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                            </View>
                        </View>
                    </AnimatedButton>
                </View>
            )}

            {/* === SLIDE 3 LAYOUT === */}
            {currentIndex === 2 && (
                <View style={styles.slide3Bottom}>
                    <View style={styles.slide3DotsRow}>
                        {onboardingData.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dotDark,
                                    currentIndex === index && styles.dotDarkActive,
                                ]}
                            />
                        ))}
                    </View>
                    <AnimatedButton
                        onPress={handleNext}
                        title="Get Started"
                        style={styles.getStartedDark}
                        textStyle={styles.getStartedDarkText}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: height * 0.55,
    },
    lightOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: height * 0.15,
        backgroundColor: 'rgba(245,245,245,0.6)',
    },

    /* ===== Slide 1 ===== */
    dotsTopLeft: {
        position: 'absolute',
        top: 60,
        left: 24,
        flexDirection: 'row',
        gap: 6,
    },
    dotLight: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotLightActive: {
        width: 24,
        backgroundColor: Colors.white,
    },
    slide1Bottom: {
        position: 'absolute',
        bottom: 50,
        left: 24,
        right: 24,
    },
    slide1Title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: Colors.white,
        marginBottom: 12,
        lineHeight: 36,
    },
    slide1Subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 20,
        marginBottom: 24,
    },
    nextButton: {
        backgroundColor: Colors.white,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    nextButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primary,
    },

    /* ===== Slide 2 ===== */
    slide2Bottom: {
        position: 'absolute',
        bottom: 50,
        left: 24,
        right: 24,
        alignItems: 'center',
    },
    slide2Title: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: Colors.white,
        textAlign: 'center',
        marginBottom: 10,
    },
    slide2Subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
    },
    getStartedPill: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BorderRadius.full,
        paddingLeft: 20,
        paddingRight: 6,
        paddingVertical: 6,
    },
    getStartedPillInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    getStartedPillText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* ===== Slide 3 ===== */
    slide3Bottom: {
        position: 'absolute',
        bottom: 50,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slide3DotsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    dotDark: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    dotDarkActive: {
        width: 24,
        backgroundColor: Colors.primary,
    },
    getStartedDark: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: BorderRadius.xl,
    },
    getStartedDarkText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
});
