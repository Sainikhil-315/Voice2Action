// test-sensor-submit.js
// Run this to test the sensor endpoint

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/issue/sensor-submit';
const API_KEY = 'demo-sensor-key-2024';

async function testSensorSubmit() {
  try {
    // Read test image (place a pothole/garbage image in test-images folder)
    const imagePath = path.join(__dirname, 'test-images', 'pothole.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const testData = {
      image: base64Image,
      lat: 16.5062,  // Bhimavaram coordinates
      lng: 81.5217,
      source_id: 'CAMERA_001_MAIN_ROAD',
      timestamp: new Date().toISOString(),
      api_key: API_KEY
    };

    console.log('📡 Sending sensor data...');
    
    const response = await axios.post(API_URL, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ Success:', response.data);
    console.log('\n📊 Issue Details:');
    console.log('   ID:', response.data.data.issueId);
    console.log('   Title:', response.data.data.title);
    console.log('   Category:', response.data.data.category);
    console.log('   Priority:', response.data.data.priority);
    console.log('   Confidence:', (response.data.data.confidence * 100).toFixed(1) + '%');
    console.log('   Validation Score:', response.data.data.validationScore);
    console.log('   Source:', response.data.data.source);
    
    // Show AI reasoning if available
    if (response.data.data.reasoning) {
      console.log('\n🤖 AI Analysis:');
      console.log('   ' + response.data.data.reasoning);
    }

  } catch (error) {
    console.error('❌ Error occurred:');
    
    if (error.response) {
      // Server responded with error
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Request made but no response
      console.error('No response received from server');
      console.error('Is your server running on http://localhost:5000?');
    } else {
      // Error setting up request
      console.error('Error:', error.message);
    }
    
    console.error('\n🔍 Troubleshooting tips:');
    console.error('1. Check if server is running: npm run dev');
    console.error('2. Check route is mounted in server/index.js');
    console.error('3. Check endpoint URL: /api/issues/sensor-submit (not /issue)');
    console.error('4. Check API key matches .env file');
  }
}

// Test multiple sensors
async function testMultipleSensors() {
  const sensors = [
    { id: 'CAMERA_001_MAIN_ROAD', lat: 16.5062, lng: 81.5217 },
    { id: 'CAMERA_002_PARK_JUNCTION', lat: 16.5078, lng: 81.5230 },
    { id: 'DRONE_001_AREA_SURVEY', lat: 16.5090, lng: 81.5245 }
  ];

  for (const sensor of sensors) {
    console.log(`\n🔄 Testing sensor: ${sensor.id}`);
    // Read appropriate test image for each
    await testSensorSubmit();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests
  }
}

// Run test
console.log('🚀 Starting sensor submission test...\n');
testSensorSubmit();

// To test multiple: testMultipleSensors();