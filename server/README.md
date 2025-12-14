# 🎯 Geographic Routing Implementation Guide

## Problem Solved
**Before:** Issues were assigned to authorities based ONLY on category, ignoring location. A pothole in Bhimavaram could be sent to Mumbai! 😱

**After:** Issues are now matched to authorities based on:
1. **Category** (road_maintenance, waste_management, etc.)
2. **Geographic Jurisdiction** (State → District → Pincode)
3. **Performance Metrics** (rating, resolution time)

---

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd server
npm install
# This will install node-fetch for reverse geocoding
```

### Step 2: Add New Files
Copy these NEW files to your project:

```
server/
├── models/
│   └── Pincode.js                    ✅ NEW
├── services/
│   └── locationService.js            ✅ NEW
└── scripts/
    └── seedData.js                   ✅ NEW
```

### Step 3: Replace Modified Files
Replace these EXISTING files:

```
server/
├── models/
│   └── Authority.js                  🔄 MODIFIED
├── routes/
│   └── admin.js                      🔄 MODIFIED
└── package.json                      🔄 MODIFIED
```

### Step 4: Seed Sample Data
```bash
npm run seed
```

This will populate:
- ✅ 6 sample pincodes (Bhimavaram, Eluru, Vijayawada, Hyderabad, Mumbai)
- ✅ 5 sample authorities with proper jurisdiction

### Step 5: Test It!
```bash
npm start
# or
npm run dev
```

---

## 🧪 Testing Geographic Routing

### Test Case 1: Bhimavaram Road Issue ✅
**Expected:** Should assign to "Bhimavaram Municipal Corporation - Road Department"

1. Login as a user
2. Report a road issue at coordinates:
   - **Lat:** 16.5449
   - **Lng:** 81.5212
   - **Category:** road_maintenance

3. Admin verifies the issue
4. System should:
   - ✅ Resolve location to: Bhimavaram, West Godavari, AP
   - ✅ Find authority matching: category + district + state
   - ✅ Auto-assign to Bhimavaram Road Dept

### Test Case 2: Eluru Waste Issue ✅
**Expected:** Should assign to "West Godavari District Sanitation Department"

1. Report waste management issue at:
   - **Lat:** 16.7107
   - **Lng:** 81.0952
   - **Category:** waste_management

2. Admin verifies
3. System should assign to West Godavari Sanitation (district-level)

### Test Case 3: Mumbai Road Issue (Cross-State) ✅
**Expected:** Should assign to Mumbai authority, NOT Bhimavaram!

1. Report road issue in Mumbai:
   - **Lat:** 19.0760
   - **Lng:** 72.8777
   - **Category:** road_maintenance

2. Admin verifies
3. System should assign to Mumbai Municipal Corporation

### Test Case 4: No Authority Available ⚠️
**Expected:** Should stay as "verified" for manual assignment

1. Report an issue in a location with no authority
2. Admin verifies
3. System should:
   - ⚠️ Keep status as "verified"
   - ⚠️ Add note: "No authority found, manual assignment required"

---

## 📊 How It Works

### 1. Issue Reported with Coordinates
```javascript
{
  title: "Pothole on Main Road",
  category: "road_maintenance",
  location: {
    coordinates: { lat: 16.5449, lng: 81.5212 }
  }
}
```

### 2. Reverse Geocoding (Location Resolution)
```
Coordinates → API Call → Location Data
(16.5449, 81.5212) → Nominatim → {
  state: "Andhra Pradesh",
  district: "West Godavari",
  city: "Bhimavaram",
  pincode: "534201"
}
```

### 3. Authority Matching (Priority Order)
```
1️⃣ Try: category + pincode (most precise)
   ✅ road_maintenance + 534201

2️⃣ Try: category + district + state
   ✅ road_maintenance + West Godavari + Andhra Pradesh

3️⃣ Try: category + state (state-level authority)
   ✅ road_maintenance + Andhra Pradesh

4️⃣ Fallback: Any authority for category (old behavior)
   ⚠️ Used only if no geographic match
```

### 4. Auto-Assignment
```
✅ Match Found → Auto-assign → Notify Authority
❌ No Match → Keep as "verified" → Manual assignment needed
```

---

## 🗄️ Database Schema Changes

### Authority Model - NEW Fields
```javascript
jurisdiction: {
  state: "Andhra Pradesh",        // Required
  districts: ["West Godavari"],   // Array of districts
  cities: ["Bhimavaram"],         // Optional
  pincodes: ["534201", "534202"], // Most precise
  coverageType: "city"            // state/district/city/municipal/ward
}
```

### Pincode Model (NEW)
```javascript
{
  pincode: "534201",
  state: "Andhra Pradesh",
  district: "West Godavari",
  city: "Bhimavaram",
  location: {
    type: "Point",
    coordinates: [81.5212, 16.5449] // [lng, lat]
  }
}
```

---

## 🌍 Production Deployment

### Import Full India Pincode Database

**Option 1: Use CSV from GitHub**
Download from: https://github.com/datameet/india-pincode-data

```bash
# Convert CSV to JSON
node scripts/convertPincodeCsv.js pincode.csv pincode.json

# Import to MongoDB
node scripts/seedData.js --import pincode.json
```

**Option 2: Use API Service**
- Use India Pincode API: https://api.postalpincode.in/
- Or MapMyIndia API: https://www.mapmyindia.com/

### Reverse Geocoding Service

**Current:** Nominatim (FREE, rate-limited to 1 req/sec)

**Production Options:**
1. **Self-hosted Nominatim** (Docker)
   ```bash
   docker run -p 8080:8080 mediagis/nominatim:latest
   ```

2. **Google Maps Geocoding API** ($5/1000 requests)
   - Sign up: https://console.cloud.google.com/
   - Enable Geocoding API
   - Add API key to `.env`: `GOOGLE_MAPS_API_KEY=xxx`

3. **MapMyIndia** (India-specific, better accuracy)
   - Sign up: https://www.mapmyindia.com/
   - More accurate for Indian addresses

---

## 🔧 Configuration

### Environment Variables
Add to your `.env`:

```bash
# Existing variables...

# Geographic Routing (optional)
GEOCODING_SERVICE=nominatim  # nominatim | google | mapmyindia
GOOGLE_MAPS_API_KEY=         # If using Google Maps
MAPMYINDIA_API_KEY=          # If using MapMyIndia
GEOCODING_CACHE_TTL=86400    # Cache results for 24 hours
```

### Fallback Behavior
If reverse geocoding fails, system will:
1. Try pincode from user-provided address
2. Use district/state from issue location field
3. Fall back to old behavior (any authority for category)

---

## 📈 Monitoring & Logs

Look for these logs when testing:

```bash
# Successful geographic routing
✅ Issue auto-assigned to Bhimavaram Road Dept (AP/West Godavari)
📍 Resolved location: { state: 'AP', district: 'West Godavari', pincode: '534201' }

# Warnings
⚠️ No geographically matched authority for road_maintenance in West Godavari, AP
🔄 Falling back to any available authority...

# Errors
❌ No authority found for category: road_maintenance in West Godavari, AP
⚠️ Reverse geocoding failed: Rate limit exceeded
```

---

## 🎓 Adding More Authorities

### For Your City/District
```javascript
// In MongoDB or via Admin UI
{
  name: "Your City Road Department",
  department: "road_maintenance",
  jurisdiction: {
    state: "Your State",
    districts: ["Your District"],
    cities: ["Your City"],
    pincodes: ["123456", "123457"], // Add all pincodes
    coverageType: "city"
  },
  contact: {
    email: "roads@yourcity.gov.in",
    phone: "+919876543210",
    officeAddress: "City Office Address"
  },
  status: "active"
}
```

### Coverage Types
- **`state`**: Covers entire state (e.g., State Water Board)
- **`district`**: Covers entire district (e.g., District Sanitation)
- **`city`**: Covers specific city (e.g., Municipal Corporation)
- **`municipal`**: Municipal ward-level
- **`ward`**: Specific ward numbers

---

## 🐛 Troubleshooting

### Issue 1: "No authority found" even though one exists
**Check:**
- Authority `status` is `active`
- Authority `jurisdiction.state` matches exactly (case-sensitive)
- Authority `jurisdiction.districts` includes the district

**Fix:**
```bash
# Check authority data
mongosh
use voice2action
db.authorities.find({ department: "road_maintenance" })

# Verify jurisdiction fields
```

### Issue 2: Wrong authority assigned
**Check console logs:**
```
📍 Resolved location: { state: '?', district: '?', pincode: '?' }
```

If coordinates are wrong:
- User might have denied location permission
- Coordinates might be outside India
- Reverse geocoding might have failed

### Issue 3: Reverse geocoding slow/failing
**Solutions:**
1. Seed pincode database for faster local lookups
2. Switch to Google Maps API (paid but reliable)
3. Self-host Nominatim server (Docker)

---

## 🔒 Security Considerations

1. **Rate Limiting:** Nominatim API is rate-limited to 1 req/sec
   - Add caching in production
   - Use paid API for high traffic

2. **API Keys:** Store in environment variables
   ```bash
   GOOGLE_MAPS_API_KEY=xxx  # Never commit to git!
   ```

3. **Input Validation:** Coordinates are validated in `locationService.validateCoordinates()`

---

## 📝 Next Steps

### Phase 2 Enhancements (Optional)
1. **Admin UI for Authority Management**
   - Add/Edit authorities with jurisdiction
   - Visual map of coverage areas

2. **Batch Import Tool**
   - CSV upload for bulk authority creation
   - Import full India pincode database

3. **Analytics Dashboard**
   - Authority workload distribution
   - Geographic issue heatmap
   - Response time by region

4. **Smart Routing Improvements**
   - ML-based authority recommendations
   - Load balancing across authorities
   - Time-based routing (business hours)

---

## 🎉 Success Criteria

After implementation, verify:
- ✅ Bhimavaram issues go to Bhimavaram authorities
- ✅ Mumbai issues stay in Mumbai
- ✅ Cross-state assignments work correctly
- ✅ Fallback works when no authority available
- ✅ Admin can still manually override assignments

---

## 💬 Support

If you face issues:
1. Check console logs for error messages
2. Verify database seeding succeeded
3. Test reverse geocoding separately
4. Check authority jurisdiction data

Need help? Check:
- Nominatim API docs: https://nominatim.org/release-docs/latest/api/
- Turf.js (geospatial): https://turfjs.org/
- India Pincode Data: https://github.com/datameet/india-pincode-data

---

## 📄 License
MIT License - Voice2Action Platform