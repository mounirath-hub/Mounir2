import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  SafeAreaView,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe, SubscriptionState, AdminSettings, MainSection } from './src/types';
import {
  getStoredRecipes,
  getSubscriptionState,
  getAdminSettings,
  getFavorites,
  toggleFavorite,
  saveRecipe,
} from './src/services/storage';
import { extractYouTubeId } from './src/utils/youtube';
import { Header } from './src/components/Header';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { AdminLoginModal } from './src/components/AdminLoginModal';
import { UserActivationModal } from './src/components/UserActivationModal';
import { RecipeFormModal } from './src/components/RecipeFormModal';

export default function App() {
  // Preload icon fonts for web - required for icons to display correctly
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isSubscribed: false,
    activeCode: null,
    planName: null,
    expiresAt: null,
    isLifetime: false,
    activatedAt: null,
  });
  const [settings, setSettings] = useState<AdminSettings>({
    requireSubscription: true,
    freeRecipesCount: 2,
    supportContact: '+966500000000',
    noticeBanner: 'مرحباً بك في المنصة الشاملة لتركيبات المنظفات الاحترافية بالفيديو (السيارات والمنزلية)',
  });
  const [favorites, setFavorites] = useState<(number | string)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Navigation states
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);
  const [isQuickRecipeModalOpen, setIsQuickRecipeModalOpen] = useState<boolean>(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<'all' | MainSection>('all');
  const [onlyWithVideo, setOnlyWithVideo] = useState<boolean>(false);

  // Refresh all app data
  const refreshAppData = useCallback(async () => {
    try {
      const [storedRecipes, subState, adminSettings, favs] = await Promise.all([
        getStoredRecipes(),
        getSubscriptionState(),
        getAdminSettings(),
        getFavorites(),
      ]);

      setRecipes(storedRecipes);
      setSubscription(subState);
      setSettings(adminSettings);
      setFavorites(favs);

      // Refresh currently selected recipe if it was updated
      if (selectedRecipe) {
        const found = storedRecipes.find((r) => String(r.id) === String(selectedRecipe.id));
        if (found) setSelectedRecipe(found);
      }
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecipe]);

  useEffect(() => {
    refreshAppData();
  }, []);

  const totalWithVideoCount = recipes.filter((r) => Boolean(extractYouTubeId(r.youtubeUrl))).length;
  const carCareCount = recipes.filter((r) => r.mainSection === 'car_care').length;
  const householdCount = recipes.filter((r) => r.mainSection === 'household').length;

  const handleToggleFavorite = async (recipeId: number | string) => {
    const updated = await toggleFavorite(recipeId);
    setFavorites(updated);
  };

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsQuickRecipeModalOpen(true);
  };

  const handleAddNewRecipe = () => {
    setRecipeToEdit(null);
    setIsQuickRecipeModalOpen(true);
  };

  const handleSaveRecipeQuick = async (recipe: Recipe) => {
    setIsQuickRecipeModalOpen(false);
    const updated = await saveRecipe(recipe);
    setRecipes(updated);
    if (selectedRecipe && String(selectedRecipe.id) === String(recipe.id)) {
      setSelectedRecipe(recipe);
    }
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>جاري تحميل تركيبات كيم كلين...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isAdminPanelOpen ? 'light' : 'dark'} />

      <View style={styles.mainWrapper}>
        {/* View 1: Admin Panel Screen */}
        {isAdminPanelOpen ? (
          <AdminScreen
            onClose={() => setIsAdminPanelOpen(false)}
            onRefreshData={refreshAppData}
          />
        ) : selectedRecipe ? (
          /* View 2: Recipe Detail Screen */
          <RecipeDetailScreen
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            isAdmin={isAdmin}
            onEditRecipe={handleOpenEditRecipe}
            isFavorite={favorites.some((f) => String(f) === String(selectedRecipe.id))}
            onToggleFavorite={() => handleToggleFavorite(selectedRecipe.id)}
          />
        ) : (
          /* View 3: Catalog Home Screen */
          <View style={styles.catalogContainer}>
            <Header
              subscription={subscription}
              isAdmin={isAdmin}
              onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
              onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              onLogoutAdmin={() => {
                setIsAdmin(false);
                setIsAdminPanelOpen(false);
              }}
              onOpenUserActivation={() => setIsActivationModalOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              onlyWithVideo={onlyWithVideo}
              onToggleOnlyWithVideo={() => setOnlyWithVideo(!onlyWithVideo)}
              recipesCount={recipes.length}
              carCareCount={carCareCount}
              householdCount={householdCount}
              videoCount={totalWithVideoCount}
            />

            <HomeScreen
              recipes={recipes}
              subscription={subscription}
              settings={settings}
              isAdmin={isAdmin}
              onSelectRecipe={(recipe) => setSelectedRecipe(recipe)}
              onOpenActivationModal={() => setIsActivationModalOpen(true)}
              onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
              onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              onEditRecipeAdmin={handleOpenEditRecipe}
              onAddNewRecipeAdmin={handleAddNewRecipe}
              onRefresh={refreshAppData}
              searchQuery={searchQuery}
              selectedSection={selectedSection}
              onlyWithVideo={onlyWithVideo}
            />
          </View>
        )}
      </View>

      {/* Admin Login Modal (password: mounirath1977@) */}
      <AdminLoginModal
        visible={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          setIsAdminLoginOpen(false);
          setIsAdminPanelOpen(true);
        }}
      />

      {/* User Activation Modal (8-char codes or admin backdoor) */}
      <UserActivationModal
        visible={isActivationModalOpen}
        currentSubscription={subscription}
        onClose={() => setIsActivationModalOpen(false)}
        onSuccess={(updatedSub) => {
          setSubscription(updatedSub);
          setIsActivationModalOpen(false);
        }}
        onAdminDetected={() => {
          setIsAdmin(true);
          setIsActivationModalOpen(false);
          setIsAdminPanelOpen(true);
        }}
      />

      {/* Recipe Add/Edit Modal */}
      <RecipeFormModal
        visible={isQuickRecipeModalOpen}
        recipeToEdit={recipeToEdit}
        onClose={() => setIsQuickRecipeModalOpen(false)}
        onSave={handleSaveRecipeQuick}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  catalogContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#0284C7',
    fontWeight: '700',
  },
});
