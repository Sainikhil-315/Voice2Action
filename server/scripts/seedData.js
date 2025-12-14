require('dotenv').config();
const mongoose = require('mongoose');
const Pincode = require('../models/Pincode');
const Authority = require('../models/Authority');

// Sample pincode data for Andhra Pradesh (Bhimavaram region)
// In production, import full dataset from: https://github.com/datameet/india-pincode-data
const samplePincodes = [
  // Bhimavaram, West Godavari, Andhra Pradesh
  {
    pincode: '534201',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    city: 'Bhimavaram',
    postOfficeName: 'Bhimavaram H.O',
    postOfficeType: 'Head Post Office',
    location: {
      type: 'Point',
      coordinates: [81.5212, 16.5449] // [lng, lat]
    },
    region: 'South',
    verified: true
  },
  {
    pincode: '534202',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    city: 'Bhimavaram',
    postOfficeName: 'Kalla B.O',
    postOfficeType: 'Branch Post Office',
    location: {
      type: 'Point',
      coordinates: [81.5300, 16.5500]
    },
    region: 'South',
    verified: true
  },
  
  // Eluru, West Godavari
  {
    pincode: '534001',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    city: 'Eluru',
    postOfficeName: 'Eluru H.O',
    postOfficeType: 'Head Post Office',
    location: {
      type: 'Point',
      coordinates: [81.0952, 16.7107]
    },
    region: 'South',
    verified: true
  },
  
  // Vijayawada, Krishna District
  {
    pincode: '520001',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    city: 'Vijayawada',
    postOfficeName: 'Vijayawada H.O',
    postOfficeType: 'Head Post Office',
    location: {
      type: 'Point',
      coordinates: [80.6480, 16.5062]
    },
    region: 'South',
    verified: true
  },
  
  // Hyderabad, Telangana (for comparison)
  {
    pincode: '500001',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    postOfficeName: 'Abids H.O',
    postOfficeType: 'Head Post Office',
    location: {
      type: 'Point',
      coordinates: [78.4867, 17.3850]
    },
    region: 'South',
    verified: true
  },
  
  // Mumbai, Maharashtra (for testing cross-state scenarios)
  {
    pincode: '400001',
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai',
    postOfficeName: 'Mumbai GPO',
    postOfficeType: 'Head Post Office',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760]
    },
    region: 'West',
    verified: true
  }
];

// Sample authorities with proper jurisdiction
const sampleAuthorities = [
  // Bhimavaram Municipal Corporation - Road Maintenance
  {
    name: 'Bhimavaram Municipal Corporation - Road Department',
    department: 'road_maintenance',
    jurisdiction: {
      state: 'Andhra Pradesh',
      districts: ['West Godavari'],
      cities: ['Bhimavaram'],
      pincodes: ['534201', '534202'],
      coverageType: 'city'
      // NO bounds field at all
    },
    contact: {
      email: 'roads.bhimavaram@apgov.in',
      phone: '+919876543210',
      officeAddress: 'Municipal Office, Bhimavaram, West Godavari, Andhra Pradesh - 534201'
    },
    serviceArea: {
      description: 'Responsible for road maintenance and repairs in Bhimavaram city limits',
      districts: ['West Godavari'],
      postalCodes: ['534201', '534202']
      // NO wards, NO boundaries at all
    },
    workingHours: {
      monday: { start: '10:00', end: '17:00' },
      tuesday: { start: '10:00', end: '17:00' },
      wednesday: { start: '10:00', end: '17:00' },
      thursday: { start: '10:00', end: '17:00' },
      friday: { start: '10:00', end: '17:00' },
      saturday: { start: '10:00', end: '14:00' }
    },
    emergencyContact: {
      available247: true,
      phone: '+919876543211',
      email: 'roads.emergency@bhimavaram.gov.in'
    },
    status: 'active'
  },
  
  // West Godavari District - Waste Management
  {
    name: 'West Godavari District Sanitation Department',
    department: 'waste_management',
    jurisdiction: {
      state: 'Andhra Pradesh',
      districts: ['West Godavari'],
      cities: ['Bhimavaram', 'Eluru', 'Tanuku'],
      pincodes: ['534201', '534202', '534001'],
      coverageType: 'district'
    },
    contact: {
      email: 'sanitation.wg@apgov.in',
      phone: '+919876543220',
      officeAddress: 'District Collectorate, Eluru, West Godavari, Andhra Pradesh - 534001'
    },
    serviceArea: {
      description: 'Handles waste management across West Godavari district',
      districts: ['West Godavari'],
      postalCodes: ['534201', '534202', '534001']
    },
    workingHours: {
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
      saturday: { start: '08:00', end: '14:00' }
    },
    status: 'active'
  },
  
  // Andhra Pradesh State - Water Supply
  {
    name: 'Andhra Pradesh Water Supply & Drainage Board',
    department: 'water_supply',
    jurisdiction: {
      state: 'Andhra Pradesh',
      districts: ['West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore'],
      coverageType: 'state'
    },
    contact: {
      email: 'water.apwsdb@apgov.in',
      phone: '+919876543230',
      officeAddress: 'APWSDB Office, Vijayawada, Andhra Pradesh - 520001'
    },
    serviceArea: {
      description: 'State-level water supply and drainage management for Andhra Pradesh',
      districts: ['West Godavari', 'Krishna', 'Guntur']
    },
    workingHours: {
      monday: { start: '09:00', end: '17:30' },
      tuesday: { start: '09:00', end: '17:30' },
      wednesday: { start: '09:00', end: '17:30' },
      thursday: { start: '09:00', end: '17:30' },
      friday: { start: '09:00', end: '17:30' }
    },
    emergencyContact: {
      available247: true,
      phone: '+919876543231',
      email: 'water.emergency@apgov.in'
    },
    status: 'active'
  },
  
  // Mumbai - Road Maintenance (for testing cross-state)
  {
    name: 'Mumbai Municipal Corporation - Road Department',
    department: 'road_maintenance',
    jurisdiction: {
      state: 'Maharashtra',
      districts: ['Mumbai'],
      cities: ['Mumbai'],
      pincodes: ['400001', '400002', '400003'],
      coverageType: 'city'
    },
    contact: {
      email: 'roads.mumbai@mcgm.gov.in',
      phone: '+912212345678',
      officeAddress: 'BMC Building, Mumbai, Maharashtra - 400001'
    },
    serviceArea: {
      description: 'Road maintenance for Mumbai city',
      districts: ['Mumbai'],
      postalCodes: ['400001', '400002', '400003']
    },
    status: 'active'
  },
  
  // Hyderabad - Waste Management (for testing Telangana)
  {
    name: 'GHMC Sanitation Department',
    department: 'waste_management',
    jurisdiction: {
      state: 'Telangana',
      districts: ['Hyderabad', 'Medchal-Malkajgiri', 'Rangareddy'],
      cities: ['Hyderabad', 'Secunderabad'],
      pincodes: ['500001', '500002', '500003'],
      coverageType: 'city'
    },
    contact: {
      email: 'sanitation.ghmc@telangana.gov.in',
      phone: '+914012345678',
      officeAddress: 'GHMC Head Office, Hyderabad, Telangana - 500001'
    },
    serviceArea: {
      description: 'Waste management for Greater Hyderabad Municipal Corporation',
      districts: ['Hyderabad'],
      postalCodes: ['500001', '500002']
    },
    status: 'active'
  }
];

// Connect to database and seed
const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Pincode.deleteMany({});
    await Authority.deleteMany({});
    console.log('✅ Existing data cleared');
    
    // Seed pincodes
    console.log('📍 Seeding pincode data...');
    const pincodes = await Pincode.insertMany(samplePincodes);
    console.log(`✅ Seeded ${pincodes.length} pincodes`);
    
    // Seed authorities
    console.log('🏛️  Seeding authority data...');
    const authorities = await Authority.insertMany(sampleAuthorities);
    console.log(`✅ Seeded ${authorities.length} authorities`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Pincodes: ${pincodes.length}`);
    console.log(`   Authorities: ${authorities.length}`);
    console.log('\n🔍 Sample data:');
    console.log('   - Bhimavaram, AP: Road Maintenance + Waste Management');
    console.log('   - West Godavari District: Waste Management');
    console.log('   - Andhra Pradesh State: Water Supply');
    console.log('   - Mumbai, MH: Road Maintenance (cross-state test)');
    console.log('   - Hyderabad, TS: Waste Management (cross-state test)');
    
    console.log('\n✨ You can now test geographic routing!');
    console.log('   Try reporting a road issue in Bhimavaram - it should auto-assign to Bhimavaram Road Dept');
    console.log('   Try reporting a waste issue in Eluru - it should assign to West Godavari Sanitation');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Import full India pincode dataset (for production use)
const importFullPincodeData = async (jsonFilePath) => {
  try {
    console.log('📂 Reading pincode data from file...');
    const fs = require('fs');
    const rawData = fs.readFileSync(jsonFilePath);
    const pincodeData = JSON.parse(rawData);
    
    console.log(`📊 Found ${pincodeData.length} pincodes in file`);
    console.log('💾 Importing to database (this may take a few minutes)...');
    
    // Import in batches to avoid memory issues
    const batchSize = 1000;
    let imported = 0;
    
    for (let i = 0; i < pincodeData.length; i += batchSize) {
      const batch = pincodeData.slice(i, i + batchSize);
      await Pincode.insertMany(batch, { ordered: false }); // ordered: false to skip duplicates
      imported += batch.length;
      console.log(`   Progress: ${imported}/${pincodeData.length}`);
    }
    
    console.log(`✅ Imported ${imported} pincodes successfully!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
};

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, importFullPincodeData };