require('dotenv').config();
const mongoose = require('mongoose');
const Authority = require('../models/Authority');
const fs = require('fs');
const path = require('path');
const ADM1_GEOJSON = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/boundaries/geoBoundaries-IND-ADM1.geojson'), 'utf8')
);

// All Indian States and Union Territories (36 total)
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep','Puducherry'
];

// Mapping from INDIAN_STATES to geoBoundaries shapeName
const STATE_NAME_MAP = {
  "Andhra Pradesh": "Andhra Pradesh",
  "Arunachal Pradesh": "Arunāchal Pradesh",
  "Assam": "Assam",
  "Bihar": "Bihār",
  "Chhattisgarh": "Chhattīsgarh",
  "Goa": "Goa",
  "Gujarat": "Gujarāt",
  "Haryana": "Haryāna",
  "Himachal Pradesh": "Himāchal Pradesh",
  "Jharkhand": "Jhārkhand",
  "Karnataka": "Karnātaka",
  "Kerala": "Kerala",
  "Madhya Pradesh": "Madhya Pradesh",
  "Maharashtra": "Mahārāshtra",
  "Manipur": "Manipur",
  "Meghalaya": "Meghālaya",
  "Mizoram": "Mizoram",
  "Nagaland": "Nāgāland",
  "Odisha": "Odisha",
  "Punjab": "Punjab",
  "Rajasthan": "Rājasthān",
  "Sikkim": "Sikkim",
  "Tamil Nadu": "Tamil Nādu",
  "Telangana": "Telangāna",
  "Tripura": "Tripura",
  "Uttar Pradesh": "Uttar Pradesh",
  "Uttarakhand": "Uttarākhand",
  "West Bengal": "West Bengal",
  "Andaman and Nicobar Islands": "Andaman and Nicobar Islands",
  "Chandigarh": "Chandīgarh",
  "Dadra and Nagar Haveli and Daman and Diu": "Dādra and Nagar Haveli and Damān and Diu",
  "Delhi": "Delhi",
  "Jammu and Kashmir": "Jammu and Kashmir",
  "Ladakh": "Ladākh",
  "Lakshadweep": "Lakshadweep",
  "Puducherry": "Puducherry"
};

// All 13 departments
const DEPARTMENTS = [
  { value: 'road_maintenance', label: 'Road Maintenance' },
  { value: 'waste_management', label: 'Waste Management' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'public_transport', label: 'Public Transport' },
  { value: 'parks_recreation', label: 'Parks & Recreation' },
  { value: 'street_lighting', label: 'Street Lighting' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'noise_pollution', label: 'Noise Pollution' },
  { value: 'illegal_construction', label: 'Illegal Construction' },
  { value: 'animal_control', label: 'Animal Control' },
  { value: 'other', label: 'Other' }
];



function getStateBoundary(stateName) {
  const geoJsonName = STATE_NAME_MAP[stateName];
  return ADM1_GEOJSON.features.find(
    f => f.properties.shapeName === geoJsonName
  );
}

async function seedStateAuthorities() {
  try {
    console.log('🚀 Starting State Authority Seeding...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    // Loop through each state
    for (const state of INDIAN_STATES) {
      console.log(`\n📍 Processing ${state}...`);
      
      // Loop through each department
      for (const dept of DEPARTMENTS) {
        const authorityName = `${state} State ${dept.label} Department`;
        
        try {
          // Check if authority already exists
          const existing = await Authority.findOne({
            'jurisdiction.state': state,
            'jurisdiction.district': null,
            'jurisdiction.municipality': null,
            department: dept.value
          });
          
          if (existing) {
            // Update boundaries and related fields for existing authority
            const boundaryFeature = getStateBoundary(state);
            if (!boundaryFeature) {
              console.error(`  ❌ No boundary found for ${state}`);
              errors++;
              continue;
            }
            existing.serviceArea.boundaries = boundaryFeature.geometry;
            existing.boundaryId = boundaryFeature.properties.shapeID;
            existing.admLevel = 1;
            await existing.save();
            console.log(`  🔄 Updated: ${authorityName} (boundaries)`);
            skipped++;
            continue;
          }
          

          // Get real boundary for the state
          const boundaryFeature = getStateBoundary(state);
          if (!boundaryFeature) {
            console.error(`  ❌ No boundary found for ${state}`);
            errors++;
            continue;
          }

          await Authority.create({
            name: authorityName,
            department: dept.value,

            jurisdiction: {
              state: state,
              district: null,  // State-level = null district
              municipality: null  // State-level = null municipality
            },

            contact: {
              email: `${dept.value}.${state.toLowerCase().replace(/\s+/g, '')}@gov.in`,
              phone: '9191919191',
              officeAddress: `State Secretariat, ${state}`
            },

            serviceArea: {
              description: `State-level authority for ${dept.label} across ${state}`,
              boundaries: boundaryFeature.geometry
            },

            boundaryId: boundaryFeature.properties.shapeID,
            admLevel: 1, // State level

            status: 'active',  // All state authorities are active

            performanceMetrics: {
              totalAssignedIssues: 0,
              resolvedIssues: 0,
              averageResolutionTime: 0,
              rating: 5,
              responseRate: 100
            }
          });

          console.log(`  ✅ Created: ${authorityName}`);
          created++;
          
        } catch (err) {
          console.error(`  ❌ Error creating ${authorityName}:`, err.message);
          errors++;
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created:  ${created} authorities`);
    console.log(`⏭️  Skipped:  ${skipped} authorities (already existed)`);
    console.log(`❌ Errors:   ${errors} authorities`);
    console.log(`📈 Total:    ${INDIAN_STATES.length} states × ${DEPARTMENTS.length} departments = ${INDIAN_STATES.length * DEPARTMENTS.length} total authorities`);
    console.log('='.repeat(60) + '\n');
    
    if (created > 0) {
      console.log('🎉 State authorities seeded successfully!');
      console.log('🔍 Next steps:');
      console.log('   1. Update contact information with real data');
      console.log('   2. Update service boundaries with real coordinates');
      console.log('   3. Add district and municipality authorities as needed');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeder
seedStateAuthorities();