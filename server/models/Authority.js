// models/Authority.js - Updated with Jurisdiction Model
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
      'noise_pollution',
      'illegal_construction',
      'animal_control',
      'other'
    ]
  },
  
  // Hierarchical jurisdiction model
  jurisdiction: {
    state: {
      type: String,
      required: [true, 'State is required for jurisdiction'],
      trim: true
    },
    district: {
      type: String,
      default: null,
      trim: true
    },
    municipality: {
      type: String,
      default: null,
      trim: true
    }
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
  
  serviceArea: {
    description: {
      type: String,
      required: [true, 'Service area description is required']
    },
    boundaries: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        default: 'Polygon'
      },
      coordinates: {
        type: Array, // Accepts both Polygon ([[[]]]) and MultiPolygon ([[[[]]]])
        required: [true, 'Service boundaries are required']
      }
    },
    wards: [String],
    districts: [String],
    postalCodes: [String]
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
      type: Number,  // in hours
      default: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    responseRate: {
      type: Number,  // percentage
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
  
  lastLogin: {
    type: Date
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

// ✅ INDEXES: Critical for performance
// 1. Geospatial index for location queries
authoritySchema.index({ 'serviceArea.boundaries': '2dsphere' });

// 2. Jurisdiction-based queries (most important)
authoritySchema.index({ 
  'jurisdiction.state': 1, 
  'jurisdiction.district': 1, 
  'jurisdiction.municipality': 1,
  department: 1,
  status: 1 
});

// 3. Department + status (for finding active authorities)
authoritySchema.index({ department: 1, status: 1 });

// 4. Performance metrics
authoritySchema.index({ 'performanceMetrics.rating': -1 });

// ✅ VALIDATION: Ensure jurisdiction hierarchy rules
authoritySchema.pre('validate', function(next) {
  // Rule: Municipality cannot exist without district
  if (this.jurisdiction.municipality && !this.jurisdiction.district) {
    return next(new Error('Municipality cannot be set without district'));
  }
  
  // Rule: District cannot exist without state
  if (this.jurisdiction.district && !this.jurisdiction.state) {
    return next(new Error('District cannot be set without state'));
  }
  
  next();
});

// ✅ METHOD: Get jurisdiction level
authoritySchema.methods.getJurisdictionLevel = function() {
  if (this.jurisdiction.municipality) return 'municipality';
  if (this.jurisdiction.district) return 'district';
  return 'state';
};

// ✅ METHOD: Get jurisdiction display name
authoritySchema.methods.getJurisdictionDisplay = function() {
  if (this.jurisdiction.municipality) {
    return `${this.jurisdiction.municipality}, ${this.jurisdiction.district}, ${this.jurisdiction.state}`;
  }
  if (this.jurisdiction.district) {
    return `${this.jurisdiction.district}, ${this.jurisdiction.state}`;
  }
  return this.jurisdiction.state;
};

// ✅ METHOD: Check if location is in service area (simplified)
authoritySchema.methods.servesLocation = function(state, district = null, municipality = null) {
  // State must match
  if (this.jurisdiction.state !== state) return false;
  
  // If authority is state-level, it serves all locations in the state
  if (!this.jurisdiction.district) return true;
  
  // If authority is district-level, district must match
  if (this.jurisdiction.district) {
    if (this.jurisdiction.district !== district) return false;
    
    // If authority is district-level (no municipality), it serves all non-municipal areas
    if (!this.jurisdiction.municipality) {
      return !municipality;  // Only serve if location has no municipality
    }
  }
  
  // If authority is municipality-level, municipality must match
  if (this.jurisdiction.municipality) {
    return this.jurisdiction.municipality === municipality;
  }
  
  return false;
};

// ✅ STATIC METHOD: Find responsible authority for a location
authoritySchema.statics.findResponsibleAuthority = async function(department, state, district = null, municipality = null) {
  // Priority 1: Municipality-level authority
  if (municipality) {
    const municipalAuthority = await this.findOne({
      department,
      status: 'active',
      'jurisdiction.state': state,
      'jurisdiction.district': district,
      'jurisdiction.municipality': municipality
    }).sort({ 'performanceMetrics.rating': -1 });
    
    if (municipalAuthority) return municipalAuthority;
  }
  
  // Priority 2: District-level authority
  if (district) {
    const districtAuthority = await this.findOne({
      department,
      status: 'active',
      'jurisdiction.state': state,
      'jurisdiction.district': district,
      'jurisdiction.municipality': null
    }).sort({ 'performanceMetrics.rating': -1 });
    
    if (districtAuthority) return districtAuthority;
  }
  
  // Priority 3: State-level authority (fallback)
  const stateAuthority = await this.findOne({
    department,
    status: 'active',
    'jurisdiction.state': state,
    'jurisdiction.district': null,
    'jurisdiction.municipality': null
  }).sort({ 'performanceMetrics.rating': -1 });
  
  return stateAuthority;
};

// ✅ METHOD: Update performance metrics
authoritySchema.methods.updateMetrics = function() {
  this.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('Authority', authoritySchema);