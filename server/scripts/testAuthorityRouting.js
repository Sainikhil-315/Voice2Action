// server/scripts/testAuthorityRouting.js
require('dotenv').config();
const mongoose = require('mongoose');
const Authority = require('../models/Authority');

// Test cases
const TEST_CASES = [
  {
    name: 'Municipality Level - Bhimavaram Road Issue',
    department: 'road_maintenance',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    municipality: 'Bhimavaram',
    expected: 'Bhimavaram Municipal Corporation - Road Maintenance'
  },
  {
    name: 'District Level - Rural West Godavari Road Issue',
    department: 'road_maintenance',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    municipality: null,
    expected: 'West Godavari District - Road Maintenance (if exists, else State)'
  },
  {
    name: 'State Level - Remote Area Road Issue',
    department: 'road_maintenance',
    state: 'Andhra Pradesh',
    district: null,
    municipality: null,
    expected: 'Andhra Pradesh State Road Maintenance Department'
  },
  {
    name: 'Municipality Level - Eluru Waste Management',
    department: 'waste_management',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    municipality: 'Eluru',
    expected: 'Eluru Municipal Corporation - Waste Management'
  }
];

async function testAuthorityRouting() {
  try {
    console.log('🧪 Testing Authority Routing Logic\n');
    console.log('='.repeat(70) + '\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of TEST_CASES) {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log(`   📍 Location: ${[testCase.municipality, testCase.district, testCase.state].filter(Boolean).join(', ')}`);
      console.log(`   🏢 Department: ${testCase.department}`);
      
      try {
        const authority = await Authority.findResponsibleAuthority(
          testCase.department,
          testCase.state,
          testCase.district,
          testCase.municipality
        );
        
        if (authority) {
          const level = authority.getJurisdictionLevel();
          const display = authority.getJurisdictionDisplay();
          
          console.log(`   ✅ Found: ${authority.name}`);
          console.log(`   📊 Level: ${level}`);
          console.log(`   🗺️  Jurisdiction: ${display}`);
          passed++;
        } else {
          console.log(`   ❌ No authority found`);
          console.log(`   💡 Expected: ${testCase.expected}`);
          failed++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${passed}/${TEST_CASES.length}`);
    console.log(`❌ Failed: ${failed}/${TEST_CASES.length}`);
    console.log('='.repeat(70) + '\n');
    
    // Show available authorities for debugging
    console.log('\n📚 Available Authorities in Database:');
    console.log('-'.repeat(70));
    
    const allAuthorities = await Authority.find({
      'jurisdiction.state': 'Andhra Pradesh',
      'jurisdiction.district': 'West Godavari'
    }).select('name department jurisdiction status');
    
    allAuthorities.forEach(auth => {
      const level = auth.getJurisdictionLevel();
      const display = auth.getJurisdictionDisplay();
      console.log(`   • ${auth.name}`);
      console.log(`     Level: ${level} | ${display}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

// Run tests
testAuthorityRouting();