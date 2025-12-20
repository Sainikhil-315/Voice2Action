import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { leaderboardAPI } from '../utils/api';

const LeaderboardScreen = () => {
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState([]);
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    activeContributors: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await leaderboardAPI.getMonthly();
      console.log('Leaderboard Response:', response.data);
      
      const leaderboardData = response.data?.data?.leaderboard || [];
      setLeaders(leaderboardData);
      
      const statsData = response.data?.data?.stats || {};
      setStats({
        totalIssues: statsData.totalIssues || statsData.overview?.total || 0,
        resolvedIssues: statsData.resolvedIssues || statsData.overview?.resolved || 0,
        activeContributors: statsData.activeContributors || statsData.overview?.uniqueUsers?.length || 0,
      });
      
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getTrophyColor = (rank) => {
    if (rank === 1) return '#fbbf24';
    if (rank === 2) return '#9ca3af';
    if (rank === 3) return '#cd7f32';
    return '#6b7280';
  };

  const calculateResolutionRate = () => {
    if (stats.totalIssues === 0) return 0;
    return Math.round((stats.resolvedIssues / stats.totalIssues) * 100);
  };

  const renderTopThree = () => {
    const top3 = leaders.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        {top3[1] && (
          <View style={[styles.podiumItem, styles.secondPlace]}>
            <View style={styles.podiumAvatar}>
              {top3[1].avatar ? (
                <Image source={{ uri: top3[1].avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={24} color="#9ca3af" />
                </View>
              )}
            </View>
            <View style={styles.podiumRank}>
              <Icon name="trophy" size={20} color={getTrophyColor(2)} />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top3[1].name || 'User'}
            </Text>
            <Text style={styles.podiumPoints}>{top3[1].points || 0} {t('leaderboard.pts')}</Text>
          </View>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <View style={[styles.podiumAvatar, styles.firstAvatar]}>
              {top3[0].avatar ? (
                <Image source={{ uri: top3[0].avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={28} color="#fbbf24" />
                </View>
              )}
            </View>
            <View style={styles.podiumRank}>
              <Icon name="ribbon" size={24} color={getTrophyColor(1)} />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top3[0].name || 'User'}
            </Text>
            <Text style={styles.podiumPoints}>{top3[0].points || 0} {t('leaderboard.pts')}</Text>
          </View>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <View style={[styles.podiumItem, styles.thirdPlace]}>
            <View style={styles.podiumAvatar}>
              {top3[2].avatar ? (
                <Image source={{ uri: top3[2].avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={24} color="#9ca3af" />
                </View>
              )}
            </View>
            <View style={styles.podiumRank}>
              <Icon name="trophy" size={20} color={getTrophyColor(3)} />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top3[2].name || 'User'}
            </Text>
            <Text style={styles.podiumPoints}>{top3[2].points || 0} {t('leaderboard.pts')}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.statsGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.statsTitle}>{t('leaderboard.communityImpact')}</Text>
      </LinearGradient>
      
      <View style={styles.statsContent}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalIssues}</Text>
          <Text style={styles.statLabel}>{t('leaderboard.totalIssues')}</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {stats.resolvedIssues}
          </Text>
          <Text style={styles.statLabel}>{t('leaderboard.resolved')}</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
            {stats.activeContributors}
          </Text>
          <Text style={styles.statLabel}>{t('leaderboard.contributors')}</Text>
        </View>
      </View>
      
      <View style={styles.resolutionRateContainer}>
        <View style={styles.resolutionRateHeader}>
          <Text style={styles.resolutionRateLabel}>{t('leaderboard.resolutionRate')}</Text>
          <Text style={styles.resolutionRateValue}>
            {calculateResolutionRate()}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${calculateResolutionRate()}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  const renderLeaderItem = ({ item, index }) => {
    if (index < 3) return null;

    return (
      <View style={styles.leaderItem}>
        <View style={styles.leaderLeft}>
          <Text style={styles.leaderRank}>#{index + 1}</Text>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.leaderAvatar} />
          ) : (
            <View style={styles.leaderAvatarPlaceholder}>
              <Icon name="person" size={20} color="#9ca3af" />
            </View>
          )}
          <View style={styles.leaderInfo}>
            <Text style={styles.leaderName}>{item.name || 'User'}</Text>
            <Text style={styles.leaderStats}>
              {item.issueCount || 0} {t('leaderboard.issues')} • {item.resolvedCount || 0} {t('leaderboard.resolvedCount')}
            </Text>
          </View>
        </View>
        <Text style={styles.leaderPoints}>{item.points || 0} {t('leaderboard.pts')}</Text>
      </View>
    );
  };

  if (loading && leaders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>{t('leaderboard.loadingLeaderboard')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>{t('leaderboard.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('leaderboard.subtitle')}</Text>
      </LinearGradient>

      <FlatList
        data={leaders}
        renderItem={renderLeaderItem}
        keyExtractor={(item, index) => `${item.userId || item._id}-${index}`}
        ListHeaderComponent={
          <>
            {renderTopThree()}
            {renderStatsCard()}
            {leaders.length > 3 && (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>{t('leaderboard.allRankings')}</Text>
              </View>
            )}
          </>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLeaderboard} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Icon name="trophy-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>{t('leaderboard.noData')}</Text>
              <Text style={styles.emptySubtext}>
                {t('leaderboard.beFirst')}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14, color: '#bfdbfe' },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: { marginBottom: 20 },
  secondPlace: { marginBottom: 10 },
  thirdPlace: { marginBottom: 0 },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  firstAvatar: { width: 80, height: 80, borderRadius: 40 },
  avatar: { width: '100%', height: '100%', borderRadius: 40 },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  statsContent: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  resolutionRateContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resolutionRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resolutionRateLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  resolutionRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  listContent: { paddingBottom: 20 },
  leaderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  leaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  leaderRank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    width: 40,
  },
  leaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  leaderAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderInfo: { flex: 1 },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  leaderStats: { fontSize: 12, color: '#6b7280' },
  leaderPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default LeaderboardScreen;