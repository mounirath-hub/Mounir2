import { ActivationCode, SubscriptionPlan, ChemicalMaterial } from '../types';

export const ADMIN_SECRET_KEY = 'mounirath1977@';

// Latin uppercase characters and numbers (high readability)
const ALPHANUMERIC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ALL_LATIN_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate random 8-character string consisting of Latin letters and numbers
 */
export function generate8CharCode(useFullCharset: boolean = false): string {
  const chars = useFullCharset ? ALL_LATIN_ALPHANUMERIC : ALPHANUMERIC_CHARS;
  let result = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

/**
 * Generates an 8-character chemical material code (e.g. TX70K9M4, SLFN8X2P)
 */
export function generate8MaterialCode(prefix?: string): string {
  if (prefix && prefix.length <= 4) {
    const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const remaining = 8 - cleanPrefix.length;
    let code = cleanPrefix;
    for (let i = 0; i < remaining; i++) {
      code += ALPHANUMERIC_CHARS.charAt(Math.floor(Math.random() * ALPHANUMERIC_CHARS.length));
    }
    return code;
  }
  return generate8CharCode();
}

export function getPlanDetails(plan: SubscriptionPlan): { planName: string; durationDays: number } {
  switch (plan) {
    case 'trial':
      return { planName: 'تجريبي (7 أيام)', durationDays: 7 };
    case 'monthly':
      return { planName: 'شهري (30 يوم)', durationDays: 30 };
    case 'quarterly':
      return { planName: 'فصلي (3 أشهر)', durationDays: 90 };
    case 'annual':
    default:
      return { planName: 'سنوي (سنة كاملة)', durationDays: 365 };
    case 'lifetime':
      return { planName: 'مدى الحياة (وصول غير محدود)', durationDays: 99999 };
  }
}

export function createActivationCode(
  plan: SubscriptionPlan = 'annual',
  notes: string = '',
  maxUses: number = 1,
  categoryScope: 'all' | 'car_care' | 'household' = 'all',
  customCode?: string
): ActivationCode {
  // Ensure the code is exactly 8 characters Latin + digits
  let code: string;
  if (customCode && customCode.trim().length === 8) {
    code = customCode.trim().toUpperCase();
  } else {
    code = generate8CharCode();
  }

  const { planName, durationDays } = getPlanDetails(plan);
  const now = new Date();
  let expiresAt: string | undefined;

  if (plan !== 'lifetime') {
    const exp = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    expiresAt = exp.toISOString();
  }

  return {
    id: `code_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    code,
    plan,
    planName,
    durationDays,
    createdAt: now.toISOString(),
    expiresAt,
    status: 'active',
    maxUses,
    timesUsed: 0,
    notes: notes || 'تم الإنشاء بواسطة الإدارة',
    categoryScope,
  };
}

export function generateMultipleCodes(
  count: number,
  plan: SubscriptionPlan = 'annual',
  notes: string = '',
  maxUses: number = 1,
  categoryScope: 'all' | 'car_care' | 'household' = 'all'
): ActivationCode[] {
  const codes: ActivationCode[] = [];
  const existingSet = new Set<string>();

  for (let i = 0; i < count; i++) {
    let codeStr = generate8CharCode();
    while (existingSet.has(codeStr)) {
      codeStr = generate8CharCode();
    }
    existingSet.add(codeStr);

    codes.push(createActivationCode(plan, `${notes} #${i + 1}`, maxUses, categoryScope, codeStr));
  }

  return codes;
}

export function createChemicalMaterial(
  name: string,
  chemicalName: string,
  category: ChemicalMaterial['category'],
  purity: string = '99%',
  supplier: string = '',
  hazardClass?: string,
  notes?: string,
  customCode?: string
): ChemicalMaterial {
  const code = customCode && customCode.trim().length === 8
    ? customCode.trim().toUpperCase()
    : generate8MaterialCode(category.substring(0, 3).toUpperCase());

  return {
    id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    code,
    name,
    chemicalName,
    category,
    purity,
    batchNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier: supplier || 'مورد معتمد للصناعات الكيميائية',
    hazardClass,
    notes,
    createdAt: new Date().toISOString(),
  };
}
