import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    ScrollView,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import MapComponent, { moveMap } from '../components/MapComponent';

interface SearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    boundingbox?: string[];
    address?: {
        road?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
    };
}

export default function AddAddressScreen() {
    const router = useRouter();
    const mapRef = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('Moon Road, West Subidbazar');
    const [selectedCity, setSelectedCity] = useState('Sylhet, Bangladesh');
    const [mapCoords, setMapCoords] = useState({ lat: 24.8949, lng: 91.8687 });
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Search via Nominatim (free, no API key) ───
    const searchLocations = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`,
                {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'SnapShopApp/1.0',
                    },
                }
            );
            const data: SearchResult[] = await response.json();
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
        } catch (error) {
            console.error('Search error:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearchChange = useCallback(
        (text: string) => {
            setSearchQuery(text);
            if (debounceTimer.current) clearTimeout(debounceTimer.current);

            if (text.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            debounceTimer.current = setTimeout(() => {
                searchLocations(text);
            }, 500);
        },
        [searchLocations]
    );

    const getShortName = (result: SearchResult): string => {
        const parts = result.display_name.split(',');
        return parts
            .slice(0, 2)
            .map((p) => p.trim())
            .join(', ');
    };

    const getCityCountry = (result: SearchResult): string => {
        const addr = result.address;
        if (!addr) {
            const parts = result.display_name.split(',');
            return parts
                .slice(2, 4)
                .map((p) => p.trim())
                .join(', ');
        }
        const city = addr.city || addr.town || addr.village || addr.suburb || '';
        const country = addr.country || '';
        return [city, addr.state, country].filter(Boolean).join(', ');
    };

    const handleSelectLocation = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setSelectedAddress(getShortName(result));
        setSelectedCity(getCityCountry(result));
        setMapCoords({ lat, lng });
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        Keyboard.dismiss();

        // Animate map to new location with smart zoom from bounding box
        setTimeout(() => moveMap(mapRef, lat, lng, result.boundingbox), 200);
    };

    const handleConfirmAddress = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            {/* ─── Map ─── */}
            <View style={styles.mapContainer}>
                <MapComponent
                    lat={mapCoords.lat}
                    lng={mapCoords.lng}
                    mapRef={mapRef}
                />

                {/* Center pin overlay */}
                <View style={styles.pinContainer} pointerEvents="none">
                    <View style={styles.pinOuter}>
                        <View style={styles.pinInner}>
                            <Ionicons name="location" size={20} color={Colors.white} />
                        </View>
                    </View>
                    <View style={styles.pinShadow} />
                </View>
            </View>

            {/* ─── Header overlay ─── */}
            <View style={styles.headerOverlay}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add New Address</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search bar */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search any location worldwide..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                    />
                    {isLoading && (
                        <ActivityIndicator
                            size="small"
                            color="#999"
                            style={{ marginRight: 8 }}
                        />
                    )}
                    {searchQuery.length > 0 && !isLoading && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchQuery('');
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }}
                        >
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                            style={styles.suggestionsList}
                        >
                            {suggestions.map((result, index) => (
                                <TouchableOpacity
                                    key={result.place_id}
                                    style={[
                                        styles.suggestionItem,
                                        index < suggestions.length - 1 &&
                                        styles.suggestionBorder,
                                    ]}
                                    onPress={() => handleSelectLocation(result)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.suggestionIcon}>
                                        <Ionicons
                                            name="location-outline"
                                            size={16}
                                            color={Colors.primaryText}
                                        />
                                    </View>
                                    <View style={styles.suggestionText}>
                                        <Text
                                            style={styles.suggestionName}
                                            numberOfLines={1}
                                        >
                                            {getShortName(result)}
                                        </Text>
                                        <Text
                                            style={styles.suggestionCity}
                                            numberOfLines={1}
                                        >
                                            {getCityCountry(result)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* No results */}
                {showSuggestions &&
                    !isLoading &&
                    searchQuery.length >= 2 &&
                    suggestions.length === 0 && (
                        <View style={styles.suggestionsContainer}>
                            <View style={styles.noResultsContainer}>
                                <Ionicons
                                    name="search-outline"
                                    size={20}
                                    color="#999"
                                />
                                <Text style={styles.noResultsText}>
                                    No locations found
                                </Text>
                            </View>
                        </View>
                    )}
            </View>

            {/* ─── Bottom card ─── */}
            <View style={styles.bottomCard}>
                <View style={styles.addressPreview}>
                    <View style={styles.addressDot}>
                        <Ionicons name="location" size={18} color={Colors.white} />
                    </View>
                    <View style={styles.addressTextContainer}>
                        <Text style={styles.addressName} numberOfLines={1}>
                            {selectedAddress}
                        </Text>
                        <Text style={styles.addressCity} numberOfLines={1}>
                            {selectedCity}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmAddress}
                    activeOpacity={0.8}
                >
                    <Text style={styles.confirmButtonText}>Confirm Address</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8E8E8',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    // ── Pin ──
    pinContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        alignItems: 'center',
        marginLeft: -22,
        marginTop: -44,
    },
    pinOuter: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    pinShadow: {
        width: 12,
        height: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.15)',
        marginTop: 4,
    },
    // ── Header ──
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.primary,
        paddingTop: Platform.OS === 'ios' ? 54 : 40,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
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
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.white,
        marginLeft: Spacing.sm,
        padding: 0,
    },
    // ── Suggestions ──
    suggestionsContainer: {
        marginTop: 8,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        overflow: 'hidden',
    },
    suggestionsList: {
        maxHeight: 280,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
    },
    suggestionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    suggestionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    suggestionText: {
        flex: 1,
    },
    suggestionName: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    suggestionCity: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
    },
    noResultsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    noResultsText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: '#999',
    },
    // ── Bottom Card ──
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xxl,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
    },
    addressPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    addressDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    addressCity: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
});
