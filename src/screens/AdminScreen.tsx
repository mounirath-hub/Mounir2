import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Recipe,
  ActivationCode,
  SubscriptionPlan,
  AdminSettings,
  ChemicalMaterial,
  SupabaseConfig,
  SubscriptionState,
} from '../types';
import {
  getStoredRecipes,
  saveRecipe,
  deleteRecipe,
  restoreDefaultRecipes,
  getStoredCodes,
  addActivationCode,
  addMultipleCodes,
  toggleCodeRevoked,
  deleteCode,
  getAdminSettings,
  saveAdminSettings,
  getSubscriptionState,
  activateUserSubscription,
  getStoredMaterials,
  saveMaterial,
  deleteMaterial,
} from '../services/storage';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  uploadAllRecipesToSupabase,
  fetchRecipesFromSupabase,
  uploadAllCodesToSupabase,
  generateSupabaseSQL,
} from '../services/supabase';
import {
  createActivationCode,
  generate8CharCode,
  generateMultipleCodes,
  createChemicalMaterial,
  ADMIN_SECRET_KEY,
} from '../utils/codeGenerator';
import { copyToClipboard } from '../utils/clipboard';
import { RecipeFormModal } from '../components/RecipeFormModal';
import { extractYouTubeId } from '../utils/youtube';

interface AdminScreenProps {
  onClose: () => void;
  onRefreshData: () => Promise<void>;
}

type AdminTab = 'generator' | 'codes' | 'recipes' | 'supabase' | 'settings';

export const AdminScreen: React.FC<AdminScreenProps> = ({ onClose, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('generator');

  // Data states
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [materials, setMaterials] = useState<ChemicalMaterial[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    requireSubscription: true,
    freeRecipesCount: 2,
    supportContact: '+966500000000',
    noticeBanner: '',
  });
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConnected: false,
    lastSyncAt: null,
    autoSync: false,
  });
  const [deviceSub, setDeviceSub] = useState<SubscriptionState>({
    isSubscribed: false,
    activeCode: null,
    planName: null,
    expiresAt: null,
    isLifetime: false,
    activatedAt: null,
  });

  // UI feedback & loading states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Generator Tab States
  const [genMode, setGenMode] = useState<'subscription' | 'material'>('subscription');
  const [genPlan, setGenPlan] = useState<SubscriptionPlan>('annual');
  const [genMaxUses, setGenMaxUses] = useState<number>(1);
  const [genScope, setGenScope] = useState<'all' | 'car_care' | 'household'>('all');
  const [genNotes, setGenNotes] = useState<string>('');
  const [custom8Code, setCustom8Code] = useState<string>('');
  const [lastGeneratedCode, setLastGeneratedCode] = useState<ActivationCode | null>(null);

  // Material Generator States
  const [matName, setMatName] = useState<string>('');
  const [matChemName, setMatChemName] = useState<string>('');
  const [matCategory, setMatCategory] = useState<ChemicalMaterial['category']>('surfactant');
  const [matPurity, setMatPurity] = useState<string>('99%');
  const [matSupplier, setMatSupplier] = useState<string>('');

  // Recipes Tab States
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [recipeSectionFilter, setRecipeSectionFilter] = useState<'all' | 'car_care' | 'household'>('all');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState<boolean>(false);

  // Codes Tab States
  const [codeSearch, setCodeSearch] = useState<string>('');
  const [codeStatusFilter, setCodeStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');

  // Supabase Tab States
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>('');
  const [showAnonKey, setShowAnonKey] = useState<boolean>(false);
  const [showSqlViewer, setShowSqlViewer] = useState<boolean>(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [r, c, m, s, sb, sub] = await Promise.all([
        getStoredRecipes(),
        getStoredCodes(),
        getStoredMaterials(),
        getAdminSettings(),
        getSupabaseConfig(),
        getSubscriptionState(),
      ]);

      setRecipes(r);
      setCodes(c);
      setMaterials(m);
      setSettings(s);
      setSupabaseConfigState(sb);
      setSupabaseUrlInput(sb.url);
      setSupabaseKeyInput(sb.anonKey);
      setDeviceSub(sub);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  /* ---------------- GENERATOR TAB ACTIONS ---------------- */

  const handleGenerateSingleCode = async () => {
    const newCode = createActivationCode(
      genPlan,
      genNotes.trim() || 'كود تفعيل 8 خانات تم إنشاؤه بواسطة الأدمن',
      genMaxUses,
      genScope,
      custom8Code.trim().length === 8 ? custom8Code.trim() : undefined
    );

    const updated = await addActivationCode(newCode);
    setCodes(updated);
    setLastGeneratedCode(newCode);
    setCustom8Code('');
    showToast(`تم إنشاء الكود ${newCode.code} (8 خانات) بنجاح!`);
    await onRefreshData();
  };

  const handleGenerateBatch = async (count: number) => {
    const newCodes = generateMultipleCodes(
      count,
      genPlan,
      genNotes.trim() || `دفعة ${count} أكواد`,
      genMaxUses,
      genScope
    );

    const updated = await addMultipleCodes(newCodes);
    setCodes(updated);
    setLastGeneratedCode(newCodes[0]);
    showToast(`تم توليد ${count} أكواد (8 خانات لكل كود) بنجاح!`);
    await onRefreshData();
  };

  const handleGenerateMaterial = async () => {
    if (!matName.trim()) {
      showToast('يرجى إدخال اسم المادة الكيميائية');
      return;
    }

    const newMat = createChemicalMaterial(
      matName.trim(),
      matChemName.trim() || matName.trim(),
      matCategory,
      matPurity,
      matSupplier.trim()
    );

    const updated = await saveMaterial(newMat);
    setMaterials(updated);
    setMatName('');
    setMatChemName('');
    showToast(`تم توليد كود المادة: ${newMat.code} (8 خانات)`);
  };

  const handleCopyCode = async (codeStr: string) => {
    const success = await copyToClipboard(codeStr);
    if (success) {
      showToast(`تم نسخ الكود ${codeStr} إلى الحافظة!`);
    }
  };

  const handleShareCode = async (codeObj: ActivationCode) => {
    const text = `مرحباً بك! إليك كود تفعيل اشتراكك في منصة كيم كلين للمنظفات:\n\n` +
      `🔑 *كود التفعيل (8 خانات):* ${codeObj.code}\n` +
      `📋 *الخطة:* ${codeObj.planName}\n` +
      `📅 *الصلاحية:* ${codeObj.durationDays > 1000 ? 'مدى الحياة' : `${codeObj.durationDays} يوم`}\n\n` +
      `أدخل الكود في التطبيق لفتح كافة التركيبات وفيديوهات التحضير مباشرة!`;

    try {
      await Share.share({ message: text });
    } catch {
      handleCopyCode(codeObj.code);
    }
  };

  const handleTestActivateDevice = async (codeStr: string) => {
    const res = await activateUserSubscription(codeStr);
    if (res.success && res.subscription) {
      setDeviceSub(res.subscription);
      showToast(`تم تفعيل اشتراك هذا الجهاز بنجاح بالكود ${codeStr}!`);
      await onRefreshData();
    } else {
      showToast(res.message);
    }
  };

  const handleToggleRevoke = async (codeId: string) => {
    const updated = await toggleCodeRevoked(codeId);
    setCodes(updated);
    showToast('تم تحديث حالة الكود!');
    await onRefreshData();
  };

  const handleDeleteCode = async (codeId: string) => {
    const updated = await deleteCode(codeId);
    setCodes(updated);
    showToast('تم حذف الكود');
    await onRefreshData();
  };

  /* ---------------- RECIPES TAB ACTIONS ---------------- */

  const handleOpenAddRecipe = () => {
    setEditingRecipe(null);
    setIsRecipeModalVisible(true);
  };

  const handleOpenEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsRecipeModalVisible(true);
  };

  const handleSaveRecipeModal = async (recipe: Recipe) => {
    setIsRecipeModalVisible(false);
    const updated = await saveRecipe(recipe);
    setRecipes(updated);
    showToast(`تم حفظ التركيبة: ${recipe.title}`);
    await onRefreshData();
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    const confirmDelete = () => {
      deleteRecipe(recipe.id).then((updated) => {
        setRecipes(updated);
        showToast(`تم حذف التركيبة: ${recipe.title}`);
        onRefreshData();
      });
    };

    if (Platform.OS === 'web') {
      if (confirm(`هل أنت متأكد من حذف الوصفة: ${recipe.title}؟`)) {
        confirmDelete();
      }
    } else {
      Alert.alert('تأكيد الحذف', `هل أنت متأكد من حذف وصفة: ${recipe.title}؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const handleDuplicateRecipe = async (recipe: Recipe) => {
    const duplicated: Recipe = {
      ...recipe,
      id: Date.now(),
      slug: `recipe-${Date.now()}`,
      title: `${recipe.title} (نسخة معدلة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = await saveRecipe(duplicated);
    setRecipes(updated);
    showToast('تم إنشاء نسخة من التركيبة بنجاح!');
    await onRefreshData();
  };

  const handleRestoreRecipes = async () => {
    const restore = async () => {
      const restored = await restoreDefaultRecipes();
      setRecipes(restored);
      showToast(`تمت استعادة كافة الوصفات الـ ${restored.length} الأصلية بنجاح!`);
      await onRefreshData();
    };

    if (Platform.OS === 'web') {
      if (confirm('هل ترغب باستعادة كافة الوصفات الأصلية الـ 36؟ لن تحذف وصفاتك المضافة.')) {
        restore();
      }
    } else {
      Alert.alert(
        'استعادة الوصفات الأصلية',
        'هل ترغب باستعادة كافة الوصفات الأصلية الـ 36؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'استعادة', onPress: restore },
        ]
      );
    }
  };

  /* ---------------- SUPABASE TAB ACTIONS ---------------- */

  const handleSaveSupabaseConfig = async () => {
    const updated = await saveSupabaseConfig({
      url: supabaseUrlInput.trim(),
      anonKey: supabaseKeyInput.trim(),
    });
    setSupabaseConfigState(updated);
    showToast('تم حفظ إعدادات Supabase بنجاح!');
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    // Save current inputs first
    await saveSupabaseConfig({
      url: supabaseUrlInput.trim(),
      anonKey: supabaseKeyInput.trim(),
    });

    const res = await testSupabaseConnection();
    setTestingConnection(false);
    setConnectionResult(res);

    if (res.success) {
      setSupabaseConfigState((prev) => ({ ...prev, isConnected: true, lastSyncAt: new Date().toISOString() }));
    }
  };

  const handleUploadRecipesToSupabase = async () => {
    setIsLoading(true);
    const res = await uploadAllRecipesToSupabase(recipes);
    setIsLoading(false);

    if (res.success) {
      showToast(`تم رفع ومزامنة ${res.uploadedCount} وصفة إلى Supabase بنجاح!`);
      setSupabaseConfigState((prev) => ({ ...prev, isConnected: true, lastSyncAt: new Date().toISOString() }));
    } else {
      showToast(`خطأ في رفع الوصفات: ${res.error}`);
    }
  };

  const handleFetchRecipesFromSupabase = async () => {
    setIsLoading(true);
    const res = await fetchRecipesFromSupabase();
    setIsLoading(false);

    if (res.success && res.recipes) {
      if (res.recipes.length > 0) {
        setRecipes(res.recipes);
        showToast(`تم سحب ${res.recipes.length} وصفة من Supabase بنجاح!`);
        await onRefreshData();
      } else {
        showToast('لم يتم العثور على وصفات في جدول Supabase. يمكنك رفع الوصفات أولاً.');
      }
    } else {
      showToast(`فشل سحب الوصفات: ${res.error}`);
    }
  };

  const handleUploadCodesToSupabase = async () => {
    setIsLoading(true);
    const res = await uploadAllCodesToSupabase(codes);
    setIsLoading(false);

    if (res.success) {
      showToast(`تمت مزامنة ${res.uploadedCount} كود تفعيل مع سحابة Supabase!`);
    } else {
      showToast(`خطأ في مزامنة الأكواد: ${res.error}`);
    }
  };

  const handleCopySqlSchema = async () => {
    const sql = generateSupabaseSQL();
    const success = await copyToClipboard(sql);
    if (success) {
      showToast('تم نسخ كود SQL الكامل لإنشاء جداول Supabase إلى الحافظة!');
    }
  };

  /* ---------------- SETTINGS TAB ACTIONS ---------------- */

  const handleSaveSettings = async () => {
    await saveAdminSettings(settings);
    showToast('تم حفظ إعدادات المنصة بنجاح!');
    await onRefreshData();
  };

  // Filtered lists for UI
  const filteredRecipes = recipes.filter((r) => {
    if (recipeSearch.trim()) {
      const q = recipeSearch.toLowerCase();
      const inTitle = r.title.toLowerCase().includes(q);
      const inTitleEn = !!r.titleEn && r.titleEn.toLowerCase().includes(q);
      const inCat = r.categoryName.toLowerCase().includes(q);
      if (!(inTitle || inTitleEn || inCat)) return false;
    }
    if (recipeSectionFilter !== 'all' && r.mainSection !== recipeSectionFilter) {
      return false;
    }
    return true;
  });

  const filteredCodes = codes.filter((c) => {
    if (codeSearch.trim()) {
      const q = codeSearch.toLowerCase();
      const inCode = c.code.toLowerCase().includes(q);
      const inNotes = !!c.notes && c.notes.toLowerCase().includes(q);
      const inPlan = c.planName.toLowerCase().includes(q);
      if (!(inCode || inNotes || inPlan)) return false;
    }
    if (codeStatusFilter !== 'all' && c.status !== codeStatusFilter) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <Ionicons name="information-circle" size={18} color="#06B6D4" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Top Command Bar */}
      <View style={styles.topBar}>
        <View style={styles.topInfo}>
          <View style={styles.shieldBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#06B6D4" />
          </View>
          <View>
            <Text style={styles.adminTitle}>لوحة التحكم المركزية - ChemClean Pro</Text>
            <View style={styles.authRow}>
              <View style={styles.activeDot} />
              <Text style={styles.adminKeyText}>المدير: {ADMIN_SECRET_KEY}</Text>
              {supabaseConfig.isConnected && (
                <View style={styles.cloudOnlineTag}>
                  <Ionicons name="cloud-done" size={12} color="#10B981" />
                  <Text style={styles.cloudOnlineText}>Supabase متصل</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 5 Command Navigation Tabs */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'generator' && styles.tabBtnActive]}
          onPress={() => setActiveTab('generator')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="barcode"
            size={16}
            color={activeTab === 'generator' ? '#06B6D4' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'generator' && styles.tabBtnTextActive]}>
            مولد المواد (8 خانات)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'codes' && styles.tabBtnActive]}
          onPress={() => setActiveTab('codes')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="key"
            size={16}
            color={activeTab === 'codes' ? '#06B6D4' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'codes' && styles.tabBtnTextActive]}>
            الاشتراكات ({codes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'recipes' && styles.tabBtnActive]}
          onPress={() => setActiveTab('recipes')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="flask"
            size={16}
            color={activeTab === 'recipes' ? '#06B6D4' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'recipes' && styles.tabBtnTextActive]}>
            الوصفات ({recipes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'supabase' && styles.tabBtnActive]}
          onPress={() => setActiveTab('supabase')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="cloud"
            size={16}
            color={activeTab === 'supabase' ? '#06B6D4' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'supabase' && styles.tabBtnTextActive]}>
            بيانات Supabase
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="settings-outline"
            size={16}
            color={activeTab === 'settings' ? '#06B6D4' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'settings' && styles.tabBtnTextActive]}>
            الإعدادات
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ========================================================== */}
        {/* TAB 1: GENERATOR (MOLAD MAWAD & CODES - 8 CHARACTERS)      */}
        {/* ========================================================== */}
        {activeTab === 'generator' && (
          <View>
            {/* Mode Switcher */}
            <View style={styles.genModeSwitcher}>
              <TouchableOpacity
                style={[styles.genModeBtn, genMode === 'subscription' && styles.genModeBtnActive]}
                onPress={() => setGenMode('subscription')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="key-outline"
                  size={16}
                  color={genMode === 'subscription' ? '#06B6D4' : '#64748B'}
                />
                <Text style={[styles.genModeText, genMode === 'subscription' && styles.genModeTextActive]}>
                  مولد أكواد الاشتراكات (8 خانات)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genModeBtn, genMode === 'material' && styles.genModeBtnActive]}
                onPress={() => setGenMode('material')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="flask-outline"
                  size={16}
                  color={genMode === 'material' ? '#06B6D4' : '#64748B'}
                />
                <Text style={[styles.genModeText, genMode === 'material' && styles.genModeTextActive]}>
                  مولد باركود المواد الكيميائية (8 خانات)
                </Text>
              </TouchableOpacity>
            </View>

            {genMode === 'subscription' ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="sparkles" size={20} color="#06B6D4" />
                  <Text style={styles.cardTitle}>مولد أكواد تفعيل الاشتراكات (8 حروف لاتينية وأرقام)</Text>
                </View>
                <Text style={styles.cardSub}>
                  ينشئ كوداً حصرياً مكوناً من 8 خانات بالضبط (A-Z و 0-9) يستخدمه العميل في واجهة التطبيق لفتح الوصفات والفيديوهات.
                </Text>

                {/* Plan Selection */}
                <Text style={styles.inputLabel}>نوع خطة الاشتراك والصلاحية:</Text>
                <View style={styles.plansGrid}>
                  {(
                    [
                      ['trial', 'تجريبي (7 أيام)'],
                      ['monthly', 'شهري (30 يوم)'],
                      ['quarterly', 'فصلي (3 أشهر)'],
                      ['annual', 'سنوي (سنة كاملة)'],
                      ['lifetime', 'مدى الحياة VIP'],
                    ] as [SubscriptionPlan, string][]
                  ).map(([pKey, pLabel]) => (
                    <TouchableOpacity
                      key={pKey}
                      style={[styles.planChip, genPlan === pKey && styles.planChipActive]}
                      onPress={() => setGenPlan(pKey)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.planChipText, genPlan === pKey && styles.planChipTextActive]}>
                        {pLabel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Max uses & scope */}
                <View style={styles.twoCols}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>الحد الأقصى للاستخدام:</Text>
                    <View style={styles.usesRow}>
                      {[1, 5, 10, -1].map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.usePill, genMaxUses === u && styles.usePillActive]}
                          onPress={() => setGenMaxUses(u)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.usePillText, genMaxUses === u && styles.usePillTextActive]}>
                            {u === -1 ? 'غير محدود' : `${u} أجهزة`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>نطاق الصلاحية:</Text>
                    <View style={styles.usesRow}>
                      {(
                        [
                          ['all', 'الكل'],
                          ['car_care', 'سيارات'],
                          ['household', 'منزلية'],
                        ] as const
                      ).map(([sKey, sLabel]) => (
                        <TouchableOpacity
                          key={sKey}
                          style={[styles.usePill, genScope === sKey && styles.usePillActive]}
                          onPress={() => setGenScope(sKey)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.usePillText, genScope === sKey && styles.usePillTextActive]}>
                            {sLabel}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Notes Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ملاحظات أو اسم العميل / المركز:</Text>
                  <TextInput
                    style={styles.darkInput}
                    value={genNotes}
                    onChangeText={setGenNotes}
                    placeholder="مثال: اشتراك ورشة الأمل للسيارات بالرياض"
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Custom 8-char Code Override */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>تخصيص كود 8 خانات يدوي (اختياري):</Text>
                  <TextInput
                    style={[styles.darkInput, styles.codeMonoInput]}
                    value={custom8Code}
                    onChangeText={(t) => setCustom8Code(t.toUpperCase())}
                    placeholder="اتركه فارغاً للتوليد العشوائي (8 خانات)"
                    placeholderTextColor="#64748B"
                    maxLength={8}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Action Generate Buttons */}
                <View style={styles.genBtnRow}>
                  <TouchableOpacity
                    style={styles.genPrimaryBtn}
                    onPress={handleGenerateSingleCode}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="flash" size={18} color="#0F172A" />
                    <Text style={styles.genPrimaryText}>توليد كود واحد (8 خانات)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.genBatchBtn}
                    onPress={() => handleGenerateBatch(5)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="layers-outline" size={16} color="#06B6D4" />
                    <Text style={styles.genBatchText}>دفعة 5 أكواد</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.genBatchBtn}
                    onPress={() => handleGenerateBatch(10)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="copy-outline" size={16} color="#06B6D4" />
                    <Text style={styles.genBatchText}>دفعة 10 أكواد</Text>
                  </TouchableOpacity>
                </View>

                {/* Last Generated Code Showcase Card */}
                {lastGeneratedCode && (
                  <View style={styles.showcaseCard}>
                    <View style={styles.showcaseTop}>
                      <View style={styles.showcaseBadge}>
                        <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                        <Text style={styles.showcaseBadgeText}>تم التوليد بنجاح</Text>
                      </View>
                      <Text style={styles.showcasePlan}>{lastGeneratedCode.planName}</Text>
                    </View>

                    <Text style={styles.showcaseBigCode}>{lastGeneratedCode.code}</Text>
                    <Text style={styles.showcaseMeta}>
                      8 حروف لاتينية وأرقام • الصلاحية: {lastGeneratedCode.durationDays > 1000 ? 'مدى الحياة' : `${lastGeneratedCode.durationDays} يوم`} • النطاق: {lastGeneratedCode.categoryScope === 'all' ? 'كافة التركيبات' : lastGeneratedCode.categoryScope}
                    </Text>

                    <View style={styles.showcaseActions}>
                      <TouchableOpacity
                        style={styles.showcaseActionBtn}
                        onPress={() => handleCopyCode(lastGeneratedCode.code)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="copy" size={15} color="#06B6D4" />
                        <Text style={styles.showcaseActionText}>نسخ الكود</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.showcaseActionBtn}
                        onPress={() => handleShareCode(lastGeneratedCode)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="logo-whatsapp" size={15} color="#22C55E" />
                        <Text style={styles.showcaseActionText}>مشاركة للعميل</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.showcaseActionBtn, styles.testActBtn]}
                        onPress={() => handleTestActivateDevice(lastGeneratedCode.code)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="phone-portrait-outline" size={15} color="#F59E0B" />
                        <Text style={styles.testActText}>تفعيل على هذا الجهاز</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* MODE 2: MATERIAL 8-CHAR CODES */
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="flask" size={20} color="#06B6D4" />
                  <Text style={styles.cardTitle}>مولد باركود ورموز المواد الكيميائية (8 خانات)</Text>
                </View>
                <Text style={styles.cardSub}>
                  توليد رموز تشغيلية وباركودات مكونة من 8 خانات لاتينية وأرقام لترميز المواد الخام وتتبع تشغيلات التصنيع (Batch Lots).
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>اسم المادة الكيميائية التجاري:</Text>
                  <TextInput
                    style={styles.darkInput}
                    value={matName}
                    onChangeText={setMatName}
                    placeholder="مثال: تكسابون 70%، سيليكون، كمبرلان..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.twoCols}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>الاسم العلمي / الكيميائي:</Text>
                    <TextInput
                      style={styles.darkInput}
                      value={matChemName}
                      onChangeText={setMatChemName}
                      placeholder="e.g. SLES 70%"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>درجة النقاوة التركيز:</Text>
                    <TextInput
                      style={styles.darkInput}
                      value={matPurity}
                      onChangeText={setMatPurity}
                      placeholder="70% أو 99%"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>اسم المصنع / المورد المعتمد:</Text>
                  <TextInput
                    style={styles.darkInput}
                    value={matSupplier}
                    onChangeText={setMatSupplier}
                    placeholder="مثال: سابك، باسف، إيفونيك، داو..."
                    placeholderTextColor="#64748B"
                  />
                </View>

                <TouchableOpacity
                  style={styles.genPrimaryBtn}
                  onPress={handleGenerateMaterial}
                  activeOpacity={0.85}
                >
                  <Ionicons name="qr-code-outline" size={18} color="#0F172A" />
                  <Text style={styles.genPrimaryText}>توليد رمز المادة الكيميائية (8 خانات)</Text>
                </TouchableOpacity>

                {/* Materials List */}
                <Text style={[styles.inputLabel, { marginTop: 20 }]}>
                  المواد الخام المسجلة ({materials.length}):
                </Text>
                {materials.map((m) => (
                  <View key={m.id} style={styles.materialRow}>
                    <View style={styles.matCodeBadge}>
                      <Text style={styles.matCodeText}>{m.code}</Text>
                    </View>
                    <View style={styles.matInfo}>
                      <Text style={styles.matName}>{m.name}</Text>
                      <Text style={styles.matSub}>
                        {m.chemicalName} • {m.purity} • {m.batchNumber}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCopyCode(m.code)}
                      style={styles.iconMiniBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={15} color="#06B6D4" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ========================================================== */}
        {/* TAB 2: SUBSCRIPTION CODES MANAGEMENT                       */}
        {/* ========================================================== */}
        {activeTab === 'codes' && (
          <View>
            {/* Stats Header */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{codes.length}</Text>
                <Text style={styles.statLabel}>إجمالي الأكواد</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#10B981' }]}>
                  {codes.filter((c) => c.status === 'active').length}
                </Text>
                <Text style={styles.statLabel}>أكواد نشطة</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#F59E0B' }]}>
                  {codes.reduce((acc, c) => acc + (c.timesUsed || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>مرات التفعيل</Text>
              </View>
            </View>

            {/* Search and Filters */}
            <View style={styles.searchBarDark}>
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                style={styles.searchDarkInput}
                value={codeSearch}
                onChangeText={setCodeSearch}
                placeholder="ابحث برمز الكود أو اسم العميل..."
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Filter pills */}
            <View style={styles.filterPillsRow}>
              {(['all', 'active', 'revoked'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusFilterPill, codeStatusFilter === st && styles.statusFilterPillActive]}
                  onPress={() => setCodeStatusFilter(st)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusFilterText,
                      codeStatusFilter === st && styles.statusFilterTextActive,
                    ]}
                  >
                    {st === 'all' ? 'كافة الأكواد' : st === 'active' ? 'النشطة فقط' : 'الموقوفة'}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.copyAllBtn}
                onPress={async () => {
                  const text = codes
                    .filter((c) => c.status === 'active')
                    .map((c) => `${c.code} (${c.planName})`)
                    .join('\n');
                  await copyToClipboard(text);
                  showToast('تم نسخ كافة الأكواد النشطة إلى الحافظة!');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={13} color="#06B6D4" />
                <Text style={styles.copyAllText}>نسخ النشطة</Text>
              </TouchableOpacity>
            </View>

            {/* Codes List */}
            {filteredCodes.map((codeObj) => {
              const isRevoked = codeObj.status === 'revoked';
              return (
                <View key={codeObj.id} style={[styles.codeCard, isRevoked && styles.codeCardRevoked]}>
                  <View style={styles.codeCardTop}>
                    <View style={styles.codeDisplay}>
                      <Text style={styles.codeText}>{codeObj.code}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isRevoked ? styles.badgeRevoked : styles.badgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isRevoked ? styles.textRevoked : styles.textActive,
                          ]}
                        >
                          {isRevoked ? 'موقوف' : 'نشط'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.codePlanBadge}>{codeObj.planName}</Text>
                  </View>

                  {codeObj.notes ? <Text style={styles.codeNotes}>{codeObj.notes}</Text> : null}

                  <View style={styles.codeMetaRow}>
                    <Text style={styles.codeMetaText}>
                      الاستخدام: {codeObj.timesUsed} / {codeObj.maxUses === -1 ? '∞' : codeObj.maxUses}
                    </Text>
                    {codeObj.expiresAt && (
                      <Text style={styles.codeMetaText}>
                        انتهاء: {new Date(codeObj.expiresAt).toLocaleDateString('ar-SA')}
                      </Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.codeActionsRow}>
                    <TouchableOpacity
                      style={styles.codeActionBtn}
                      onPress={() => handleCopyCode(codeObj.code)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={14} color="#06B6D4" />
                      <Text style={styles.codeActionText}>نسخ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.codeActionBtn}
                      onPress={() => handleShareCode(codeObj)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#22C55E" />
                      <Text style={styles.codeActionText}>واتساب</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.codeActionBtn}
                      onPress={() => handleTestActivateDevice(codeObj.code)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="flash-outline" size={14} color="#F59E0B" />
                      <Text style={styles.codeActionText}>تفعيل بجهازي</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.codeActionBtn, isRevoked && styles.btnReactivate]}
                      onPress={() => handleToggleRevoke(codeObj.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isRevoked ? 'play-outline' : 'pause-outline'}
                        size={14}
                        color={isRevoked ? '#10B981' : '#F59E0B'}
                      />
                      <Text
                        style={[
                          styles.codeActionText,
                          isRevoked && { color: '#10B981' },
                        ]}
                      >
                        {isRevoked ? 'تنشيط' : 'إيقاف'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.codeActionBtn, styles.btnDelete]}
                      onPress={() => handleDeleteCode(codeObj.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ========================================================== */}
        {/* TAB 3: RECIPES MANAGEMENT (ADD, EDIT, YOUTUBE)             */}
        {/* ========================================================== */}
        {activeTab === 'recipes' && (
          <View>
            {/* Top Add Recipe & Restore Buttons */}
            <View style={styles.recipesHeaderRow}>
              <TouchableOpacity
                style={styles.addNewRecipeBtn}
                onPress={handleOpenAddRecipe}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={18} color="#0F172A" />
                <Text style={styles.addNewRecipeText}>إضافة تركيبة كيميائية جديدة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={handleRestoreRecipes}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color="#94A3B8" />
                <Text style={styles.restoreText}>استعادة الـ 36 وصفة</Text>
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={styles.searchBarDark}>
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                style={styles.searchDarkInput}
                value={recipeSearch}
                onChangeText={setRecipeSearch}
                placeholder="ابحث بالاسم أو التصنيف..."
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Section tabs */}
            <View style={styles.filterPillsRow}>
              {(
                [
                  ['all', 'كافة التركيبات'],
                  ['car_care', 'سيارات فقط'],
                  ['household', 'منزلية فقط'],
                ] as const
              ).map(([sKey, sLabel]) => (
                <TouchableOpacity
                  key={sKey}
                  style={[
                    styles.statusFilterPill,
                    recipeSectionFilter === sKey && styles.statusFilterPillActive,
                  ]}
                  onPress={() => setRecipeSectionFilter(sKey)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusFilterText,
                      recipeSectionFilter === sKey && styles.statusFilterTextActive,
                    ]}
                  >
                    {sLabel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recipes List */}
            {filteredRecipes.map((recipe) => {
              const hasVideo = Boolean(extractYouTubeId(recipe.youtubeUrl));
              return (
                <View key={recipe.id} style={styles.recipeRowCard}>
                  <Image
                    source={{ uri: recipe.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' }}
                    style={styles.recipeThumb}
                    contentFit="cover"
                  />

                  <View style={styles.recipeMainInfo}>
                    <Text style={styles.recipeTitle} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <Text style={styles.recipeSub} numberOfLines={1}>
                      {recipe.categoryName} • {recipe.ingredients.length} مواد • pH: {recipe.phLevel}
                    </Text>

                    {/* YouTube status indicator */}
                    <View style={styles.recipeTagsRow}>
                      {hasVideo ? (
                        <View style={styles.ytOkTag}>
                          <Ionicons name="logo-youtube" size={12} color="#EF4444" />
                          <Text style={styles.ytOkText}>فيديو مدمج</Text>
                        </View>
                      ) : (
                        <View style={styles.ytMissingTag}>
                          <Ionicons name="videocam-off-outline" size={12} color="#64748B" />
                          <Text style={styles.ytMissingText}>بدون فيديو</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.recipeActionCol}>
                    <TouchableOpacity
                      style={styles.recipeEditBtn}
                      onPress={() => handleOpenEditRecipe(recipe)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create" size={16} color="#06B6D4" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.recipeDuplicateBtn}
                      onPress={() => handleDuplicateRecipe(recipe)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={16} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.recipeDeleteBtn}
                      onPress={() => handleDeleteRecipe(recipe)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ========================================================== */}
        {/* TAB 4: SUPABASE CLOUD SYNC & DATA                         */}
        {/* ========================================================== */}
        {activeTab === 'supabase' && (
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="cloud" size={22} color="#06B6D4" />
                <Text style={styles.cardTitle}>بيانات سحابة Supabase ومزامنة التركيبات</Text>
              </View>
              <Text style={styles.cardSub}>
                ربط التطبيق بقاعدة بيانات Supabase السحابية لإتاحة التحديث التلقائي للوصفات وأكواد التفعيل بدون الحاجة لإعادة نشر التطبيق.
              </Text>

              {/* Status Indicator */}
              <View
                style={[
                  styles.connectionStatusBox,
                  supabaseConfig.isConnected ? styles.connBoxOk : styles.connBoxOffline,
                ]}
              >
                <Ionicons
                  name={supabaseConfig.isConnected ? 'checkmark-circle' : 'cloud-offline'}
                  size={20}
                  color={supabaseConfig.isConnected ? '#10B981' : '#F59E0B'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.connStatusTitle}>
                    {supabaseConfig.isConnected
                      ? 'سحابة Supabase متصلة وجاهزة للمزامنة'
                      : 'الوضع المحلي نشط (AsyncStorage Fallback)'}
                  </Text>
                  {supabaseConfig.lastSyncAt && (
                    <Text style={styles.connStatusSub}>
                      آخر اتصال/مزامنة: {new Date(supabaseConfig.lastSyncAt).toLocaleString('ar-SA')}
                    </Text>
                  )}
                </View>
              </View>

              {/* Supabase URL Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رابط مشروع Supabase (Project URL):</Text>
                <TextInput
                  style={[styles.darkInput, styles.codeMonoInput]}
                  value={supabaseUrlInput}
                  onChangeText={setSupabaseUrlInput}
                  placeholder="https://dvxrhkgloakisnvqoxgl.supabase.co"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Supabase Anon Key Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithAction}>
                  <TouchableOpacity
                    onPress={() => setShowAnonKey(!showAnonKey)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toggleText}>{showAnonKey ? 'إخفاء المفتاح' : 'إظهار المفتاح'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.inputLabel}>مفتاح الـ Anon Key (الوصول العام):</Text>
                </View>
                <TextInput
                  style={[styles.darkInput, styles.codeMonoInput]}
                  value={supabaseKeyInput}
                  onChangeText={setSupabaseKeyInput}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showAnonKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Test Connection Button */}
              <View style={styles.genBtnRow}>
                <TouchableOpacity
                  style={[styles.genPrimaryBtn, { backgroundColor: '#06B6D4' }]}
                  onPress={handleTestConnection}
                  disabled={testingConnection}
                  activeOpacity={0.85}
                >
                  {testingConnection ? (
                    <ActivityIndicator size="small" color="#0F172A" />
                  ) : (
                    <>
                      <Ionicons name="pulse" size={18} color="#0F172A" />
                      <Text style={styles.genPrimaryText}>فحص واختبار الاتصال بالسحابة</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.genBatchBtn}
                  onPress={handleSaveSupabaseConfig}
                  activeOpacity={0.7}
                >
                  <Ionicons name="save-outline" size={16} color="#06B6D4" />
                  <Text style={styles.genBatchText}>حفظ الإعدادات</Text>
                </TouchableOpacity>
              </View>

              {/* Connection Test Result Box */}
              {connectionResult && (
                <View
                  style={[
                    styles.testResultBox,
                    connectionResult.success ? styles.testOk : styles.testFail,
                  ]}
                >
                  <Ionicons
                    name={connectionResult.success ? 'checkmark-circle' : 'alert-circle'}
                    size={18}
                    color={connectionResult.success ? '#10B981' : '#EF4444'}
                  />
                  <Text style={styles.testResultText}>{connectionResult.message}</Text>
                </View>
              )}

              {/* Cloud Sync Operations */}
              <Text style={[styles.inputLabel, { marginTop: 22 }]}>عمليات المزامنة السحابية:</Text>
              <View style={styles.syncButtonsCol}>
                <TouchableOpacity
                  style={styles.syncActionBtn}
                  onPress={handleUploadRecipesToSupabase}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload" size={18} color="#06B6D4" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.syncBtnTitle}>
                      رفع ومزامنة كافة الوصفات إلى Supabase ({recipes.length} وصفة)
                    </Text>
                    <Text style={styles.syncBtnSub}>
                      يرفع الوصفات الكيميائية بالفيديوهات والمكونات إلى جدول recipes في Supabase
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.syncActionBtn}
                  onPress={handleFetchRecipesFromSupabase}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-download" size={18} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.syncBtnTitle}>سحب الوصفات من سحابة Supabase</Text>
                    <Text style={styles.syncBtnSub}>
                      تحديث الوصفات المخزنة محلياً بآخر ما تم تعديله في Supabase
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.syncActionBtn}
                  onPress={handleUploadCodesToSupabase}
                  activeOpacity={0.8}
                >
                  <Ionicons name="key" size={18} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.syncBtnTitle}>
                      مزامنة أكواد الاشتراكات إلى Supabase ({codes.length} كود)
                    </Text>
                    <Text style={styles.syncBtnSub}>
                      تحديث جدول activation_codes لتصبح الأكواد مفعلة مركزياً على كافة الأجهزة
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* SQL Schema Viewer Section */}
              <View style={styles.sqlSection}>
                <View style={styles.sqlHeader}>
                  <TouchableOpacity
                    style={styles.sqlToggleBtn}
                    onPress={() => setShowSqlViewer(!showSqlViewer)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showSqlViewer ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#06B6D4"
                    />
                    <Text style={styles.sqlToggleText}>
                      {showSqlViewer ? 'إخفاء كود الـ SQL' : 'عرض كود SQL لإنشاء جداول Supabase'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sqlCopyBtn}
                    onPress={handleCopySqlSchema}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.sqlCopyText}>نسخ كود SQL</Text>
                  </TouchableOpacity>
                </View>

                {showSqlViewer && (
                  <View style={styles.sqlCodeBox}>
                    <Text style={styles.sqlCodeText}>{generateSupabaseSQL()}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================== */}
        {/* TAB 5: PLATFORM SETTINGS                                   */}
        {/* ========================================================== */}
        {activeTab === 'settings' && (
          <View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="settings" size={20} color="#06B6D4" />
                <Text style={styles.cardTitle}>إعدادات التطبيق وسياسات الوصول</Text>
              </View>

              {/* Require Subscription Switch */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>إلزام تفعيل الاشتراك للوصول الكامل</Text>
                  <Text style={styles.settingSub}>
                    عند التفعيل، يحتاج المستخدم لإدخال كود الـ 8 خانات لفتح كافة الوصفات بعد الوصفات المجانية
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    settings.requireSubscription ? styles.toggleOn : styles.toggleOff,
                  ]}
                  onPress={() =>
                    setSettings({ ...settings, requireSubscription: !settings.requireSubscription })
                  }
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      settings.requireSubscription ? styles.circleOn : styles.circleOff,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Free recipes count */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>عدد الوصفات المجانية للمعاينة:</Text>
                  <Text style={styles.settingSub}>عدد الوصفات المفتوحة للمستخدم قبل طلب كود التفعيل</Text>
                </View>
                <View style={styles.stepperWrap}>
                  {[0, 1, 2, 3, 5].map((cnt) => (
                    <TouchableOpacity
                      key={cnt}
                      style={[
                        styles.stepperBtn,
                        settings.freeRecipesCount === cnt && styles.stepperBtnActive,
                      ]}
                      onPress={() => setSettings({ ...settings, freeRecipesCount: cnt })}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.stepperText,
                          settings.freeRecipesCount === cnt && styles.stepperTextActive,
                        ]}
                      >
                        {cnt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Support contact */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رقم هاتف الدعم الفني / المبيعات:</Text>
                <TextInput
                  style={styles.darkInput}
                  value={settings.supportContact}
                  onChangeText={(t) => setSettings({ ...settings, supportContact: t })}
                  placeholder="+966..."
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Notice Banner */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>شريط التنبيه العام في أعلى التطبيق:</Text>
                <TextInput
                  style={[styles.darkInput, { height: 70 }]}
                  value={settings.noticeBanner}
                  onChangeText={(t) => setSettings({ ...settings, noticeBanner: t })}
                  placeholder="رسالة ترحيبية أو إعلان عن اشتراك..."
                  placeholderTextColor="#64748B"
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.genPrimaryBtn}
                onPress={handleSaveSettings}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#0F172A" />
                <Text style={styles.genPrimaryText}>حفظ إعدادات المنصة</Text>
              </TouchableOpacity>
            </View>

            {/* Device Subscription Info */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.cardTitle}>حالة هذا الجهاز الحالية</Text>
              <Text style={styles.cardSub}>
                الاشتراك: {deviceSub.isSubscribed ? `نشط (${deviceSub.planName})` : 'غير مشترك (وضع المعاينة)'}
              </Text>
              {deviceSub.activeCode && (
                <Text style={styles.cardSub}>الكود المستخدم: {deviceSub.activeCode}</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Recipe Form Modal */}
      <RecipeFormModal
        visible={isRecipeModalVisible}
        recipeToEdit={editingRecipe}
        onClose={() => setIsRecipeModalVisible(false)}
        onSave={handleSaveRecipeModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  toast: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#06B6D4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  adminTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  adminKeyText: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cloudOnlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  cloudOnlineText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: '#06B6D4',
  },
  tabBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  genModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  genModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  genModeBtnActive: {
    backgroundColor: '#1E293B',
  },
  genModeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  genModeTextActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'right',
  },
  cardSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'right',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
    textAlign: 'right',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  planChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  planChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06B6D4',
  },
  planChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  planChipTextActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  usesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  usePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  usePillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06B6D4',
  },
  usePillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  usePillTextActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  darkInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'right',
  },
  codeMonoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '700',
  },
  genBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  genPrimaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  genPrimaryText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  genBatchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  genBatchText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  showcaseCard: {
    backgroundColor: '#091322',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    alignItems: 'center',
  },
  showcaseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  showcaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showcaseBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  showcasePlan: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
  },
  showcaseBigCode: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 6,
  },
  showcaseMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 14,
    textAlign: 'center',
  },
  showcaseActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  showcaseActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  showcaseActionText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  testActBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  testActText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
  matCodeBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matCodeText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  matInfo: {
    flex: 1,
  },
  matName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  matSub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  iconMiniBtn: {
    padding: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#06B6D4',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  searchBarDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchDarkInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 8,
    textAlign: 'right',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  statusFilterPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusFilterPillActive: {
    backgroundColor: '#06B6D4',
  },
  statusFilterText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statusFilterTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  copyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  copyAllText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  codeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  codeCardRevoked: {
    opacity: 0.6,
    borderColor: '#334155',
  },
  codeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeRevoked: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textActive: {
    color: '#10B981',
  },
  textRevoked: {
    color: '#EF4444',
  },
  codePlanBadge: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  codeNotes: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 6,
    textAlign: 'right',
  },
  codeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  codeMetaText: {
    color: '#64748B',
    fontSize: 11,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 6,
    gap: 4,
  },
  codeActionText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  btnReactivate: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  btnDelete: {
    flex: 0.6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  recipesHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addNewRecipeBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  addNewRecipeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  restoreText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  recipeRowCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    gap: 10,
  },
  recipeThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  recipeMainInfo: {
    flex: 1,
  },
  recipeTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  recipeSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  recipeTagsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  ytOkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  ytOkText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  ytMissingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  ytMissingText: {
    color: '#64748B',
    fontSize: 10,
  },
  recipeActionCol: {
    flexDirection: 'column',
    gap: 6,
  },
  recipeEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeDuplicateBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
  },
  connBoxOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  connBoxOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  connStatusTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  connStatusSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  labelWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  toggleText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '600',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
  },
  testOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  testFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  testResultText: {
    color: '#F8FAFC',
    fontSize: 12,
    flex: 1,
  },
  syncButtonsCol: {
    gap: 8,
    marginTop: 8,
  },
  syncActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  syncBtnTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  syncBtnSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  sqlSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  sqlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sqlToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sqlToggleText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
  },
  sqlCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  sqlCopyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sqlCodeBox: {
    backgroundColor: '#050A14',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: 200,
  },
  sqlCodeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  settingTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  settingSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 3,
  },
  toggleOn: {
    backgroundColor: '#06B6D4',
  },
  toggleOff: {
    backgroundColor: '#334155',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  circleOn: {
    alignSelf: 'flex-end',
  },
  circleOff: {
    alignSelf: 'flex-start',
  },
  stepperWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepperBtnActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  stepperText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperTextActive: {
    color: '#0F172A',
  },
});
