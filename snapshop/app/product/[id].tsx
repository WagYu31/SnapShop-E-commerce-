import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Share,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../../constants/theme';
import { products, productReviews } from '../../constants/data';
import { API_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedButton from '../../components/AnimatedButton';
import FadeInView from '../../components/FadeInView';

const { width } = Dimensions.get('window');

// Generate 4 variant image URLs per product by tweaking crop params
const getProductImages = (baseUrl: string): string[] => {
    return [
        baseUrl,
        baseUrl.replace('fit=crop', 'fit=crop&flip=h'),
        baseUrl.replace('w=400&h=500', 'w=500&h=500'),
        baseUrl.replace('w=400&h=500', 'w=400&h=400'),
    ];
};

export default function ProductDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const product = products.find((p) => p.id === id) || products[0];

    const [selectedSize, setSelectedSize] = useState(2);
    const [selectedColor, setSelectedColor] = useState(0);
    const [sizeUnit, setSizeUnit] = useState<'EU' | 'US' | 'UK'>('EU');
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);

    const handleAddToCart = async () => {
        try {
            setAddingToCart(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Login Required', 'Silakan login terlebih dahulu', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => router.push('/login') },
                ]);
                return;
            }
            const res = await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    product_id: parseInt(product.id),
                    quantity: 1,
                }),
            });
            const data = await res.json();
            if (data.success) {
                Alert.alert('Berhasil! ✓', `${product.name} ditambahkan ke keranjang`, [
                    { text: 'Lanjut Belanja', style: 'cancel' },
                    { text: 'Lihat Cart', onPress: () => router.push('/(tabs)/cart') },
                ]);
            } else {
                Alert.alert('Gagal', data.message || 'Gagal menambahkan ke keranjang');
            }
        } catch (e) {
            Alert.alert('Error', 'Gagal terhubung ke server');
        } finally {
            setAddingToCart(false);
        }
    };
    const imageScrollRef = useRef<ScrollView>(null);

    const sizes = product.sizes || ['S', 'M', 'L', 'XL'];
    const colors = product.colors || ['#000000', '#8B4513', '#D2B48C'];
    const reviews = productReviews.filter(r => r.productId === product.id);
    const productImages = getProductImages(product.image);

    const onImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveImageIndex(index);
    };

    const scrollToImage = (index: number) => {
        setActiveImageIndex(index);
        imageScrollRef.current?.scrollTo({ x: index * width, animated: true });
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Dark Product Image Area */}
                <View style={styles.imageSection}>
                    {/* Header Overlay */}
                    <View style={styles.imageHeader}>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Product Details</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                style={styles.headerIconBtn}
                                onPress={() => setIsFavorite(!isFavorite)}
                            >
                                <Ionicons
                                    name={isFavorite ? 'heart' : 'heart-outline'}
                                    size={22}
                                    color={isFavorite ? Colors.red : Colors.white}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerIconBtn}
                                onPress={async () => {
                                    try {
                                        await Share.share({
                                            message: `Check out ${product.name} at SnapShop! ${formatRupiah(product.price)}\nhttps://snapshop.id/product/${product.id}`,
                                        });
                                    } catch (e) { }
                                }}
                            >
                                <Ionicons name="share-outline" size={22} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Swipeable Product Images */}
                    <ScrollView
                        ref={imageScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={onImageScroll}
                        scrollEventThrottle={16}
                    >
                        {productImages.map((imgUri, i) => (
                            <View key={i} style={styles.imageContainer}>
                                <View style={styles.ovalDecoration} />
                                <Image source={{ uri: imgUri }} style={styles.productImage} />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Image Carousel Dots */}
                    <View style={styles.imageDots}>
                        {productImages.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.imageDot,
                                    activeImageIndex === i && styles.activeImageDot,
                                ]}
                            />
                        ))}
                    </View>

                    {/* Small thumbnail images */}
                    <View style={styles.thumbnailRow}>
                        {productImages.map((imgUri, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.thumbnail,
                                    activeImageIndex === i && styles.activeThumbnail,
                                ]}
                                onPress={() => scrollToImage(i)}
                            >
                                <Image
                                    source={{ uri: imgUri }}
                                    style={styles.thumbnailImage}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Product Info Section - White Background */}
                <View style={styles.infoSection}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>

                    <Text style={styles.descriptionText}>
                        {product.description || 'Sports tech. Street smarts. Made in Portugal. Blister blends luxurious leathers to everyday cool. Be bold. Be you.'}
                    </Text>

                    {/* Size Section */}
                    <View style={styles.sizeSection}>
                        <View style={styles.sizeHeader}>
                            <Text style={styles.sizeLabel}>Size</Text>
                            <View style={styles.sizeUnitTabs}>
                                {(['EU', 'US', 'UK'] as const).map((unit) => (
                                    <TouchableOpacity
                                        key={unit}
                                        onPress={() => setSizeUnit(unit)}
                                        style={[
                                            styles.sizeUnitTab,
                                            sizeUnit === unit && styles.sizeUnitTabActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.sizeUnitText,
                                                sizeUnit === unit && styles.sizeUnitTextActive,
                                            ]}
                                        >
                                            {unit}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.sizeOptions}>
                            {sizes.map((size, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.sizeChip,
                                        selectedSize === index && styles.selectedSizeChip,
                                    ]}
                                    onPress={() => setSelectedSize(index)}
                                >
                                    <Text
                                        style={[
                                            styles.sizeText,
                                            selectedSize === index && styles.selectedSizeText,
                                        ]}
                                    >
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Color Section */}
                    <View style={styles.colorSection}>
                        <Text style={styles.sizeLabel}>Color</Text>
                        <View style={styles.colorOptions}>
                            {colors.map((color, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.colorSwatch,
                                        { backgroundColor: color },
                                        selectedColor === index && styles.selectedColorSwatch,
                                    ]}
                                    onPress={() => setSelectedColor(index)}
                                >
                                    {selectedColor === index && (
                                        <Ionicons name="checkmark" size={14} color={color === '#FFFFFF' || color === '#D2B48C' ? '#000' : '#fff'} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Reviews Section */}
                    <FadeInView delay={200}>
                        <View style={styles.reviewsSection}>
                            <View style={styles.reviewsHeader}>
                                <View>
                                    <Text style={styles.reviewsTitle}>Reviews</Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={16} color="#FFB800" />
                                        <Text style={styles.ratingText}>{product.rating}</Text>
                                        <Text style={styles.reviewCount}>({product.reviews} reviews)</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => router.push({ pathname: '/reviews', params: { productId: product.id } })}>
                                    <Text style={styles.seeAllReviews}>See All</Text>
                                </TouchableOpacity>
                            </View>

                            {reviews.slice(0, 2).map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewUserRow}>
                                        <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                                        <View style={styles.reviewUserInfo}>
                                            <Text style={styles.reviewUserName}>{review.userName}</Text>
                                            <Text style={styles.reviewDate}>{review.date}</Text>
                                        </View>
                                        <View style={styles.reviewStars}>
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={12} color="#FFB800" />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={styles.reviewText} numberOfLines={2}>{review.text}</Text>
                                </View>
                            ))}
                        </View>
                    </FadeInView>
                </View>
            </ScrollView>

            {/* Bottom Add to Cart */}
            <View style={styles.bottomBar}>
                <AnimatedButton
                    onPress={handleAddToCart}
                    disabled={addingToCart}
                    title={addingToCart ? 'Adding...' : 'Add to Cart'}
                    style={styles.addToCartButton}
                    textStyle={styles.addToCartText}
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
    // === Dark Image Section ===
    imageSection: {
        backgroundColor: '#1A1A1A',
        paddingBottom: Spacing.xl,
    },
    imageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
        paddingTop: 56,
        paddingBottom: Spacing.md,
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 4,
    },
    // === Product Image ===
    imageContainer: {
        width: width,
        height: width * 0.85,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ovalDecoration: {
        position: 'absolute',
        width: width * 0.7,
        height: width * 0.35,
        borderRadius: width * 0.35,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        transform: [{ rotate: '-15deg' }],
    },
    productImage: {
        width: width * 0.75,
        height: width * 0.85,
        resizeMode: 'contain',
    },
    // === Image Dots ===
    imageDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    imageDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    activeImageDot: {
        backgroundColor: Colors.white,
        width: 18,
    },
    // === Thumbnails ===
    thumbnailRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.xxl,
    },
    thumbnail: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    activeThumbnail: {
        borderColor: Colors.white,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // === Info Section ===
    infoSection: {
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xxl,
        paddingBottom: 120,
    },
    productName: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h3,
        color: Colors.primaryText,
        marginBottom: Spacing.sm,
    },
    productPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h3,
        color: Colors.primaryText,
        marginBottom: Spacing.lg,
    },
    descriptionText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        lineHeight: 20,
        marginBottom: Spacing.xxl,
    },
    // === Size Section ===
    sizeSection: {
        marginBottom: Spacing.xxl,
    },
    sizeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sizeLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    sizeUnitTabs: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    sizeUnitTab: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    sizeUnitTabActive: {
        backgroundColor: Colors.primary,
    },
    sizeUnitText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    sizeUnitTextActive: {
        color: Colors.white,
    },
    sizeOptions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    sizeChip: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedSizeChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    sizeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    selectedSizeText: {
        color: Colors.white,
    },
    // === Bottom Bar ===
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.lg,
        paddingBottom: 34,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    addToCartButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    addToCartText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.lg,
        color: Colors.white,
    },
    colorSection: {
        marginTop: Spacing.xl,
    },
    colorOptions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    colorSwatch: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectedColorSwatch: {
        borderWidth: 2,
        borderColor: Colors.primaryText,
    },
    reviewsSection: {
        marginTop: Spacing.xxl,
        paddingBottom: Spacing.xl,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    reviewsTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
    },
    reviewCount: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    seeAllReviews: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
    },
    reviewCard: {
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    reviewUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    reviewUserInfo: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    reviewUserName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    reviewDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.gray,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewText: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.sm,
        color: Colors.secondaryText,
        lineHeight: 18,
    },
});
