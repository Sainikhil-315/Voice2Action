import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { issuesAPI } from '../utils/api';
import { ISSUE_CATEGORIES, ISSUE_PRIORITY } from '../utils/constants';

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

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      
      if (formData.location) {
        formDataToSend.append('latitude', formData.location.latitude);
        formDataToSend.append('longitude', formData.location.longitude);
      }

      await issuesAPI.create(formDataToSend);
      Alert.alert('Success', 'Issue reported successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
        Alert.alert('Success', 'Location captured');
      },
      (error) => Alert.alert('Error', 'Failed to get location'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <Text style={[styles.submitText, loading && styles.submitTextDisabled]}>
            {loading ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the issue"
            placeholderTextColor="#9ca3af"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detailed description..."
            placeholderTextColor="#9ca3af"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ISSUE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  formData.category === cat.value && styles.categoryChipActive,
                ]}
                onPress={() => setFormData({ ...formData, category: cat.value })}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  formData.category === cat.value && styles.categoryTextActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {ISSUE_PRIORITY.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityButton,
                  formData.priority === p.value && styles.priorityButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, priority: p.value })}
              >
                <Text style={[
                  styles.priorityText,
                  formData.priority === p.value && styles.priorityTextActive,
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
          <Icon name="map-marker" size={24} color="#2563eb" />
          <Text style={styles.locationText}>
            {formData.location ? 'Location Captured' : 'Add Location'}
          </Text>
        </TouchableOpacity>
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
  submitTextDisabled: { opacity: 0.5 },
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  locationText: { fontSize: 16, color: '#2563eb', fontWeight: '500' },
});

export default IssueFormScreen;
