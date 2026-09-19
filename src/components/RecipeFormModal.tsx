import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Recipe, Ingredient, MainSection } from '../types';
import { extractYouTubeId, getYouTubeThumbnail } from '../utils/youtube';

interface RecipeFormModalProps {
  visible: boolean;
  recipeToEdit?: Recipe | null;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

const PRESET_IMAGES = [
  { label: 'شامبو ورغوة', url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80' },
  { label: 'زجاج ومرايا', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80' },
  { label: 'إطارات وجنوط', url: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80' },
  { label: 'أواني ومطبخ', url: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80' },
  { label: 'أرضيات ومعقمات', url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80' },
  { label: 'محرك وشحوم', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80' },
];

const PRESET_YOUTUBE_VIDEOS = [
  { label: 'تصنيع شامبو رغوة سيارات', url: 'https://www.youtube.com/watch?v=7X8II6J-6mU' },
  { label: 'تنظيف وتلميع زجاج احترافي', url: 'https://www.youtube.com/watch?v=kYv_3e1aQ7E' },
  { label: 'ملمع كفرات سيليكون دائم', url: 'https://www.youtube.com/watch?v=yW2k_3pB7Qk' },
  { label: 'سائل جلي صحون اقتصادي', url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' },
  { label: 'مزيل دهون وأفران قوي', url: 'https://www.youtube.com/watch?v=u78o1lVqJ_M' },
];

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  visible,
  recipeToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [categoryName, setCategoryName] = useState('شامبو ورغوة');
  const [category, setCategory] = useState('car_shampoo');
  const [mainSection, setMainSection] = useState<MainSection>('car_care');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [badge, setBadge] = useState('');
  const [phLevel, setPhLevel] = useState('6.5 - 7.0');
  const [phType, setPhType] = useState('neutral');
  const [difficulty, setDifficulty] = useState('سهل');
  const [preparationTime, setPreparationTime] = useState('30 دقيقة');
  const [curingTime, setCuringTime] = useState('12 ساعة');
  const [appearance, setAppearance] = useState('سائل لزج شفاف بلون كرزي');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: 'ماء نقي', chemicalName: 'Aqua (Water)', percentage: 80, role: 'مذيب رئيسي وحامل للمكونات' },
    { name: 'تكسابون N70', chemicalName: 'Sodium Lauryl Ether Sulfate 70%', percentage: 12, role: 'مادة فعالة سطحياً ورغوية' },
    { name: 'كمبرلان CDE', chemicalName: 'Cocamide DEA', percentage: 4, role: 'معزز ومثبت للرغوة ومثخن للقوام' },
    { name: 'بروبيلين جليكول', chemicalName: 'Propylene Glycol', percentage: 2, role: 'مانع جفاف سريع ومحسن لمعان' },
    { name: 'حمض الستريك', chemicalName: 'Citric Acid', percentage: 1, role: 'ضبط درجة الحموضة pH' },
    { name: 'عطر ومادة حافظة', chemicalName: 'Fragrance & Preservative', percentage: 1, role: 'رائحة منعشة وحفظ التركيبة' },
  ]);
  const [preparationSteps, setPreparationSteps] = useState<string[]>([
    'ضع كمية الماء النقي في وعاء خلط نظيف ومناسب.',
    'أضف التكسابون تدريجياً مع التحريك المستمر باتجاه واحد حتى الذوبان التام.',
    'أضف الكمبرلان وحرك جيداً حتى يمتزج تماماً ويتماسك القوام.',
    'أضف البروبيلين جليكول وحمض الستريك المذاب في قليل من الماء لضبط الـ pH.',
    'أضف العطر والمادة الحافظة واللون، واخلط حتى التجانس التام.',
  ]);
  const [safetyWarnings, setSafetyWarnings] = useState<string[]>([
    'ارتدِ قفازات واقية ونظارات أثناء وزن ومزج المواد الخام المركزة.',
    'احفظ المنتج النهائي في عبوات محكمة بعيداً عن متناول الأطفال وأشعة الشمس المباشرة.',
  ]);
  const [formulationTips, setFormulationTips] = useState<string[]>([
    'التحريك الهادئ باتجاه واحد يمنع تشكل الرغوة المفرطة داخل وعاء التصنيع.',
    'ترك المنتج يرقد لمدة 12 ساعة يساعد على تصفية الفقاعات الهوائية ليصبح المنتج شفافاً كلياً.',
  ]);
  const [usageInstructions, setUsageInstructions] = useState('يخفف بنسبة 1:10 أو يستخدم مباشرة حسب نوع السطح.');
  const [recommendedPackaging, setRecommendedPackaging] = useState('عبوات بلاستيكية سعة 1 لتر أو 5 لتر مع غطاء محكم.');

  useEffect(() => {
    if (recipeToEdit) {
      setTitle(recipeToEdit.title || '');
      setTitleEn(recipeToEdit.titleEn || '');
      setCategoryName(recipeToEdit.categoryName || 'عام');
      setCategory(recipeToEdit.category || 'general');
      setMainSection(recipeToEdit.mainSection || 'car_care');
      setImageUrl(recipeToEdit.imageUrl || PRESET_IMAGES[0].url);
      setYoutubeUrl(recipeToEdit.youtubeUrl || '');
      setShortDesc(recipeToEdit.shortDesc || '');
      setBadge(recipeToEdit.badge || '');
      setPhLevel(recipeToEdit.phLevel || '7.0');
      setPhType(recipeToEdit.phType || 'neutral');
      setDifficulty(recipeToEdit.difficulty || 'سهل');
      setPreparationTime(recipeToEdit.preparationTime || '30 دقيقة');
      setCuringTime(recipeToEdit.curingTime || '12 ساعة');
      setAppearance(recipeToEdit.appearance || '');
      setIngredients(recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0 ? recipeToEdit.ingredients : []);
      setPreparationSteps(recipeToEdit.preparationSteps || []);
      setSafetyWarnings(recipeToEdit.safetyWarnings || []);
      setFormulationTips(recipeToEdit.formulationTips || []);
      setUsageInstructions(recipeToEdit.usageInstructions || '');
      setRecommendedPackaging(recipeToEdit.recommendedPackaging || '');
    } else {
      // Reset to defaults
      setTitle('');
      setTitleEn('');
      setCategoryName('شامبو ورغوة');
      setCategory('car_shampoo');
      setMainSection('car_care');
      setImageUrl(PRESET_IMAGES[0].url);
      setYoutubeUrl('');
      setShortDesc('');
      setBadge('تركيبة معتمدة');
    }
  }, [recipeToEdit, visible]);

  // YouTube detection
  const ytVideoId = extractYouTubeId(youtubeUrl);
  const ytThumbnail = ytVideoId ? getYouTubeThumbnail(ytVideoId) : null;

  // Percentage calculation
  const totalPercentage = ingredients.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
  const roundedTotal = Math.round(totalPercentage * 10) / 10;
  const isPercentBalanced = Math.abs(roundedTotal - 100) < 0.2;

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: '', chemicalName: '', percentage: 1, role: '' },
    ]);
  };

  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    setPreparationSteps([...preparationSteps, '']);
  };

  const handleUpdateStep = (index: number, text: string) => {
    const updated = [...preparationSteps];
    updated[index] = text;
    setPreparationSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setPreparationSteps(preparationSteps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('يرجى إدخال اسم الوصفة');
      return;
    }

    const payload: Recipe = {
      id: recipeToEdit?.id || Date.now(),
      slug: recipeToEdit?.slug || `recipe-${Date.now()}`,
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      category,
      categoryName,
      mainSection,
      mainSectionName: mainSection === 'car_care' ? 'قسم العناية بالسيارات' : 'قسم المنظفات المنزلية',
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      youtubeUrl: youtubeUrl.trim() || undefined,
      shortDesc: shortDesc.trim() || 'تركيبة كيميائية عالية الجودة لتصنيع المنظفات',
      badge: badge.trim() || undefined,
      phLevel: phLevel.trim() || '7.0',
      phType,
      difficulty,
      preparationTime,
      curingTime,
      appearance,
      ingredients,
      preparationSteps: preparationSteps.filter((s) => s.trim().length > 0),
      safetyWarnings: safetyWarnings.filter((s) => s.trim().length > 0),
      formulationTips: formulationTips.filter((s) => s.trim().length > 0),
      usageInstructions,
      recommendedPackaging,
      isPremium: true,
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.modalTitle}>
              {recipeToEdit ? 'تعديل التركيبة الكيميائية' : 'إضافة تركيبة منظفات جديدة'}
            </Text>
            <Text style={styles.modalSubtitle}>لوحة تحكم المدير ومحرر الفيديو والمكونات</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.headerSaveBtn} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.headerSaveText}>حفظ</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Main Section Selector */}
          <View style={styles.fieldSection}>
            <Text style={styles.sectionHeading}>1. القسم الرئيسي والتصنيف</Text>
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={[styles.radioCard, mainSection === 'car_care' && styles.radioCardActive]}
                onPress={() => setMainSection('car_care')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="car-sport"
                  size={20}
                  color={mainSection === 'car_care' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.radioText, mainSection === 'car_care' && styles.radioTextActive]}>
                  قسم العناية بالسيارات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioCard, mainSection === 'household' && styles.radioCardActive]}
                onPress={() => setMainSection('household')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="home"
                  size={20}
                  color={mainSection === 'household' ? '#0284C7' : '#64748B'}
                />
                <Text style={[styles.radioText, mainSection === 'household' && styles.radioTextActive]}>
                  قسم المنظفات المنزلية
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title Inputs */}
            <View style={styles.inputRow}>
              <Text style={styles.label}>اسم الوصفة بالعربية (مطلوب):</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="مثال: شامبو السيارات المركز فائق الرغوة"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>اسم الوصفة بالإنجليزية (اختياري):</Text>
              <TextInput
                style={styles.textInput}
                value={titleEn}
                onChangeText={setTitleEn}
                placeholder="e.g. Ultra Foam Car Shampoo"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.twoCols}>
              <View style={styles.col}>
                <Text style={styles.label}>اسم التصنيف:</Text>
                <TextInput
                  style={styles.textInput}
                  value={categoryName}
                  onChangeText={setCategoryName}
                  placeholder="شامبو ورغوة"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>الشارة المميزة (Badge):</Text>
                <TextInput
                  style={styles.textInput}
                  value={badge}
                  onChangeText={setBadge}
                  placeholder="رغوة كثيفة ولمعان"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>نبذة مختصرة عن المنتج واستخداماته:</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={shortDesc}
                onChangeText={setShortDesc}
                placeholder="وصف مختصر للتركيبة ومزاياها التنافسية..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* YouTube Video Section - HIGHLIGHTED REQUIREMENT */}
          <View style={[styles.fieldSection, styles.youtubeSectionCard]}>
            <View style={styles.ytHeaderRow}>
              <View style={styles.ytBadge}>
                <Ionicons name="logo-youtube" size={18} color="#EF4444" />
                <Text style={styles.ytBadgeText}>إرفاق فيديو يوتيوب للوصفة</Text>
              </View>
              <Text style={styles.ytHeaderSub}>تشغيل مباشر وتلقائي داخل التطبيق</Text>
            </View>

            <Text style={styles.label}>رابط فيديو يوتيوب (URL أو معرف الفيديو):</Text>
            <View style={styles.ytInputWrapper}>
              <TextInput
                style={styles.ytInput}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="https://www.youtube.com/watch?v=XXXXXXX أو معرف الفيديو"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Ionicons name="link" size={18} color="#EF4444" />
            </View>

            {/* Video Preview Check */}
            {ytVideoId ? (
              <View style={styles.ytSuccessCard}>
                <View style={styles.ytSuccessTop}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.ytSuccessText}>تم استخراج معرف الفيديو: {ytVideoId}</Text>
                </View>
                {ytThumbnail && (
                  <View style={styles.ytPreviewRow}>
                    <Image source={{ uri: ytThumbnail }} style={styles.ytThumbSmall} contentFit="cover" />
                    <View style={styles.ytPreviewInfo}>
                      <Text style={styles.ytPreviewTitle}>الفيديو جاهز للتشغيل المباشر داخل التطبيق!</Text>
                      <Text style={styles.ytPreviewSub}>سيظهر للمستخدمين مع زر تشغيل وإمكانية العرض بملء الشاشة.</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.ytPresets}>
                <Text style={styles.presetsLabel}>روابط سريعة لفيديوهات جاهزة:</Text>
                <View style={styles.presetGrid}>
                  {PRESET_YOUTUBE_VIDEOS.map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.presetChip}
                      onPress={() => setYoutubeUrl(p.url)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="play" size={10} color="#EF4444" />
                      <Text style={styles.presetText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Image Selection */}
          <View style={styles.fieldSection}>
            <Text style={styles.sectionHeading}>2. صورة التركيبة الكيميائية</Text>
            <View style={styles.inputRow}>
              <Text style={styles.label}>رابط صورة مخصصة:</Text>
              <TextInput
                style={styles.textInput}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Text style={styles.presetsLabel}>أو اختر صورة جاهزة من مكتبتنا الاحترافية:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {PRESET_IMAGES.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.imgCard, imageUrl === img.url && styles.imgCardActive]}
                  onPress={() => setImageUrl(img.url)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: img.url }} style={styles.imgThumb} contentFit="cover" />
                  <Text style={styles.imgLabel}>{img.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chemical Specs */}
          <View style={styles.fieldSection}>
            <Text style={styles.sectionHeading}>3. المواصفات الفيزيائية والكيميائية</Text>
            <View style={styles.twoCols}>
              <View style={styles.col}>
                <Text style={styles.label}>درجة الحموضة pH:</Text>
                <TextInput
                  style={styles.textInput}
                  value={phLevel}
                  onChangeText={setPhLevel}
                  placeholder="6.5 - 7.0"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>مستوى الصعوبة:</Text>
                <TextInput
                  style={styles.textInput}
                  value={difficulty}
                  onChangeText={setDifficulty}
                  placeholder="سهل / متوسط / محترف"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.twoCols}>
              <View style={styles.col}>
                <Text style={styles.label}>مدة التحضير:</Text>
                <TextInput
                  style={styles.textInput}
                  value={preparationTime}
                  onChangeText={setPreparationTime}
                  placeholder="30 دقيقة"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>مدة التعتيق/الركود:</Text>
                <TextInput
                  style={styles.textInput}
                  value={curingTime}
                  onChangeText={setCuringTime}
                  placeholder="12 ساعة"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>الشكل والمظهر النهائي للمنتج:</Text>
              <TextInput
                style={styles.textInput}
                value={appearance}
                onChangeText={setAppearance}
                placeholder="سائل لزج شفاف بلون كرزي فاقع..."
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Dynamic Ingredients Manager */}
          <View style={styles.fieldSection}>
            <View style={styles.ingHeadingRow}>
              <View>
                <Text style={styles.sectionHeading}>4. المكونات والنسب المئوية</Text>
                <Text style={styles.sectionSubHeading}>المجموع الكيميائي يجب أن يساوي 100%</Text>
              </View>
              <View
                style={[
                  styles.percentSumBadge,
                  isPercentBalanced ? styles.percentSumOk : styles.percentSumWarn,
                ]}
              >
                <Text style={styles.percentSumText}>المجموع: {roundedTotal}%</Text>
                <Ionicons
                  name={isPercentBalanced ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={isPercentBalanced ? '#15803D' : '#DC2626'}
                />
              </View>
            </View>

            {ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRowCard}>
                <View style={styles.ingTopRow}>
                  <Text style={styles.ingIndexText}>المادة #{idx + 1}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveIngredient(idx)}
                    style={styles.ingRemoveBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.twoCols}>
                  <View style={[styles.col, { flex: 2 }]}>
                    <Text style={styles.smallLabel}>الاسم التجاري للمادة:</Text>
                    <TextInput
                      style={styles.textInputSmall}
                      value={ing.name}
                      onChangeText={(t) => handleUpdateIngredient(idx, 'name', t)}
                      placeholder="مثال: تكسابون 70%"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.col, { flex: 1 }]}>
                    <Text style={styles.smallLabel}>النسبة %:</Text>
                    <TextInput
                      style={styles.textInputSmall}
                      value={String(ing.percentage)}
                      onChangeText={(t) => handleUpdateIngredient(idx, 'percentage', parseFloat(t) || 0)}
                      placeholder="10"
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={styles.twoCols}>
                  <View style={[styles.col, { flex: 1.5 }]}>
                    <Text style={styles.smallLabel}>الاسم الكيميائي (IUPAC):</Text>
                    <TextInput
                      style={styles.textInputSmall}
                      value={ing.chemicalName}
                      onChangeText={(t) => handleUpdateIngredient(idx, 'chemicalName', t)}
                      placeholder="e.g. SLES 70%"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.col, { flex: 2 }]}>
                    <Text style={styles.smallLabel}>الوظيفة الكيميائية:</Text>
                    <TextInput
                      style={styles.textInputSmall}
                      value={ing.role}
                      onChangeText={(t) => handleUpdateIngredient(idx, 'role', t)}
                      placeholder="مادة رغوية فعالة سطحياً"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addIngBtn} onPress={handleAddIngredient} activeOpacity={0.7}>
              <Ionicons name="add-circle" size={20} color="#0284C7" />
              <Text style={styles.addIngText}>إضافة مادة كيميائية جديدة</Text>
            </TouchableOpacity>
          </View>

          {/* Preparation Steps */}
          <View style={styles.fieldSection}>
            <Text style={styles.sectionHeading}>5. خطوات التحضير والمزج</Text>
            {preparationSteps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.stepInput]}
                  value={step}
                  onChangeText={(t) => handleUpdateStep(idx, t)}
                  placeholder={`اكتب الخطوة رقم ${idx + 1}...`}
                  placeholderTextColor="#94A3B8"
                  multiline
                />
                <TouchableOpacity
                  onPress={() => handleRemoveStep(idx)}
                  style={styles.stepRemoveBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addIngBtn} onPress={handleAddStep} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color="#0284C7" />
              <Text style={styles.addIngText}>إضافة خطوة تحضير جديدة</Text>
            </TouchableOpacity>
          </View>

          {/* Final Save Button */}
          <TouchableOpacity style={styles.bottomSaveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
            <Text style={styles.bottomSaveText}>
              {recipeToEdit ? 'حفظ تعديلات التركيبة الكيميائية' : 'إضافة التركيبة للمنصة الآن'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionSubHeading: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'right',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  radioCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  radioCardActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  radioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  radioTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  inputRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'right',
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'right',
  },
  textInputSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'right',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  twoCols: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  youtubeSectionCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  ytHeaderRow: {
    marginBottom: 12,
  },
  ytBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ytBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  ytHeaderSub: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
    textAlign: 'right',
  },
  ytInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F87171',
    paddingHorizontal: 12,
    height: 46,
  },
  ytInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'left',
  },
  ytSuccessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  ytSuccessTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ytSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  ytPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  ytThumbSmall: {
    width: 80,
    height: 48,
    borderRadius: 6,
  },
  ytPreviewInfo: {
    flex: 1,
  },
  ytPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  ytPreviewSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  ytPresets: {
    marginTop: 10,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'right',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  presetText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
  },
  imagesScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imgCard: {
    width: 100,
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F1F5F9',
  },
  imgCardActive: {
    borderColor: '#0284C7',
  },
  imgThumb: {
    width: '100%',
    height: 60,
  },
  imgLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    padding: 4,
  },
  ingHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentSumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  percentSumOk: {
    backgroundColor: '#DCFCE7',
  },
  percentSumWarn: {
    backgroundColor: '#FEE2E2',
  },
  percentSumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  ingredientRowCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  ingRemoveBtn: {
    padding: 4,
  },
  addIngBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    marginTop: 6,
  },
  addIngText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  stepInput: {
    flex: 1,
    minHeight: 40,
  },
  stepRemoveBtn: {
    padding: 4,
  },
  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  bottomSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
