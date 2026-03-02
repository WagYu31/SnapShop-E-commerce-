import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, formatRupiah } from '../../constants/theme';
import { categories, banners, products as staticProducts } from '../../constants/data';
import AnimatedCard from '../../components/AnimatedCard';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;
const API_URL = 'http://localhost:8080/api/v1';

export default function HomeScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState('1');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [showNotifBanner, setShowNotifBanner] = useState(true);
  const notifAnim = useRef(new Animated.Value(-80)).current;
  const [products, setProducts] = useState<any[]>(staticProducts);

  useEffect(() => {
    console.log('[SnapShop] Fetching products from API...');
    fetch(`${API_URL}/products?limit=50`)
      .then(r => r.json())
      .then(res => {
        console.log('[SnapShop] API response:', res.data?.length, 'products');
        if (res.data && res.data.length > 0) {
          setProducts(res.data.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            price: p.price,
            oldPrice: p.old_price,
            image: p.image_url?.startsWith('/') ? `http://localhost:8080${p.image_url}` : p.image_url,
            category: p.category?.name || 'All',
            rating: p.rating,
            reviews: p.review_count,
            description: p.description,
            stock: p.stock,
          })));
        }
      })
      .catch((err) => { console.log('[SnapShop] API fetch failed, using static data:', err.message); });
  }, []);

  useEffect(() => {
    if (showNotifBanner) {
      Animated.spring(notifAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(notifAnim, {
          toValue: -80,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowNotifBanner(false));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotifBanner]);

  const onBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (width - 48 + 12));
    setBannerIndex(index);
  };

  // Filter products by selected category
  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name || 'All';
  const filteredProducts = activeCategoryName === 'All'
    ? products
    : products.filter(p => p.category === activeCategoryName);

  const renderProductCard = (item: typeof products[0], index: number) => (
    <AnimatedCard
      key={item.id}
      style={[styles.productCard, { marginRight: index % 2 === 0 ? 12 : 0 }]}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
      delay={index * 80}
    >
      <View style={[styles.productImageContainer, isDark && { backgroundColor: colors.cardElevated }]}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <TouchableOpacity style={[styles.wishlistButton, isDark && { backgroundColor: colors.cardElevated }]}>
          <Ionicons name="heart-outline" size={18} color={isDark ? colors.primaryText : Colors.primaryText} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, isDark && { color: colors.secondaryText }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.productPrice, isDark && { color: colors.accent }]}>{formatRupiah(item.price)}</Text>
      </View>
    </AnimatedCard>
  );

  return (
    <View style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        overScrollMode="always"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        {showNotifBanner && (
          <Animated.View style={[styles.notifBanner, { transform: [{ translateY: notifAnim }] }]}>
            <TouchableOpacity
              style={styles.notifBannerContent}
              activeOpacity={0.9}
              onPress={() => { setShowNotifBanner(false); router.push('/notifications'); }}
            >
              <View style={styles.notifBannerIcon}>
                <Ionicons name="pricetag" size={16} color="#fff" />
              </View>
              <View style={styles.notifBannerTextWrap}>
                <Text style={styles.notifBannerTitle}>Flash Sale! 🔥</Text>
                <Text style={styles.notifBannerDesc}>Diskon hingga 50% untuk produk pilihan</Text>
              </View>
              <TouchableOpacity onPress={() => {
                Animated.timing(notifAnim, {
                  toValue: -80, duration: 200, useNativeDriver: true,
                }).start(() => setShowNotifBanner(false));
              }}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
        <View style={[styles.header, isDark && { backgroundColor: colors.surface }]}>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={24} color={isDark ? colors.primaryText : Colors.primaryText} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, isDark && { backgroundColor: '#fff' }]}>
              <Ionicons name="bag-handle" size={14} color={isDark ? '#000' : '#FFFFFF'} />
            </View>
            <Text style={[styles.logoText, isDark && { color: colors.primaryText }]}>SnapShop</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={isDark ? colors.primaryText : Colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={[styles.searchBar, isDark && { backgroundColor: colors.lightGray }]}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={20} color={isDark ? colors.gray : Colors.gray} />
          <Text style={[styles.searchPlaceholder, isDark && { color: colors.gray }]}>Search products...</Text>
          <View style={[styles.searchFilterIcon, isDark && { backgroundColor: colors.surface }]}>
            <Ionicons name="options-outline" size={18} color={isDark ? colors.primaryText : Colors.primaryText} />
          </View>
        </TouchableOpacity>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                isDark && { backgroundColor: colors.chipBg, borderColor: colors.border },
                activeCategory === category.id && styles.activeCategoryChip,
                activeCategory === category.id && isDark && { backgroundColor: colors.chipActiveBg, borderColor: colors.chipActiveBg },
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  isDark && { color: colors.chipText },
                  activeCategory === category.id && styles.activeCategoryText,
                  activeCategory === category.id && isDark && { color: colors.chipActiveText },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Banner Carousel */}
        <View style={styles.bannerSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onBannerScroll}
            scrollEventThrottle={16}
            snapToInterval={width - 48 + 12}
            decelerationRate="fast"
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {banners.map((item, idx) => (
              <View key={item.id} style={[styles.bannerCard, idx < banners.length - 1 && { marginRight: 12 }]}>
                <Image source={{ uri: item.image }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay} />
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.bannerDots}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerDot,
                  bannerIndex === index && styles.activeBannerDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* New Arrival */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && { color: colors.primaryText }]}>New Arrival</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/search', params: { filter: 'new-arrival' } })}>
            <Text style={[styles.seeAllText, isDark && { color: colors.accent }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productGrid}>
          {filteredProducts.slice(0, 4).map((product, index) =>
            renderProductCard(product, index)
          )}
        </View>

        {/* Recommended */}
        {filteredProducts.length > 4 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && { color: colors.primaryText }]}>Recommended</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/search', params: { filter: 'recommended' } })}>
                <Text style={[styles.seeAllText, isDark && { color: colors.accent }]}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.productGrid}>
              {filteredProducts.slice(4, 8).map((product, index) =>
                renderProductCard(product, index)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: FontSize.xl,
    color: Colors.primaryText,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    marginHorizontal: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: FontSize.md,
    color: Colors.gray,
    marginLeft: Spacing.sm,
  },
  searchFilterIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: Spacing.xl,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.xxl,
    paddingRight: Spacing.xxl + 16,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightGray,
    marginRight: Spacing.sm,
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: FontSize.sm,
    color: Colors.primaryText,
  },
  activeCategoryText: {
    color: Colors.white,
  },
  bannerSection: {
    marginHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  bannerCard: {
    width: width - 48,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
  },
  bannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: FontSize.xxl,
    color: Colors.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginHorizontal: 3,
  },
  activeBannerDot: {
    backgroundColor: Colors.primary,
    width: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: FontSize.xl,
    color: Colors.primaryText,
  },
  seeAllText: {
    fontFamily: 'Inter_500Medium',
    fontSize: FontSize.sm,
    color: Colors.secondaryText,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    paddingHorizontal: 2,
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
  notifBanner: {
    marginHorizontal: Spacing.xxl,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  notifBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  notifBannerIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  notifBannerTextWrap: { flex: 1 },
  notifBannerTitle: {
    fontFamily: 'Inter_600SemiBold', fontSize: FontSize.sm, color: Colors.white,
  },
  notifBannerDesc: {
    fontFamily: 'Inter_400Regular', fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)',
  },
});
