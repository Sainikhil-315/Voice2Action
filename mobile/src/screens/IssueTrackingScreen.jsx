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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { issuesAPI } from '../utils/api';
import { ISSUE_CATEGORIES, ISSUE_STATUS } from '../utils/constants';
import { formatRelativeTime, getCategoryInfo } from '../utils/helpers';
import Toast from 'react-native-toast-message';

const IssueTrackingScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadIssues = useCallback(
    async (reset = false) => {
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
          text1: t('toast.failedToLoad'),
          text2: error.response?.data?.message || t('toast.pleaseRetry'),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [
      loading,
      loadingMore,
      page,
      searchQuery,
      selectedCategory,
      selectedStatus,
      issues,
      t,
    ],
  );

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

  const getSelectedCategory = () =>
    ISSUE_CATEGORIES.find(cat => cat.value === selectedCategory);

  const getStatusColor = status => {
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

  const getCategoryIcon = (category) => {
    const iconMap = {
      'road_maintenance': 'car-outline',
      'waste_management': 'trash-outline',
      'water_supply': 'water-outline',
      'electricity': 'flash-outline',
      'fire_safety': 'flame-outline',
      'public_transport': 'bus-outline',
      'parks_recreation': 'leaf-outline',
      'street_lighting': 'bulb-outline',
      'drainage': 'rainy-outline',
      'noise_pollution': 'volume-high-outline',
      'illegal_construction': 'construct-outline',
      'animal_control': 'paw-outline',
      'other': 'list-outline'
    };
    return iconMap[category] || 'help-outline';
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'road_maintenance': '#f97316',
      'waste_management': '#10b981',
      'water_supply': '#3b82f6',
      'electricity': '#fbbf24',
      'fire_safety': '#ef4444',
      'public_transport': '#8b5cf6',
      'parks_recreation': '#22c55e',
      'street_lighting': '#eab308',
      'drainage': '#06b6d4',
      'noise_pollution': '#dc2626',
      'illegal_construction': '#ea580c',
      'animal_control': '#92400e',
      'other': '#6b7280'
    };
    return colorMap[category] || '#6b7280';
  };

  const renderIssueCard = ({ item }) => {
    const categoryIcon = getCategoryIcon(item.category);
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => navigation.navigate('IssueDetail', { id: item._id })}
      >
        <View style={styles.issueHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Icon name={categoryIcon} size={20} color={categoryColor} />
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {t(`issues.statuses.${item.status.replace('_', '')}`)}
            </Text>
          </View>
        </View>

        <Text style={styles.issueTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.issueDescription} numberOfLines={3}>{item.description}</Text>

        {/* Authority and Estimated Time */}
        <View style={styles.geminiRow}>
          <Text style={styles.geminiLabel}>{t('issues.authority')}:</Text>
          <Text style={styles.geminiValue}>
            {item.assignedTo?.name ? item.assignedTo.name : '❓'}
          </Text>
        </View>
        <View style={styles.geminiRow}>
          <Text style={styles.geminiLabel}>{t('issues.estResolution')}:</Text>
          <Text style={styles.geminiValue}>
            {item.expectedResolutionTime ? new Date(item.expectedResolutionTime).toLocaleString() : '❓'}
          </Text>
        </View>

        <View style={styles.issueFooter}>
          <View style={styles.issueStats}>
            <Icon name="location" size={14} color="#6b7280" />
            <Text style={styles.issueStatText} numberOfLines={1}>
              {item.location?.address || t('issues.locationAdded')}
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

        <Text style={styles.issueTime}>{formatRelativeTime(item.createdAt)}</Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={20}
          color="#6b7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('issues.searchIssues')}
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
          <Text style={styles.filterLabel}>{t('issues.category')}</Text>

          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            {selectedCategory ? (
              <View style={styles.categorySelectorContent}>
                <View style={[styles.categorySelectorIconWrapper, { backgroundColor: getCategoryColor(selectedCategory) + '20' }]}>
                  <Icon 
                    name={getCategoryIcon(selectedCategory)} 
                    size={18} 
                    color={getCategoryColor(selectedCategory)} 
                  />
                </View>
                <Text style={styles.categorySelectorText}>
                  {t(`issues.categories.${getSelectedCategory()?.value}`)}
                </Text>
              </View>
            ) : (
              <View style={styles.categorySelectorContent}>
                <Icon name="apps-outline" size={18} color="#6b7280" />
                <Text style={styles.categorySelectorPlaceholder}>
                  {t('issues.allCategories')}
                </Text>
              </View>
            )}
            <Icon name="chevron-down" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t('issues.status')}</Text>
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
                {t('common.viewAll')}
              </Text>
            </TouchableOpacity>
            {ISSUE_STATUS.map(status => (
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
                    selectedStatus === status.value &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {t(`issues.statuses.${status.value.replace('_', '')}`)}
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
            <Text style={styles.clearFiltersText}>{t('common.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="file-tray-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>{t('issues.noIssuesFound')}</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedCategory || selectedStatus
          ? t('issues.adjustFilters')
          : t('dashboard.reportFirstIssue')}
      </Text>
      {!searchQuery && !selectedCategory && !selectedStatus && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('IssueForm')}
        >
          <Text style={styles.emptyStateButtonText}>{t('dashboard.reportIssue')}</Text>
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
        <Text style={styles.title}>{t('dashboard.myIssues')}</Text>
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
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={
          issues.length === 0 ? styles.emptyContainer : null
        }
      />

      {loading && issues.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>{t('issues.loadingIssues')}</Text>
        </View>
      )}
      
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('issues.selectCategory')}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  !selectedCategory && styles.categoryOptionSelected,
                ]}
                onPress={() => {
                  setSelectedCategory('');
                  setShowCategoryModal(false);
                }}
              >
                <View style={styles.categoryOptionLeft}>
                  <View style={styles.categoryModalIcon}>
                    <Icon name="apps-outline" size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.categoryOptionText}>{t('issues.allCategories')}</Text>
                </View>
                {!selectedCategory && (
                  <Icon name="checkmark-circle" size={22} color="#2563eb" />
                )}
              </TouchableOpacity>

              {ISSUE_CATEGORIES.map(cat => {
                const categoryIcon = getCategoryIcon(cat.value);
                const categoryColor = getCategoryColor(cat.value);
                
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      selectedCategory === cat.value &&
                        styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.value);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={styles.categoryOptionLeft}>
                      <View style={[styles.categoryModalIcon, { backgroundColor: categoryColor + '20' }]}>
                        <Icon name={categoryIcon} size={20} color={categoryColor} />
                      </View>
                      <Text style={styles.categoryOptionText}>
                        {t(`issues.categories.${cat.value}`)}
                      </Text>
                    </View>
                    {selectedCategory === cat.value && (
                      <Icon name="checkmark-circle" size={22} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  geminiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  geminiLabel: {
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
    fontSize: 13,
    width: 90,
  },
  geminiValue: {
    color: '#1f2937',
    fontSize: 13,
    flex: 1,
    flexWrap: 'wrap',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categorySelectorIcon: {
    fontSize: 16,
  },
  categorySelectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  categorySelectorPlaceholder: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  categoryOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryModalIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
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
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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