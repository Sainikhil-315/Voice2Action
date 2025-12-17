// server/scripts/seedWestGodavariMunicipalities.js
require('dotenv').config();
const mongoose = require('mongoose');
const Authority = require('../models/Authority');
const fs = require('fs');
const path = require('path');

// West Godavari municipalities with approximate boundaries
const MUNICIPALITIES = [
  {
    name: 'Bhimavaram',
    center: [81.52322, 16.54078], // [lng, lat] from geo data :contentReference[oaicite:0]{index=0}
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [81.50, 16.52], [81.55, 16.52], [81.55, 16.56], [81.50, 16.56], [81.50, 16.52]
      ]]
    }
  },
  {
    name: 'Eluru',
    center: [81.100388, 16.703285], // [lng, lat] from geo data :contentReference[oaicite:1]{index=1}
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [81.08, 16.69], [81.12, 16.69], [81.12, 16.72], [81.08, 16.72], [81.08, 16.69]
      ]]
    }
  },
  {
    name: 'Tadepalligudem',
    center: [81.526558, 16.814524], // [lng, lat] from geo data :contentReference[oaicite:2]{index=2}
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [81.50, 16.80], [81.55, 16.80], [81.55, 16.83], [81.50, 16.83], [81.50, 16.80]
      ]]
    }
  },
  {
    name: 'Tanuku',
    center: [81.679962, 16.757174], // [lng, lat] from geo data :contentReference[oaicite:3]{index=3}
    boundary: {
      type: 'Polygon',
      coordinates: [[
        [81.66, 16.74], [81.70, 16.74], [81.70, 16.77], [81.66, 16.77], [81.66, 16.74]
      ]]
    }
  }
];


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

async function seedMunicipalityAuthorities() {
  try {
    console.log('🚀 Starting West Godavari Municipality Authority Seeding...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    // Loop through each municipality
    for (const municipality of MUNICIPALITIES) {
      console.log(`\n📍 Processing ${municipality.name}...`);
      
      // Loop through each department
      for (const dept of DEPARTMENTS) {
        const authorityName = `${municipality.name} Municipal Corporation - ${dept.label}`;
        
        try {
          // Check if authority already exists
          const existing = await Authority.findOne({
            'jurisdiction.state': 'Andhra Pradesh',
            'jurisdiction.district': 'West Godavari',
            'jurisdiction.municipality': municipality.name,
            department: dept.value
          });
          
          if (existing) {
            console.log(`  ⏭️  Skipped: ${authorityName} (already exists)`);
            skipped++;
            continue;
          }

          // Create municipality authority
          await Authority.create({
            name: authorityName,
            department: dept.value,

            // CRITICAL: Municipality-level jurisdiction
            jurisdiction: {
              state: 'Andhra Pradesh',
              district: 'West Godavari',
              municipality: municipality.name  // This makes it municipality-level
            },

            contact: {
              email: `${dept.value}.${municipality.name.toLowerCase()}@municipal.gov.in`,
              phone: '9191919191',
              officeAddress: `Municipal Corporation Office, ${municipality.name}, West Godavari, Andhra Pradesh`
            },

            serviceArea: {
              description: `Handles ${dept.label} issues within ${municipality.name} municipality limits`,
              boundaries: municipality.boundary
            },

            status: 'active',

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
    console.log(`📈 Total:    ${MUNICIPALITIES.length} municipalities × ${DEPARTMENTS.length} departments = ${MUNICIPALITIES.length * DEPARTMENTS.length} total`);
    console.log('='.repeat(60) + '\n');
    
    if (created > 0) {
      console.log('🎉 Municipality authorities seeded successfully!');
      console.log('🔍 Next steps:');
      console.log('   1. Replace approximate boundaries with real GeoJSON from OSM');
      console.log('   2. Update contact information with real data');
      console.log('   3. Test the jurisdiction hierarchy routing');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeder
seedMunicipalityAuthorities();