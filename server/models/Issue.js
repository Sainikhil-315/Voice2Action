// models/Issue.js
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
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
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Location address is required']
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Invalid latitude'],
        max: [90, 'Invalid latitude']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Invalid longitude'],
        max: [180, 'Invalid longitude']
      }
    },
    landmark: String,
    state: {
      type: String,
      default: null
    },
    district: {
      type: String,
      default: null
    },
    municipality: {
      type: String,
      default: null
    },
    ward: String
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String, // Cloudinary public ID
    filename: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Authority',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'assigned', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  rejectionReason: {
    type: String,
    maxlength: [300, 'Rejection reason cannot exceed 300 characters']
  },
  timeline: [{
    action: {
      type: String,
      enum: ['submitted', 'verified', 'rejected', 'assigned', 'in_progress', 'resolved', 'closed'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    authority: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Authority'
    },
    notes: String
  }],
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [300, 'Comment cannot exceed 300 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  estimatedResolutionTime: {
    type: Number, // in hours
    default: null
  },
  actualResolutionTime: {
    type: Number, // in hours
    default: null
  },
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0,
  },
  aiAnalysis: {
    validationScore: {
      type: Number,
      min: 0,
      max: 100
    },
    validationDetails: {
      titleQuality: {
        score: Number,
        isMeaningful: Boolean,
        issue: String
      },
      descriptionQuality: {
        score: Number,
        isMeaningful: Boolean,
        issue: String
      },
      imageValidation: {
        score: Number,
        matchesDescription: Boolean,
        isAuthentic: Boolean,
        issue: String
      },
      contentConsistency: {
        score: Number,
        isConsistent: Boolean
      }
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    communityAdjustedScore: {
      type: Number,
      min: 0,
      max: 100
    },
    communityBoost: {
      type: Number,
      default: 0
    },
    reasoning: String,
    confidence: Number,
    severityFactors: {
      visualSeverity: Number,
      locationRisk: Number,
      textUrgency: Number,
      temporalContext: Number
    },
    recommendations: String,
    fraudCheck: {
      isAuthentic: Boolean,
      imageMatchesDescription: Boolean,
      locationVerified: Boolean,
      duplicateCheck: Boolean
    },
    analyzedAt: Date
  },
});

issueSchema.index({ title: 'text', description: 'text' });
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ reporter: 1, createdAt: -1 });
issueSchema.index({ assignedTo: 1, status: 1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ priority: 1, status: 1 });
issueSchema.index({ 'location.coordinates': '2dsphere' });
issueSchema.index({
  'location.state': 1,
  'location.district': 1,
  'location.municipality': 1
});

// ✅ PRE-SAVE: Update timestamp
issueSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ PRE-SAVE: Add timeline entry on status change
issueSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    // Only add if not already added manually
    const lastTimeline = this.timeline[this.timeline.length - 1];
    if (!lastTimeline || lastTimeline.action !== this.status) {
      this.timeline.push({
        action: this.status,
        timestamp: new Date(),
        notes: this.adminNotes || ''
      });
    }
  }
  next();
});

// ✅ PRE-SAVE: Calculate resolution time when resolved
issueSchema.pre('save', function (next) {
  if (this.status === 'resolved' && !this.actualResolutionTime) {
    this.resolvedAt = new Date();

    // Calculate from work start time if available, otherwise from creation
    const startTime = this.workStartedAt || this.createdAt;
    const resolutionTime = (this.resolvedAt - startTime) / (1000 * 60 * 60); // hours

    this.actualResolutionTime = Math.round(resolutionTime * 100) / 100;
  }
  next();
});

// ✅ METHOD: Get jurisdiction display string
issueSchema.methods.getJurisdictionDisplay = function () {
  const parts = [
    this.location.municipality,
    this.location.district,
    this.location.state
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
};

// ✅ METHOD: Check if jurisdiction is complete
issueSchema.methods.hasCompleteJurisdiction = function () {
  return !!(this.location.state && this.location.district);
};

// ✅ STATIC: Get issues by jurisdiction
issueSchema.statics.findByJurisdiction = function (state, district = null, municipality = null) {
  const query = { 'location.state': state };

  if (district) {
    query['location.district'] = district;
  }

  if (municipality) {
    query['location.municipality'] = municipality;
  }

  return this.find(query);
};

// ✅ STATIC: Get jurisdiction analytics
issueSchema.statics.getJurisdictionStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: {
          state: '$location.state',
          district: '$location.district',
          municipality: '$location.municipality'
        },
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

module.exports = mongoose.model('Issue', issueSchema);