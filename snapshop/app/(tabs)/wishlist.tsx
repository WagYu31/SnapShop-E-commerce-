import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../../constants/theme';

interface WishlistItem {
    id: string;
    name: string;
    brand: string;
    rating: number;
    reviews: number;
    price: number;
    image: string;
    liked: boolean;
}

const initialItems: WishlistItem[] = [
    {
        id: '1',
        name: 'Jordan 1 Retro High Tie Dye',
        brand: 'Nike',
        rating: 4.5,
        reviews: 1045,
        price: 3500000,
        image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=500&fit=crop',
        liked: true,
    },
    {
        id: '2',
        name: 'Running Shoes Pro Max',
        brand: 'Adidas',
        rating: 4.5,
        reviews: 1045,
        price: 3500000,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
        liked: true,
    },
    {
        id: '3',
        name: 'Jordan 1 Retro High Tie Dye',
        brand: 'Nike',
        rating: 4.5,
        reviews: 1045,
        price: 3500000,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop',
        liked: true,
    },
    {
        id: '4',
        name: 'Classic Sport Sneakers',
        brand: 'Puma',
        rating: 4.2,
        reviews: 876,
        price: 2800000,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop',
        liked: true,
    },
];

export default function WishlistScreen() {
    const router = useRouter();
    const [items, setItems] = useState(initialItems);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleLike = (id: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, liked: !item.liked } : item
            )
        );
    };

    const filtered = items.filter(
        (item) =>
            item.liked &&
            (searchQuery === '' ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Wishlist</Text>
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/cart')}
                    style={styles.headerIcon}
                >
                    <Ionicons name="bag-outline" size={22} color={Colors.primaryText} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color={Colors.gray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search your wishlist product"
                        placeholderTextColor={Colors.gray}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons
                                name="close-circle"
                                size={18}
                                color={Colors.gray}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Product List */}
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="heart-outline"
                            size={64}
                            color={Colors.border}
                        />
                        <Text style={styles.emptyTitle}>No items yet</Text>
                        <Text style={styles.emptySubtext}>
                            Browse products and tap ♥ to add favorites
                        </Text>
                    </View>
                ) : (
                    filtered.map((item) => (
                        <View key={item.id}>
                            <TouchableOpacity
                                style={styles.itemCard}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/product/${item.id}`)}
                            >
                                <Image source={{ uri: item.image }} style={styles.itemImage} />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.ratingText}>
                                            {item.rating}
                                        </Text>
                                        <Text style={styles.reviewCount}>
                                            ({item.reviews} Reviews)
                                        </Text>
                                    </View>
                                    <Text style={styles.itemPrice}>
                                        {formatRupiah(item.price)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.heartButton}
                                    onPress={() => toggleLike(item.id)}
                                >
                                    <Ionicons
                                        name={item.liked ? 'heart' : 'heart-outline'}
                                        size={22}
                                        color={
                                            item.liked
                                                ? Colors.primaryText
                                                : Colors.gray
                                        }
                                    />
                                </TouchableOpacity>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.moveToCartBtn}
                                onPress={() => Alert.alert('Added to Cart', `${item.name} has been added to your cart!`)}
                            >
                                <Ionicons name="cart-outline" size={16} color={Colors.primary} />
                                <Text style={styles.moveToCartText}>Move to Cart</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add All to Cart */}
            {filtered.length > 0 && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.addAllBtn}
                        onPress={() => Alert.alert('Added to Cart', `${filtered.length} items have been added to your cart!`)}
                    >
                        <Ionicons name="cart" size={20} color={Colors.white} />
                        <Text style={styles.addAllText}>Add All to Cart ({filtered.length})</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 54 : 40,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.h3,
        color: Colors.primaryText,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Search
    searchContainer: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.white,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginLeft: Spacing.sm,
        padding: 0,
    },
    // List
    list: {
        flex: 1,
    },
    listContent: {
        padding: Spacing.xxl,
        gap: Spacing.lg,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.lightGray,
        marginRight: Spacing.lg,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.primaryText,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    ratingText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primaryText,
    },
    reviewCount: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.xs,
        color: Colors.secondaryText,
    },
    itemPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: FontSize.lg,
        color: Colors.primaryText,
    },
    heartButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Empty
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        gap: 12,
    },
    emptyTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.xl,
        color: Colors.primaryText,
    },
    emptySubtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: FontSize.md,
        color: Colors.secondaryText,
    },
    moveToCartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.sm,
        marginTop: -4,
        marginBottom: Spacing.sm,
    },
    moveToCartText: {
        fontFamily: 'Inter_500Medium',
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    bottomBar: {
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.md,
        paddingBottom: 34,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    addAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
    },
    addAllText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
});
