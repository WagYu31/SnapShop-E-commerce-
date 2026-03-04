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
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        city_district?: string;
        town?: string;
        village?: string;
        state?: string;
        state_district?: string;
        county?: string;
        country?: string;
        postcode?: string;
    };
}

type Step = 'map' | 'form';

const ADDRESS_LABELS = ['Rumah', 'Kantor', 'Apartemen', 'Kos', 'Lainnya'];

export default function AddAddressScreen() {
    const router = useRouter();
    const mapRef = useRef<any>(null);

    // Step management
    const [step, setStep] = useState<Step>('map');

    // Map/search state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [mapCoords, setMapCoords] = useState({ lat: -6.2088, lng: 106.8456 }); // Jakarta default
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentRegion = useRef({ latitude: -6.2088, longitude: 106.8456, latitudeDelta: 0.01, longitudeDelta: 0.01 });

    const handleZoom = (zoomIn: boolean) => {
        const region = currentRegion.current;
        const factor = zoomIn ? 0.5 : 2;
        const newRegion = {
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: Math.max(region.latitudeDelta * factor, 0.0005),
            longitudeDelta: Math.max(region.longitudeDelta * factor, 0.0005),
        };
        currentRegion.current = newRegion;
        mapRef.current?.animateToRegion(newRegion, 300);
    };

    // Form state (pre-filled from map)
    const [recipientName, setRecipientName] = useState('');
    const [phone, setPhone] = useState('');
    const [label, setLabel] = useState('Rumah');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // ─── Search via Nominatim (free, no API key) ───
    const searchLocations = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setIsLoading(true);
        try {
            // Prioritize Indonesia results
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&countrycodes=id`,
                {
                    headers: {
                        'Accept-Language': 'id,en',
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
            }, 400);
        },
        [searchLocations]
    );

    const getShortName = (result: SearchResult): string => {
        const addr = result.address;
        if (addr) {
            const road = addr.road || '';
            const suburb = addr.suburb || addr.city_district || '';
            return [road, suburb].filter(Boolean).join(', ') || result.display_name.split(',').slice(0, 2).map(p => p.trim()).join(', ');
        }
        return result.display_name.split(',').slice(0, 2).map(p => p.trim()).join(', ');
    };

    const getCityFromResult = (result: SearchResult): string => {
        const addr = result.address;
        if (!addr) return '';
        return addr.city || addr.town || addr.village || addr.county || addr.city_district || '';
    };

    const getProvinceFromResult = (result: SearchResult): string => {
        const addr = result.address;
        if (!addr) return '';
        return addr.state || addr.state_district || '';
    };

    const getCityCountry = (result: SearchResult): string => {
        const c = getCityFromResult(result);
        const p = getProvinceFromResult(result);
        return [c, p].filter(Boolean).join(', ') || 'Indonesia';
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

        // Pre-fill form fields from map data
        const addr = result.address;
        if (addr) {
            setStreet(addr.road || getShortName(result));
            setCity(getCityFromResult(result));
            setProvince(getProvinceFromResult(result));
            setPostalCode(addr.postcode || '');
        }

        setTimeout(() => moveMap(mapRef, lat, lng, result.boundingbox), 200);
    };

    const handleContinueToForm = () => {
        if (!selectedAddress) {
            Alert.alert('Pilih Lokasi', 'Cari dan pilih lokasi terlebih dahulu');
            return;
        }
        setStep('form');
    };

    const handleSaveAddress = async () => {
        // Validation
        if (!recipientName.trim()) {
            Alert.alert('Error', 'Nama penerima harus diisi');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Error', 'Nomor telepon harus diisi');
            return;
        }
        if (!street.trim()) {
            Alert.alert('Error', 'Alamat lengkap harus diisi');
            return;
        }
        if (!city.trim()) {
            Alert.alert('Error', 'Kota harus diisi');
            return;
        }
        if (!province.trim()) {
            Alert.alert('Error', 'Provinsi harus diisi');
            return;
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert('Login', 'Silakan login terlebih dahulu');
            router.push('/login');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recipient_name: recipientName.trim(),
                    phone: phone.trim(),
                    street: street.trim(),
                    city: city.trim(),
                    province: province.trim(),
                    postal_code: postalCode.trim(),
                    label: label,
                    is_default: true,
                }),
            });
            const data = await res.json();
            if (data.success) {
                Alert.alert('Berhasil ✓', 'Alamat berhasil disimpan', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Gagal', data.message || 'Gagal menyimpan alamat');
            }
        } catch (e) {
            Alert.alert('Error', 'Gagal terhubung ke server');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── MAP STEP ───
    if (step === 'map') {
        return (
            <View style={styles.container}>
                {/* Map */}
                <View style={styles.mapContainer}>
                    <MapComponent
                        lat={mapCoords.lat}
                        lng={mapCoords.lng}
                        mapRef={mapRef}
                        onRegionChangeComplete={(region: any) => {
                            currentRegion.current = region;
                        }}
                    />
                    {/* Center pin */}
                    <View style={styles.pinContainer} pointerEvents="none">
                        <View style={styles.pinOuter}>
                            <View style={styles.pinInner}>
                                <Ionicons name="location" size={20} color={Colors.white} />
                            </View>
                        </View>
                        <View style={styles.pinShadow} />
                    </View>
                </View>

                {/* Zoom controls - positioned above bottom card */}
                <View style={styles.zoomControls}>
                    <TouchableOpacity
                        style={styles.zoomButton}
                        onPress={() => handleZoom(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={24} color={Colors.primaryText} />
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity
                        style={styles.zoomButton}
                        onPress={() => handleZoom(false)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="remove" size={24} color={Colors.primaryText} />
                    </TouchableOpacity>
                </View>

                {/* Header (search) */}
                <View style={styles.headerOverlay}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Pilih Lokasi</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search bar */}
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#999" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari alamat, jalan, atau kota..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            onFocus={() => {
                                if (suggestions.length > 0) setShowSuggestions(true);
                            }}
                            autoCorrect={false}
                        />
                        {isLoading && (
                            <ActivityIndicator size="small" color="#999" style={{ marginRight: 8 }} />
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

                    {/* Suggestions */}
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
                                            index < suggestions.length - 1 && styles.suggestionBorder,
                                        ]}
                                        onPress={() => handleSelectLocation(result)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.suggestionIcon}>
                                            <Ionicons name="location-outline" size={16} color={Colors.primaryText} />
                                        </View>
                                        <View style={styles.suggestionText}>
                                            <Text style={styles.suggestionName} numberOfLines={1}>
                                                {getShortName(result)}
                                            </Text>
                                            <Text style={styles.suggestionCity} numberOfLines={1}>
                                                {getCityCountry(result)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* No results */}
                    {showSuggestions && !isLoading && searchQuery.length >= 2 && suggestions.length === 0 && (
                        <View style={styles.suggestionsContainer}>
                            <View style={styles.noResultsContainer}>
                                <Ionicons name="search-outline" size={20} color="#999" />
                                <Text style={styles.noResultsText}>Lokasi tidak ditemukan</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Bottom card */}
                <View style={styles.bottomCard}>
                    {selectedAddress ? (
                        <View style={styles.addressPreview}>
                            <View style={styles.addressDot}>
                                <Ionicons name="location" size={18} color={Colors.white} />
                            </View>
                            <View style={styles.addressTextContainer}>
                                <Text style={styles.addressPreviewName} numberOfLines={1}>{selectedAddress}</Text>
                                <Text style={styles.addressPreviewCity} numberOfLines={1}>{selectedCity}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.addressPreview}>
                            <View style={[styles.addressDot, { backgroundColor: Colors.gray }]}>
                                <Ionicons name="location-outline" size={18} color={Colors.white} />
                            </View>
                            <View style={styles.addressTextContainer}>
                                <Text style={[styles.addressPreviewName, { color: Colors.gray }]}>
                                    Cari lokasi di atas
                                </Text>
                                <Text style={styles.addressPreviewCity}>Ketik nama jalan atau kota</Text>
                            </View>
                        </View>
                    )}
                    <TouchableOpacity
                        style={[styles.confirmButton, !selectedAddress && { opacity: 0.5 }]}
                        onPress={handleContinueToForm}
                        activeOpacity={0.8}
                        disabled={!selectedAddress}
                    >
                        <Text style={styles.confirmButtonText}>Lanjutkan</Text>
                        <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─── FORM STEP ───
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.formHeader}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep('map')}>
                    <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Alamat</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Location preview */}
                <View style={styles.locationPreview}>
                    <View style={styles.addressDot}>
                        <Ionicons name="location" size={16} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.locationName} numberOfLines={1}>{selectedAddress}</Text>
                        <Text style={styles.locationCity} numberOfLines={1}>{selectedCity}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setStep('map')}>
                        <Text style={styles.changeMapText}>Ubah</Text>
                    </TouchableOpacity>
                </View>

                {/* Label picker */}
                <Text style={styles.fieldLabel}>Label Alamat</Text>
                <View style={styles.labelRow}>
                    {ADDRESS_LABELS.map(l => (
                        <TouchableOpacity
                            key={l}
                            style={[styles.labelChip, label === l && styles.labelChipActive]}
                            onPress={() => setLabel(l)}
                        >
                            <Ionicons
                                name={l === 'Rumah' ? 'home' : l === 'Kantor' ? 'business' : l === 'Apartemen' ? 'business-outline' : l === 'Kos' ? 'bed' : 'bookmark'}
                                size={14}
                                color={label === l ? Colors.white : Colors.primaryText}
                                style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>
                                {l}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Form fields */}
                <Text style={styles.fieldLabel}>Nama Penerima *</Text>
                <TextInput
                    style={styles.formInput}
                    placeholder="Nama lengkap penerima"
                    placeholderTextColor={Colors.gray}
                    value={recipientName}
                    onChangeText={setRecipientName}
                />

                <Text style={styles.fieldLabel}>No. Telepon *</Text>
                <TextInput
                    style={styles.formInput}
                    placeholder="08xxxxxxxxxx"
                    placeholderTextColor={Colors.gray}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <Text style={styles.fieldLabel}>Alamat Lengkap *</Text>
                <TextInput
                    style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Jl., No., RT/RW, Kelurahan, Kecamatan"
                    placeholderTextColor={Colors.gray}
                    value={street}
                    onChangeText={setStreet}
                    multiline
                />

                <View style={styles.rowFields}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Kota *</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="Kota / Kabupaten"
                            placeholderTextColor={Colors.gray}
                            value={city}
                            onChangeText={setCity}
                        />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Provinsi *</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="Provinsi"
                            placeholderTextColor={Colors.gray}
                            value={province}
                            onChangeText={setProvince}
                        />
                    </View>
                </View>

                <Text style={styles.fieldLabel}>Kode Pos</Text>
                <TextInput
                    style={[styles.formInput, { width: 120 }]}
                    placeholder="00000"
                    placeholderTextColor={Colors.gray}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="number-pad"
                    maxLength={5}
                />

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save button */}
            <View style={styles.saveContainer}>
                <TouchableOpacity
                    style={[styles.confirmButton, isSaving && { opacity: 0.6 }]}
                    onPress={handleSaveAddress}
                    activeOpacity={0.8}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.confirmButtonText}>Simpan Alamat</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.primary,
        paddingTop: Platform.OS === 'ios' ? 54 : 40,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
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
        maxHeight: 300,
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
    addressPreviewName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    addressPreviewCity: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    confirmButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    // ── Form ──
    formScroll: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    formContent: {
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xl,
    },
    locationPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xxl,
    },
    locationName: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    locationCity: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        marginTop: 2,
    },
    changeMapText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    fieldLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
        marginBottom: 8,
        marginTop: Spacing.lg,
    },
    formInput: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        backgroundColor: Colors.lightGray,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    labelRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    labelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    labelChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    labelChipText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.xs,
        color: Colors.primaryText,
    },
    labelChipTextActive: {
        color: Colors.white,
    },
    rowFields: {
        flexDirection: 'row',
    },
    saveContainer: {
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    // ── Zoom Controls ──
    zoomControls: {
        position: 'absolute',
        right: 16,
        bottom: 200,
        zIndex: 5,
        backgroundColor: Colors.white,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 8,
    },
    zoomButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 8,
    },
});
