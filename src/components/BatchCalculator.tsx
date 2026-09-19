import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Ingredient } from '../types';

interface BatchCalculatorProps {
  ingredients: Ingredient[];
}

const PRESET_BATCHES = [
  { label: '1 كجم (تجربة مخبرية)', value: 1, unit: 'كجم' },
  { label: '5 كجم (جالون منزلي)', value: 5, unit: 'كجم' },
  { label: '20 كجم (برميل صغير)', value: 20, unit: 'كجم' },
  { label: '100 كجم (دفعة مصنع)', value: 100, unit: 'كجم' },
  { label: '1,000 كجم (طن صناعي)', value: 1000, unit: 'كجم' },
];

export const BatchCalculator: React.FC<BatchCalculatorProps> = ({ ingredients }) => {
  const [selectedBatch, setSelectedBatch] = useState<number>(100);
  const [customInput, setCustomInput] = useState<string>('100');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const batchWeightKg = isCustom ? parseFloat(customInput) || 1 : selectedBatch;

  const formatAmount = (percentage: number, totalKg: number): string => {
    const rawKg = (percentage / 100) * totalKg;
    if (rawKg < 1) {
      const grams = Math.round(rawKg * 1000 * 10) / 10;
      return `${grams} جرام`;
    }
    const formatted = Math.round(rawKg * 100) / 100;
    return `${formatted} كجم`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="calculator" size={18} color="#0284C7" />
        </View>
        <View style={styles.headerTitles}>
          <Text style={styles.title}>حاسبة أوزان الخلطات الصناعية</Text>
          <Text style={styles.subtitle}>حدد حجم الدفعة المطلوبة لحساب وزن كل مادة كيميائية بدقة</Text>
        </View>
      </View>

      {/* Preset Buttons */}
      <View style={styles.presetsGrid}>
        {PRESET_BATCHES.map((preset) => {
          const isActive = !isCustom && selectedBatch === preset.value;
          return (
            <TouchableOpacity
              key={preset.value}
              style={[styles.presetChip, isActive && styles.presetChipActive]}
              onPress={() => {
                setSelectedBatch(preset.value);
                setCustomInput(String(preset.value));
                setIsCustom(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, isActive && styles.presetTextActive]}>{preset.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Input */}
      <View style={styles.customRow}>
        <Text style={styles.customLabel}>أو أدخل وزناً مخصصاً:</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.customInput}
            value={customInput}
            onChangeText={(txt) => {
              setCustomInput(txt);
              setIsCustom(true);
            }}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.unitSuffix}>كجم / لتر</Text>
        </View>
      </View>

      {/* Calculated Results Table */}
      <View style={styles.resultsCard}>
        <View style={styles.resultsHeader}>
          <Text style={styles.colName}>المادة الكيميائية</Text>
          <Text style={styles.colPct}>النسبة %</Text>
          <Text style={styles.colWeight}>الوزن لـ ({batchWeightKg} كجم)</Text>
        </View>

        {ingredients.map((ing, idx) => (
          <View key={idx} style={[styles.resultRow, idx % 2 === 1 && styles.resultRowAlt]}>
            <View style={styles.nameBlock}>
              <Text style={styles.ingName}>{ing.name}</Text>
              {ing.chemicalName ? <Text style={styles.chemName}>{ing.chemicalName}</Text> : null}
            </View>
            <Text style={styles.ingPct}>{ing.percentage}%</Text>
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>{formatAmount(ing.percentage, batchWeightKg)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>إجمالي وزن الخلطة:</Text>
          <Text style={styles.totalVal}>{batchWeightKg} كجم (100%)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  presetChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  presetText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  customInput: {
    width: 80,
    height: 36,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  unitSuffix: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
  resultsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colName: {
    flex: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },
  colPct: {
    width: 65,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  colWeight: {
    flex: 1.5,
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    textAlign: 'left',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultRowAlt: {
    backgroundColor: '#FFFFFF',
  },
  nameBlock: {
    flex: 2,
  },
  ingName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
  },
  chemName: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'right',
  },
  ingPct: {
    width: 65,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  weightBadge: {
    flex: 1.5,
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'flex-start',
  },
  weightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
});
