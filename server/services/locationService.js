// Import fetch for Node.js (native in Node 18+, or use node-fetch for older versions)
const fetch = require('node-fetch');

const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Voice2Action/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract structured location data
    const address = data.address || {};
    
    return {
      success: true,
      location: {
        // Full address
        fullAddress: data.display_name,
        
        // Administrative divisions (in order of specificity)
        country: address.country || 'India',
        state: address.state || address.state_district || null,
        district: address.state_district || address.county || null,
        city: address.city || address.town || address.village || null,
        municipality: address.municipality || null,
        
        // Pincode (postal code)
        pincode: address.postcode || null,
        
        // Local area details
        suburb: address.suburb || address.neighbourhood || null,
        road: address.road || null,
        
        // Coordinates
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon)
      },
      raw: data // Keep raw data for debugging
    };
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: error.message,
      location: null
    };
  }
};

/**
 * Extract pincode from coordinates using local database (fallback)
 * This is faster than API calls once data is seeded
 */
const getPincodeFromCoordinates = async (lat, lng) => {
  try {
    // Import pincode model (we'll create this)
    const Pincode = require('../models/Pincode');
    
    // Find nearest pincode using geospatial query
    const nearestPincode = await Pincode.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 10000 // 10km radius
        }
      }
    });
    
    if (nearestPincode) {
      return {
        success: true,
        pincode: nearestPincode.pincode,
        district: nearestPincode.district,
        state: nearestPincode.state,
        city: nearestPincode.city
      };
    }
    
    return { success: false, error: 'No pincode found nearby' };
    
  } catch (error) {
    console.error('Pincode lookup error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get complete location data (tries local DB first, then API)
 */
const getLocationData = async (lat, lng) => {
  try {
    // Try local pincode database first (faster)
    const localResult = await getPincodeFromCoordinates(lat, lng);
    
    if (localResult.success) {
      console.log('✅ Location resolved from local database');
      return {
        success: true,
        source: 'local',
        location: localResult
      };
    }
    
    // Fallback to reverse geocoding API
    console.log('⚠️ Local lookup failed, using reverse geocoding API...');
    const apiResult = await reverseGeocode(lat, lng);
    
    if (apiResult.success) {
      console.log('✅ Location resolved from reverse geocoding API');
      return {
        success: true,
        source: 'api',
        location: apiResult.location
      };
    }
    
    return {
      success: false,
      error: 'Could not resolve location from coordinates'
    };
    
  } catch (error) {
    console.error('Get location data error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Normalize location data to standard format
 */
const normalizeLocation = (locationData) => {
  return {
    state: normalizeStateName(locationData.state),
    district: normalizeDistrictName(locationData.district),
    city: locationData.city,
    pincode: locationData.pincode,
    fullAddress: locationData.fullAddress || locationData.address
  };
};

/**
 * Normalize state names (handle variations)
 */
const normalizeStateName = (state) => {
  if (!state) return null;
  
  const stateMap = {
    'andhra pradesh': 'Andhra Pradesh',
    'ap': 'Andhra Pradesh',
    'telangana': 'Telangana',
    'ts': 'Telangana',
    'tamil nadu': 'Tamil Nadu',
    'tn': 'Tamil Nadu',
    'karnataka': 'Karnataka',
    'ka': 'Karnataka',
    'maharashtra': 'Maharashtra',
    'mh': 'Maharashtra',
    // Add more states as needed
  };
  
  const normalized = state.toLowerCase();
  return stateMap[normalized] || state;
};

/**
 * Normalize district names (handle variations)
 */
const normalizeDistrictName = (district) => {
  if (!district) return null;
  
  // Convert to title case
  return district
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Validate coordinates
 */
const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return { valid: false, error: 'Invalid coordinates' };
  }
  
  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }
  
  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }
  
  return { valid: true, lat: latitude, lng: longitude };
};

/**
 * Calculate distance between two coordinates (in meters)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

module.exports = {
  reverseGeocode,
  getPincodeFromCoordinates,
  getLocationData,
  normalizeLocation,
  normalizeStateName,
  normalizeDistrictName,
  validateCoordinates,
  calculateDistance
};