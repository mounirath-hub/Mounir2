import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe } from '../types';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { BatchCalculator } from '../components/BatchCalculator';
import { extractYouTubeId } from '../utils/youtube';

interface RecipeDetailScreenProps {
  recipe: Recipe;
  onBack: () => void;
  isAdmin: boolean;
  onEditRecipe: (recipe: Recipe) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({
  recipe,
  onBack,
  isAdmin,
  onEditRecipe,
  isFavorite,
  onToggleFavorite,
}) => {
  // Step check tracking
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleShare = async () => {
    try {
      const ingredientsText = recipe.ingredients
        .map((ing) => `- ${ing.name}: ${ing.percentage}% (${ing.role})`)
        .join('\n');

      const message = `🧪 *تركيبة منظف: ${recipe.title}*\n` +
        (recipe.titleEn ? `(${recipe.titleEn})\n\n` : '\n') +
        `📝 *النسب الكيميائية:*\n${ingredientsText}\n\n` +
        (recipe.youtubeUrl ? `🎥 *فيديو التحضير والمزج المباشر:* ${recipe.youtubeUrl}\n\n` : '') +
        `✅ عبر تطبيق كيم كلين لتركيبات المنظفات الاحترافية.`;

      await Share.share({ message });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const hasVideo = Boolean(extractYouTubeId(recipe.youtubeUrl));

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-forward" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          {recipe.title}
        </Text>

        <View style={styles.navActions}>
          <TouchableOpacity style={styles.navBtn} onPress={onToggleFavorite} activeOpacity={0.7}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#EF4444' : '#64748B'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={20} color="#0284C7" />
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={[styles.navBtn, styles.editNavBtn]}
              onPress={() => onEditRecipe(recipe)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={20} color="#06B6D4" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: recipe.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />

          {/* Badges on Hero */}
          <View style={styles.heroBadgesRow}>
            {hasVideo && (
              <View style={styles.heroVideoBadge}>
                <Ionicons name="logo-youtube" size={14} color="#FFFFFF" />
                <Text style={styles.heroVideoBadgeText}>فيديو مدمج</Text>
              </View>
            )}

            {recipe.badge ? (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{recipe.badge}</Text>
              </View>
            ) : null}

            <View style={styles.heroCategoryBadge}>
              <Text style={styles.heroCategoryText}>{recipe.categoryName}</Text>
            </View>
          </View>

          {/* Hero Titles */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
            {recipe.titleEn ? <Text style={styles.heroTitleEn}>{recipe.titleEn}</Text> : null}
          </View>
        </View>

        {/* Short Description */}
        <View style={styles.descCard}>
          <Text style={styles.descText}>{recipe.shortDesc}</Text>
        </View>

        {/* IN-APP YOUTUBE PLAYER - HIGHLIGHTED REQUIREMENT */}
        <View style={styles.sectionCard}>
          <YouTubePlayer
            url={recipe.youtubeUrl}
            title={`فيديو تحضير: ${recipe.title}`}
            subtitle="شاهد خطوات وزن ومزج المواد الكيميائية بالترتيب الدقيق في الفيديو المباشر أدناه"
          />
          {!hasVideo && isAdmin && (
            <TouchableOpacity
              style={styles.addVideoPromptBtn}
              onPress={() => onEditRecipe(recipe)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-youtube" size={18} color="#EF4444" />
              <Text style={styles.addVideoPromptText}>أنت في وضع المدير: اضغط هنا لإضافة فيديو يوتيوب لهذه الوصفة</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Specs Overview Grid */}
        <View style={styles.specsGrid}>
          {recipe.phLevel ? (
            <View style={styles.specCard}>
              <Ionicons name="flask-outline" size={20} color="#0284C7" />
              <Text style={styles.specLabel}>درجة الـ pH</Text>
              <Text style={styles.specValue}>{recipe.phLevel}</Text>
            </View>
          ) : null}

          {recipe.difficulty ? (
            <View style={styles.specCard}>
              <Ionicons name="speedometer-outline" size={20} color="#6366F1" />
              <Text style={styles.specLabel}>مستوى الصعوبة</Text>
              <Text style={styles.specValue}>{recipe.difficulty}</Text>
            </View>
          ) : null}

          {recipe.preparationTime ? (
            <View style={styles.specCard}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <Text style={styles.specLabel}>مدة التحضير</Text>
              <Text style={styles.specValue}>{recipe.preparationTime}</Text>
            </View>
          ) : null}

          {recipe.curingTime ? (
            <View style={styles.specCard}>
              <Ionicons name="hourglass-outline" size={20} color="#10B981" />
              <Text style={styles.specLabel}>مدة التعتيق</Text>
              <Text style={styles.specValue}>{recipe.curingTime}</Text>
            </View>
          ) : null}
        </View>

        {/* Appearance if present */}
        {recipe.appearance ? (
          <View style={styles.appearanceCard}>
            <Ionicons name="color-palette-outline" size={18} color="#0284C7" />
            <View style={styles.appearanceContent}>
              <Text style={styles.appearanceLabel}>المظهر والقوام النهائي:</Text>
              <Text style={styles.appearanceText}>{recipe.appearance}</Text>
            </View>
          </View>
        ) : null}

        {/* BATCH CALCULATOR */}
        <BatchCalculator ingredients={recipe.ingredients} />

        {/* Ingredients Detailed Table */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="beaker-outline" size={20} color="#0284C7" />
            <Text style={styles.sectionTitle}>المكونات والنسب الكيميائية (Formulation)</Text>
          </View>

          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={styles.thName}>المادة الكيميائية</Text>
              <Text style={styles.thRole}>الوظيفة الكيميائية</Text>
              <Text style={styles.thPct}>النسبة %</Text>
            </View>

            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <View style={styles.tdName}>
                  <Text style={styles.ingNameMain}>{ing.name}</Text>
                  {ing.chemicalName ? (
                    <Text style={styles.ingNameChem}>{ing.chemicalName}</Text>
                  ) : null}
                </View>
                <Text style={styles.tdRole}>{ing.role}</Text>
                <View style={styles.pctBadge}>
                  <Text style={styles.pctText}>{ing.percentage}%</Text>
                </View>
              </View>
            ))}

            <View style={styles.tableFooter}>
              <Text style={styles.footerLabel}>إجمالي النسب الكيميائية:</Text>
              <Text style={styles.footerVal}>
                {recipe.ingredients.reduce((acc, curr) => acc + curr.percentage, 0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Preparation Steps with Checkboxes */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="list-circle-outline" size={22} color="#0284C7" />
            <Text style={styles.sectionTitle}>خطوات التصنيع والمزج المباشر</Text>
          </View>
          <Text style={styles.stepsHint}>اضغط على الخطوة لتأشيرها عند إتمامها أثناء العمل المخبري</Text>

          {recipe.preparationSteps.map((step, idx) => {
            const isDone = Boolean(completedSteps[idx]);
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.stepItem, isDone && styles.stepItemDone]}
                onPress={() => toggleStep(idx)}
                activeOpacity={0.7}
              >
                <View style={[styles.stepCheckCircle, isDone && styles.stepCheckCircleDone]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepIndexNum}>{idx + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepText, isDone && styles.stepTextDone]}>{step}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Formulation Tips */}
        {recipe.formulationTips && recipe.formulationTips.length > 0 && (
          <View style={[styles.sectionCard, styles.tipsCard]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: '#B45309' }]}>
                أسرار التركيب الكيميائي وتوجيهات الخبراء
              </Text>
            </View>

            {recipe.formulationTips.map((tip, idx) => (
              <View key={idx} style={styles.tipItem}>
                <Ionicons name="sparkles" size={14} color="#F59E0B" style={{ marginTop: 2 }} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Safety Warnings */}
        {recipe.safetyWarnings && recipe.safetyWarnings.length > 0 && (
          <View style={[styles.sectionCard, styles.safetyCard]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-alert" size={20} color="#DC2626" />
              <Text style={[styles.sectionTitle, { color: '#991B1B' }]}>
                تحذيرات الأمان والسلامة المهنية
              </Text>
            </View>

            {recipe.safetyWarnings.map((warn, idx) => (
              <View key={idx} style={styles.safetyItem}>
                <Ionicons name="warning-outline" size={16} color="#DC2626" style={{ marginTop: 2 }} />
                <Text style={styles.safetyText}>{warn}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Usage & Packaging */}
        {(recipe.usageInstructions || recipe.recommendedPackaging) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cube-outline" size={20} color="#0284C7" />
              <Text style={styles.sectionTitle}>طريقة الاستخدام والتعبئة والتغليف</Text>
            </View>

            {recipe.usageInstructions ? (
              <View style={styles.infoBlock}>
                <Text style={styles.infoBlockTitle}>طريقة الاستخدام والتخفيف:</Text>
                <Text style={styles.infoBlockText}>{recipe.usageInstructions}</Text>
              </View>
            ) : null}

            {recipe.recommendedPackaging ? (
              <View style={styles.infoBlock}>
                <Text style={styles.infoBlockTitle}>العبوات الموصى بها:</Text>
                <Text style={styles.infoBlockText}>{recipe.recommendedPackaging}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Bottom Share Bar */}
        <TouchableOpacity style={styles.bottomShareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-social" size={18} color="#FFFFFF" />
          <Text style={styles.bottomShareText}>مشاركة هذه التركيبة مع الزملاء</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editNavBtn: {
    backgroundColor: '#0F172A',
  },
  navTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  heroBadgesRow: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  heroVideoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  heroVideoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  heroCategoryBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroCategoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    left: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'right',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroTitleEn: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
  descCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    textAlign: 'right',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  specCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
    textAlign: 'center',
  },
  appearanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  appearanceContent: {
    flex: 1,
  },
  appearanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    textAlign: 'right',
  },
  appearanceText: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
    textAlign: 'right',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addVideoPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 8,
  },
  addVideoPromptText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
  },
  tableWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thName: {
    flex: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },
  thRole: {
    flex: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },
  thPct: {
    width: 60,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tdName: {
    flex: 2,
  },
  ingNameMain: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
  },
  ingNameChem: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'right',
  },
  tdRole: {
    flex: 2,
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
    paddingRight: 6,
  },
  pctBadge: {
    width: 60,
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  footerVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  stepsHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'right',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  stepItemDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepCheckCircleDone: {
    backgroundColor: '#10B981',
  },
  stepIndexNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 20,
    textAlign: 'right',
  },
  stepTextDone: {
    color: '#166534',
    textDecorationLine: 'line-through',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 19,
    textAlign: 'right',
  },
  safetyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 19,
    textAlign: 'right',
  },
  infoBlock: {
    marginBottom: 10,
  },
  infoBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    textAlign: 'right',
  },
  infoBlockText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'right',
  },
  bottomShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  bottomShareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
