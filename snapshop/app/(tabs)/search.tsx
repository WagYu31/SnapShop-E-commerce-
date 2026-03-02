import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Modal,
    Platform,
    PanResponder,
    GestureResponderEvent,
    PanResponderGestureState,
    LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../../constants/theme';
import { products, recentSearches } from '../../constants/data';
import AnimatedButton from '../../components/AnimatedButton';

const { width } = Dimensions.get('window');
const PRICE_MIN = 0;
const PRICE_MAX = 10000000;
const HANDLE_SIZE = 24;
const CARD_WIDTH = (width - 48 - 12) / 2;

const SORT_TABS = ['New', 'Best seller', 'Trending', 'Recent'];
const FILTER_CATEGORIES = [
    'Office Chairs', 'color Chair', 'Wing Chair', 'Room Chair',
    'Bentwood Chair', 'Bots',
];

export default function SearchScreen() {
    const router = useRouter();
    const { filter } = useLocalSearchParams<{ filter?: string }>();
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('Best seller');
    const [showFilter, setShowFilter] = useState(false);
    const [showAllProducts, setShowAllProducts] = useState(false);

    // Auto-apply filter from See All navigation
    useEffect(() => {
        if (filter) {
            if (filter === 'new-arrival') {
                setActiveTab('New');
            } else if (filter === 'recommended') {
                setActiveTab('Trending');
            }
            setShowAllProducts(true);
        }
    }, [filter]);

    // Filter state
    const [priceRange, setPriceRange] = useState<[number, number]>([100000, 10000000]);
    const [selectedFilterCategories, setSelectedFilterCategories] = useState<string[]>([]);
    const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([100000, 10000000]);
    const sliderWidthRef = useRef<number>(0);
    const activeHandleRef = useRef<'min' | 'max'>('min');
    const [tempFilterCategories, setTempFilterCategories] = useState<string[]>([]);

    const filteredProducts = useMemo(() => {
        let result = products;

        // Text search
        if (searchText) {
            result = result.filter((p) =>
                p.name.toLowerCase().includes(searchText.toLowerCase()) ||
                p.category.toLowerCase().includes(searchText.toLowerCase()) ||
                p.description.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Price filter
        result = result.filter(
            (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
        );

        // Category filter
        if (selectedFilterCategories.length > 0) {
            result = result.filter((p) =>
                selectedFilterCategories.some(
                    (cat) => p.name.toLowerCase().includes(cat.toLowerCase()) ||
                        p.category.toLowerCase().includes(cat.toLowerCase())
                )
            );
        }

        return result;
    }, [searchText, priceRange, selectedFilterCategories]);

    const openFilter = () => {
        setTempPriceRange(priceRange);
        setTempFilterCategories([...selectedFilterCategories]);
        setShowFilter(true);
    };

    const applyFilter = () => {
        setPriceRange(tempPriceRange);
        setSelectedFilterCategories(tempFilterCategories);
        setShowFilter(false);
    };

    const clearFilter = () => {
        setTempPriceRange([100000, 10000000]);
        setTempFilterCategories([]);
    };

    const toggleFilterCategory = (cat: string) => {
        setTempFilterCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };

    const hasSearched = searchText.length > 0 || showAllProducts;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    {hasSearched && (
                        <TouchableOpacity
                            onPress={() => { setSearchText(''); }}
                            style={styles.backBtn}
                        >
                            <Ionicons name="arrow-back" size={22} color={Colors.primaryText} />
                        </TouchableOpacity>
                    )}
                    <View style={[styles.searchBar, hasSearched && { flex: 1 }]}>
                        <Ionicons name="search-outline" size={20} color={Colors.gray} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products..."
                            placeholderTextColor={Colors.gray}
                            value={searchText}
                            onChangeText={setSearchText}
                            autoCapitalize="none"
                        />
                        {searchText ? (
                            <TouchableOpacity onPress={() => setSearchText('')}>
                                <Ionicons name="close-circle" size={20} color={Colors.gray} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
                        <Ionicons name="options-outline" size={20} color={Colors.primaryText} />
                    </TouchableOpacity>
                </View>

                {/* Sort Tabs (only when searching) */}
                {hasSearched && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsRow}
                    >
                        {SORT_TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.sortTab,
                                    activeTab === tab && styles.sortTabActive,
                                ]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text
                                    style={[
                                        styles.sortTabText,
                                        activeTab === tab && styles.sortTabTextActive,
                                    ]}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* No search: show recent + tags */}
                {!hasSearched ? (
                    <>
                        {/* Recent Searches */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent Searches</Text>
                                <TouchableOpacity>
                                    <Text style={styles.clearText}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                            {recentSearches.map((search, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.recentItem}
                                    onPress={() => setSearchText(search)}
                                >
                                    <Ionicons name="time-outline" size={18} color={Colors.gray} />
                                    <Text style={styles.recentText}>{search}</Text>
                                    <Ionicons name="arrow-forward-outline" size={16} color={Colors.gray} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Popular Products preview */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Popular</Text>
                                <TouchableOpacity onPress={() => setSearchText(' ')}>
                                    <Text style={styles.clearText}>See All</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.productGrid}>
                                {products.slice(0, 4).map((product, index) => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={[styles.productCard, { marginRight: index % 2 === 0 ? 12 : 0 }]}
                                        onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.productImageContainer}>
                                            <Image source={{ uri: product.image }} style={styles.productImage} />
                                            <TouchableOpacity style={styles.wishlistButton}>
                                                <Ionicons name="heart-outline" size={16} color={Colors.primaryText} />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                        <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Search Results */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    {`Results for "${searchText.trim()}"`}
                                </Text>
                                <Text style={styles.resultCount}>{filteredProducts.length} items</Text>
                            </View>
                            {filteredProducts.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="search" size={48} color={Colors.border} />
                                    <Text style={styles.emptyText}>No products found</Text>
                                    <Text style={styles.emptySubtext}>Try different keywords or adjust filters</Text>
                                </View>
                            ) : (
                                <View style={styles.productGrid}>
                                    {filteredProducts.map((product, index) => (
                                        <TouchableOpacity
                                            key={product.id}
                                            style={[styles.productCard, { marginRight: index % 2 === 0 ? 12 : 0 }]}
                                            onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.productImageContainer}>
                                                <Image source={{ uri: product.image }} style={styles.productImage} />
                                                <TouchableOpacity style={styles.wishlistButton}>
                                                    <Ionicons name="heart-outline" size={16} color={Colors.primaryText} />
                                                </TouchableOpacity>
                                            </View>
                                            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                            <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Filter Modal */}
            <Modal
                visible={showFilter}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilter(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowFilter(false)}>
                                <Ionicons name="close" size={24} color={Colors.primaryText} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Filter</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Categories */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Categories</Text>
                                <View style={styles.filterChips}>
                                    {FILTER_CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.filterChip,
                                                tempFilterCategories.includes(cat) && styles.filterChipActive,
                                            ]}
                                            onPress={() => toggleFilterCategory(cat)}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    tempFilterCategories.includes(cat) && styles.filterChipTextActive,
                                                ]}
                                            >
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Price Range */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Price</Text>
                                <View style={styles.priceSliderContainer}>
                                    {/* Slider */}
                                    <View
                                        style={styles.sliderWrapper}
                                        onLayout={(e) => {
                                            sliderWidthRef.current = e.nativeEvent.layout.width;
                                        }}
                                        onStartShouldSetResponder={() => true}
                                        onMoveShouldSetResponder={() => true}
                                        onResponderGrant={(e) => {
                                            const touchX = e.nativeEvent.locationX;
                                            const sw = sliderWidthRef.current || (width - 96);
                                            const pct = Math.max(0, Math.min(1, touchX / sw));
                                            const value = Math.round(PRICE_MIN + pct * (PRICE_MAX - PRICE_MIN));
                                            const distMin = Math.abs(value - tempPriceRange[0]);
                                            const distMax = Math.abs(value - tempPriceRange[1]);
                                            if (distMin <= distMax) {
                                                activeHandleRef.current = 'min';
                                                setTempPriceRange([Math.min(value, tempPriceRange[1] - 50), tempPriceRange[1]]);
                                            } else {
                                                activeHandleRef.current = 'max';
                                                setTempPriceRange([tempPriceRange[0], Math.max(value, tempPriceRange[0] + 50)]);
                                            }
                                        }}
                                        onResponderMove={(e) => {
                                            const touchX = e.nativeEvent.locationX;
                                            const sw = sliderWidthRef.current || (width - 96);
                                            const pct = Math.max(0, Math.min(1, touchX / sw));
                                            const value = Math.round(PRICE_MIN + pct * (PRICE_MAX - PRICE_MIN));
                                            if (activeHandleRef.current === 'min') {
                                                setTempPriceRange([Math.min(value, tempPriceRange[1] - 50), tempPriceRange[1]]);
                                            } else {
                                                setTempPriceRange([tempPriceRange[0], Math.max(value, tempPriceRange[0] + 50)]);
                                            }
                                        }}
                                    >
                                        {/* Background track */}
                                        <View style={styles.sliderTrack} />
                                        {/* Filled range */}
                                        <View
                                            style={[
                                                styles.sliderFill,
                                                {
                                                    left: `${((tempPriceRange[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                                                    right: `${100 - ((tempPriceRange[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                                                },
                                            ]}
                                        />
                                        {/* Min handle */}
                                        <View
                                            style={[
                                                styles.sliderHandle,
                                                {
                                                    left: `${((tempPriceRange[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                                                },
                                            ]}
                                        />
                                        {/* Max handle */}
                                        <View
                                            style={[
                                                styles.sliderHandle,
                                                {
                                                    left: `${((tempPriceRange[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                                                },
                                            ]}
                                        />
                                    </View>

                                    {/* Price input fields */}
                                    <View style={styles.priceInputRow}>
                                        <View style={styles.priceInputBox}>
                                            <Text style={styles.priceInputLabel}>Min</Text>
                                            <TextInput
                                                style={styles.priceInput}
                                                value={formatRupiah(tempPriceRange[0])}
                                                keyboardType="number-pad"
                                                onChangeText={(text) => {
                                                    const num = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                                                    setTempPriceRange([Math.min(num, tempPriceRange[1] - 50), tempPriceRange[1]]);
                                                }}
                                            />
                                        </View>
                                        <Text style={styles.priceDash}>—</Text>
                                        <View style={styles.priceInputBox}>
                                            <Text style={styles.priceInputLabel}>Max</Text>
                                            <TextInput
                                                style={styles.priceInput}
                                                value={formatRupiah(tempPriceRange[1])}
                                                keyboardType="number-pad"
                                                onChangeText={(text) => {
                                                    const num = parseInt(text.replace(/[^0-9]/g, ''), 10) || PRICE_MAX;
                                                    setTempPriceRange([tempPriceRange[0], Math.max(num, tempPriceRange[0] + 50)]);
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Modal Bottom Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.clearBtn} onPress={clearFilter}>
                                <Text style={styles.clearBtnText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
                                <Text style={styles.applyBtnText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    // === Header ===
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: Spacing.md,
        gap: Spacing.sm,
    },
    backBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        paddingVertical: 0,
    },
    filterBtn: {
        width: 42,
        height: 42,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // === Sort Tabs ===
    tabsRow: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    sortTab: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.lightGray,
    },
    sortTabActive: {
        backgroundColor: Colors.primary,
    },
    sortTabText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    sortTabTextActive: {
        color: Colors.white,
    },
    // === Sections ===
    section: {
        paddingHorizontal: Spacing.xxl,
        marginBottom: Spacing.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    clearText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    resultCount: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    // === Recent ===
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    recentText: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    // === Products ===
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    productCard: {
        width: CARD_WIDTH,
        marginBottom: Spacing.lg,
    },
    productImageContainer: {
        width: '100%',
        height: CARD_WIDTH * 1.2,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        backgroundColor: Colors.lightGray,
        marginBottom: Spacing.sm,
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    wishlistButton: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productName: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
        marginBottom: 2,
    },
    productPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    // === Empty ===
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginTop: Spacing.lg,
    },
    emptySubtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        marginTop: Spacing.sm,
    },
    // ======= FILTER MODAL =======
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: Spacing.xxl,
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 50,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    modalTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h3,
        color: Colors.primaryText,
    },
    // === Filter Sections ===
    filterSection: {
        marginBottom: Spacing.xxl,
    },
    filterSectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginBottom: Spacing.lg,
    },
    filterChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    filterChipTextActive: {
        color: Colors.white,
    },
    // === Price ===
    priceSliderContainer: {
        marginTop: Spacing.md,
    },
    sliderWrapper: {
        height: 44,
        justifyContent: 'center',
        position: 'relative',
        marginVertical: Spacing.sm,
    },
    sliderTrack: {
        height: 3,
        backgroundColor: '#E8E8E8',
        borderRadius: 2,
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        marginTop: -1.5,
    },
    sliderFill: {
        height: 3,
        position: 'absolute',
        top: '50%',
        marginTop: -1.5,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    sliderHandle: {
        position: 'absolute',
        top: '50%',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        marginTop: -10,
        marginLeft: -10,
        borderWidth: 3,
        borderColor: Colors.white,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 5,
    },
    priceInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    priceInputBox: {
        flex: 1,
    },
    priceInputLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
        marginBottom: 4,
    },
    priceInput: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingVertical: 8,
    },
    priceDash: {
        fontFamily: 'Inter_400Regular',
        color: Colors.secondaryText,
        paddingHorizontal: Spacing.md,
        paddingTop: 16,
    },
    // === Modal Actions ===
    modalActions: {
        flexDirection: 'row',
        marginTop: Spacing.xxl,
    },
    clearBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    clearBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    applyBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
});
