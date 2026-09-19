import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeWatchUrl } from '../utils/youtube';

interface YouTubePlayerProps {
  url?: string | null;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  title,
  subtitle,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = extractYouTubeId(url);

  if (!url || !videoId) {
    return (
      <View style={styles.noVideoContainer}>
        <Ionicons name="videocam-outline" size={32} color="#94A3B8" />
        <Text style={styles.noVideoText}>لا يوجد فيديو توضيحي مرفق لهذه التركيبة حالياً</Text>
        <Text style={styles.noVideoSub}>يمكن للمدير إضافة رابط فيديو يوتيوب في أي وقت من لوحة التحكم</Text>
      </View>
    );
  }

  const thumbnailUrl = getYouTubeThumbnail(videoId);
  const watchUrl = getYouTubeWatchUrl(videoId);

  const handleOpenExternal = () => {
    Linking.openURL(watchUrl).catch((err) => {
      console.warn('Could not open YouTube link:', err);
    });
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.badge}>
            <Ionicons name="logo-youtube" size={16} color="#EF4444" />
            <Text style={styles.badgeText}>فيديو تحضير التركيبة</Text>
          </View>
          {title ? (
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.externalButton} onPress={handleOpenExternal} activeOpacity={0.7}>
          <Ionicons name="open-outline" size={15} color="#0284C7" />
          <Text style={styles.externalButtonText}>فتح في يوتيوب</Text>
        </TouchableOpacity>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Video Display Area */}
      <View style={styles.playerWrapper}>
        {isPlaying ? (
          Platform.OS === 'web' ? (
            <View style={styles.webFrameContainer}>
              {/* @ts-ignore - iframe in react-native-web */}
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={title || 'YouTube video'}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 14,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </View>
          ) : (
            // Native fallback view with direct open
            <TouchableOpacity style={styles.nativePlayPrompt} onPress={handleOpenExternal} activeOpacity={0.8}>
              <Ionicons name="play-circle" size={54} color="#EF4444" />
              <Text style={styles.nativePromptTitle}>جاري تشغيل الفيديو</Text>
              <Text style={styles.nativePromptSub}>اضغط للمشاهدة عبر تطبيق YouTube</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={styles.thumbnailContainer} onPress={() => setIsPlaying(true)} activeOpacity={0.88}>
            <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
            <View style={styles.playOverlay}>
              <View style={styles.playButtonCircle}>
                <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.playPromptText}>اضغط لتشغيل الفيديو مباشرة داخل التطبيق</Text>
              <View style={styles.timeTag}>
                <Ionicons name="videocam" size={13} color="#FFFFFF" />
                <Text style={styles.timeTagText}>HD 1080p</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer bar */}
      <View style={styles.footer}>
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.verifiedText}>خطوات كيميائية معتمدة ومطابقة لنسب التركيبة</Text>
        </View>

        {isPlaying && (
          <TouchableOpacity style={styles.stopButton} onPress={() => setIsPlaying(false)} activeOpacity={0.7}>
            <Ionicons name="stop-circle-outline" size={15} color="#94A3B8" />
            <Text style={styles.stopButtonText}>إيقاف العرض</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  compactContainer: {
    padding: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 5,
  },
  badgeText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  titleText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'right',
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  externalButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  webFrameContainer: {
    width: '100%',
    height: '100%',
  },
  nativePlayPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  nativePromptTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  nativePromptSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  thumbnailContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  playPromptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  timeTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  timeTagText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  verifiedText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stopButtonText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  noVideoContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  noVideoText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  noVideoSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
