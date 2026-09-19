import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe } from '../types';
import { extractYouTubeId } from '../utils/youtube';

interface RecipeCardProps {
  recipe: Recipe;
  isLocked: boolean;
  onPress: () => void;
  onLockedPress: () => void;
  onEditPress?: () => void;
  isAdmin: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isLocked,
  onPress,
  onLockedPress,
  onEditPress,
  isAdmin,
}) => {
  const hasVideo = Boolean(extractYouTubeId(recipe.youtubeUrl));

  const handleCardPress = () => {
    if (isLocked && !isAdmin) {
      onLockedPress();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isLocked && !isAdmin && styles.cardLocked]}
      onPress={handleCardPress}
      activeOpacity={0.88}
    >
      {/* Image Banner */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80' }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />

        {/* Top Badges */}
        <View style={styles.badgesRow}>
          {hasVideo && (
            <View style={styles.videoBadge}>
              <Ionicons name="logo-youtube" size={13} color="#FFFFFF" />
              <Text style={styles.videoBadgeText}>فيديو</Text>
            </View>
          )}

          {recipe.badge ? (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>{recipe.badge}</Text>
            </View>
          ) : (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{recipe.categoryName}</Text>
            </View>
          )}
        </View>

        {/* Main section ribbon */}
        <View style={[styles.sectionRibbon, recipe.mainSection === 'car_care' ? styles.carRibbon : styles.homeRibbon]}>
          <Ionicons
            name={recipe.mainSection === 'car_care' ? 'car-sport' : 'home'}
            size={11}
            color="#FFFFFF"
          />
          <Text style={styles.sectionRibbonText}>
            {recipe.mainSection === 'car_care' ? 'سيارات' : 'منزلي'}
          </Text>
        </View>

        {/* Lock overlay if locked */}
        {isLocked && !isAdmin && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.lockTitle}>محتوى حصري</Text>
            <Text style={styles.lockSub}>اضغط لإدخال كود التفعيل المكون من 8 خانات</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title}
          </Text>
          {isAdmin && onEditPress && (
            <TouchableOpacity style={styles.adminEditBtn} onPress={onEditPress} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={16} color="#0284C7" />
            </TouchableOpacity>
          )}
        </View>

        {recipe.titleEn ? (
          <Text style={styles.titleEn} numberOfLines={1}>
            {recipe.titleEn}
          </Text>
        ) : null}

        <Text style={styles.desc} numberOfLines={2}>
          {recipe.shortDesc}
        </Text>

        {/* Chemical Specs Row */}
        <View style={styles.specsRow}>
          {recipe.phLevel ? (
            <View style={styles.specPill}>
              <Ionicons name="flask-outline" size={12} color="#0284C7" />
              <Text style={styles.specPillText}>pH: {recipe.phLevel.split('(')[0].trim()}</Text>
            </View>
          ) : null}

          <View style={styles.specPill}>
            <Ionicons name="list-outline" size={12} color="#10B981" />
            <Text style={styles.specPillText}>{recipe.ingredients.length} مواد</Text>
          </View>

          {recipe.preparationTime ? (
            <View style={styles.specPill}>
              <Ionicons name="time-outline" size={12} color="#F59E0B" />
              <Text style={styles.specPillText}>{recipe.preparationTime}</Text>
            </View>
          ) : null}

          {recipe.difficulty ? (
            <View style={styles.specPill}>
              <Ionicons name="speedometer-outline" size={12} color="#6366F1" />
              <Text style={styles.specPillText}>{recipe.difficulty}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Button Strip */}
        <View style={styles.actionStrip}>
          <View style={styles.actionPrompt}>
            <Text style={styles.actionPromptText}>
              {isLocked && !isAdmin ? 'فتح بالاشتراك' : 'عرض التركيبة وطريقة الخلط'}
            </Text>
            <Ionicons
              name={isLocked && !isAdmin ? 'key' : 'chevron-back'}
              size={15}
              color={isLocked && !isAdmin ? '#F59E0B' : '#0284C7'}
            />
          </View>

          {hasVideo && (
            <View style={styles.videoIndicator}>
              <Ionicons name="play" size={12} color="#EF4444" />
              <Text style={styles.videoIndicatorText}>فيديو داخل التطبيق</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLocked: {
    borderColor: '#CBD5E1',
    opacity: 0.96,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgesRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  customBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  customBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionRibbon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    zIndex: 2,
  },
  carRibbon: {
    backgroundColor: 'rgba(30, 58, 138, 0.9)',
  },
  homeRibbon: {
    backgroundColor: 'rgba(6, 95, 70, 0.9)',
  },
  sectionRibbonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 3,
  },
  lockIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  lockTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  lockSub: {
    color: '#CBD5E1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  adminEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleEn: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  desc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'right',
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  specPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoIndicatorText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
});
