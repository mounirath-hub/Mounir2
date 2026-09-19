import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, ActivationCode, SubscriptionState, AdminSettings, ChemicalMaterial } from '../types';
import { INITIAL_RECIPES } from '../data/initialRecipes';
import { INITIAL_CODES } from '../data/initialCodes';
import { ADMIN_SECRET_KEY, createChemicalMaterial } from '../utils/codeGenerator';

const RECIPES_STORAGE_KEY = '@chemclean_recipes_v5';
const CODES_STORAGE_KEY = '@chemclean_codes_v5';
const SUBSCRIPTION_STORAGE_KEY = '@chemclean_subscription_v5';
const SETTINGS_STORAGE_KEY = '@chemclean_settings_v5';
const FAVORITES_STORAGE_KEY = '@chemclean_favorites_v5';
const MATERIALS_STORAGE_KEY = '@chemclean_materials_v5';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  requireSubscription: true,
  freeRecipesCount: 2,
  supportContact: '+966500000000',
  noticeBanner: 'مرحباً بك في المنصة الشاملة لتركيبات المنظفات الاحترافية (العناية بالسيارات والمنظفات المنزلية)',
};

const INITIAL_MATERIALS: ChemicalMaterial[] = [
  createChemicalMaterial('تكسابون 70%', 'Sodium Lauryl Ether Sulfate (SLES 70%)', 'surfactant', '70%', 'BASF Chem', 'مهيج للجلد', 'المادة الرغوية الأساسية لكافة الشامبوهات وسوائل الجلي', 'TX70N700'),
  createChemicalMaterial('كمبرلان CDE', 'Coconut Diethanolamide (Cocamide DEA)', 'surfactant', '85%', 'Galaxy Surfactants', 'آمن', 'معزز ومثبت للرغوة ومحسن للزوجة والنعومة', 'CDE98811'),
  createChemicalMaterial('بيتايين CAPB', 'Cocamidopropyl Betaine 30%', 'surfactant', '30%', 'Evonik', 'لطيف على الجلد', 'معزز رغوة ومخفض لحدة التكسابون ومثبت للفقاعات', 'BET30K9P'),
  createChemicalMaterial('مستحلب السيليكون 60%', 'Polydimethylsiloxane Emulsion 60%', 'emulsifier', '60%', 'Dow Corning', 'آمن', 'المكون السحري لتلميع الإطارات والتابلوه والطلاء', 'SIL60M77'),
  createChemicalMaterial('بروبيلين جليكول', 'Propylene Glycol (PG)', 'solvent', '99.5%', 'LyondellBasell', 'آمن غذائياً وصناعياً', 'مانع جفاف سريع، ومحسن انزلاق، ومضاد لتكلسات قطرات الماء', 'PG995K21'),
  createChemicalMaterial('كحول إيزوبروبيلي IPA', 'Isopropyl Alcohol 99%', 'solvent', '99.8%', 'Shell Chemicals', 'سريع الاشتعال', 'مذيب فائق السرعة للدهون وزجاج السيارات بدون ترك خطوط', 'IPA99800'),
  createChemicalMaterial('دي ليمونين d-Limonene', 'd-Limonene (Citrus Terpene)', 'solvent', '96%', 'Florida Citrus', 'قابل للاشتعال', 'مذيب طبيعي خارق لزفت الطرق والقطران والشحوم الصلبة', 'LIM96T22'),
  createChemicalMaterial('حمض الستريك', 'Citric Acid Anhydrous', 'acid_alkali', '99.8%', 'Jungbunzlauer', 'حمض عضوي آمن', 'لضبط درجة الحموضة pH وإزالة التكلسات والأملاح الكلسية', 'CIT99801'),
];

/* ---------------- RECIPES ---------------- */

export async function getStoredRecipes(): Promise<Recipe[]> {
  try {
    const json = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
    if (!json) {
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
      return INITIAL_RECIPES;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RECIPES;
  } catch (error) {
    console.error('Error reading recipes from storage:', error);
    return INITIAL_RECIPES;
  }
}

export async function saveRecipe(recipe: Recipe): Promise<Recipe[]> {
  const current = await getStoredRecipes();
  const index = current.findIndex((r) => String(r.id) === String(recipe.id));
  let updated: Recipe[];

  if (index !== -1) {
    updated = [...current];
    updated[index] = { ...recipe, updatedAt: new Date().toISOString() };
  } else {
    const newRecipe: Recipe = {
      ...recipe,
      id: recipe.id || Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updated = [newRecipe, ...current];
  }

  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function setAllStoredRecipes(recipes: Recipe[]): Promise<void> {
  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
}

export async function deleteRecipe(recipeId: number | string): Promise<Recipe[]> {
  const current = await getStoredRecipes();
  const updated = current.filter((r) => String(r.id) !== String(recipeId));
  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function restoreDefaultRecipes(): Promise<Recipe[]> {
  await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
  return INITIAL_RECIPES;
}

/* ---------------- ACTIVATION CODES ---------------- */

export async function getStoredCodes(): Promise<ActivationCode[]> {
  try {
    const json = await AsyncStorage.getItem(CODES_STORAGE_KEY);
    if (!json) {
      await AsyncStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(INITIAL_CODES));
      return INITIAL_CODES;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : INITIAL_CODES;
  } catch (error) {
    console.error('Error reading codes from storage:', error);
    return INITIAL_CODES;
  }
}

export async function saveActivationCodes(codes: ActivationCode[]): Promise<void> {
  await AsyncStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(codes));
}

export async function addActivationCode(code: ActivationCode): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = [code, ...current];
  await saveActivationCodes(updated);
  return updated;
}

export async function addMultipleCodes(codes: ActivationCode[]): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = [...codes, ...current];
  await saveActivationCodes(updated);
  return updated;
}

export async function toggleCodeRevoked(codeId: string): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = current.map((c) => {
    if (c.id === codeId) {
      const nextStatus = c.status === 'revoked' ? 'active' : 'revoked';
      return { ...c, status: nextStatus };
    }
    return c;
  });
  await saveActivationCodes(updated);
  return updated;
}

export async function deleteCode(codeId: string): Promise<ActivationCode[]> {
  const current = await getStoredCodes();
  const updated = current.filter((c) => c.id !== codeId);
  await saveActivationCodes(updated);
  return updated;
}

/* ---------------- SUBSCRIPTIONS ---------------- */

export async function getSubscriptionState(): Promise<SubscriptionState> {
  try {
    const json = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!json) {
      return {
        isSubscribed: false,
        activeCode: null,
        planName: null,
        expiresAt: null,
        isLifetime: false,
        activatedAt: null,
        scope: 'all',
      };
    }
    const parsed: SubscriptionState = JSON.parse(json);

    // Verify expiry if not lifetime
    if (parsed.isSubscribed && !parsed.isLifetime && parsed.expiresAt) {
      const expTime = new Date(parsed.expiresAt).getTime();
      if (Date.now() > expTime) {
        parsed.isSubscribed = false;
        await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    return parsed;
  } catch (error) {
    console.error('Error reading subscription state:', error);
    return {
      isSubscribed: false,
      activeCode: null,
      planName: null,
      expiresAt: null,
      isLifetime: false,
      activatedAt: null,
      scope: 'all',
    };
  }
}

export async function saveSubscriptionState(state: SubscriptionState): Promise<void> {
  await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
}

export async function activateUserSubscription(
  codeStr: string
): Promise<{ success: boolean; message: string; isAdminKey?: boolean; subscription?: SubscriptionState }> {
  const normalized = codeStr.trim();

  // Backdoor check for admin password in user input!
  if (normalized === ADMIN_SECRET_KEY) {
    return {
      success: false,
      isAdminKey: true,
      message: 'تم التعرف على كلمة مرور المدير! جاري فتح لوحة التحكم المخفية...',
    };
  }

  const upperCode = normalized.toUpperCase();

  if (upperCode.length !== 8) {
    return {
      success: false,
      message: 'يتكون كود التفعيل حصراً من 8 حروف لاتينية وأرقام صادر من الإدارة',
    };
  }

  const allCodes = await getStoredCodes();
  const targetIndex = allCodes.findIndex((c) => c.code.toUpperCase() === upperCode);

  if (targetIndex === -1) {
    return {
      success: false,
      message: 'الكود غير موجود في النظام. يرجى التأكد من كتابته بشكل صحيح أو التواصل مع الإدارة.',
    };
  }

  const targetCode = allCodes[targetIndex];

  if (targetCode.status === 'revoked') {
    return {
      success: false,
      message: 'هذا الكود تم إيقافه أو إلغاؤه من قبل الإدارة.',
    };
  }

  // Check usage limit
  if (targetCode.maxUses !== -1 && targetCode.timesUsed >= targetCode.maxUses) {
    return {
      success: false,
      message: 'تم استهلاك الحد الأقصى لاستخدام هذا الكود.',
    };
  }

  // Update times used
  const updatedCodes = [...allCodes];
  updatedCodes[targetIndex] = {
    ...targetCode,
    timesUsed: targetCode.timesUsed + 1,
  };
  await saveActivationCodes(updatedCodes);

  // Set subscription
  const now = new Date();
  const isLifetime = targetCode.plan === 'lifetime';
  let expiresAt: string | null = null;

  if (!isLifetime) {
    const exp = new Date(now.getTime() + targetCode.durationDays * 24 * 60 * 60 * 1000);
    expiresAt = exp.toISOString();
  }

  const newSubState: SubscriptionState = {
    isSubscribed: true,
    activeCode: targetCode.code,
    planName: targetCode.planName,
    expiresAt,
    isLifetime,
    activatedAt: now.toISOString(),
    scope: targetCode.categoryScope || 'all',
  };

  await saveSubscriptionState(newSubState);

  return {
    success: true,
    message: `تم تفعيل الاشتراك بنجاح! الخطة: ${targetCode.planName}`,
    subscription: newSubState,
  };
}

export async function cancelSubscription(): Promise<SubscriptionState> {
  const cleared: SubscriptionState = {
    isSubscribed: false,
    activeCode: null,
    planName: null,
    expiresAt: null,
    isLifetime: false,
    activatedAt: null,
    scope: 'all',
  };
  await saveSubscriptionState(cleared);
  return cleared;
}

/* ---------------- SETTINGS ---------------- */

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!json) return DEFAULT_ADMIN_SETTINGS;
    return JSON.parse(json);
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/* ---------------- FAVORITES ---------------- */

export async function getFavorites(): Promise<(number | string)[]> {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(recipeId: number | string): Promise<(number | string)[]> {
  const favs = await getFavorites();
  const exists = favs.some((id) => String(id) === String(recipeId));
  const updated = exists ? favs.filter((id) => String(id) !== String(recipeId)) : [...favs, recipeId];
  await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/* ---------------- CHEMICAL MATERIALS ---------------- */

export async function getStoredMaterials(): Promise<ChemicalMaterial[]> {
  try {
    const json = await AsyncStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!json) {
      await AsyncStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(INITIAL_MATERIALS));
      return INITIAL_MATERIALS;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : INITIAL_MATERIALS;
  } catch {
    return INITIAL_MATERIALS;
  }
}

export async function saveMaterial(mat: ChemicalMaterial): Promise<ChemicalMaterial[]> {
  const current = await getStoredMaterials();
  const index = current.findIndex((m) => m.id === mat.id);
  let updated: ChemicalMaterial[];
  if (index !== -1) {
    updated = [...current];
    updated[index] = mat;
  } else {
    updated = [mat, ...current];
  }
  await AsyncStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteMaterial(id: string): Promise<ChemicalMaterial[]> {
  const current = await getStoredMaterials();
  const updated = current.filter((m) => m.id !== id);
  await AsyncStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearStoredMaterials(): Promise<ChemicalMaterial[]> {
  await AsyncStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify([]));
  return [];
}
