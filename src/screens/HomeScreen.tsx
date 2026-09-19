import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe, SubscriptionState, AdminSettings, MainSection } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { extractYouTubeId } from '../utils/youtube';

interface HomeScreenProps {
  recipes: Recipe[];
  subscription: SubscriptionState;
  settings: AdminSettings;
  isAdmin: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenActivationModal: () => void;
  onOpenAdminLogin: () => void;
  onOpenAdminPanel: () => void;
  onEditRecipeAdmin?: (recipe: Recipe) => void;
  onAddNewRecipeAdmin?: () => void;
  onRefresh: () => Promise<void>;
  searchQuery: string;
  selectedSection: 'all' | MainSection;
  onlyWithVideo: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  recipes,
  subscription,
  settings,
  isAdmin,
  onSelectRecipe,
  onOpenActivationModal,
  onOpenAdminLogin,
  onOpenAdminPanel,
  onEditRecipeAdmin,
  onAddNewRecipeAdmin,
  onRefresh,
  searchQuery,
  selectedSection,
  onlyWithVideo,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubCat, setSelectedSubCat] = useState<string>('all');

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Filter recipes based on search, section, video, and subcategory
  const filteredRecipes = recipes.filter((recipe, index) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = recipe.title.toLowerCase().includes(q);
      const inTitleEn = Boolean(recipe.titleEn && recipe.titleEn.toLowerCase().includes(q));
      const inCategory = recipe.categoryName.toLowerCase().includes(q);
      const inIngredients = recipe.ingredients.some(
        (ing) =>
          ing.name.toLowerCase().includes(q) ||
          (ing.chemicalName && ing.chemicalName.toLowerCase().includes(q))
      );
      if (!(inTitle || inTitleEn || inCategory || inIngredients)) return false;
    }

    // Section filter
    if (selectedSection !== 'all' && recipe.mainSection !== selectedSection) {
      return false;
    }

    // Video only filter
    if (onlyWithVideo && !extractYouTubeId(recipe.youtubeUrl)) {
      return false;
    }

    // Subcategory filter
    if (selectedSubCat !== 'all' && recipe.category !== selectedSubCat) {
      return false;
    }

    return true;
  });

  // Calculate distinct subcategories for current section
  const currentSectionRecipes = selectedSection === 'all'
    ? recipes
    : recipes.filter((r) => r.mainSection === selectedSection);

  const subCategories = Array.from(
    new Map(currentSectionRecipes.map((r) => [r.category, r.categoryName])).entries()
  );

  // Check locked status
  const isRecipeLocked = (index: number): boolean => {
    if (isAdmin) return false;
    if (subscription.isSubscribed) {
      if (subscription.scope && subscription.scope !== 'all') {
        const recipe = filteredRecipes[index];
        if (recipe && recipe.mainSection !== subscription.scope) {
          return true;
        }
      }
      return false;
    }
    if (!settings.requireSubscription) return false;
    return index >= settings.freeRecipesCount;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => {
          const locked = isRecipeLocked(index);
          return (
            <RecipeCard
              recipe={item}
              isLocked={locked}
              onPress={() => onSelectRecipe(item)}
              onLockedPress={onOpenActivationModal}
              onEditPress={isAdmin && onEditRecipeAdmin ? () => onEditRecipeAdmin(item) : undefined}
              isAdmin={isAdmin}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} colors={['#0284C7']} />
        }
        ListHeaderComponent={() => (
          <View style={styles.headerArea}>
            {/* Admin Command Bar if Admin */}
            {isAdmin && (
              <View style={styles.adminBar}>
                <View style={styles.adminBarLeft}>
                  <Ionicons name="shield-checkmark" size={18} color="#06B6D4" />
                  <Text style={styles.adminBarTitle}>وضع المدير نشط (mounirath1977@)</Text>
                </View>
                <View style={styles.adminBarButtons}>
                  {onAddNewRecipeAdmin && (
                    <TouchableOpacity
                      style={styles.adminAddBtn}
                      onPress={onAddNewRecipeAdmin}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.adminAddText}>إضافة وصفة</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.adminOpenPanelBtn}
                    onPress={onOpenAdminPanel}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="terminal-outline" size={15} color="#06B6D4" />
                    <Text style={styles.adminOpenPanelText}>لوحة التحكم</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Subscription Warning / Promo Banner for non-subscribed users */}
            {!subscription.isSubscribed && settings.requireSubscription && !isAdmin && (
              <View style={styles.promoBanner}>
                <View style={styles.promoIconCircle}>
                  <Ionicons name="key" size={24} color="#0284C7" />
                </View>
                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>المحتوى الكامل يتطلب تفعيل الاشتراك</Text>
                  <Text style={styles.promoSub}>
                    لديك {settings.freeRecipesCount} وصفات مجانية للمعاينة. أدخل كود الـ 8 خانات لفتح كافة الأسرار والفيديوهات.
                  </Text>
                  <TouchableOpacity
                    style={styles.promoBtn}
                    onPress={onOpenActivationModal}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                    <Text style={styles.promoBtnText}>إدخال كود التفعيل (8 خانات)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Subcategory Pills */}
            <View style={styles.subCatScrollWrapper}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[['all', 'كافة التصنيفات'], ...subCategories]}
                keyExtractor={(item) => item[0]}
                renderItem={({ item }) => {
                  const [catKey, catLabel] = item;
                  const isActive = selectedSubCat === catKey;
                  return (
                    <TouchableOpacity
                      style={[styles.subCatPill, isActive && styles.subCatPillActive]}
                      onPress={() => setSelectedSubCat(catKey)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.subCatText, isActive && styles.subCatTextActive]}>
                        {catLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.subCatList}
              />
            </View>

            {/* Results Counter */}
            <View style={styles.resultsCounterRow}>
              <Text style={styles.resultsCountText}>
                عرض {filteredRecipes.length} من أصل {recipes.length} تركيبة كيميائية
              </Text>
              {onlyWithVideo && (
                <View style={styles.filterActiveTag}>
                  <Ionicons name="logo-youtube" size={12} color="#EF4444" />
                  <Text style={styles.filterActiveText}>مرشح بالفيديو</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>لا توجد تركيبات تطابق بحثك</Text>
            <Text style={styles.emptySub}>جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerArea: {
    marginBottom: 12,
  },
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  adminBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBarTitle: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
  },
  adminBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  adminAddText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  adminOpenPanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  adminOpenPanelText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  promoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 12,
  },
  promoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
    textAlign: 'right',
  },
  promoSub: {
    fontSize: 12,
    color: '#0284C7',
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'right',
  },
  promoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  promoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subCatScrollWrapper: {
    marginBottom: 10,
  },
  subCatList: {
    gap: 6,
    paddingVertical: 4,
  },
  subCatPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subCatPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  subCatText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  subCatTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  resultsCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'right',
  },
  filterActiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  filterActiveText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});
