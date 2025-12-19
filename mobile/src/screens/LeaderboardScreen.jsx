import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { leaderboardAPI } from '../utils/api';

const LeaderboardScreen = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await leaderboardAPI.getMonthly();
      setLeaders(response.data.data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
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

  const renderTopThree = () => {
    const top3 = leaders.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <View style={styles.podiumContainer}>
        {top3[1] && (
          <View style={[styles.podiumItem, styles.secondPlace]}>
            <View style={styles.podiumAvatar}>
              {top3[1].user?.avatar ? (
                <Image source={{ uri: top3[1].user.avatar }} style={styles.avatar} />
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
              {top3[1].user?.name || 'User'}
            </Text>
            <Text style={styles.podiumPoints}>{top3[1].totalPoints} pts</Text>
          </View>
        )}

        {top3[0] && (
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <View style={[styles.podiumAvatar, styles.firstAvatar]}>
              {top3[0].user?.avatar ? (
                <Image source={{ uri: top3[0].user.avatar }} style={styles.avatar} />
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
              {top3[0].user?.name || 'User'}
            </Text>
            <Text style={styles.podiumPoints}>{top3[0].totalPoints} pts</Text>
          </View>
        )}

        {top3[2] && (
          <View style={[styles.podiumItem, styles.thirdPlace]}>
            <View style={styles.podiumAvatar}>
              {top3[2].user?.avatar ? (
                <Image source={{ uri: top3[2].user.avatar }} style={styles.avatar} />
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
              {top3[2].user?.name || 'User'}
            </Text>
            <Text style={styles.podiumPoints}>{top3[2].totalPoints} pts</Text>
          </View>
        )}
      </View>
    );
  };

  const renderLeaderItem = ({ item, index }) => {
    if (index < 3) return null;

    return (
      <View style={styles.leaderItem}>
        <View style={styles.leaderLeft}>
          <Text style={styles.leaderRank}>#{index + 1}</Text>
          {item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={styles.leaderAvatar} />
          ) : (
            <View style={styles.leaderAvatarPlaceholder}>
              <Icon name="person" size={20} color="#9ca3af" />
            </View>
          )}
          <View style={styles.leaderInfo}>
            <Text style={styles.leaderName}>{item.user?.name || 'User'}</Text>
            <Text style={styles.leaderStats}>
              {item.totalIssues} issues • {item.resolvedIssues} resolved
            </Text>
          </View>
        </View>
        <Text style={styles.leaderPoints}>{item.totalPoints} pts</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2563eb', '#1e40af']} style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top Community Contributors</Text>
      </LinearGradient>

      <FlatList
        data={leaders}
        renderItem={renderLeaderItem}
        keyExtractor={(item, index) => `${item.user?._id}-${index}`}
        ListHeaderComponent={renderTopThree()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLeaderboard} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
});

export default LeaderboardScreen;