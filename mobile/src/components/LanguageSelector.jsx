// mobile/src/components/LanguageSelector.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage, getCurrentLanguage, getLanguageInfo } from '../i18n';

const LanguageSelector = ({ style }) => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const currentLanguage = getCurrentLanguage();
  const currentLangInfo = getLanguageInfo(currentLanguage);

  const handleLanguageChange = async (languageCode) => {
    const success = await changeLanguage(languageCode);
    if (success) {
      setModalVisible(false);
    }
  };

  const renderLanguageItem = ({ item }) => {
    const isSelected = currentLanguage === item.code;

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.languageItemSelected]}
        onPress={() => handleLanguageChange(item.code)}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.languageFlag}>{item.flag}</Text>
          <View style={styles.languageText}>
            <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
              {item.name}
            </Text>
            <Text style={styles.languageNative}>{item.nativeName}</Text>
          </View>
        </View>
        {isSelected && (
          <Icon name="checkmark-circle" size={24} color="#2563eb" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.languageButton, style]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.languageButtonText}>{currentLangInfo.flag}</Text>
        <Icon name="chevron-down" size={16} color="#1f2937" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LANGUAGES}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    gap: 2,
  },
  languageButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    paddingVertical: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  languageItemSelected: {
    backgroundColor: '#eff6ff',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageText: {
    gap: 2,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  languageNameSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default LanguageSelector;