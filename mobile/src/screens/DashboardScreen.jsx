// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { issuesAPI, leaderboardAPI } from '../utils/api';
import { formatNumber } from '../utils/helpers';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, issuesRes, rankRes] = await Promise.all([
        issuesAPI.getStats(),
        issuesAPI.getMyIssues({ limit: 5 }),
        leaderboardAPI.getUserHistory(user.id),
      ]);

      setStats(statsRes.data);
      setRecentIssues(issuesRes.data.data.issues || []);
      setUserRank(rankRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return '#10b981';
      case 'in_progress':
        return '#f59e0b';
      case 'verified':
        return '#3b82f6';
      case 'pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const quickActions = [
    {
      icon: 'plus-circle',
      label: 'Report Issue',
      color: '#2563eb',
      onPress: () => navigation.navigate('Report'),
    },
    {
      icon: 'alert-circle',
      label: 'My Issues',
      color: '#f59e0b',
      onPress: () => navigation.navigate('Issues'),
    },
    {
      icon: 'trophy',
      label: 'Leaderboard',
      color: '#8b5cf6',
      onPress: () => navigation.navigate('Leaderboard'),
    },
    {
      icon: 'account',
      label: 'Profile',
      color: '#10b981',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadDashboardData} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Icon name="bell-outline" size={24} color="#1f2937" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.statCard}
          >
            <Icon name="alert-circle" size={32} color="#ffffff" />
            <Text style={styles.statValue}>{stats.data.overview.total}</Text>
            <Text style={styles.statLabel}>Total Issues</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statCard}
          >
            <Icon name="check-circle" size={32} color="#ffffff" />
            <Text style={styles.statValue}>{stats.data.overview.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.statCard}
          >
            <Icon name="clock-outline" size={32} color="#ffffff" />
            <Text style={styles.statValue}>{stats.data.overview.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </LinearGradient>
        </View>
      )}

      {/* User Rank */}
      {userRank && (
        <TouchableOpacity
          style={styles.rankCard}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <View style={styles.rankContent}>
            <View style={styles.rankIcon}>
              <Icon name="trophy" size={24} color="#fbbf24" />
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankTitle}>Your Community Rank</Text>
              <Text style={styles.rankValue}>#{userRank.rank}</Text>
            </View>
          </View>
          <View style={styles.rankDetails}>
            <View style={styles.rankDetailItem}>
              <Text style={styles.rankDetailValue}>{userRank.totalPoints}</Text>
              <Text style={styles.rankDetailLabel}>Points</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankDetailItem}>
              <Text style={styles.rankDetailValue}>{userRank.totalIssues}</Text>
              <Text style={styles.rankDetailLabel}>Issues</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={action.onPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Icon name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Issues */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Issues</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Issues')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="alert-circle-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No issues reported yet</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Report')}
            >
              <Text style={styles.emptyStateButtonText}>Report First Issue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.issuesList}>
            {recentIssues.map((issue) => (
              <TouchableOpacity
                key={issue._id}
                style={styles.issueCard}
                onPress={() => navigation.navigate('IssueDetail', { id: issue._id })}
              >
                <View style={styles.issueHeader}>
                  <Text style={styles.issueTitle} numberOfLines={1}>
                    {issue.title}
                  </Text>
                  <View
                    style={[
                      styles.issueStatus,
                      { backgroundColor: getStatusColor(issue.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.issueStatusText,
                        { color: getStatusColor(issue.status) },
                      ]}
                    >
                      {issue.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.issueDescription} numberOfLines={2}>
                  {issue.description}
                </Text>
                <View style={styles.issueFooter}>
                  <View style={styles.issueStats}>
                    <Icon name="thumb-up-outline" size={14} color="#6b7280" />
                    <Text style={styles.issueStatText}>{issue.upvoteCount || 0}</Text>
                  </View>
                  <View style={styles.issueStats}>
                    <Icon name="comment-outline" size={14} color="#6b7280" />
                    <Text style={styles.issueStatText}>{issue.commentCount || 0}</Text>
                  </View>
                  <Text style={styles.issueDate}>
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.9,
  },
  rankCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  rankValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  rankDetails: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  rankDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  rankDetailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  rankDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  rankDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  issuesList: {
    gap: 12,
  },
  issueCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  issueStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  issueStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  issueDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  issueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  issueStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  issueStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  issueDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 'auto',
  },
});

export default DashboardScreen;