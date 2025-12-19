// ============================================
// src/screens/IssueDetailScreen.js
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { issuesAPI } from '../utils/api';
import { formatRelativeTime } from '../utils/helpers';

const IssueDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    loadIssue();
  }, [id]);

  const loadIssue = async () => {
    try {
      const response = await issuesAPI.getById(id);
      setIssue(response.data.data?.issue || response.data.issue || response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load issue details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      await issuesAPI.upvote(id);
      setIssue({
        ...issue,
        upvoteCount: (issue.upvoteCount || 0) + (issue.userHasUpvoted ? -1 : 1),
        userHasUpvoted: !issue.userHasUpvoted,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to upvote');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setCommenting(true);
    try {
      await issuesAPI.addComment(id, { message: comment });
      setComment('');
      loadIssue();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'verified': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Icon name="share-variant" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.issueHeader}>
          <Text style={styles.issueTitle}>{issue.title}</Text>
          <View style={styles.issueMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(issue.status) }]}>
                {issue.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.issueDate}>{formatRelativeTime(issue.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.issueDescription}>{issue.description}</Text>

        {issue.media && issue.media.length > 0 && (
          <ScrollView horizontal style={styles.mediaContainer}>
            {issue.media.map((media, index) => (
              <Image key={index} source={{ uri: media.url }} style={styles.mediaImage} />
            ))}
          </ScrollView>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpvote}>
            <Icon 
              name={issue.userHasUpvoted ? 'thumb-up' : 'thumb-up-outline'} 
              size={24} 
              color={issue.userHasUpvoted ? '#2563eb' : '#6b7280'} 
            />
            <Text style={styles.actionText}>{issue.upvoteCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="comment-outline" size={24} color="#6b7280" />
            <Text style={styles.actionText}>{issue.commentCount || 0}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({issue.comments?.length || 0})</Text>
          
          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#9ca3af"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !comment.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!comment.trim() || commenting}
            >
              {commenting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Icon name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          {issue.comments?.map((c) => (
            <View key={c._id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.user?.name || 'Anonymous'}</Text>
                <Text style={styles.commentDate}>{formatRelativeTime(c.createdAt)}</Text>
              </View>
              <Text style={styles.commentText}>{c.message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  shareButton: { padding: 4 },
  content: { flex: 1 },
  issueHeader: { padding: 20 },
  issueTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  issueMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  issueDate: { fontSize: 14, color: '#6b7280' },
  issueDescription: { paddingHorizontal: 20, fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 20 },
  mediaContainer: { paddingHorizontal: 20, marginBottom: 20 },
  mediaImage: { width: 200, height: 150, borderRadius: 12, marginRight: 12 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    gap: 24,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: { fontSize: 16, color: '#1f2937', fontWeight: '500' },
  commentsSection: { padding: 20 },
  commentsTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  commentInput: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  commentCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  commentDate: { fontSize: 12, color: '#6b7280' },
  commentText: { fontSize: 14, color: '#374151', lineHeight: 20 },
});

export default IssueDetailScreen;