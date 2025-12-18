// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Settings,
  Trophy,
  BarChart3,
  Calendar,
  Lock,
  Bell,
  Palette,
  Globe,
  TrendingUp,
  Target,
  CheckCircle,
  Award,
  Star,
  Shield, 
  Smartphone, 
  Key, 
  AlertCircle,
  Copy, 
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { leaderboardAPI, issuesAPI } from '../utils/api'
import LoadingButton from '../components/common/LoadingButton'
import { SkeletonLoader } from '../components/common/Loader'
import { useForm } from 'react-hook-form'
import { formatNumber, formatRelativeTime } from '../utils/helpers'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { authAPI } from '../utils/api';

const Profile = () => {
  const { user, updateProfile, updateAvatar, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'stats', name: 'Statistics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'security', name: 'Security', icon: Lock }
  ]

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    
    setUploading(true)
    try {
      await updateAvatar(avatarFile)
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Profile photo updated successfully!')
    } catch (error) {
      console.error('Avatar upload failed:', error)
      toast.error('Failed to update profile photo')
    } finally {
      setUploading(false)
    }
  }

  const cancelAvatarChange = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {avatarPreview || user?.avatar ? (
                <img
                  src={avatarPreview || user.avatar}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 text-primary-600" />
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-2 cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-lg text-gray-600 mt-1">{user?.email}</p>
              <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    user?.role === 'admin' ? 'bg-purple-400' : 'bg-blue-400'
                  }`}></span>
                  <span className="capitalize font-medium">{user?.role} Account</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Joined {formatRelativeTime(user?.createdAt)}</span>
                </div>
                {user?.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {avatarPreview && (
              <div className="flex space-x-3">
                <button
                  onClick={cancelAvatarChange}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <LoadingButton
                  loading={uploading}
                  onClick={handleAvatarUpload}
                  className="btn btn-primary"
                >
                  Save Photo
                </LoadingButton>
              </div>
            )}
          </div>
          
          {/* Tabs */}
          <div className="mt-8">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 pb-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}

// Enhanced Stats Tab Component with Backend Integration
const StatsTab = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [userHistory, setUserHistory] = useState(null)
  const [recentIssues, setRecentIssues] = useState([])
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    loadUserStats()
  }, [user?.id])

  const loadUserStats = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [historyResponse, issuesResponse, achievementsResponse] = await Promise.all([
        leaderboardAPI.getUserHistory(user.id),
        issuesAPI.getMyIssues({ limit: 5, sort: '-createdAt' }),
        leaderboardAPI.getAchievements().catch(() => ({ data: [] }))
      ]);
      console.log('User History Response:', historyResponse);
      console.log('User Issues Response:', issuesResponse);
      console.log('Achievements Response:', achievementsResponse);

      // Defensive: support both .data and .data.data for issues
      const issuesData = issuesResponse.data?.data || issuesResponse.data || {};
      const issuesList = issuesData.issues || [];
      const totalIssues = issuesData.total || issuesList.length;
      console.log('Issues Data:', issuesData);
      console.log('Parsed Issues List:', issuesList);
      console.log('Total Issues:', totalIssues);
      // Defensive: support both .data and .data.data for history
      const historyData = historyResponse.data || historyResponse;

      // Patch recent issues for id/_id and upvotes/comments
      const mappedIssues = issuesList.map(issue => ({
        ...issue,
        id: issue.id || issue._id,
        upvotes: issue.upvotes || issue.upvoteCount || 0,
        comments: issue.comments || issue.commentCount || 0
      }));
      setRecentIssues(mappedIssues);
      console.log('Mapped Recent Issues:', mappedIssues);
      setAchievements(achievementsResponse.data || []);

      // Calculate additional stats
      const resolvedIssues = mappedIssues.filter(issue => issue.status === 'resolved').length || 0;
      // Use user.stats if available for fallback
      const userStats = user.stats || {};
      console.log('User Stats Fallback:', userStats);
      setStats({
        issuesReported: historyData.data.totalIssues || 0,
        issuesResolved: resolvedIssues || userStats.issuesResolved || 0,
        totalPoints: historyData.data.totalPoints ?? userStats.contributionScore ?? 0,
        currentRank: historyData.data.rank ?? 0,
        monthlyPoints: historyData.data.monthlyPoints ?? 0,
        contributions: historyData.data.monthlyContributions ?? [],
        resolutionRate: (historyData.data.totalIssues > 0 ? Math.round((resolvedIssues / historyData.data.totalIssues) * 100) : 0),
        monthlyIssues: historyData.data.monthlyIssues ?? 0,
        rankChange: historyData.data.rankChange ?? 0
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
              <SkeletonLoader lines={3} />
            </div>
          ))}
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <SkeletonLoader lines={8} />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Statistics Available</h3>
        <p className="text-gray-600 mb-6">Start reporting issues to see your contribution statistics</p>
        <Link href="/report" className="btn btn-primary">
          Report Your First Issue
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issues Reported</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(stats.issuesReported)}</p>
              <p className="text-sm text-blue-600 mt-1">+{stats.monthlyIssues || 0} this month</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issues Resolved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(stats.issuesResolved)}</p>
              <p className="text-sm text-green-600 mt-1">{stats.resolutionRate}% success rate</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Community Points</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(stats.totalPoints)}</p>
              <p className="text-sm text-yellow-600 mt-1">+{stats.monthlyPoints} this month</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Community Rank</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">#{stats.currentRank}</p>
              <p className="text-sm text-purple-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.rankChange > 0 ? `↑${stats.rankChange}` : stats.rankChange < 0 ? `↓${Math.abs(stats.rankChange)}` : 'No change'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Contributions Chart */}
      {stats.contributions && stats.contributions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Contributions</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={stats.contributions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="issues" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Issues Reported"
                />
                <Line 
                  type="monotone" 
                  dataKey="points" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Points Earned"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Issues</h3>
          
          {recentIssues.length > 0 ? (
            <div className="space-y-4">
              {recentIssues.map(issue => (
                <div key={issue._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{issue.title}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        issue.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                        issue.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span>{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                  </div>
                  {/* <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>👍 {issue.upvotes || 0}</span>
                    <span>💬 {issue.comments || 0}</span>
                  </div> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No issues yet</h4>
              <p className="text-gray-600 mb-4">Start contributing to your community</p>
              <Link href="/report" className="btn btn-primary">
                Report First Issue
              </Link>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Achievements</h3>
          
          <div className="space-y-4">
            {/* Dynamic achievements based on user stats */}
            {stats.issuesReported >= 1 && (
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="p-2 bg-yellow-100 rounded-full mr-4">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">First Reporter</h4>
                  <p className="text-sm text-gray-600">Reported your first civic issue</p>
                </div>
              </div>
            )}
            
            {stats.issuesReported >= 10 && (
              <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="p-2 bg-blue-100 rounded-full mr-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Active Reporter</h4>
                  <p className="text-sm text-gray-600">Reported 10+ civic issues</p>
                </div>
              </div>
            )}
            
            {stats.issuesResolved >= 5 && (
              <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="p-2 bg-green-100 rounded-full mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Problem Solver</h4>
                  <p className="text-sm text-gray-600">5+ issues resolved</p>
                </div>
              </div>
            )}
            
            {stats.currentRank <= 10 && stats.currentRank > 0 && (
              <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="p-2 bg-purple-100 rounded-full mr-4">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Top Contributor</h4>
                  <p className="text-sm text-gray-600">Ranked in top 10 contributors</p>
                </div>
              </div>
            )}
            
            {/* Show message if no achievements */}
            {stats.issuesReported === 0 && (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h4>
                <p className="text-gray-600">Start reporting issues to unlock achievements</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Profile Tab
const ProfileTab = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    getValues,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        {!isEditing ? (
          <button className="btn btn-outline" onClick={handleEdit}>
            Edit
          </button>
        ) : (
          isDirty && <span className="text-sm text-black">You have unsaved changes</span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
              type="text"
              className={`form-input w-full text-black ${errors.name ? 'border-red-300 focus:border-red-500' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address',
                },
              })}
              type="email"
              className={`form-input w-full text-black ${errors.email ? 'border-red-300 focus:border-red-500' : ''}`}
              placeholder="Enter your email address"
              readOnly={!isEditing}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              {...register('phone', {
                pattern: {
                  value: /^[0-9+\-\s\(\)]+$/,
                  message: 'Please enter a valid phone number',
                },
              })}
              type="tel"
              className={`form-input w-full text-black ${errors.phone ? 'border-red-300 focus:border-red-500' : ''}`}
              placeholder="Enter your phone number"
              readOnly={!isEditing}
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              {...register('location')}
              type="text"
              className="form-input w-full text-black"
              placeholder="Enter your city/area"
              readOnly={!isEditing}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            {...register('bio', {
              maxLength: { value: 500, message: 'Bio must be less than 500 characters' },
            })}
            rows={4}
            className={`form-textarea w-full text-black ${errors.bio ? 'border-red-300 focus:border-red-500' : ''}`}
            placeholder="Tell us about yourself... (optional)"
            readOnly={!isEditing}
          />
          {errors.bio && <p className="text-red-600 text-sm mt-1">{errors.bio.message}</p>}
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="btn btn-outline disabled:opacity-50"
            >
              Cancel
            </button>
            <LoadingButton
              loading={loading}
              type="submit"
              disabled={!isDirty || loading}
              className="btn btn-primary disabled:opacity-50"
            >
              Save Changes
            </LoadingButton>
          </div>
        )}
      </form>
    </div>
  );
};

// Enhanced Settings Tab
const SettingsTab = () => {
  const { user, updateProfile } = useAuth();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    language: 'en',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        emailNotifications: user.preferences.emailNotifications ?? true,
        smsNotifications: user.preferences.smsNotifications ?? false,
        language: user.preferences.language || 'en',
      });
    }
  }, [user]);

  const handlePrefChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({ preferences });
      if (result.success) {
        toast.success('Preferences updated!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive issue updates and announcements via email</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) => handlePrefChange('emailNotifications', e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-600">Receive text messages for urgent updates</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.smsNotifications}
              onChange={(e) => handlePrefChange('smsNotifications', e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Language</p>
                <p className="text-sm text-gray-600">Preferred language for notifications</p>
              </div>
            </div>
            <select
              value={preferences.language}
              onChange={(e) => handlePrefChange('language', e.target.value)}
              className="form-select w-32"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
              <option value="ta">தமிழ்</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <LoadingButton
            loading={saving}
            onClick={saveSettings}
            className="btn btn-primary"
          >
            Save Preferences
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

// Security Tab Component
const SecurityTab = () => {
  const { user, changePassword, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState({
    qrCode: null,
    secret: null,
    backupCodes: [],
    showSetup: false,
    verifying: false
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch
  } = useForm();

  const {
    register: register2FA,
    handleSubmit: handle2FASubmit,
    formState: { errors: twoFAErrors },
    reset: reset2FAForm
  } = useForm();

  const newPassword = watch("newPassword");

  // Load 2FA status on component mount
  useEffect(() => {
    if (user?.twoFactorEnabled) {
      loadBackupCodes();
    }
  }, [user]);

  const loadBackupCodes = async () => {
    try {
      const response = await authAPI.get2FABackupCodes();
      if (response.data.success) {
        setTwoFactorSetup(prev => ({
          ...prev,
          backupCodes: response.data.data.backupCodes
        }));
      }
    } catch (error) {
      console.error('Failed to load backup codes:', error);
    }
  };

  // Password Change Handler
  const onPasswordSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      if (result.success) {
        resetPasswordForm();
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Setup 2FA - Request QR Code
  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const response = await authAPI.setup2FA();
      
      if (response.data.success) {
        setTwoFactorSetup({
          qrCode: response.data.data.qrCode,
          secret: response.data.data.secret,
          backupCodes: [],
          showSetup: true,
          verifying: false
        });
        toast.success('Scan QR code with your authenticator app');
      }
    } catch (error) {
      console.error('2FA setup failed:', error);
      toast.error('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Verify and Enable 2FA
  const onVerify2FA = async (data) => {
    setTwoFactorSetup(prev => ({ ...prev, verifying: true }));
    try {
      console.log('Sending verification code:', data.verificationCode);
      
      const response = await authAPI.verify2FA({
        token: data.verificationCode.trim()
      });
      
      console.log('2FA verification response:', response);
      
      if (response.data.success) {
        // Update user profile with 2FA enabled
        await updateProfile({ twoFactorEnabled: true });
        
        setTwoFactorSetup({
          qrCode: null,
          secret: null,
          backupCodes: response.data.data.backupCodes,
          showSetup: false,
          verifying: false
        });
        
        toast.success('Two-Factor Authentication enabled successfully!');
        reset2FAForm();
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Invalid verification code. Please try again.';
      toast.error(errorMessage);
    } finally {
      setTwoFactorSetup(prev => ({ ...prev, verifying: false }));
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.disable2FA();
      
      if (response.data.success) {
        await updateProfile({ twoFactorEnabled: false });
        setTwoFactorSetup({
          qrCode: null,
          secret: null,
          backupCodes: [],
          showSetup: false,
          verifying: false
        });
        toast.success('Two-Factor Authentication disabled');
      }
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate Backup Codes
  const handleRegenerateBackupCodes = async () => {
    if (!window.confirm('This will invalidate your current backup codes. Make sure to save the new ones. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.regenerateBackupCodes();
      
      if (response.data.success) {
        setTwoFactorSetup(prev => ({
          ...prev,
          backupCodes: response.data.data.backupCodes
        }));
        toast.success('Backup codes regenerated successfully');
      }
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      toast.error('Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  // Copy Secret to Clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-8">
      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-600">Update your password regularly to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <input
              {...registerPassword("currentPassword", {
                required: "Current password is required",
              })}
              type="password"
              className="form-input w-full text-black"
              placeholder="Enter current password"
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-600 text-sm mt-1">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <input
              {...registerPassword("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Password must contain uppercase, lowercase, and number",
                },
              })}
              type="password"
              className="form-input w-full text-black"
              placeholder="Enter new password"
            />
            {passwordErrors.newPassword && (
              <p className="text-red-600 text-sm mt-1">
                {passwordErrors.newPassword.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <input
              {...registerPassword("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === newPassword || "Passwords do not match",
              })}
              type="password"
              className="form-input w-full text-black"
              placeholder="Confirm new password"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">
                {passwordErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <LoadingButton
            loading={loading}
            type="submit"
            className="btn btn-primary"
          >
            Update Password
          </LoadingButton>
        </form>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          {user?.twoFactorEnabled && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Enabled
            </span>
          )}
        </div>

        {!user?.twoFactorEnabled && !twoFactorSetup.showSetup && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">Secure Your Account</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Two-Factor Authentication (2FA) adds an extra layer of security by requiring a verification code from your authenticator app in addition to your password.
                </p>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Compatible with Google Authenticator, Authy, and other TOTP apps
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Backup codes provided for account recovery
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    Protects against unauthorized access
                  </li>
                </ul>
                <LoadingButton
                  loading={loading}
                  onClick={handleSetup2FA}
                  className="btn btn-primary"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Enable Two-Factor Authentication
                </LoadingButton>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Setup Flow */}
        {twoFactorSetup.showSetup && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                Scan QR Code
              </h4>
              
              <div className="bg-white p-4 rounded-lg border inline-block">
                {twoFactorSetup.qrCode && (
                  <img src={twoFactorSetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              {twoFactorSetup.secret && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Can't scan? Enter this code manually:</p>
                  <div className="flex items-center space-x-2">
                    <code className="px-3 py-2 bg-gray-100 rounded text-sm font-mono flex-1">
                      {twoFactorSetup.secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(twoFactorSetup.secret, 'Secret key')}
                      className="btn btn-outline p-2"
                      title="Copy secret key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                Verify Setup
              </h4>
              
              <form onSubmit={handle2FASubmit(onVerify2FA)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 6-digit code from your authenticator app
                  </label>
                  <input
                    {...register2FA("verificationCode", {
                      required: "Verification code is required",
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: "Code must be 6 digits"
                      }
                    })}
                    type="text"
                    maxLength="6"
                    className="form-input w-full max-w-xs text-center text-2xl tracking-widest font-mono text-black"
                    placeholder="000000"
                    autoComplete="off"
                  />
                  {twoFAErrors.verificationCode && (
                    <p className="text-red-600 text-sm mt-1">
                      {twoFAErrors.verificationCode.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <LoadingButton
                    loading={twoFactorSetup.verifying}
                    type="submit"
                    className="btn btn-primary"
                  >
                    Verify and Enable
                  </LoadingButton>
                  <button
                    type="button"
                    onClick={() => setTwoFactorSetup({ ...twoFactorSetup, showSetup: false })}
                    className="btn btn-outline"
                    disabled={twoFactorSetup.verifying}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2FA Enabled - Show Management Options */}
        {user?.twoFactorEnabled && !twoFactorSetup.showSetup && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Two-Factor Authentication is active</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your account is protected with an additional security layer
              </p>
            </div>

            {/* Backup Codes */}
            {twoFactorSetup.backupCodes.length > 0 && (
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-start mb-4">
                  <Key className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">Backup Recovery Codes</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Save these codes in a secure place. Each code can be used once if you lose access to your authenticator app.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {twoFactorSetup.backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-3 rounded border font-mono text-sm text-center">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const codesText = twoFactorSetup.backupCodes.join('\n');
                      copyToClipboard(codesText, 'Backup codes');
                    }}
                    className="btn btn-outline text-sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Codes
                  </button>
                  <LoadingButton
                    loading={loading}
                    onClick={handleRegenerateBackupCodes}
                    className="btn btn-outline text-sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Codes
                  </LoadingButton>
                </div>
              </div>
            )}

            {/* Disable 2FA */}
            <div className="pt-6 border-t">
              <LoadingButton
                loading={loading}
                onClick={handleDisable2FA}
                className="btn btn-danger"
              >
                Disable Two-Factor Authentication
              </LoadingButton>
              <p className="text-sm text-gray-500 mt-2">
                This will make your account less secure. Not recommended.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions (Existing) */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Active Sessions</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <p className="font-medium text-gray-900">Current Session</p>
              <p className="text-sm text-gray-600">Chrome on Windows • India</p>
              <p className="text-xs text-gray-500">Last active: Now</p>
            </div>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
