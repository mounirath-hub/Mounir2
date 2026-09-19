export type MainSection = 'car_care' | 'household';

export interface Ingredient {
  name: string;
  chemicalName?: string;
  percentage: number;
  role: string;
}

export interface Recipe {
  id: number | string;
  slug?: string;
  mainSection: MainSection;
  mainSectionName?: string;
  sectionIndex?: number;
  title: string;
  titleEn?: string;
  category: string;
  categoryName: string;
  imageUrl: string;
  shortDesc: string;
  badge?: string;
  phLevel?: string;
  phType?: 'neutral' | 'acidic' | 'alkaline' | string;
  difficulty?: 'سهل' | 'متوسط' | 'متقدم' | string;
  preparationTime?: string;
  curingTime?: string;
  appearance?: string;
  ingredients: Ingredient[];
  preparationSteps: string[];
  safetyWarnings: string[];
  formulationTips: string[];
  usageInstructions?: string;
  recommendedPackaging?: string;
  isFeaturedPrompt?: boolean;
  youtubeUrl?: string;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriptionPlan = 'trial' | 'monthly' | 'quarterly' | 'annual' | 'lifetime';

export interface ActivationCode {
  id: string;
  code: string; // 8 characters Latin uppercase + digits
  plan: SubscriptionPlan;
  planName: string;
  durationDays: number;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'revoked' | 'expired';
  maxUses: number; // -1 for unlimited, or 1, 5, etc.
  timesUsed: number;
  notes?: string;
  categoryScope: 'all' | 'car_care' | 'household';
}

export interface SubscriptionState {
  isSubscribed: boolean;
  activeCode: string | null;
  planName: string | null;
  expiresAt: string | null;
  isLifetime: boolean;
  activatedAt: string | null;
  scope?: 'all' | 'car_care' | 'household';
}

export interface AdminSettings {
  requireSubscription: boolean;
  freeRecipesCount: number;
  supportContact: string;
  noticeBanner: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncAt: string | null;
  autoSync: boolean;
}

export interface ChemicalMaterial {
  id: string;
  code: string; // 8 Latin characters and digits e.g. TX70K9M4
  name: string;
  chemicalName: string;
  category: 'surfactant' | 'solvent' | 'acid_alkali' | 'emulsifier' | 'preservative' | 'fragrance' | 'other';
  purity: string;
  batchNumber: string;
  supplier: string;
  hazardClass?: string;
  notes?: string;
  createdAt: string;
}
