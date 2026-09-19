import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { activateUserSubscription, cancelSubscription } from '../services/storage';
import { SubscriptionState } from '../types';

interface UserActivationModalProps {
  visible: boolean;
  currentSubscription: SubscriptionState;
  onClose: () => void;
  onSuccess: (updatedSub: SubscriptionState) => void;
  onAdminDetected: () => void;
}

export const UserActivationModal: React.FC<UserActivationModalProps> = ({
  visible,
  currentSubscription,
  onClose,
  onSuccess,
  onAdminDetected,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleActivate = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg('يرجى إدخال كود التفعيل المكون من 8 خانات');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await activateUserSubscription(trimmed);

      if (res.isAdminKey) {
        setLoading(false);
        setSuccessMsg(res.message);
        setTimeout(() => {
          setCode('');
          setSuccessMsg(null);
          onAdminDetected();
        }, 800);
        return;
      }

      if (res.success && res.subscription) {
        setLoading(false);
        setSuccessMsg(res.message);
        setTimeout(() => {
          setCode('');
          setSuccessMsg(null);
          onSuccess(res.subscription!);
        }, 1200);
      } else {
        setLoading(false);
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('حدث خطأ أثناء التحقق من الكود. يرجى المحاولة مجدداً.');
    }
  };

  const handleCancelSub = async () => {
    const cleared = await cancelSubscription();
    onSuccess(cleared);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="key" size={28} color="#0284C7" />
            </View>
            <Text style={styles.title}>تفعيل اشتراك المنظفات</Text>
            <Text style={styles.subtitle}>
              أدخل كود التفعيل المكون من 8 حروف وأرقام لاتينية لفتح كافة الوصفات والفيديوهات الحصرية
            </Text>
          </View>

          {/* Current Subscription Status if active */}
          {currentSubscription.isSubscribed && (
            <View style={styles.currentActiveBox}>
              <View style={styles.currentActiveTop}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.currentActiveTitle}>اشتراكك الحالي مفعّل</Text>
              </View>
              <Text style={styles.currentActivePlan}>الخطة: {currentSubscription.planName}</Text>
              {currentSubscription.activeCode && (
                <Text style={styles.currentActiveCode}>الكود النشط: {currentSubscription.activeCode}</Text>
              )}
              {currentSubscription.expiresAt && !currentSubscription.isLifetime && (
                <Text style={styles.currentActiveExp}>
                  ينتهي في: {new Date(currentSubscription.expiresAt).toLocaleDateString('ar-SA')}
                </Text>
              )}
              <TouchableOpacity style={styles.cancelSubBtn} onPress={handleCancelSub} activeOpacity={0.7}>
                <Text style={styles.cancelSubText}>إلغاء التفعيل والعودة للوضع الافتراضي</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Code Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>كود التفعيل (8 خانات حروف وأرقام):</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(t) => {
                  setCode(t);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                placeholder="أدخل كود الاشتراك الصادر من الإدارة (8 خانات)..."
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleActivate}
              />
              <Ionicons name="barcode-outline" size={24} color="#0284C7" />
            </View>
            <Text style={styles.charCountHint}>
              الرمز المدخل: {code.trim().toUpperCase()} ({code.trim().length} خانات)
            </Text>
          </View>

          {/* Success Message */}
          {successMsg && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* Error Message */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeText}>إغلاق</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.activateBtn, loading && styles.btnDisabled]}
              onPress={handleActivate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.activateText}>تفعيل الآن</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  currentActiveBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  currentActiveTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentActiveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  currentActivePlan: {
    fontSize: 12,
    color: '#166534',
    marginTop: 4,
    textAlign: 'right',
  },
  currentActiveCode: {
    fontSize: 11,
    color: '#166534',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
    textAlign: 'right',
  },
  currentActiveExp: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
    textAlign: 'right',
  },
  cancelSubBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  cancelSubText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    paddingRight: 10,
    textAlign: 'center',
    letterSpacing: 2,
  },
  charCountHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  samplesSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  samplesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'right',
  },
  samplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sampleChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  sampleCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 1,
  },
  sampleLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  closeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  activateBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  activateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
