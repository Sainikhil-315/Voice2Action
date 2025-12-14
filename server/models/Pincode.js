// models/Pincode.js - NEW FILE
// Local pincode database for fast lookups

const mongoose = require('mongoose');

const pincodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9]{6}$/, 'Pincode must be 6 digits'],
    index: true
  },
  
  // Administrative divisions
  state: {
    type: String,
    required: true,
    index: true
  },
  
  district: {
    type: String,
    required: true,
    index: true
  },
  
  city: {
    type: String,
    required: true
  },
  
  // Optional subdivisions
  taluk: String,
  subDistrict: String,
  
  // Post office details
  postOfficeName: String,
  postOfficeType: {
    type: String,
    enum: ['Head Post Office', 'Sub Post Office', 'Branch Post Office', 'Other']
  },
  
  // Geographic coordinates (centroid of pincode area)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  
  // Coverage area (optional polygon)
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon']
    },
    coordinates: {
      type: [[[Number]]] // GeoJSON format
    }
  },
  
  // Additional metadata
  region: String, // North, South, East, West, Central
  division: String, // Postal division
  
  // Data quality
  verified: {
    type: Boolean,
    default: false
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
pincodeSchema.index({ location: '2dsphere' });

// Compound index for state + district lookups
pincodeSchema.index({ state: 1, district: 1 });

// Text index for search
pincodeSchema.index({ 
  pincode: 'text', 
  city: 'text', 
  district: 'text', 
  state: 'text' 
});

// Static method to find pincodes in a district
pincodeSchema.statics.findByDistrict = async function(state, district) {
  return this.find({ 
    state: state, 
    district: district 
  }).select('pincode city postOfficeName location');
};

// Static method to find pincodes in a state
pincodeSchema.statics.findByState = async function(state) {
  return this.find({ state: state })
    .select('pincode district city location');
};

// Static method to get all districts in a state
pincodeSchema.statics.getDistrictsByState = async function(state) {
  return this.distinct('district', { state: state });
};

// Static method to search pincodes
pincodeSchema.statics.search = async function(query, limit = 10) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
  .select('pincode city district state location');
};

// Instance method to get nearby pincodes
pincodeSchema.methods.getNearby = async function(radiusInMeters = 10000) {
  return this.constructor.find({
    location: {
      $near: {
        $geometry: this.location,
        $maxDistance: radiusInMeters
      }
    },
    _id: { $ne: this._id } // Exclude self
  }).limit(10);
};

module.exports = mongoose.model('Pincode', pincodeSchema);