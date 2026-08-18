import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

interface FilterOptions {
  origin?: string[];
  grade?: string[];
  priceRange?: [number, number];
  variety?: string[];
}

interface AdvancedFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

const ORIGINS = ['Ethiopia', 'Colombia', 'Kenya', 'Peru', 'Guatemala', 'Brazil'];
const GRADES = ['Grade A+', 'Grade A', 'Grade B', 'Grade C'];
const VARIETIES = [
  'Bourbon',
  'Typica',
  'Geisha',
  'SL28',
  'Yirgacheffe',
  'Mundo Novo',
];

export function AdvancedFilters({
  visible,
  onClose,
  onApply,
}: AdvancedFiltersProps) {
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedVarieties, setSelectedVarieties] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const toggleSelection = (
    item: string,
    selected: string[],
    setSel: (items: string[]) => void,
  ) => {
    if (selected.includes(item)) {
      setSel(selected.filter((s) => s !== item));
    } else {
      setSel([...selected, item]);
    }
  };

  const handleApply = () => {
    const filters: FilterOptions = {};
    if (selectedOrigins.length > 0) filters.origin = selectedOrigins;
    if (selectedGrades.length > 0) filters.grade = selectedGrades;
    if (selectedVarieties.length > 0) filters.variety = selectedVarieties;
    if (minPrice || maxPrice) {
      filters.priceRange = [
        parseFloat(minPrice) || 0,
        parseFloat(maxPrice) || 999999,
      ];
    }
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setSelectedOrigins([]);
    setSelectedGrades([]);
    setSelectedVarieties([]);
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Advanced Filters</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.navy} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Origin</Text>
            <View style={styles.optionsGrid}>
              {ORIGINS.map((origin) => (
                <Pressable
                  key={origin}
                  onPress={() =>
                    toggleSelection(origin, selectedOrigins, setSelectedOrigins)
                  }
                  style={[
                    styles.optionBadge,
                    selectedOrigins.includes(origin) &&
                      styles.optionBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedOrigins.includes(origin) &&
                        styles.optionTextActive,
                    ]}
                  >
                    {origin}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grade</Text>
            <View style={styles.optionsGrid}>
              {GRADES.map((grade) => (
                <Pressable
                  key={grade}
                  onPress={() =>
                    toggleSelection(grade, selectedGrades, setSelectedGrades)
                  }
                  style={[
                    styles.optionBadge,
                    selectedGrades.includes(grade) && styles.optionBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedGrades.includes(grade) &&
                        styles.optionTextActive,
                    ]}
                  >
                    {grade}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Variety</Text>
            <View style={styles.optionsGrid}>
              {VARIETIES.map((variety) => (
                <Pressable
                  key={variety}
                  onPress={() =>
                    toggleSelection(variety, selectedVarieties, setSelectedVarieties)
                  }
                  style={[
                    styles.optionBadge,
                    selectedVarieties.includes(variety) &&
                      styles.optionBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedVarieties.includes(variety) &&
                        styles.optionTextActive,
                    ]}
                  >
                    {variety}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="decimal-pad"
              />
              <Text style={styles.priceSeparator}>—</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable onPress={handleApply} style={styles.applyBtn}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  optionBadgeActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  optionText: {
    fontSize: 12,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  priceSeparator: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.navy,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
