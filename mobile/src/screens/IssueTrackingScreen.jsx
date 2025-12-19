// mobile/src/screens/IssueTrackingScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { issuesAPI } from '../utils/api';
import { ISSUE_CATEGORIES, ISSUE_STATUS } from '../utils/constants';
import { formatRelativeTime, getCategoryInfo } from '../utils/helpers';
import Toast from 'react-native-toast-message';

const IssueTrackingScreen = ({ navigation }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadIssues = useCallback(async (reset = false) => {
    if (loading || loadingMore) return;
    
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 10,
        q: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
      };

      const response = await issuesAPI.getMyIssues(params);
      const newIssues = response.data?.data?.issues || [];
      
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
      Toast.show({
        type: 'error',
        text1: 'Failed to load issues',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [loading, loadingMore, page, searchQuery, selectedCategory, selectedStatus, issues]);

  useEffect(() => {
    loadIssues(true);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadIssues(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadIssues(false);
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
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderIssueCard = ({ item }) => {
    const categoryInfo = getCategoryInfo(item.category);
    
    return (
      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => navigation.navigate('IssueDetail', { id: item._id })}
      >
        <View style={styles.issueHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
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
            <Icon name="location" size={14} color="#6b7280" />
            <Text style={styles.issueStatText} numberOfLines={1}>
              {item.location?.address || 'Location not specified'}
            </Text>
          </View>
          <View style={styles.issueMetrics}>
            <View style={styles.metricItem}>
              <Icon name="thumbs-up-outline" size={14} color="#6b7280" />
              <Text style={styles.metricText}>{item.upvoteCount || 0}</Text>
            </View>
            <View style={styles.metricItem}>
              <Icon name="chatbox-outline" size={14} color="#6b7280" />
              <Text style={styles.metricText}>{item.commentCount || 0}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.issueTime}>
          {formatRelativeTime(item.createdAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your issues..."
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
        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedCategory && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory('')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedCategory && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {ISSUE_CATEGORIES.slice(0, 5).map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.filterChip,
                  selectedCategory === cat.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text style={styles.filterChipIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === cat.value && styles.filterChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedStatus && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus('')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedStatus && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {ISSUE_STATUS.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.filterChip,
                  selectedStatus === status.value && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatus(status.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === status.value && styles.filterChipTextActive,
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {(selectedCategory || selectedStatus) && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSelectedCategory('');
              setSelectedStatus('');
            }}
          >
            <Icon name="close-circle" size={16} color="#ef4444" />
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="file-tray-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No Issues Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedCategory || selectedStatus
          ? 'Try adjusting your filters'
          : 'Start by reporting your first issue'}
      </Text>
      {!searchQuery && !selectedCategory && !selectedStatus && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('IssueForm')}
        >
          <Text style={styles.emptyStateButtonText}>Report Issue</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>My Issues</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('IssueForm')}
        >
          <Icon name="add" size={24} color="#ffffff" />
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={issues.length === 0 ? styles.emptyContainer : null}
      />

      {loading && issues.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading issues...</Text>
        </View>
      )}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
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
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  filterChipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 13,
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#ef4444',
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
    marginBottom: 8,
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
  issueTime: {
    fontSize: 12,
    color: '#9ca3af',
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
    paddingHorizontal: 40,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default IssueTrackingScreen;