import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { issuesAPI } from '../utils/api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    issues: 0,
    resolved: 0,
    points: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      /**
       * API CALLS (REAL BACKEND)
       * 1. /issues/stats/overview  -> issues, resolved, points
       * 2. /issues/my/issues       -> fallback + verification
       */
      const [statsRes, myIssuesRes] = await Promise.all([
        issuesAPI.getStats(),
        issuesAPI.getMyIssues({ limit: 100 }),
      ]);

      // ---- Parse stats overview ----
      const overview = statsRes?.data || statsRes || {};
      console.log("🔍 Fetched stats overview:", overview.data.overview.total);
      // ---- Parse my issues ----
      const issuesData = myIssuesRes?.data?.data || myIssuesRes?.data || {};
      const issuesList = issuesData.issues || [];
      console.log("🔍 Fetched issues for stats:", issuesList);
      const resolvedCount = issuesList.filter(
        (issue) => issue.status === 'resolved'
      ).length;

      setStats({
        issues: overview.data.overview.total ?? issuesList.length ?? 0,
        resolved: overview.resolvedIssues ?? resolvedCount ?? 0,
        points: overview.totalPoints ?? 0,
      });
      console.log("✅ Profile stats fetched:", overview);
    } catch (error) {
      console.log('❌ Profile stats error:', error);
      setStats({ issues: 0, resolved: 0, points: 0 });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: 'create', label: 'Edit Profile', onPress: () => {} },
    { icon: 'notifications', label: 'Notifications', onPress: () => {} },
    { icon: 'shield-checkmark', label: 'Privacy & Security', onPress: () => {} },
    { icon: 'help-circle', label: 'Help & Support', onPress: () => {} },
    { icon: 'information', label: 'About', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={48} color="#9ca3af" />
            </View>
          )}
          <TouchableOpacity style={styles.avatarEditButton}>
            <Icon name="camera" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem
            label="Issues"
            value={stats.issues}
            loading={statsLoading}
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Resolved"
            value={stats.resolved}
            loading={statsLoading}
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Points"
            value={stats.points}
            loading={statsLoading}
          />
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Icon name={item.icon} size={22} color="#2563eb" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

/* ---------- Small reusable stat component ---------- */
const StatItem = ({ label, value, loading }) => (
  <View style={styles.statItem}>
    {loading ? (
      <ActivityIndicator size="small" color="#2563eb" />
    ) : (
      <Text style={styles.statValue}>{value}</Text>
    )}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },

  profileCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },

  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  userName: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  userEmail: { fontSize: 14, color: '#6b7280', marginBottom: 20 },

  statsRow: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },

  menu: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: { fontSize: 16, color: '#1f2937' },

  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginVertical: 32,
  },
});

export default ProfileScreen;