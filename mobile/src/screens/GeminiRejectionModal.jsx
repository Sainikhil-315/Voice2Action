import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const GeminiRejectionModal = ({ visible, onClose, rejectionData }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    if (visible) {
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
  }, [visible]);

  // Parse rejection data
  const {
    reason = 'Your submission did not meet our quality standards.',
    suggestions = [],
    category = 'content_quality',
    severity = 'medium'
  } = rejectionData || {};

  // Get icon and colors based on category
  const getCategoryConfig = () => {
    switch (category) {
      case 'inappropriate_content':
        return {
          icon: 'warning',
          gradient: ['#ef4444', '#dc2626'],
          color: '#ef4444',
          title: 'Inappropriate Content',
          description: 'Your submission contains content that violates our community guidelines.'
        };
      case 'spam':
        return {
          icon: 'ban',
          gradient: ['#f59e0b', '#d97706'],
          color: '#f59e0b',
          title: 'Spam Detected',
          description: 'This appears to be spam or duplicate content.'
        };
      case 'insufficient_information':
        return {
          icon: 'information-circle',
          gradient: ['#3b82f6', '#2563eb'],
          color: '#3b82f6',
          title: 'More Information Needed',
          description: 'Please provide more details to help us process your report.'
        };
      case 'content_quality':
      default:
        return {
          icon: 'alert-circle',
          gradient: ['#8b5cf6', '#7c3aed'],
          color: '#8b5cf6',
          title: 'Quality Standards',
          description: 'Your submission needs improvement to meet our standards.'
        };
    }
  };

  const config = getCategoryConfig();

  // Auto-generated suggestions if none provided
  const defaultSuggestions = [
    'Provide more specific details about the issue',
    'Include clear photos showing the problem',
    'Add the exact location where the issue occurred',
    'Describe the impact this issue has on the community'
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={config.gradient}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Icon name={config.icon} size={40} color="#ffffff" />
              </View>
              <View style={styles.pulseRing} />
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView 
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Title */}
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.description}</Text>

              {/* Reason Card */}
              <View style={styles.reasonCard}>
                <View style={styles.reasonHeader}>
                  <Icon name="document-text" size={20} color={config.color} />
                  <Text style={styles.reasonTitle}>Rejection Reason</Text>
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>

              {/* Suggestions Section */}
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsHeader}>
                  <Icon name="bulb" size={20} color="#fbbf24" />
                  <Text style={styles.suggestionsTitle}>How to Improve</Text>
                </View>

                {displaySuggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <View style={styles.suggestionNumber}>
                      <Text style={styles.suggestionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>

              {/* Help Section */}
              <View style={styles.helpSection}>
                <Icon name="help-circle-outline" size={18} color="#6b7280" />
                <Text style={styles.helpText}>
                  Need help? Check our{' '}
                  <Text style={styles.helpLink}>community guidelines</Text>
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: config.color }]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
              <Icon name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
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
  modalHeader: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  contentContainer: {
    maxHeight: 400,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  reasonCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
  },
  reasonText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  suggestionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  suggestionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  helpLink: {
    color: '#2563eb',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default GeminiRejectionModal;