import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Mail, Phone, MapPin, Building, Users, Search, 
  Filter, X, TrendingUp, Award, Clock, CheckCircle, AlertCircle,
  ChevronDown, BarChart3, Layers, MapPinned, SlidersHorizontal
} from 'lucide-react';
import { authoritiesAPI } from '../../utils/api';
import { formatRelativeTime } from '../../utils/helpers';
import { ISSUE_CATEGORIES, DISTRICTS_BY_STATE, MUNICIPALITIES_BY_DISTRICT, INDIAN_STATES } from '../../utils/constants';
import LoadingButton from '../common/LoadingButton';
import { SkeletonLoader } from '../common/Loader';
import toast from 'react-hot-toast';

const AuthorityManager = () => {
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    searchQuery: '',
    department: '',
    jurisdictionLevel: '', // 'state', 'district', 'municipality'
    state: '',
    district: '',
    municipality: '',
    status: '',
    sortBy: 'name', // 'name', 'rating', 'resolved', 'assignedIssues', 'resolutionTime'
    sortOrder: 'asc' // 'asc', 'desc'
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byLevel: { state: 0, district: 0, municipality: 0 }
  });

  useEffect(() => {
    loadAuthorities();
  }, [filters]);

  const loadAuthorities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.searchQuery) params.search = filters.searchQuery;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;
      if (filters.state) params.state = filters.state;
      if (filters.district) params.district = filters.district;
      if (filters.municipality) params.municipality = filters.municipality;
      if (filters.jurisdictionLevel) params.jurisdictionLevel = filters.jurisdictionLevel;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;
      
      const response = await authoritiesAPI.getAll(params);
      let authoritiesData = response.data.data.authorities || [];
      
      // Client-side jurisdiction level filter
      if (filters.jurisdictionLevel) {
        authoritiesData = authoritiesData.filter(auth => {
          const hasDistrict = auth.jurisdiction?.district;
          const hasMunicipality = auth.jurisdiction?.municipality;
          
          if (filters.jurisdictionLevel === 'state') return !hasDistrict && !hasMunicipality;
          if (filters.jurisdictionLevel === 'district') return hasDistrict && !hasMunicipality;
          if (filters.jurisdictionLevel === 'municipality') return hasMunicipality;
          return true;
        });
      }

      // Client-side sorting by performance metrics
      if (filters.sortBy && filters.sortBy !== 'name') {
        authoritiesData.sort((a, b) => {
          let aVal, bVal;
          
          switch (filters.sortBy) {
            case 'rating':
              aVal = a.performanceMetrics?.rating || 0;
              bVal = b.performanceMetrics?.rating || 0;
              break;
            case 'resolved':
              aVal = a.performanceMetrics?.resolvedIssues || 0;
              bVal = b.performanceMetrics?.resolvedIssues || 0;
              break;
            case 'assignedIssues':
              aVal = a.performanceMetrics?.totalAssignedIssues || 0;
              bVal = b.performanceMetrics?.totalAssignedIssues || 0;
              break;
            case 'resolutionTime':
              aVal = a.performanceMetrics?.averageResolutionTime || 999999;
              bVal = b.performanceMetrics?.averageResolutionTime || 999999;
              break;
            default:
              aVal = 0;
              bVal = 0;
          }
          
          return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }

      setAuthorities(authoritiesData);
      
      // Calculate stats
      const totalCount = authoritiesData.length;
      const activeCount = authoritiesData.filter(a => a.status === 'active').length;
      const inactiveCount = totalCount - activeCount;
      
      const byLevel = {
        state: authoritiesData.filter(a => !a.jurisdiction?.district && !a.jurisdiction?.municipality).length,
        district: authoritiesData.filter(a => a.jurisdiction?.district && !a.jurisdiction?.municipality).length,
        municipality: authoritiesData.filter(a => a.jurisdiction?.municipality).length
      };
      
      setStats({
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        byLevel
      });
      
    } catch (error) {
      console.error('Error loading authorities:', error);
      toast.error('Failed to load authorities');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters
      if (key === 'state') {
        newFilters.district = '';
        newFilters.municipality = '';
      }
      if (key === 'district') {
        newFilters.municipality = '';
      }
      if (key === 'jurisdictionLevel') {
        if (value === 'state') {
          newFilters.district = '';
          newFilters.municipality = '';
        } else if (value === 'district') {
          newFilters.municipality = '';
        }
      }
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      department: '',
      jurisdictionLevel: '',
      state: '',
      district: '',
      municipality: '',
      status: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'name' && v !== 'asc');

  const handleCreateAuthority = () => {
    setEditingAuthority(null);
    setShowModal(true);
  };

  const handleEditAuthority = (authority) => {
    setEditingAuthority(authority);
    setShowModal(true);
  };

  const handleDeleteAuthority = async (authorityId) => {
    if (!confirm('Are you sure you want to delete this authority? This action cannot be undone.')) {
      return;
    }

    try {
      await authoritiesAPI.delete(authorityId);
      setAuthorities(prev => prev.filter(auth => auth._id !== authorityId));
      toast.success('Authority deleted successfully');
    } catch (error) {
      console.error('Error deleting authority:', error);
      toast.error('Failed to delete authority');
    }
  };

  const getJurisdictionBadge = (authority) => {
    const { state, district, municipality } = authority.jurisdiction || {};
    
    if (municipality) {
      return {
        icon: <MapPinned className="w-3 h-3" />,
        text: 'Municipality',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      };
    } else if (district) {
      return {
        icon: <Layers className="w-3 h-3" />,
        text: 'District',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      };
    } else {
      return {
        icon: <MapPin className="w-3 h-3" />,
        text: 'State',
        color: 'bg-green-100 text-green-700 border-green-200'
      };
    }
  };

  const getJurisdictionDisplay = (authority) => {
    const { state, district, municipality } = authority.jurisdiction || {};
    return [municipality, district, state].filter(Boolean).join(', ') || 'N/A';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const departments = [...new Set(ISSUE_CATEGORIES?.map(cat => cat.label))];
  const availableDistricts = filters.state ? DISTRICTS_BY_STATE[filters.state] || [] : [];
  const availableMunicipalities = filters.district ? MUNICIPALITIES_BY_DISTRICT[filters.district] || [] : [];

  if (loading && authorities?.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader lines={2} className="mb-8" />
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <SkeletonLoader lines={10} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building className="w-8 h-8 mr-3 text-blue-600" />
                Authority Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage government departments and authority contacts across all levels
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              <button
                onClick={handleCreateAuthority}
                className="btn btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Authority
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Building className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-medium">Active</p>
                  <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-medium">State</p>
                  <p className="text-2xl font-bold text-green-900">{stats.byLevel.state}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-medium">District</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.byLevel.district}</p>
                </div>
                <Layers className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-700 font-medium">Municipal</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.byLevel.municipality}</p>
                </div>
                <MapPinned className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Advanced Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Authorities
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    className="pl-10 form-input w-full text-black"
                  />
                </div>
              </div>

              {/* Jurisdiction Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurisdiction Level
                </label>
                <select
                  value={filters.jurisdictionLevel}
                  onChange={(e) => handleFilterChange('jurisdictionLevel', e.target.value)}
                  className="form-select w-full text-black"
                >
                  <option value="">All Levels</option>
                  <option value="state">🌐 State Level</option>
                  <option value="district">🏛️ District Level</option>
                  <option value="municipality">🏙️ Municipality Level</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="form-select w-full text-black"
                >
                  <option value="">All Departments</option>
                  {ISSUE_CATEGORIES?.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/UT
                </label>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="form-select w-full text-black"
                >
                  <option value="">All States</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District
                </label>
                <select
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  disabled={!filters.state || availableDistricts.length === 0}
                  className="form-select w-full text-black disabled:bg-gray-100"
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {/* Municipality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipality
                </label>
                <select
                  value={filters.municipality}
                  onChange={(e) => handleFilterChange('municipality', e.target.value)}
                  disabled={!filters.district || availableMunicipalities.length === 0}
                  className="form-select w-full text-black disabled:bg-gray-100"
                >
                  <option value="">All Municipalities</option>
                  {availableMunicipalities.map(municipality => (
                    <option key={municipality} value={municipality}>{municipality}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-select w-full text-black"
                >
                  <option value="">All Status</option>
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                </select>
              </div>
            </div>

            {/* Sorting */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <div className="flex items-center gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="form-select text-sm text-black"
                  >
                    <option value="name">Name</option>
                    <option value="rating">⭐ Rating</option>
                    <option value="resolved">✅ Issues Resolved</option>
                    <option value="assignedIssues">📋 Total Assigned</option>
                    <option value="resolutionTime">⚡ Avg Resolution Time</option>
                  </select>
                  
                  <button
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="btn btn-outline btn-sm flex items-center"
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Authorities Grid */}
        {authorities?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No authorities found</h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more results' 
                : 'Get started by adding your first authority'
              }
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="btn btn-outline">
                Clear Filters
              </button>
            ) : (
              <button onClick={handleCreateAuthority} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Authority
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {authorities.map((authority) => {
              console.log("Rendering authority:", authority);
              const jurisdictionBadge = getJurisdictionBadge(authority);
              const rating = authority.performanceMetrics?.rating || 0;
              const resolved = authority.performanceMetrics?.resolvedIssues || 0;
              const total = authority.performanceMetrics?.totalAssignedIssues || 0;
              const avgTime = authority.performanceMetrics?.averageResolutionTime || 0;
              const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

              return (
                <div
                  key={authority._id}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200"
                >
                  {/* Header */}
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${jurisdictionBadge.color}`}>
                            {jurisdictionBadge.icon}
                            {jurisdictionBadge.text}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            authority.status === 'active'
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {authority.status === 'active' ? '✅ Active' : '⏸️ Inactive'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {authority.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {getJurisdictionDisplay(authority)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAuthority(authority)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAuthority(authority._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {/* Department */}
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Building className="w-4 h-4 mr-2" />
                        {ISSUE_CATEGORIES.find(c => c.value === authority.department)?.label || authority.department}
                      </span>
                    </div>

                    {/* Performance Metrics */}
                    <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Performance Metrics
                        </h4>
                        <div className="flex items-center gap-1">
                          <Award className={`w-4 h-4 ${getRatingColor(rating)}`} />
                          <span className={`text-lg font-bold ${getRatingColor(rating)}`}>
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-white rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Assigned</p>
                          <p className="text-lg font-bold text-blue-600">{total}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Resolved</p>
                          <p className="text-lg font-bold text-green-600">{resolved}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border">
                          <p className="text-xs text-gray-600 mb-1">Rate</p>
                          <p className="text-lg font-bold text-purple-600">{resolutionRate}%</p>
                        </div>
                      </div>

                      {avgTime > 0 && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Avg Resolution: <strong>{avgTime}h</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{authority.contact?.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{authority.contact?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Authority Form Modal - Keep existing */}
      {showModal && (
        <AuthorityFormModal
          authority={editingAuthority}
          onClose={() => {
            setShowModal(false);
            setEditingAuthority(null);
          }}
          onSave={(savedAuthority) => {
            if (editingAuthority) {
              setAuthorities(prev => Array.isArray(prev) ? prev.map(auth => auth._id === savedAuthority._id ? savedAuthority : auth) : [savedAuthority]);
            } else {
              setAuthorities(prev => Array.isArray(prev) ? [...prev, savedAuthority] : [savedAuthority]);
            }
            setShowModal(false);
            setEditingAuthority(null);
            loadAuthorities(); // Reload to update stats
          }}
        />
      )}
    </div>
  );
};

// Authority Form Modal Component
const AuthorityFormModal = ({ authority, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: authority?.name || '',
    department: authority?.department || '',
    description: authority?.description || '',
    
    // Jurisdiction fields
    state: authority?.jurisdiction?.state || '',
    district: authority?.jurisdiction?.district || null,
    municipality: authority?.jurisdiction?.municipality || null,
    
    // Contact info
    email: authority?.contact?.email || '',
    phone: authority?.contact?.phone || '',
    address: authority?.contact?.officeAddress || '',
    
    active: authority?.status === 'active'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState([]);

  // Update districts when state changes
  useEffect(() => {
    if (formData.state) {
      setAvailableDistricts(DISTRICTS_BY_STATE[formData.state] || []);
    } else {
      setAvailableDistricts([]);
      setFormData(prev => ({ ...prev, district: null, municipality: null }));
    }
  }, [formData.state]);

  // Update municipalities when district changes
  useEffect(() => {
    if (formData.district) {
      setAvailableMunicipalities(MUNICIPALITIES_BY_DISTRICT[formData.district] || []);
    } else {
      setAvailableMunicipalities([]);
      setFormData(prev => ({ ...prev, municipality: null }));
    }
  }, [formData.district]);

  // Auto-generate authority name based on jurisdiction
  useEffect(() => {
    if (formData.state && formData.department) {
      let name = '';
      
      if (formData.municipality) {
        name = `${formData.municipality} Municipal Corporation - ${ISSUE_CATEGORIES.find(c => c.value === formData.department)?.label || formData.department}`;
      } else if (formData.district) {
        name = `${formData.district} District - ${ISSUE_CATEGORIES.find(c => c.value === formData.department)?.label || formData.department}`;
      } else {
        name = `${formData.state} State ${ISSUE_CATEGORIES.find(c => c.value === formData.department)?.label || formData.department} Department`;
      }
      
      setFormData(prev => ({ ...prev, name }));
    }
  }, [formData.state, formData.district, formData.municipality, formData.department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build payload with jurisdiction model
    const payload = {
      name: formData.name,
      department: formData.department,
      
      jurisdiction: {
        state: formData.state,
        district: formData.district || null,
        municipality: formData.municipality || null
      },
      
      contact: {
        email: formData.email,
        phone: formData.phone,
        officeAddress: formData.address || 'N/A'
      },
      
      serviceArea: {
        description: formData.description || generateServiceAreaDescription(),
        boundaries: {
          type: 'Polygon',
          coordinates: getDefaultBoundaries()
        }
      },
      
      status: formData.active ? 'active' : 'inactive'
    };

    setLoading(true);
    try {
      let response;
      if (authority) {
        response = await authoritiesAPI.update(authority._id, payload);
      } else {
        response = await authoritiesAPI.create(payload);
      }
      
      toast.success(`Authority ${authority ? 'updated' : 'created'} successfully`);
      onSave(response.data.authority);
    } catch (error) {
      console.error('Error saving authority:', error);
      toast.error(error.response?.data?.message || `Failed to ${authority ? 'update' : 'create'} authority`);
    } finally {
      setLoading(false);
    }
  };

  const generateServiceAreaDescription = () => {
    if (formData.municipality) {
      return `Handles ${ISSUE_CATEGORIES.find(c => c.value === formData.department)?.label} issues within ${formData.municipality} municipality limits`;
    } else if (formData.district) {
      return `Handles ${ISSUE_CATEGORIES.find(c => c.value === formData.department)?.label} issues for ${formData.district} district (excluding municipalities)`;
    } else {
      return `State-level authority for ${ISSUE_CATEGORIES.find(c => c.value === formData.department)?.label} across ${formData.state}`;
    }
  };

  const getDefaultBoundaries = () => {
    // Default polygon (placeholder - should be replaced with actual boundaries)
    return [[[77.5946, 12.9716], [77.5950, 12.9716], [77.5950, 12.9720], [77.5946, 12.9720], [77.5946, 12.9716]]];
  };

  const getJurisdictionLevel = () => {
    if (formData.municipality) return 'Municipality Level';
    if (formData.district) return 'District Level';
    if (formData.state) return 'State Level';
    return 'Not Set';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {authority ? 'Edit Authority' : 'Add New Authority'}
              </h3>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white px-6 py-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              
              {/* Jurisdiction Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Jurisdiction Level</p>
                    <p className="text-lg font-bold text-blue-600">{getJurisdictionLevel()}</p>
                  </div>
                  <div className="text-xs text-blue-700">
                    {formData.municipality && '🏙️ Municipality'}
                    {!formData.municipality && formData.district && '🏛️ District'}
                    {!formData.municipality && !formData.district && formData.state && '🌐 State'}
                  </div>
                </div>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department * <span className="text-red-500">⚠️ Select this first</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className={`form-select w-full text-black ${errors.department ? 'border-red-300' : ''}`}
                >
                  <option value="">Select Department</option>
                  {ISSUE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.department && <p className="text-red-600 text-sm mt-1">{errors.department}</p>}
              </div>

              {/* Jurisdiction Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/UT *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      state: e.target.value,
                      district: null,
                      municipality: null 
                    }))}
                    className={`form-select w-full text-black ${errors.state ? 'border-red-300' : ''}`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District (optional)
                  </label>
                  <select
                    value={formData.district || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      district: e.target.value || null,
                      municipality: null 
                    }))}
                    disabled={!formData.state || availableDistricts.length === 0}
                    className="form-select w-full text-black disabled:bg-gray-100"
                  >
                    <option value="">No District (State-level)</option>
                    {availableDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for state-level authority
                  </p>
                </div>

                {/* Municipality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Municipality (optional)
                  </label>
                  <select
                    value={formData.municipality || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      municipality: e.target.value || null 
                    }))}
                    disabled={!formData.district || availableMunicipalities.length === 0}
                    className="form-select w-full text-black disabled:bg-gray-100"
                  >
                    <option value="">No Municipality (District-level)</option>
                    {availableMunicipalities.map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for district-level authority
                  </p>
                </div>
              </div>

              {/* Auto-generated Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Name (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`form-input w-full text-black ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Will be auto-generated based on jurisdiction"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="form-textarea w-full text-black"
                  placeholder="Brief description of responsibilities (auto-generated if empty)"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`form-input w-full text-black ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="authority@gov.in"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`form-input w-full text-black ${errors.phone ? 'border-red-300' : ''}`}
                    placeholder="+91-9876543210"
                  />
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Office Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="form-input w-full text-black"
                  placeholder="Office address"
                />
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="form-checkbox mr-2"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Active (authority can receive issue assignments)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <LoadingButton
                loading={loading}
                type="submit"
                className="btn btn-primary"
              >
                {authority ? 'Update Authority' : 'Create Authority'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default AuthorityManager;