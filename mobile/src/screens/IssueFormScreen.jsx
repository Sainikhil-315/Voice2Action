// mobile/src/screens/IssueFormScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { useTranslation } from 'react-i18next';
import { issuesAPI } from '../utils/api';
import { ISSUE_CATEGORIES, ISSUE_PRIORITY } from '../utils/constants';
import Toast from 'react-native-toast-message';

const IssueFormScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
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
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionData, setRejectionData] = useState(null);

  // Request Camera Permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('issues.cameraPermission'),
            message: t('issues.cameraPermissionMessage'),
            buttonNeutral: t('common.cancel'),
            buttonNegative: t('common.cancel'),
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

  // Request Location Permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('issues.locationPermission'),
            message: t('issues.locationPermissionMessage'),
            buttonNeutral: t('common.cancel'),
            buttonNegative: t('common.cancel'),
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

  // Handle Take Photo
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Toast.show({ type: 'error', text1: t('issues.cameraPermissionDenied') });
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
          text1: t('common.error'),
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
        Toast.show({ type: 'success', text1: t('issues.photoAdded') });
      }
    });
  };

  // Handle Select Photo from Gallery
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
          text1: t('common.error'),
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
          text1: `${newMedia.length} ${t('issues.photosAdded')}`,
        });
      }
    });
  };

  // Remove Media
  const removeMedia = index => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  // Get Location
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Toast.show({ type: 'error', text1: t('issues.locationPermissionDenied') });
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
        Toast.show({ type: 'success', text1: t('issues.locationCaptured') });
      },
      error => {
        console.error('Location error:', error);
        setLocationLoading(false);
        let errorMsg = t('issues.locationError');
        if (error.code === 1) {
          errorMsg = t('issues.locationPermissionDenied');
        } else if (error.code === 2) {
          errorMsg = t('issues.locationUnavailable');
        } else if (error.code === 3) {
          errorMsg = t('issues.locationTimeout');
        }
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: errorMsg,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  // Get Selected Category
  const getSelectedCategory = () => {
    return ISSUE_CATEGORIES.find(cat => cat.value === formData.category);
  };

  // Determine Rejection Category
  const determineRejectionCategory = (details) => {
    const reason = (details.reason || '').toLowerCase();
    
    if (reason.includes('inappropriate') || reason.includes('offensive') || reason.includes('violation')) {
      return 'inappropriate_content';
    }
    if (reason.includes('spam') || reason.includes('duplicate')) {
      return 'spam';
    }
    if (reason.includes('information') || reason.includes('details') || reason.includes('incomplete')) {
      return 'insufficient_information';
    }
    return 'content_quality';
  };

  // Generate Suggestions
  const generateSuggestions = (category) => {
    const baseSuggestions = {
      inappropriate_content: [
        t('rejection.suggestions.appropriate'),
        t('rejection.suggestions.removeOffensive'),
        t('rejection.suggestions.objective'),
        t('rejection.suggestions.reviewGuidelines')
      ],
      spam: [
        t('rejection.suggestions.genuine'),
        t('rejection.suggestions.uniqueDetails'),
        t('rejection.suggestions.avoidDuplicate'),
        t('rejection.suggestions.specificInfo')
      ],
      insufficient_information: [
        t('rejection.suggestions.moreDetails'),
        t('rejection.suggestions.clearPhotos'),
        t('rejection.suggestions.exactLocation'),
        t('rejection.suggestions.describeImpact')
      ],
      content_quality: [
        t('rejection.suggestions.clearTitle'),
        t('rejection.suggestions.detailedInfo'),
        t('rejection.suggestions.includePhotos'),
        t('rejection.suggestions.specifyLocation')
      ]
    };

    return baseSuggestions[category] || baseSuggestions.content_quality;
  };

  // Handle Rejection
  const handleRejection = (errorData) => {
    const validationDetails = errorData.validationDetails || {};
    
    const rejectionInfo = {
      reason: validationDetails.reason || errorData.message || t('rejection.defaultReason'),
      suggestions: validationDetails.suggestions || [],
      category: determineRejectionCategory(validationDetails),
      severity: validationDetails.severity || 'medium',
    };

    if (!rejectionInfo.suggestions.length) {
      rejectionInfo.suggestions = generateSuggestions(rejectionInfo.category);
    }

    setRejectionData(rejectionInfo);
    setShowRejectionModal(true);
  };

  // Handle Submit
  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Toast.show({ type: 'error', text1: t('validation.titleRequired') });
      return;
    }
    if (!formData.category) {
      Toast.show({ type: 'error', text1: t('validation.categoryRequired') });
      return;
    }
    if (!formData.location) {
      Toast.show({ type: 'error', text1: t('validation.locationRequired') });
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
          uri: Platform.OS === 'android' ? media.uri : media.uri.replace('file://', ''),
          type: media.type || 'image/jpeg',
          name: media.name || `image_${Date.now()}_${index}.jpg`,
        });
      });
      
      const response = await issuesAPI.create(formDataToSend);
      
      if (response?.validationFailed) {
        handleRejection(response);
        return;
      }
      
      Toast.show({
        type: 'success',
        text1: t('issues.issueReported'),
        text2: t('issues.thankYou'),
      });
      navigation.navigate('IssueTracking');
    } catch (error) {
      console.error('Submit error:', error);
      
      if (error?.response?.data?.validationFailed) {
        handleRejection(error.response.data);
        return;
      }
      
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        t('issues.submitFailed');
      Toast.show({ type: 'error', text1: t('common.error'), text2: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Retry
  const handleRetry = () => {
    setShowRejectionModal(false);
    Toast.show({
      type: 'info',
      text1: t('rejection.readyToImprove'),
      text2: t('rejection.updateSubmission')
    });
  };

  // Category Modal Component
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
            <Text style={styles.modalTitle}>{t('issues.selectCategory')}</Text>
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
                  formData.category === cat.value &&
                    styles.categoryOptionSelected,
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
                    color={
                      formData.category === cat.value ? '#2563eb' : '#6b7280'
                    }
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      formData.category === cat.value &&
                        styles.categoryOptionTextSelected,
                    ]}
                  >
                    {t(`issues.categories.${cat.value.replace(/_/g, '')}`)}
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

  // Gemini Rejection Modal Component
  const GeminiRejectionModal = () => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    React.useEffect(() => {
      if (showRejectionModal) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      }
    }, [showRejectionModal]);

    const getCategoryConfig = () => {
      const category = rejectionData?.category || 'content_quality';
      
      const configs = {
        inappropriate_content: {
          icon: 'warning',
          gradient: ['#ef4444', '#dc2626'],
          color: '#ef4444',
          title: t('rejection.inappropriateContent.title'),
          description: t('rejection.inappropriateContent.description')
        },
        spam: {
          icon: 'ban',
          gradient: ['#f59e0b', '#d97706'],
          color: '#f59e0b',
          title: t('rejection.spam.title'),
          description: t('rejection.spam.description')
        },
        insufficient_information: {
          icon: 'information-circle',
          gradient: ['#3b82f6', '#2563eb'],
          color: '#3b82f6',
          title: t('rejection.insufficientInfo.title'),
          description: t('rejection.insufficientInfo.description')
        },
        content_quality: {
          icon: 'alert-circle',
          gradient: ['#8b5cf6', '#7c3aed'],
          color: '#8b5cf6',
          title: t('rejection.contentQuality.title'),
          description: t('rejection.contentQuality.description')
        }
      };
      
      return configs[category] || configs.content_quality;
    };

    if (!rejectionData) return null;

    const config = getCategoryConfig();
    const { reason, suggestions } = rejectionData;

    return (
      <Modal
        visible={showRejectionModal}
        transparent
        animationType="none"
        onRequestClose={handleRetry}
      >
        <Animated.View 
          style={[
            styles.rejectionOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.rejectionBackdrop} 
            activeOpacity={1} 
            onPress={handleRetry}
          />
          
          <Animated.View
            style={[
              styles.rejectionContainer,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <LinearGradient
              colors={config.gradient}
              style={styles.rejectionHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.rejectionIconContainer}>
                <View style={styles.rejectionIconCircle}>
                  <Icon name={config.icon} size={40} color="#ffffff" />
                </View>
                <View style={styles.rejectionPulseRing} />
              </View>
            </LinearGradient>

            <ScrollView 
              style={styles.rejectionContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.rejectionContent}>
                <Text style={styles.rejectionTitle}>{config.title}</Text>
                <Text style={styles.rejectionSubtitle}>{config.description}</Text>

                <View style={styles.rejectionReasonCard}>
                  <View style={styles.rejectionReasonHeader}>
                    <Icon name="document-text" size={20} color={config.color} />
                    <Text style={styles.rejectionReasonTitle}>{t('rejection.rejectionReason')}</Text>
                  </View>
                  <Text style={styles.rejectionReasonText}>{reason}</Text>
                </View>

                <View style={styles.rejectionSuggestionsSection}>
                  <View style={styles.rejectionSuggestionsHeader}>
                    <Icon name="bulb" size={20} color="#fbbf24" />
                    <Text style={styles.rejectionSuggestionsTitle}>{t('rejection.howToImprove')}</Text>
                  </View>

                  {suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.rejectionSuggestionItem}>
                      <View style={styles.rejectionSuggestionNumber}>
                        <Text style={styles.rejectionSuggestionNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.rejectionSuggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.rejectionHelpSection}>
                  <Icon name="help-circle-outline" size={18} color="#6b7280" />
                  <Text style={styles.rejectionHelpText}>
                    {t('rejection.needHelp')}{' '}
                    <Text style={styles.rejectionHelpLink}>{t('rejection.communityGuidelines')}</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.rejectionActionButtons}>
              <TouchableOpacity 
                style={styles.rejectionSecondaryButton}
                onPress={() => {
                  setShowRejectionModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.rejectionSecondaryButtonText}>{t('rejection.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.rejectionPrimaryButton, { backgroundColor: config.color }]}
                onPress={handleRetry}
              >
                <Text style={styles.rejectionPrimaryButtonText}>{t('rejection.tryAgain')}</Text>
                <Icon name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('issues.reportIssue')}</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <Text style={styles.submitText}>{t('common.submit')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('issues.title')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('issues.briefDescription')}
            placeholderTextColor="#9ca3af"
            value={formData.title}
            onChangeText={text => setFormData({ ...formData, title: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('issues.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('issues.detailedDescription')}
            placeholderTextColor="#9ca3af"
            value={formData.description}
            onChangeText={text =>
              setFormData({ ...formData, description: text })
            }
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('issues.category')} *</Text>
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
                  {t(`issues.categories.${formData.category.replace(/_/g, '')}`)}
                </Text>
              </View>
            ) : (
              <View style={styles.categorySelectorContent}>
                <Icon name="list-outline" size={24} color="#9ca3af" />
                <Text style={styles.categorySelectorPlaceholder}>
                  {t('issues.selectCategory')}
                </Text>
              </View>
            )}
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('issues.priority')}</Text>
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
                  {t(`issues.priorities.${p.value}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Media Upload */}
        <View style={styles.field}>
          <Text style={styles.label}>
            {t('issues.media')} ({formData.media.length}/5)
          </Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleTakePhoto}
              disabled={formData.media.length >= 5}
            >
              <Icon name="camera" size={24} color="#2563eb" />
              <Text style={styles.mediaButtonText}>{t('issues.camera')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleSelectPhoto}
              disabled={formData.media.length >= 5}
            >
              <Icon name="images" size={24} color="#2563eb" />
              <Text style={styles.mediaButtonText}>{t('issues.gallery')}</Text>
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
                      <Text style={styles.audioText}>{t('issues.voice')}</Text>
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
          <Text style={styles.label}>{t('issues.location')} *</Text>
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
                    ? `${t('issues.locationAdded')}: ${formData.location.address}`
                    : t('issues.addLocation')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CategoryModal />
      <GeminiRejectionModal />
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
  
  // Category Selector
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
  
  // Priority
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
  
  // Media
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
  
  // Location
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

  // Rejection Modal Styles
  rejectionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rejectionBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rejectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  rejectionHeader: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rejectionIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rejectionPulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  rejectionContentContainer: {
    maxHeight: 400,
  },
  rejectionContent: {
    padding: 24,
  },
  rejectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  rejectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  rejectionReasonCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  rejectionReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  rejectionReasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
  },
  rejectionReasonText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  rejectionSuggestionsSection: {
    marginBottom: 20,
  },
  rejectionSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  rejectionSuggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rejectionSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  rejectionSuggestionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  rejectionSuggestionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  rejectionSuggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  rejectionHelpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectionHelpText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  rejectionHelpLink: {
    color: '#2563eb',
    fontWeight: '500',
  },
  rejectionActionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  rejectionSecondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectionSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  rejectionPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectionPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default IssueFormScreen;