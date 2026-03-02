import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { products, productReviews } from '../constants/data';
import FadeInView from '../components/FadeInView';

export default function ReviewsScreen() {
    const router = useRouter();
    const { productId } = useLocalSearchParams<{ productId: string }>();
    const product = products.find(p => p.id === productId) || products[0];
    const reviews = productReviews.filter(r => r.productId === productId);

    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [helpfulIds, setHelpfulIds] = useState<string[]>([]);

    const filteredReviews = filterRating
        ? reviews.filter(r => r.rating === filterRating)
        : reviews;

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0';

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        percentage: reviews.length > 0
            ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100
            : 0,
    }));

    const toggleHelpful = (id: string) => {
        setHelpfulIds(prev =>
            prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reviews</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Rating Summary */}
                <FadeInView delay={0}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryLeft}>
                            <Text style={styles.avgRating}>{avgRating}</Text>
                            <View style={styles.avgStars}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Ionicons key={s} name={s <= Math.round(Number(avgRating)) ? 'star' : 'star-outline'} size={16} color="#FFB800" />
                                ))}
                            </View>
                            <Text style={styles.totalReviews}>{product.reviews} reviews</Text>
                        </View>
                        <View style={styles.summaryRight}>
                            {ratingCounts.map(({ star, count, percentage }) => (
                                <View key={star} style={styles.ratingBar}>
                                    <Text style={styles.ratingBarLabel}>{star}</Text>
                                    <Ionicons name="star" size={10} color="#FFB800" />
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barFill, { width: `${percentage}%` }]} />
                                    </View>
                                    <Text style={styles.ratingBarCount}>{count}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </FadeInView>

                {/* Filter Chips */}
                <FadeInView delay={100}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        <TouchableOpacity
                            style={[styles.filterChip, !filterRating && styles.filterChipActive]}
                            onPress={() => setFilterRating(null)}
                        >
                            <Text style={[styles.filterChipText, !filterRating && styles.filterChipTextActive]}>All</Text>
                        </TouchableOpacity>
                        {[5, 4, 3, 2, 1].map(star => (
                            <TouchableOpacity
                                key={star}
                                style={[styles.filterChip, filterRating === star && styles.filterChipActive]}
                                onPress={() => setFilterRating(filterRating === star ? null : star)}
                            >
                                <Ionicons name="star" size={12} color={filterRating === star ? Colors.white : '#FFB800'} />
                                <Text style={[styles.filterChipText, filterRating === star && styles.filterChipTextActive]}>{star}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </FadeInView>

                {/* Review List */}
                {filteredReviews.map((review, index) => (
                    <FadeInView key={review.id} delay={200 + index * 80}>
                        <View style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                                <View style={styles.reviewUserInfo}>
                                    <Text style={styles.reviewUserName}>{review.userName}</Text>
                                    <View style={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={14} color="#FFB800" />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewDate}>{review.date}</Text>
                            </View>

                            <Text style={styles.reviewText}>{review.text}</Text>

                            {review.photos.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
                                    {review.photos.map((photo, i) => (
                                        <Image key={i} source={{ uri: photo }} style={styles.reviewPhoto} />
                                    ))}
                                </ScrollView>
                            )}

                            <TouchableOpacity
                                style={[styles.helpfulButton, helpfulIds.includes(review.id) && styles.helpfulActive]}
                                onPress={() => toggleHelpful(review.id)}
                            >
                                <Ionicons
                                    name={helpfulIds.includes(review.id) ? 'thumbs-up' : 'thumbs-up-outline'}
                                    size={14}
                                    color={helpfulIds.includes(review.id) ? Colors.primary : Colors.gray}
                                />
                                <Text style={[styles.helpfulText, helpfulIds.includes(review.id) && styles.helpfulTextActive]}>
                                    Helpful ({review.helpful + (helpfulIds.includes(review.id) ? 1 : 0)})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </FadeInView>
                ))}

                {filteredReviews.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubble-outline" size={48} color={Colors.gray} />
                        <Text style={styles.emptyText}>No reviews for this rating</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl, paddingTop: 60, paddingBottom: Spacing.lg,
    },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: FontSize.xl, color: Colors.primaryText },
    scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 40 },

    // Rating Summary
    summaryCard: {
        flexDirection: 'row', backgroundColor: Colors.lightGray,
        borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.xl,
    },
    summaryLeft: { alignItems: 'center', justifyContent: 'center', marginRight: Spacing.xxl },
    avgRating: { fontFamily: 'Inter_700Bold', fontSize: 40, color: Colors.primaryText },
    avgStars: { flexDirection: 'row', gap: 2, marginVertical: 4 },
    totalReviews: { fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.secondaryText },
    summaryRight: { flex: 1, justifyContent: 'center' },
    ratingBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    ratingBarLabel: { fontFamily: 'Inter_500Medium', fontSize: FontSize.xs, color: Colors.secondaryText, width: 12 },
    barTrack: {
        flex: 1, height: 6, backgroundColor: Colors.border,
        borderRadius: 3, marginHorizontal: 6, overflow: 'hidden',
    },
    barFill: { height: '100%', backgroundColor: '#FFB800', borderRadius: 3 },
    ratingBarCount: { fontFamily: 'Inter_400Regular', fontSize: FontSize.xs, color: Colors.gray, width: 16, textAlign: 'right' },

    // Filter
    filterScroll: { marginBottom: Spacing.xl },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
        borderRadius: 20, backgroundColor: Colors.lightGray, marginRight: Spacing.sm,
    },
    filterChipActive: { backgroundColor: Colors.primary },
    filterChipText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.sm, color: Colors.primaryText },
    filterChipTextActive: { color: Colors.white },

    // Review Card
    reviewCard: {
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
    reviewUserInfo: { flex: 1, marginLeft: Spacing.md },
    reviewUserName: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primaryText, marginBottom: 2 },
    reviewStars: { flexDirection: 'row', gap: 2 },
    reviewDate: { fontFamily: 'Inter_400Regular', fontSize: FontSize.xs, color: Colors.gray },
    reviewText: { fontFamily: 'Inter_400Regular', fontSize: FontSize.md, color: Colors.secondaryText, lineHeight: 20, marginBottom: Spacing.md },
    reviewPhotos: { marginBottom: Spacing.md },
    reviewPhoto: { width: 80, height: 80, borderRadius: BorderRadius.md, marginRight: Spacing.sm },
    helpfulButton: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 6,
        borderRadius: 16, backgroundColor: Colors.white,
    },
    helpfulActive: { backgroundColor: '#EEF2FF' },
    helpfulText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.xs, color: Colors.gray },
    helpfulTextActive: { color: Colors.primary },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
    emptyText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.md, color: Colors.gray, marginTop: Spacing.md },
});
