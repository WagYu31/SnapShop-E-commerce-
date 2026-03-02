import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import MapComponent from '../components/MapComponent';

const trackingSteps = [
    { label: 'Confirmed', done: true },
    { label: 'Preparing', done: true },
    { label: 'Shipped', done: true },
    { label: 'Delivered', done: false },
];

export default function TrackOrderScreen() {
    const router = useRouter();
    const mapRef = React.useRef<any>(null);

    return (
        <View style={styles.container}>
            {/* Map */}
            <View style={styles.mapContainer}>
                <MapComponent
                    lat={24.8949}
                    lng={91.8687}
                    mapRef={mapRef}
                />
            </View>

            {/* Header Overlay */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Track Order</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Bottom card */}
            <View style={styles.bottomCard}>
                {/* Delivery Info */}
                <View style={styles.deliveryHeader}>
                    <View>
                        <Text style={styles.deliveryTimeLabel}>Estimated Delivery</Text>
                        <Text style={styles.deliveryTime}>20 March, 5:30 PM</Text>
                    </View>
                    <View style={styles.statusChip}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusChipText}>In Transit</Text>
                    </View>
                </View>

                <View style={styles.addressRow}>
                    <Ionicons name="location" size={18} color={Colors.primaryText} />
                    <Text style={styles.addressText}>
                        Moon Road, West Subidbazar, Sylhet
                    </Text>
                </View>

                <View style={styles.divider} />

                {/* Courier */}
                <View style={styles.courierRow}>
                    <View style={styles.courierInfo}>
                        <View style={styles.courierAvatar}>
                            <Ionicons
                                name="person"
                                size={20}
                                color={Colors.white}
                            />
                        </View>
                        <View>
                            <Text style={styles.courierName}>John Delivery</Text>
                            <Text style={styles.courierLabel}>Your Courier</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.callButton} activeOpacity={0.7}>
                        <Ionicons name="call" size={18} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Mini Progress */}
                <View style={styles.progressRow}>
                    {trackingSteps.map((step, index) => (
                        <React.Fragment key={index}>
                            <View style={styles.progressStep}>
                                <View
                                    style={[
                                        styles.progressDot,
                                        step.done && styles.progressDotDone,
                                    ]}
                                >
                                    {step.done && (
                                        <Ionicons
                                            name="checkmark"
                                            size={10}
                                            color={Colors.white}
                                        />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.progressLabel,
                                        step.done && styles.progressLabelDone,
                                    ]}
                                >
                                    {step.label}
                                </Text>
                            </View>
                            {index < trackingSteps.length - 1 && (
                                <View
                                    style={[
                                        styles.progressLine,
                                        step.done && styles.progressLineDone,
                                    ]}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.lightGray,
    },
    mapContainer: {
        flex: 1,
    },
    // Header
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: Platform.OS === 'ios' ? 54 : 40,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.primary,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.xl,
        color: Colors.white,
    },
    // Bottom Card
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xxl,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    deliveryTimeLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginBottom: 4,
    },
    deliveryTime: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F59E0B',
    },
    statusChipText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.xs,
        color: '#92400E',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.lg,
    },
    addressText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.lg,
    },
    // Courier
    courierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    courierInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    courierAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    courierName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    courierLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.green,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Progress
    progressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    progressStep: {
        alignItems: 'center',
        width: 60,
    },
    progressDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressDotDone: {
        backgroundColor: Colors.green,
    },
    progressLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 9,
        color: Colors.gray,
        textAlign: 'center',
    },
    progressLabelDone: {
        color: Colors.primaryText,
        fontFamily: 'Inter_500Medium',
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: Colors.border,
        marginTop: 9,
    },
    progressLineDone: {
        backgroundColor: Colors.green,
    },
});
