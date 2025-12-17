// src/components/admin/AuthorityManager.jsx
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Building,
  Users,
  Search,
  Filter,
  X
} from 'lucide-react'
import { authoritiesAPI } from '../../utils/api'
import { formatRelativeTime } from '../../utils/helpers'
import { ISSUE_CATEGORIES, DISTRICTS_BY_STATE, MUNICIPALITIES_BY_DISTRICT, INDIAN_STATES } from '../../utils/constants'
import LoadingButton from '../common/LoadingButton'
import { SkeletonLoader } from '../common/Loader'
import toast from 'react-hot-toast'

const AuthorityManager = () => {
  const [authorities, setAuthorities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAuthority, setEditingAuthority] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')

  useEffect(() => {
    loadAuthorities()
  }, [searchQuery, filterDepartment])

  const loadAuthorities = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchQuery) params.search = searchQuery
      if (filterDepartment) params.department = filterDepartment
      
  const response = await authoritiesAPI.getAll(params)
  setAuthorities(response.data.data.authorities)
    } catch (error) {
      console.error('Error loading authorities:', error)
      toast.error('Failed to load authorities')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAuthority = () => {
    setEditingAuthority(null)
    setShowModal(true)
  }

  const handleEditAuthority = (authority) => {
    setEditingAuthority(authority)
    setShowModal(true)
  }

  const handleDeleteAuthority = async (authorityId) => {
    if (!confirm('Are you sure you want to delete this authority? This action cannot be undone.')) {
      return
    }

    try {
      await authoritiesAPI.delete(authorityId)
      setAuthorities(prev => prev.filter(auth => auth.id !== authorityId))
      toast.success('Authority deleted successfully')
    } catch (error) {
      console.error('Error deleting authority:', error)
      toast.error('Failed to delete authority')
    }
  }

  const departments = [...new Set(ISSUE_CATEGORIES?.map(cat => cat.label))]

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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building className="w-8 h-8 mr-3 text-primary-600" />
                Authority Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage government departments and authority contacts
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleCreateAuthority}
                className="btn btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Authority
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search authorities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 form-input w-full text-black "
                />
              </div>
            </div>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="form-select w-auto text-black"
            >
              <option value="">All Departments</option>
              {departments?.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Authorities Table */}
        {console.log(authorities)}
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Authority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues Handled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {console.log(authorities)}
                {authorities?.map((authority) => (
                  <tr key={authority._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <Building className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {authority.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {authority.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {authority.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {authority.contact.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {authority.contact.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {authority.performanceMetrics.totalAssignedIssues || 0} issues
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        authority.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {authority.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditAuthority(authority)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAuthority(authority._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {authorities?.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No authorities found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterDepartment 
                  ? 'Try adjusting your search filters' 
                  : 'Get started by adding your first authority'
                }
              </p>
              {!searchQuery && !filterDepartment && (
                <button
                  onClick={handleCreateAuthority}
                  className="btn btn-primary"
                >
                  Add Authority
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Authority Form Modal */}
      {showModal && (
        <AuthorityFormModal
          authority={editingAuthority}
          onClose={() => {
            setShowModal(false)
            setEditingAuthority(null)
          }}
          onSave={(savedAuthority) => {
            if (editingAuthority) {
              setAuthorities(prev => Array.isArray(prev) ? prev.map(auth => auth.id === savedAuthority._id ? savedAuthority : auth) : [savedAuthority])
            } else {
              setAuthorities(prev => Array.isArray(prev) ? [...prev, savedAuthority] : [savedAuthority])
            }
            setShowModal(false)
            setEditingAuthority(null)
          }}
        />
      )}
    </div>
  )
}

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