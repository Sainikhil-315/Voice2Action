// models/Authority.js - UPDATED WITH GEOGRAPHIC JURISDICTION
const mongoose = require('mongoose');

const authoritySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Authority name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'road_maintenance',
      'waste_management',
      'water_supply', 
      'electricity',
      'fire_safety',
      'public_transport',
      'parks_recreation',
      'street_lighting',
      'drainage',
      'municipal_corporation',
      'police',
      'other'
    ]
  },
  
  // ✅ NEW: Geographic Jurisdiction Fields
  jurisdiction: {
    // State-level jurisdiction
    state: {
      type: String,
      required: [true, 'State jurisdiction is required'],
      index: true
    },
    
    // District-level jurisdiction (can be array for multi-district authorities)
    districts: [{
      type: String,
      required: true
    }],
    
    // City/Municipality level (optional, for city-specific authorities)
    cities: [{
      type: String
    }],
    
    // Pincode coverage (most precise)
    pincodes: [{
      type: String,
      match: [/^[0-9]{6}$/, 'Pincode must be 6 digits']
    }],
    
    // Ward numbers (for municipal corporations)
    wards: [{
      type: String
    }],
    
    // Coverage type
    coverageType: {
      type: String,
      enum: ['state', 'district', 'city', 'municipal', 'ward'],
      default: 'district'
    }
    
    // NO bounds field at all - remove it completely
  },
  
  contact: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    alternatePhone: {
      type: String,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    officeAddress: {
      type: String,
      required: [true, 'Office address is required']
    }
  },
  
  // Keeping existing serviceArea for backward compatibility (but simplified)
  serviceArea: {
    description: {
      type: String,
      required: [true, 'Service area description is required']
    },
    wards: [String],
    districts: [String],
    postalCodes: [String]
    // NO boundaries field - removed completely
  },
  
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  
  emergencyContact: {
    available247: {
      type: Boolean,
      default: false
    },
    phone: String,
    email: String
  },
  
  performanceMetrics: {
    totalAssignedIssues: {
      type: Number,
      default: 0
    },
    resolvedIssues: {
      type: Number,
      default: 0
    },
    averageResolutionTime: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    responseRate: {
      type: Number,
      default: 100
    }
  },
  
  notificationPreferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    urgentOnly: {
      type: Boolean,
      default: false
    }
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  headOfDepartment: {
    name: String,
    designation: String,
    contact: String
  },
  
  budget: {
    annual: Number,
    allocated: Number,
    spent: Number
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ NEW: Compound indexes for fast geographic lookups
authoritySchema.index({ department: 1, 'jurisdiction.state': 1, status: 1 });
authoritySchema.index({ department: 1, 'jurisdiction.districts': 1, status: 1 });
authoritySchema.index({ department: 1, 'jurisdiction.pincodes': 1, status: 1 });
authoritySchema.index({ 'jurisdiction.state': 1, 'jurisdiction.districts': 1 });

// Existing indexes (no geospatial on serviceArea.boundaries - it's optional)
authoritySchema.index({ 'performanceMetrics.rating': -1 });

// ✅ NEW: Static method to find authority by location
authoritySchema.statics.findByLocation = async function(category, locationData) {
  const { state, district, pincode, city } = locationData;
  
  // Build query with priority matching
  const query = {
    department: category,
    status: 'active'
  };
  
  // Priority 1: Exact pincode match
  if (pincode) {
    query['jurisdiction.pincodes'] = pincode;
    const pincodeMatch = await this.findOne(query)
      .sort({ 'performanceMetrics.rating': -1 });
    if (pincodeMatch) return pincodeMatch;
    delete query['jurisdiction.pincodes'];
  }
  
  // Priority 2: District + State match
  if (district && state) {
    query['jurisdiction.districts'] = district;
    query['jurisdiction.state'] = state;
    const districtMatch = await this.findOne(query)
      .sort({ 'performanceMetrics.rating': -1 });
    if (districtMatch) return districtMatch;
    delete query['jurisdiction.districts'];
  }
  
  // Priority 3: State-level authority (fallback)
  if (state) {
    query['jurisdiction.state'] = state;
    query['jurisdiction.coverageType'] = 'state';
    const stateMatch = await this.findOne(query)
      .sort({ 'performanceMetrics.rating': -1 });
    if (stateMatch) return stateMatch;
  }
  
  // No match found
  return null;
};

// ✅ NEW: Method to check if location is in jurisdiction
authoritySchema.methods.coversLocation = function(locationData) {
  const { state, district, pincode, city } = locationData;
  
  // Check state
  if (this.jurisdiction.state !== state) {
    return false;
  }
  
  // Check pincode (most precise)
  if (pincode && this.jurisdiction.pincodes.length > 0) {
    return this.jurisdiction.pincodes.includes(pincode);
  }
  
  // Check district
  if (district && this.jurisdiction.districts.length > 0) {
    return this.jurisdiction.districts.includes(district);
  }
  
  // Check city
  if (city && this.jurisdiction.cities.length > 0) {
    return this.jurisdiction.cities.includes(city);
  }
  
  // State-level coverage
  if (this.jurisdiction.coverageType === 'state') {
    return true;
  }
  
  return false;
};

// Method to update performance metrics
authoritySchema.methods.updateMetrics = function() {
  this.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('Authority', authoritySchema);