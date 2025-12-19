// src/screens/IssueTrackingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { issuesAPI } from '../utils/api';
import { ISSUE_CATEGORIES, ISSUE_STATUS } from '../utils/constants';

const IssueTrackingScreen = ({ navigation }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadIssues(true);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const loadIssues = async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 10,
        q: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
      };

      const response = await issuesAPI.getAll(params);
      const newIssues = response.data.data.issues || [];
      
      if (reset) {
        setIssues(newIssues);
        setPage(2);
      } else {
        setIssues([...issues, ...newIssues]);
        setPage(currentPage + 1);
      }
      
      setHasMore(newIssues.length === 10);
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIssues(true);
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

  const renderIssueCard = ({ item }) => (
    <TouchableOpacity
      style={styles.issueCard}
      onPress={() => navigation.navigate('IssueDetail', { id: item._id })}
    >
      <View style={styles.issueHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryIcon}>
            {ISSUE_CATEGORIES.find(c => c.value === item.category)?.icon || '📋'}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={styles.issueTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.issueDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.issueFooter}>
        <View style={styles.issueStats}>
          <Icon name="map-marker" size={14} color="#6b7280" />
          <Text style={styles.issueStatText} numberOfLines={1}>
            {item.location?.address || 'Location not specified'}
          </Text>
        </View>
        <View style={styles.issueMetrics}>
          <View style={styles.metricItem}>
            <Icon name="thumb-up-outline" size={14} color="#6b7280" />
            <Text style={styles.metricText}>{item.upvoteCount || 0}</Text>
          </View>
          <View style={styles.metricItem}>
            <Icon name="comment-outline" size={14} color="#6b7280" />
            <Text style={styles.metricText}>{item.commentCount || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search issues..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Category:</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {/* Show category picker modal */}}
          >
            <Text style={styles.filterButtonText}>
              {selectedCategory || 'All'}
            </Text>
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {/* Show status picker modal */}}
          >
            <Text style={styles.filterButtonText}>
              {selectedStatus || 'All'}
            </Text>
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {(selectedCategory || selectedStatus) && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedCategory('');
              setSelectedStatus('');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="alert-circle-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No Issues Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedCategory || selectedStatus
          ? 'Try adjusting your filters'
          : 'Be the first to report an issue'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Community Issues</Text>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => {/* Navigate to map view */}}
        >
          <Icon name="map" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={issues}
        renderItem={renderIssueCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (hasMore && !loading) loadIssues(false);
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={issues.length === 0 ? styles.emptyContainer : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  filtersContainer: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    width: 70,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1f2937',
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  issueCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  issueDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  issueStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  issueStatText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  issueMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default IssueTrackingScreen;