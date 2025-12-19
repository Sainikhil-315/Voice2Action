// mobile/src/screens/IssueFormScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { issuesAPI } from '../utils/api';
import { ISSUE_CATEGORIES, ISSUE_PRIORITY } from '../utils/constants';
import Toast from 'react-native-toast-message';

const IssueFormScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: null,
    media: [],
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Request permissions
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs location permission to tag your issue',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Camera functions
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Toast.show({ type: 'error', text1: 'Camera permission denied' });
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      includeBase64: false,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Camera Error',
          text2: response.errorMessage,
        });
      } else if (response.assets && response.assets[0]) {
        const newMedia = {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || `photo_${Date.now()}.jpg`,
        };
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, newMedia],
        }));
        Toast.show({ type: 'success', text1: 'Photo added successfully' });
      }
    });
  };

  const handleSelectPhoto = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5 - formData.media.length,
      maxWidth: 1920,
      maxHeight: 1080,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.errorMessage,
        });
      } else if (response.assets) {
        const newMedia = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        }));
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, ...newMedia],
        }));
        Toast.show({
          type: 'success',
          text1: `${newMedia.length} photo(s) added`,
        });
      }
    });
  };

  const removeMedia = index => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  // Location function
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Toast.show({ type: 'error', text1: 'Location permission denied' });
      return;
    }

    setLocationLoading(true);

    Geolocation.getCurrentPosition(
      position => {
        const location = {
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        };
        setFormData(prev => ({ ...prev, location }));
        setLocationLoading(false);
        Toast.show({ type: 'success', text1: 'Location captured' });
      },
      error => {
        console.error('Location error:', error);
        setLocationLoading(false);
        let errorMsg = 'Unable to get location';
        if (error.code === 1) {
          errorMsg = 'Location permission denied';
        } else if (error.code === 2) {
          errorMsg = 'Location unavailable';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out';
        }
        Toast.show({
          type: 'error',
          text1: 'Location Error',
          text2: errorMsg,
        });
      },
      {
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 15000, // Reduced timeout
        maximumAge: 10000,
      },
    );
  };

  // Get category info
  const getSelectedCategory = () => {
    return ISSUE_CATEGORIES.find(cat => cat.value === formData.category);
  };

  // Form submission
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiReason, setGeminiReason] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a title' });
      return;
    }
    if (!formData.category) {
      Toast.show({ type: 'error', text1: 'Please select a category' });
      return;
    }
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('location', JSON.stringify(formData.location));
      formData.media.forEach((media, index) => {
        formDataToSend.append('media', {
          uri: media.uri,
          type: media.type,
          name: media.name,
        });
      });

      const response = await issuesAPI.create(formDataToSend);
      // If Gemini validation failed, backend returns 400 with validationFailed
      if (response?.validationFailed) {
        setGeminiReason(response?.validationDetails?.reason || 'Rejected by Gemini');
        setShowGeminiModal(true);
        return;
      }
      Toast.show({
        type: 'success',
        text1: 'Issue reported successfully!',
        text2: 'Thank you for helping improve the community',
      });
      navigation.navigate('IssueTracking');
    } catch (error) {
      console.error('Submit error:', error);
      // If Gemini validation failed, backend returns 400 with validationFailed
      if (error?.response?.data?.validationFailed) {
        setGeminiReason(error?.response?.data?.validationDetails?.reason || 'Rejected by Gemini');
        setShowGeminiModal(true);
        return;
      }
      const errorMsg = error.response?.data?.message || 'Failed to report issue';
      Toast.show({ type: 'error', text1: 'Error', text2: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const CategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Icon name="close" size={24} color="#1f2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.categoryList}>
            {ISSUE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryOption,
                  formData.category === cat.value && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setFormData({ ...formData, category: cat.value });
                  setShowCategoryModal(false);
                }}
              >
                <View style={styles.categoryOptionLeft}>
                  <Icon 
                    name={cat.icon} 
                    size={24} 
                    color={formData.category === cat.value ? '#2563eb' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.categoryOptionText,
                    formData.category === cat.value && styles.categoryOptionTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                </View>
                {formData.category === cat.value && (
                  <Icon name="checkmark-circle" size={24} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Gemini Rejection Modal */}
      <Modal visible={showGeminiModal} transparent animationType="fade" onRequestClose={() => setShowGeminiModal(false)}>
        <View style={styles.geminiModalOverlay}>
          <View style={styles.geminiModalContent}>
            <Text style={styles.geminiModalTitle}>Issue Rejected</Text>
            <Text style={styles.geminiModalReason}>{geminiReason}</Text>
            <TouchableOpacity style={styles.geminiModalButton} onPress={() => setShowGeminiModal(false)}>
              <Text style={styles.geminiModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the issue"
            placeholderTextColor="#9ca3af"
            value={formData.title}
            onChangeText={text => setFormData({ ...formData, title: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detailed description..."
            placeholderTextColor="#9ca3af"
            value={formData.description}
            onChangeText={text =>
              setFormData({ ...formData, description: text })
            }
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category - New Design */}
        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            {formData.category ? (
              <View style={styles.categorySelectorContent}>
                <Icon 
                  name={getSelectedCategory()?.icon || 'list-outline'} 
                  size={24} 
                  color="#2563eb" 
                />
                <Text style={styles.categorySelectorText}>
                  {getSelectedCategory()?.label || 'Select a category'}
                </Text>
              </View>
            ) : (
              <View style={styles.categorySelectorContent}>
                <Icon name="list-outline" size={24} color="#9ca3af" />
                <Text style={styles.categorySelectorPlaceholder}>
                  Select a category
                </Text>
              </View>
            )}
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {ISSUE_PRIORITY.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityButton,
                  formData.priority === p.value && styles.priorityButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, priority: p.value })}
              >
                <Text
                  style={[
                    styles.priorityText,
                    formData.priority === p.value && styles.priorityTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Media Upload */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Photos/Videos ({formData.media.length}/5)
          </Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleTakePhoto}
              disabled={formData.media.length >= 5}
            >
              <Icon name="camera" size={24} color="#2563eb" />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleSelectPhoto}
              disabled={formData.media.length >= 5}
            >
              <Icon name="images" size={24} color="#2563eb" />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Media Preview */}
          {formData.media.length > 0 && (
            <ScrollView
              horizontal
              style={styles.mediaPreview}
              showsHorizontalScrollIndicator={false}
            >
              {formData.media.map((media, index) => (
                <View key={index} style={styles.mediaItem}>
                  {media.type?.startsWith('image') ? (
                    <Image
                      source={{ uri: media.uri }}
                      style={styles.mediaImage}
                    />
                  ) : media.type?.startsWith('audio') ? (
                    <View style={styles.audioPreview}>
                      <Icon name="mic" size={32} color="#2563eb" />
                      <Text style={styles.audioText}>Voice</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.removeMedia}
                    onPress={() => removeMedia(index)}
                  >
                    <Icon name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>Location *</Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              formData.location && styles.locationButtonActive,
            ]}
            onPress={getLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <>
                <Icon
                  name={formData.location ? 'checkmark-circle' : 'location'}
                  size={24}
                  color={formData.location ? '#10b981' : '#2563eb'}
                />
                <Text
                  style={[
                    styles.locationText,
                    formData.location && styles.locationTextActive,
                  ]}
                >
                  {formData.location
                    ? `Location: ${formData.location.address}`
                    : 'Add Current Location'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CategoryModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  form: { flex: 1, padding: 20 },
  field: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  // Category Selector Styles
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: 12,
  },
  categorySelectorPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 12,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  categoryList: {
    maxHeight: 500,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  categoryOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  priorityButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  priorityText: { fontSize: 14, color: '#374151' },
  priorityTextActive: { color: '#2563eb', fontWeight: '600' },
  mediaButtons: { flexDirection: 'row', gap: 12 },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  mediaButtonText: { fontSize: 16, color: '#2563eb', fontWeight: '500' },
  mediaPreview: { marginTop: 12 },
  mediaItem: { position: 'relative', marginRight: 12 },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  audioPreview: {
    width: 100,
    height: 100,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioText: { fontSize: 12, color: '#2563eb', marginTop: 4 },
  removeMedia: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  locationButtonActive: {
    backgroundColor: '#d1fae5',
  },
  locationText: { fontSize: 16, color: '#2563eb', fontWeight: '500' },
  locationTextActive: { color: '#10b981' },
});

export default IssueFormScreen;