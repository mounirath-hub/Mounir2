import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SubscriptionState, MainSection } from '../types';

interface HeaderProps {
  subscription: SubscriptionState;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onOpenAdminPanel: () => void;
  onLogoutAdmin: () => void;
  onOpenUserActivation: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSection: 'all' | MainSection;
  onSelectSection: (section: 'all' | MainSection) => void;
  onlyWithVideo: boolean;
  onToggleOnlyWithVideo: () => void;
  recipesCount: number;
  carCareCount: number;
  householdCount: number;
  videoCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  subscription,
  isAdmin,
  onOpenAdminLogin,
  onOpenAdminPanel,
  onLogoutAdmin,
  onOpenUserActivation,
  searchQuery,
  onSearchChange,
  selectedSection,
  onSelectSection,
  onlyWithVideo,
  onToggleOnlyWithVideo,
  recipesCount,
  carCareCount,
  householdCount,
  videoCount,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="flask" size={20} color="#0284C7" />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>كيم كلين</Text>
              <View style={styles.tagV4}>
                <Text style={styles.tagV4Text}>Pro V5</Text>
              </View>
              <View style={styles.supabaseTag}>
                <Ionicons name="cloud-done" size={10} color="#0284C7" />
                <Text style={styles.supabaseTagText}>Supabase</Text>
              </View>
            </View>
            <Text style={styles.brandSub}>تركيبات المنظفات الاحترافية بالفيديو</Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.topActions}>
          {/* User Subscription Status */}
          <TouchableOpacity
            style={[styles.subPill, subscription.isSubscribed ? styles.subPillActive : styles.subPillInactive]}
            onPress={onOpenUserActivation}
            activeOpacity={0.7}
          >
            <Ionicons
              name={subscription.isSubscribed ? 'checkmark-circle' : 'key-outline'}
              size={14}
              color={subscription.isSubscribed ? '#15803D' : '#D97706'}
            />
            <Text
              style={[
                styles.subPillText,
                subscription.isSubscribed ? styles.subPillTextActive : styles.subPillTextInactive,
              ]}
            >
              {subscription.isSubscribed ? (subscription.isLifetime ? 'VIP دائم' : 'مشترك مفعّل') : 'تفعيل الكود (8 خانات)'}
            </Text>
          </TouchableOpacity>

          {/* Admin Control */}
          {isAdmin ? (
            <View style={styles.adminActiveGroup}>
              <TouchableOpacity
                style={styles.adminPanelBtn}
                onPress={onOpenAdminPanel}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={15} color="#06B6D4" />
                <Text style={styles.adminPanelText}>لوحة الأدمن</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminLogoutBtn} onPress={onLogoutAdmin} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.adminLoginBtn}
              onPress={onOpenAdminLogin}
              activeOpacity={0.7}
              accessibilityLabel="Admin Login"
            >
              <Ionicons name="shield-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="ابحث بالاسم، المادة الفعالة، تكسابون، سيليكون، ديسكول..."
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Section Tabs and Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, selectedSection === 'all' && styles.sectionTabActive]}
            onPress={() => onSelectSection('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTabText, selectedSection === 'all' && styles.sectionTabTextActive]}>
              الكل ({recipesCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionTab, selectedSection === 'car_care' && styles.sectionTabActive]}
            onPress={() => onSelectSection('car_care')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="car-sport"
              size={13}
              color={selectedSection === 'car_care' ? '#0284C7' : '#64748B'}
            />
            <Text style={[styles.sectionTabText, selectedSection === 'car_care' && styles.sectionTabTextActive]}>
              سيارات ({carCareCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionTab, selectedSection === 'household' && styles.sectionTabActive]}
            onPress={() => onSelectSection('household')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="home"
              size={13}
              color={selectedSection === 'household' ? '#0284C7' : '#64748B'}
            />
            <Text style={[styles.sectionTabText, selectedSection === 'household' && styles.sectionTabTextActive]}>
              منزلية ({householdCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Filter Toggle */}
        <TouchableOpacity
          style={[styles.videoToggleChip, onlyWithVideo && styles.videoToggleChipActive]}
          onPress={onToggleOnlyWithVideo}
          activeOpacity={0.7}
        >
          <Ionicons
            name="logo-youtube"
            size={14}
            color={onlyWithVideo ? '#FFFFFF' : '#EF4444'}
          />
          <Text style={[styles.videoToggleText, onlyWithVideo && styles.videoToggleTextActive]}>
            فيديو ({videoCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  tagV4: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagV4Text: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  supabaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 3,
  },
  supabaseTagText: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '700',
  },
  brandSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
  },
  subPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  subPillInactive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subPillTextActive: {
    color: '#15803D',
  },
  subPillTextInactive: {
    color: '#B45309',
  },
  adminActiveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminPanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  adminPanelText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  adminLogoutBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminLoginBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'right',
  },
  clearSearchBtn: {
    padding: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
    flex: 1,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  sectionTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionTabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  videoToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  videoToggleChipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  videoToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  videoToggleTextActive: {
    color: '#FFFFFF',
  },
});
