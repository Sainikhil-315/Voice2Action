// mobile/src/screens/DashboardScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { issuesAPI, leaderboardAPI } from '../utils/api';
import { formatNumber, formatRelativeTime } from '../utils/helpers';
import Toast from 'react-native-toast-message';
import LanguageSelector from '../components/LanguageSelector';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [userRank, setUserRank] = useState(null);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      const [statsRes, issuesRes, rankRes] = await Promise.all([
        issuesAPI.getStats(),
        issuesAPI.getMyIssues({ limit: 5, sort: '-createdAt' }),
        leaderboardAPI.getUserHistory(user.id),
      ]);

      const statsData = statsRes.data?.data || statsRes.data;
      const issuesData = issuesRes.data?.data?.issues || [];
      const rankData = rankRes.data?.data || rankRes.data;

      setStats(statsData);
      setRecentIssues(issuesData);
      setUserRank(rankData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Toast.show({
        type: 'error',
        text1: t('toast.failedToLoad'),
        text2: error.response?.data?.message || t('toast.pleaseRetry'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, t]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(true);
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
      icon: 'add-circle',
      label: t('dashboard.reportIssue'),
      color: '#2563eb',
      onPress: () => navigation.navigate('IssueForm'),
    },
    {
      icon: 'list',
      label: t('dashboard.myIssuesList'),
      color: '#f59e0b',
      onPress: () => navigation.navigate('IssueTracking'),
    },
    {
      icon: 'trophy',
      label: t('dashboard.leaderboard'),
      color: '#8b5cf6',
      onPress: () => navigation.navigate('Leaderboard'),
    },
    {
      icon: 'person',
      label: t('dashboard.profile'),
      color: '#10b981',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>{t('dashboard.loadingDashboard')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('dashboard.welcome')},</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <LanguageSelector style={styles.languageButton} />
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="notifications-outline" size={24} color="#1f2937" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statCard}>
            <Icon name="alert-circle" size={32} color="#ffffff" />
            <Text style={styles.statValue}>
              {formatNumber(userRank?.totalIssues || 0)}
            </Text>
            <Text style={styles.statLabel}>{t('dashboard.myIssues')}</Text>
          </LinearGradient>

          <LinearGradient colors={['#10b981', '#059669']} style={styles.statCard}>
            <Icon name="checkmark-circle" size={32} color="#ffffff" />
            <Text style={styles.statValue}>
              {formatNumber(userRank?.resolvedIssues || 0)}
            </Text>
            <Text style={styles.statLabel}>{t('dashboard.resolved')}</Text>
          </LinearGradient>

          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statCard}>
            <Icon name="time" size={32} color="#ffffff" />
            <Text style={styles.statValue}>
              {formatNumber(stats?.overview?.pending || 0)}
            </Text>
            <Text style={styles.statLabel}>{t('dashboard.pending')}</Text>
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
              <Text style={styles.rankTitle}>{t('dashboard.yourRank')}</Text>
              <Text style={styles.rankValue}>#{userRank.rank || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.rankDetails}>
            <View style={styles.rankDetailItem}>
              <Text style={styles.rankDetailValue}>
                {formatNumber(userRank.stats?.totalPoints || 0)}
              </Text>
              <Text style={styles.rankDetailLabel}>{t('dashboard.points')}</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankDetailItem}>
              <Text style={styles.rankDetailValue}>
                {formatNumber(userRank.totalIssues || 0)}
              </Text>
              <Text style={styles.rankDetailLabel}>{t('dashboard.issues')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={action.onPress}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: action.color + '20' },
                ]}
              >
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
          <Text style={styles.sectionTitle}>{t('dashboard.recentIssues')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('IssueTracking')}>
            <Text style={styles.sectionLink}>{t('common.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="alert-circle-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>{t('dashboard.noIssuesYet')}</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('IssueForm')}
            >
              <Text style={styles.emptyStateButtonText}>{t('dashboard.reportFirstIssue')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.issuesList}>
            {recentIssues.map((issue) => (
              <TouchableOpacity
                key={issue._id}
                style={styles.issueCard}
                onPress={() =>
                  navigation.navigate('IssueDetail', { id: issue._id })
                }
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
                      {t(`issues.statuses.${issue.status.replace('_', '')}`)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.issueDescription} numberOfLines={2}>
                  {issue.description}
                </Text>
                <View style={styles.issueFooter}>
                  <View style={styles.issueStats}>
                    <Icon name="thumbs-up-outline" size={14} color="#6b7280" />
                    <Text style={styles.issueStatText}>
                      {issue.upvoteCount || 0}
                    </Text>
                  </View>
                  <View style={styles.issueStats}>
                    <Icon name="chatbox-outline" size={14} color="#6b7280" />
                    <Text style={styles.issueStatText}>
                      {issue.commentCount || 0}
                    </Text>
                  </View>
                  <Text style={styles.issueDate}>
                    {formatRelativeTime(issue.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Community Impact */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.communityImpact')}</Text>
          <View style={styles.impactGrid}>
            <View style={styles.impactCard}>
              <View style={styles.impactIcon}>
                <Icon name="people" size={32} color="#2563eb" />
              </View>
              <Text style={styles.impactValue}>
                {formatNumber(stats.overview?.total || 0)}
              </Text>
              <Text style={styles.impactLabel}>{t('dashboard.totalIssues')}</Text>
            </View>

            <View style={styles.impactCard}>
              <View style={styles.impactIcon}>
                <Icon name="checkmark-done" size={32} color="#10b981" />
              </View>
              <Text style={styles.impactValue}>
                {formatNumber(stats.overview?.resolved || 0)}
              </Text>
              <Text style={styles.impactLabel}>{t('dashboard.resolved')}</Text>
            </View>

            <View style={styles.impactCard}>
              <View style={styles.impactIcon}>
                <Icon name="trending-up" size={32} color="#8b5cf6" />
              </View>
              <Text style={styles.impactValue}>
                {stats.overview?.resolutionRate || 0}%
              </Text>
              <Text style={styles.impactLabel}>{t('dashboard.resolutionRate')}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  languageButton: {
    marginRight: 0,
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
    paddingHorizontal: 4,
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
  impactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  impactIcon: {
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  impactLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DashboardScreen;