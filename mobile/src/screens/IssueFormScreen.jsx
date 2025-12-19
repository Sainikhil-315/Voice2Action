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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
// import AudioRecorderPlayer from 'react-native-nitro-sound';
import { issuesAPI } from '../utils/api';
import { ISSUE_CATEGORIES, ISSUE_PRIORITY } from '../utils/constants';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

// const audioRecorderPlayer = new AudioRecorderPlayer();

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
  // const [isRecording, setIsRecording] = useState(false);
  // const [recordingPath, setRecordingPath] = useState(null);
  // const [recordTime, setRecordTime] = useState('00:00');

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

  // const requestAudioPermission = async () => {
  //   if (Platform.OS === 'android') {
  //     try {
  //       const granted = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  //         {
  //           title: 'Audio Permission',
  //           message: 'App needs audio permission to record voice',
  //           buttonNeutral: 'Ask Me Later',
  //           buttonNegative: 'Cancel',
  //           buttonPositive: 'OK',
  //         },
  //       );
  //       return granted === PermissionsAndroid.RESULTS.GRANTED;
  //     } catch (err) {
  //       console.warn(err);
  //       return false;
  //     }
  //   }
  //   return true;
  // };

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

  // Voice recording functions
  // const startRecording = async () => {
  //   const hasPermission = await requestAudioPermission();
  //   if (!hasPermission) {
  //     Toast.show({ type: 'error', text1: 'Audio permission denied' });
  //     return;
  //   }
  //   try {
  //     const path = Platform.select({
  //       ios: 'voice_recording.m4a',
  //       android: `${Platform.constants.Release >= 10 ? 'file://' : ''}${Platform.constants.DocumentDirectoryPath}/voice_recording.mp3`,
  //     });
  //     await audioRecorderPlayer.startRecorder(path);
  //     audioRecorderPlayer.addRecordBackListener((e) => {
  //       const minutes = Math.floor(e.currentPosition / 60000);
  //       const seconds = Math.floor((e.currentPosition % 60000) / 1000);
  //       setRecordTime(
  //         `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  //       );
  //     });
  //     setIsRecording(true);
  //     setRecordingPath(path);
  //     Toast.show({ type: 'info', text1: 'Recording started' });
  //   } catch (err) {
  //     console.error('Recording error:', err);
  //     Toast.show({ type: 'error', text1: 'Failed to start recording' });
  //   }
  // };
  // const stopRecording = async () => {
  //   try {
  //     const result = await audioRecorderPlayer.stopRecorder();
  //     audioRecorderPlayer.removeRecordBackListener();
  //     setIsRecording(false);
  //     if (result) {
  //       const audioMedia = {
  //         uri: result,
  //         type: 'audio/mp3',
  //         name: `voice_${Date.now()}.mp3`,
  //       };
  //       setFormData(prev => ({
  //         ...prev,
  //         media: [...prev.media, audioMedia],
  //       }));
  //       Toast.show({ type: 'success', text1: 'Voice recording added' });
  //     }
  //     setRecordTime('00:00');
  //     setRecordingPath(null);
  //   } catch (err) {
  //     console.error('Stop recording error:', err);
  //     Toast.show({ type: 'error', text1: 'Failed to stop recording' });
  //   }
  // };

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
        Toast.show({
          type: 'error',
          text1: 'Failed to get location',
          text2: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  // Form submission
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
    if (!formData.location) {
      Toast.show({ type: 'error', text1: 'Please add location' });
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

      // Append media files
      formData.media.forEach((media, index) => {
        formDataToSend.append('media', {
          uri: media.uri,
          type: media.type,
          name: media.name,
        });
      });

      const response = await issuesAPI.create(formDataToSend);

      Toast.show({
        type: 'success',
        text1: 'Issue reported successfully!',
        text2: 'Thank you for helping improve the community',
      });

      navigation.goBack();
    } catch (error) {
      console.error('Submit error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to report issue';
      Toast.show({ type: 'error', text1: 'Error', text2: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>

          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={value =>
                setFormData({ ...formData, category: value })
              }
              style={styles.picker}
              dropdownIconColor="#2563eb"
            >
              <Picker.Item label="Select a category" value="" />
              {ISSUE_CATEGORIES.map(cat => (
                <Picker.Item
                  key={cat.value}
                  label={`${typeof cat.icon === 'string' ? cat.icon : ''} ${cat.label}`}
                  value={cat.value}
                />
              ))}
            </Picker>
          </View>
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

        {/* Voice Recording (Commented Out) */}
        {/**
        <View style={styles.field}>
          <Text style={styles.label}>Voice Note (Optional)</Text>
          <View style={styles.voiceRecordingContainer}>
            {!isRecording ? (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                disabled={formData.media.length >= 5}
              >
                <Icon name="mic" size={28} color="#ffffff" />
                <Text style={styles.recordButtonText}>Start Recording</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.recordingActive}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording... {recordTime}</Text>
                </View>
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopRecording}
                >
                  <Icon name="stop" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        */}

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
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  categoryIcon: { fontSize: 18, marginRight: 6 },
  categoryText: { fontSize: 14, color: '#374151' },
  categoryTextActive: { color: '#2563eb', fontWeight: '600' },
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
  voiceRecordingContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  recordButtonText: { fontSize: 16, color: '#ffffff', fontWeight: '500' },
  recordingActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  recordingText: { fontSize: 16, color: '#1f2937', fontWeight: '500' },
  stopButton: {
    backgroundColor: '#6b7280',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  dropdownContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  picker: {
    height: 52,
    color: '#1f2937',
  },
});

export default IssueFormScreen;
