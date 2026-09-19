import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, ActivationCode, ChemicalMaterial, SupabaseConfig } from '../types';

const SUPABASE_CONFIG_KEY = '@chemclean_supabase_config_v5';

// Default Supabase configuration derived from user project
export const DEFAULT_SUPABASE_URL = 'https://dvxrhkgloakisnvqoxgl.supabase.co';
// Default placeholder anon key (admin can paste their exact key in the admin panel)
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2eHJoa2dsb2FraXNudnFveGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4MTQ3MzksImV4cCI6MjAyNTM5MDczOX0.demo_placeholder_key';

let cachedClient: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

export async function getSupabaseConfig(): Promise<SupabaseConfig> {
  if (currentConfig) return currentConfig;
  try {
    const json = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
    if (json) {
      currentConfig = JSON.parse(json);
      return currentConfig!;
    }
  } catch (error) {
    console.warn('Could not read Supabase config from storage:', error);
  }

  currentConfig = {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isConnected: false,
    lastSyncAt: null,
    autoSync: false,
  };
  return currentConfig;
}

export async function saveSupabaseConfig(config: Partial<SupabaseConfig>): Promise<SupabaseConfig> {
  const existing = await getSupabaseConfig();
  const updated: SupabaseConfig = {
    ...existing,
    ...config,
  };

  currentConfig = updated;
  cachedClient = null; // reset client to re-init with new credentials
  await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(updated));
  return updated;
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;

  const config = await getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    cachedClient = createClient(config.url.trim(), config.anonKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

/**
 * Test connectivity with the configured Supabase project
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const startTime = Date.now();
  const config = await getSupabaseConfig();

  if (!config.url || !config.url.startsWith('https://')) {
    return {
      success: false,
      message: 'رابط مشروع Supabase غير صالح. يجب أن يبدأ بـ https://',
    };
  }

  try {
    const client = await getSupabaseClient();
    if (!client) {
      return { success: false, message: 'تعذر إنشاء عميل Supabase' };
    }

    // Try a simple ping / query to recipes table
    const { data, error } = await client.from('recipes').select('id').limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      // If table doesn't exist yet, but server responded (code 42P01 or similar)
      if (error.code === '42P01' || error.message.includes('relation "recipes" does not exist')) {
        await saveSupabaseConfig({ isConnected: true, lastSyncAt: new Date().toISOString() });
        return {
          success: true,
          latencyMs: latency,
          message: 'تم الاتصال بـ Supabase بنجاح! الجداول غير منشأة بعد (يرجى تنفيذ كود SQL المرفق).',
        };
      }

      // Check auth / invalid key
      if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('Invalid API key')) {
        await saveSupabaseConfig({ isConnected: false });
        return {
          success: false,
          latencyMs: latency,
          message: `خطأ في مفتاح Anon Key الخاص بـ Supabase: ${error.message}`,
        };
      }

      // Generic error from Supabase
      return {
        success: false,
        latencyMs: latency,
        message: `استجاب السيرفر مع خطأ: ${error.message} (${error.code || 'UNKNOWN'})`,
      };
    }

    await saveSupabaseConfig({ isConnected: true, lastSyncAt: new Date().toISOString() });
    return {
      success: true,
      latencyMs: latency,
      message: `تم الاتصال بنجاح بسحابة Supabase! زمن الاستجابة: ${latency}ms`,
    };
  } catch (err: any) {
    await saveSupabaseConfig({ isConnected: false });
    return {
      success: false,
      message: `فشل الاتصال بـ Supabase: ${err?.message || 'تأكد من اتصال الإنترنت وإعدادات المشروع'}`,
    };
  }
}

/**
 * Upload a single recipe to Supabase
 */
export async function uploadRecipeToSupabase(recipe: Recipe): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase client not initialized' };

    const payload = {
      id: String(recipe.id),
      slug: recipe.slug || `recipe-${recipe.id}`,
      main_section: recipe.mainSection,
      main_section_name: recipe.mainSectionName || (recipe.mainSection === 'car_care' ? 'قسم العناية بالسيارات' : 'قسم المنظفات المنزلية'),
      title: recipe.title,
      title_en: recipe.titleEn || null,
      category: recipe.category,
      category_name: recipe.categoryName,
      image_url: recipe.imageUrl,
      short_desc: recipe.shortDesc,
      badge: recipe.badge || null,
      ph_level: recipe.phLevel || null,
      ph_type: recipe.phType || 'neutral',
      difficulty: recipe.difficulty || 'سهل',
      preparation_time: recipe.preparationTime || null,
      curing_time: recipe.curingTime || null,
      appearance: recipe.appearance || null,
      ingredients: recipe.ingredients,
      preparation_steps: recipe.preparationSteps,
      safety_warnings: recipe.safetyWarnings,
      formulation_tips: recipe.formulationTips,
      usage_instructions: recipe.usageInstructions || null,
      recommended_packaging: recipe.recommendedPackaging || null,
      youtube_url: recipe.youtubeUrl || null,
      is_premium: recipe.isPremium ?? false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('recipes').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to upload recipe' };
  }
}

/**
 * Upload all recipes to Supabase (bulk / batch)
 */
export async function uploadAllRecipesToSupabase(recipes: Recipe[]): Promise<{
  success: boolean;
  uploadedCount: number;
  error?: string;
}> {
  try {
    const client = await getSupabaseClient();
    if (!client) return { success: false, uploadedCount: 0, error: 'عميل Supabase غير مهيأ' };

    const formatted = recipes.map((recipe) => ({
      id: String(recipe.id),
      slug: recipe.slug || `recipe-${recipe.id}`,
      main_section: recipe.mainSection,
      main_section_name: recipe.mainSectionName || (recipe.mainSection === 'car_care' ? 'قسم العناية بالسيارات' : 'قسم المنظفات المنزلية'),
      title: recipe.title,
      title_en: recipe.titleEn || null,
      category: recipe.category,
      category_name: recipe.categoryName,
      image_url: recipe.imageUrl,
      short_desc: recipe.shortDesc,
      badge: recipe.badge || null,
      ph_level: recipe.phLevel || null,
      ph_type: recipe.phType || 'neutral',
      difficulty: recipe.difficulty || 'سهل',
      preparation_time: recipe.preparationTime || null,
      curing_time: recipe.curingTime || null,
      appearance: recipe.appearance || null,
      ingredients: recipe.ingredients,
      preparation_steps: recipe.preparationSteps,
      safety_warnings: recipe.safetyWarnings,
      formulation_tips: recipe.formulationTips,
      usage_instructions: recipe.usageInstructions || null,
      recommended_packaging: recipe.recommendedPackaging || null,
      youtube_url: recipe.youtubeUrl || null,
      is_premium: recipe.isPremium ?? false,
      updated_at: new Date().toISOString(),
    }));

    // Upsert in batches of 20
    const batchSize = 20;
    for (let i = 0; i < formatted.length; i += batchSize) {
      const batch = formatted.slice(i, i + batchSize);
      const { error } = await client.from('recipes').upsert(batch, { onConflict: 'id' });
      if (error) throw error;
    }

    await saveSupabaseConfig({ lastSyncAt: new Date().toISOString(), isConnected: true });
    return { success: true, uploadedCount: formatted.length };
  } catch (err: any) {
    return { success: false, uploadedCount: 0, error: err?.message || 'فشلت المزامنة' };
  }
}

/**
 * Fetch recipes from Supabase
 */
export async function fetchRecipesFromSupabase(): Promise<{
  success: boolean;
  recipes?: Recipe[];
  error?: string;
}> {
  try {
    const client = await getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase client not initialized' };

    const { data, error } = await client
      .from('recipes')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, recipes: [] };
    }

    const parsed: Recipe[] = data.map((row: any) => ({
      id: isNaN(Number(row.id)) ? row.id : Number(row.id),
      slug: row.slug,
      mainSection: row.main_section,
      mainSectionName: row.main_section_name,
      title: row.title,
      titleEn: row.title_en,
      category: row.category,
      categoryName: row.category_name,
      imageUrl: row.image_url,
      shortDesc: row.short_desc,
      badge: row.badge,
      phLevel: row.ph_level,
      phType: row.ph_type,
      difficulty: row.difficulty,
      preparationTime: row.preparation_time,
      curingTime: row.curing_time,
      appearance: row.appearance,
      ingredients: row.ingredients || [],
      preparationSteps: row.preparation_steps || [],
      safetyWarnings: row.safety_warnings || [],
      formulationTips: row.formulation_tips || [],
      usageInstructions: row.usage_instructions,
      recommendedPackaging: row.recommended_packaging,
      youtubeUrl: row.youtube_url,
      isPremium: Boolean(row.is_premium),
      updatedAt: row.updated_at,
    }));

    await saveSupabaseConfig({ lastSyncAt: new Date().toISOString(), isConnected: true });
    return { success: true, recipes: parsed };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch recipes from Supabase' };
  }
}

/**
 * Sync activation codes to Supabase
 */
export async function uploadAllCodesToSupabase(codes: ActivationCode[]): Promise<{
  success: boolean;
  uploadedCount: number;
  error?: string;
}> {
  try {
    const client = await getSupabaseClient();
    if (!client) return { success: false, uploadedCount: 0, error: 'عميل Supabase غير مهيأ' };

    const formatted = codes.map((c) => ({
      id: c.id,
      code: c.code.toUpperCase(),
      plan: c.plan,
      plan_name: c.planName,
      duration_days: c.durationDays,
      status: c.status,
      max_uses: c.maxUses,
      times_used: c.timesUsed,
      notes: c.notes || null,
      category_scope: c.categoryScope || 'all',
      expires_at: c.expiresAt || null,
      created_at: c.createdAt,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('activation_codes').upsert(formatted, { onConflict: 'code' });
    if (error) throw error;

    await saveSupabaseConfig({ lastSyncAt: new Date().toISOString(), isConnected: true });
    return { success: true, uploadedCount: formatted.length };
  } catch (err: any) {
    return { success: false, uploadedCount: 0, error: err?.message || 'فشلت مزامنة الأكواد' };
  }
}

/**
 * Fetch codes from Supabase
 */
export async function fetchCodesFromSupabase(): Promise<{
  success: boolean;
  codes?: ActivationCode[];
  error?: string;
}> {
  try {
    const client = await getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase client not initialized' };

    const { data, error } = await client.from('activation_codes').select('*');
    if (error) throw error;

    const parsed: ActivationCode[] = (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      plan: row.plan,
      planName: row.plan_name,
      durationDays: row.duration_days,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      status: row.status,
      maxUses: row.max_uses,
      timesUsed: row.times_used || 0,
      notes: row.notes,
      categoryScope: row.category_scope || 'all',
    }));

    return { success: true, codes: parsed };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch codes' };
  }
}

/**
 * Generate complete ready-to-run Supabase PostgreSQL Schema DDL
 */
export function generateSupabaseSQL(): string {
  return `-- ===================================================================
-- ChemClean Database Schema for Supabase
-- الجداول الكاملة لتركيبات المنظفات والاشتراكات والمواد
-- ===================================================================

-- 1. جدول الوصفات الكيميائية (Recipes)
CREATE TABLE IF NOT EXISTS public.recipes (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE,
    main_section TEXT NOT NULL DEFAULT 'car_care',
    main_section_name TEXT,
    title TEXT NOT NULL,
    title_en TEXT,
    category TEXT NOT NULL,
    category_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    short_desc TEXT,
    badge TEXT,
    ph_level TEXT,
    ph_type TEXT DEFAULT 'neutral',
    difficulty TEXT DEFAULT 'سهل',
    preparation_time TEXT,
    curing_time TEXT,
    appearance TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    preparation_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    safety_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    formulation_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
    usage_instructions TEXT,
    recommended_packaging TEXT,
    youtube_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول أكواد التفعيل والاشتراكات (8 خانات)
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id TEXT PRIMARY KEY,
    code VARCHAR(8) UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'annual',
    plan_name TEXT NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 365,
    status TEXT NOT NULL DEFAULT 'active',
    max_uses INTEGER NOT NULL DEFAULT 1,
    times_used INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    category_scope TEXT DEFAULT 'all',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المواد الكيميائية الخام (8 خانات)
CREATE TABLE IF NOT EXISTS public.chemical_materials (
    id TEXT PRIMARY KEY,
    code VARCHAR(8) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    chemical_name TEXT NOT NULL,
    category TEXT NOT NULL,
    purity TEXT DEFAULT '99%',
    batch_number TEXT,
    supplier TEXT,
    hazard_class TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إتاحة صلاحيات القراءة العامة وتمكين RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemical_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Public Read Codes" ON public.activation_codes FOR SELECT USING (true);
CREATE POLICY "Public Read Materials" ON public.chemical_materials FOR SELECT USING (true);

CREATE POLICY "Admin Full Access Recipes" ON public.recipes FOR ALL USING (true);
CREATE POLICY "Admin Full Access Codes" ON public.activation_codes FOR ALL USING (true);
CREATE POLICY "Admin Full Access Materials" ON public.chemical_materials FOR ALL USING (true);
`;
}
