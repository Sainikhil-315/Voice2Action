// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { issuesAPI } from '../utils/api';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await issuesAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const features = [
    {
      icon: 'camera',
      title: 'Multi-Media Reporting',
      description: 'Report with photos, videos, or voice',
      color: '#3b82f6',
    },
    {
      icon: 'location',
      title: 'GPS Location',
      description: 'Auto-tag locations precisely',
      color: '#10b981',
    },
    {
      icon: 'notifications',
      title: 'Real-Time Updates',
      description: 'Get instant notifications',
      color: '#f59e0b',
    },
    {
      icon: 'chatbubbles',
      title: 'Track Progress',
      description: 'Monitor from start to resolution',
      color: '#8b5cf6',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#2563eb', '#1e40af']}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Voice Your{'\n'}Civic Concerns</Text>
          <Text style={styles.heroSubtitle}>
            Report issues with photos, videos, and voice. Track progress in real-time.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Icon name="arrow-forward" size={20} color="#1f2937" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          {stats && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.data.overview.total}</Text>
                <Text style={styles.statLabel}>Issues Reported</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.data.overview.resolved}</Text>
                <Text style={styles.statLabel}>Issues Resolved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.data.overview.resolutionRate}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Powerful Features</Text>
        <Text style={styles.sectionSubtitle}>
          Everything you need to report and track civic issues
        </Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Icon name={feature.icon} size={28} color={feature.color} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.stepsContainer}>
          {[
            { step: 1, title: 'Report Issue', description: 'Take a photo or record details' },
            { step: 2, title: 'Admin Reviews', description: 'Verification and forwarding' },
            { step: 3, title: 'Authority Acts', description: 'Work begins on resolution' },
            { step: 4, title: 'Track Progress', description: 'Real-time status updates' },
          ].map((item) => (
            <View key={item.step} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{item.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={['#2563eb', '#1e40af']}
        style={styles.ctaSection}
      >
        <Text style={styles.ctaTitle}>Ready to Make a Difference?</Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands improving their communities
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.ctaButtonText}>Start Reporting Issues</Text>
          <Icon name="arrow-forward" size={20} color="#1f2937" />
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  statLabel: {
    fontSize: 12,
    color: '#bfdbfe',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    width: (width - 56) / 2,
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  ctaSection: {
    padding: 32,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  ctaButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;