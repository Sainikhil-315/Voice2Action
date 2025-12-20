// // server/routes/sensorIssues.js
// const express = require('express');
// const router = express.Router();
// const Issue = require('../models/Issue');
// const User = require('../models/User');
// const geminiService = require('../services/geminiService');
// const { uploadBase64Image } = require('../config/cloudinary');

// /**
//  * @desc    Auto-detect and create issue from sensor/surveillance data
//  * @route   POST /api/issues/sensor-submit
//  * @access  Public (but requires API key for authorized sensors)
//  */
// router.post('/sensor-submit', async (req, res) => {
//   try {
//     const { image, lat, lng, source_id, timestamp, api_key } = req.body;

//     // ✅ Validate API Key (simple implementation)
//     const SENSOR_API_KEY = process.env.SENSOR_API_KEY || 'demo-sensor-key-2024';
//     if (api_key !== SENSOR_API_KEY) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid API key for sensor submission'
//       });
//     }

//     // ✅ Validate required fields
//     if (!image || !lat || !lng || !source_id) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: image, lat, lng, source_id'
//       });
//     }

//     // ✅ Get system user for sensor-created issues
//     let systemUser = await User.findOne({ email: 'system@voice2action.com' });
//     if (!systemUser) {
//       systemUser = await User.create({
//         name: 'AI Detection System',
//         email: 'system@voice2action.com',
//         password: 'system-password-' + Date.now(),
//         role: 'citizen',
//         isVerified: true
//       });
//     }

//     console.log('📡 Sensor data received:', { source_id, lat, lng, timestamp });

//     // ✅ Upload image to Cloudinary
//     const uploadResult = await uploadBase64Image(image);
//     if (!uploadResult) {
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to upload sensor image'
//       });
//     }

//     // ✅ Prepare image for Gemini analysis
//     const imageDataForGemini = {
//       base64: image,
//       mimeType: 'image/jpeg'
//     };

//     // ✅ Run Gemini detection with custom sensor prompt
//     const geminiAnalysis = await geminiService.analyzeSensorData({
//       imageData: imageDataForGemini,
//       lat,
//       lng,
//       source_id,
//       timestamp: timestamp || new Date().toISOString()
//     });

//     // ❌ Reject if not valid
//     if (!geminiAnalysis.data.isValid) {
//       console.log('❌ Sensor data rejected by Gemini:', geminiAnalysis.data.rejectionReason);
//       return res.status(400).json({
//         success: false,
//         message: 'AI validation failed',
//         reason: geminiAnalysis.data.rejectionReason,
//         confidence: geminiAnalysis.data.confidence
//       });
//     }

//     // ✅ Map detected category from Gemini's response
//     const categoryMap = {
//       'pothole': 'road_maintenance',
//       'road damage': 'road_maintenance',
//       'crack': 'road_maintenance',
//       'garbage': 'waste_management',
//       'trash': 'waste_management',
//       'waste': 'waste_management',
//       'broken light': 'street_lighting',
//       'streetlight': 'street_lighting',
//       'water leak': 'water_supply',
//       'pipe burst': 'water_supply',
//       'power line': 'electricity',
//       'drainage': 'drainage',
//       'blocked drain': 'drainage',
//       'flood': 'drainage',
//       'illegal construction': 'illegal_construction',
//       'encroachment': 'illegal_construction'
//     };
    
//     const detectedType = (geminiAnalysis.data.detectedCategory || 
//                           geminiAnalysis.data.detectedIssueType || 
//                           'other').toLowerCase();
    
//     // Try to find matching category
//     let category = 'other';
//     for (const [key, value] of Object.entries(categoryMap)) {
//       if (detectedType.includes(key)) {
//         category = value;
//         break;
//       }
//     }

//     // ✅ Use AI-generated title and description from Gemini
//     const title = geminiAnalysis.data.generatedTitle || 
//                   `${source_id}: ${geminiAnalysis.data.detectedCategory || 'Issue detected'}`;
    
//     const description = geminiAnalysis.data.generatedDescription || 
//                         `AI-Detected Issue: ${geminiAnalysis.data.reasoning}\n\nConfidence: ${(geminiAnalysis.data.confidence * 100).toFixed(1)}%\nDetected at: ${timestamp || new Date().toISOString()}`;

//     // ✅ Create issue in database
//     const issueData = {
//       title: title.substring(0, 100),
//       description: description.substring(0, 1000),
//       category,
//       priority: geminiAnalysis.data.priorityLevel.toLowerCase(),
//       location: {
//         address: `Sensor location: ${lat}, ${lng}`,
//         coordinates: {
//           lat: parseFloat(lat),
//           lng: parseFloat(lng)
//         }
//       },
//       reporter: systemUser._id,
//       media: [{
//         type: 'image',
//         url: uploadResult.secure_url,
//         publicId: uploadResult.public_id,
//         filename: `sensor_${source_id}_${Date.now()}.jpg`,
//         uploadedAt: new Date()
//       }],
//       aiAnalysis: {
//         score: geminiAnalysis.data.priorityScore,
//         validationScore: geminiAnalysis.data.validationScore,
//         reasoning: geminiAnalysis.data.reasoning,
//         confidence: geminiAnalysis.data.confidence,
//         severityFactors: geminiAnalysis.data.severityFactors,
//         recommendations: geminiAnalysis.data.recommendations,
//         fraudCheck: geminiAnalysis.data.fraudCheck,
//         validationDetails: geminiAnalysis.data.validationDetails,
//         analyzedAt: new Date()
//       },
//       geminiStatus: 'accepted',
//       expectedResolutionTime: geminiAnalysis.data.estimatedResolutionTime 
//         ? new Date(Date.now() + geminiAnalysis.data.estimatedResolutionTime * 60 * 60 * 1000) 
//         : null,
//       timeline: [{
//         action: 'submitted',
//         timestamp: new Date(),
//         user: systemUser._id,
//         notes: `Auto-detected by sensor: ${source_id}`
//       }],
//       // ✅ Mark as sensor-detected
//       tags: ['sensor-detected', source_id],
//       visibility: 'public'
//     };

//     const issue = await Issue.create(issueData);
//     await issue.populate('reporter', 'name email avatar');

//     console.log('✅ Sensor issue created:', issue._id);

//     // ✅ Emit real-time notification
//     const io = req.app.get('io');
//     if (io) {
//       io.emit('sensor_issue_detected', {
//         issueId: issue._id,
//         title: issue.title,
//         category: issue.category,
//         priority: issue.priority,
//         location: issue.location,
//         source: source_id,
//         confidence: geminiAnalysis.data.confidence
//       });
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Issue auto-detected and created successfully',
//       data: {
//         issueId: issue._id,
//         title: issue.title,
//         category: issue.category,
//         priority: issue.priority,
//         confidence: geminiAnalysis.data.confidence,
//         validationScore: geminiAnalysis.data.validationScore,
//         source: source_id
//       }
//     });

//   } catch (error) {
//     console.error('❌ Sensor submission error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process sensor data',
//       error: error.message
//     });
//   }
// });

// /**
//  * @desc    Get all sensor-detected issues
//  * @route   GET /api/issues/sensor-detected
//  * @access  Public
//  */
// router.get('/sensor-detected', async (req, res) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const skip = (page - 1) * limit;

//     const issues = await Issue.find({
//       tags: 'sensor-detected'
//     })
//       .populate('reporter', 'name')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .lean();

//     const total = await Issue.countDocuments({ tags: 'sensor-detected' });

//     // Extract source ID from tags
//     const enrichedIssues = issues.map(issue => ({
//       ...issue,
//       sourceId: issue.tags.find(tag => tag !== 'sensor-detected') || 'unknown',
//       upvoteCount: issue.upvotes?.length || 0,
//       commentCount: issue.comments?.length || 0,
//       confidence: issue.aiAnalysis?.confidence || 0
//     }));

//     res.json({
//       success: true,
//       data: {
//         issues: enrichedIssues,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get sensor issues error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch sensor-detected issues',
//       error: error.message
//     });
//   }
// });

// module.exports = router;



// server/routes/sensorIssues.js
const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const { uploadToCloudinary } = require('../config/cloudinary');
require('dotenv').config();

/**
 * @desc    Auto-detect and create issue from sensor/surveillance data
 * @route   POST /api/sensor/sensor-submit
 * @access  Public (but requires API key for authorized sensors)
 */
router.post('/sensor-submit', async (req, res) => {
  try {
    const { image, lat, lng, source_id, timestamp } = req.body;

    // ✅ Validate API Key (simple implementation)
    // const SENSOR_API_KEY = process.env.SENSOR_API_KEY || 'demo-sensor-key-2024';
    // if (api_key !== SENSOR_API_KEY) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid API key for sensor submission'
    //   });
    // }

    // ✅ Validate required fields
    if (!image || !lat || !lng || !source_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: image, lat, lng, source_id'
      });
    }

    // ✅ Get system user for sensor-created issues
    let systemUser = await User.findOne({ email: 'system@voice2action.com' });
    if (!systemUser) {
      systemUser = await User.create({
        name: 'AI Detection System',
        email: 'system@voice2action.com',
        password: 'system-password-' + Date.now(),
        role: 'citizen',
        isVerified: true
      });
    }

    console.log('📡 Sensor data received:', { source_id, lat, lng, timestamp });

    // ✅ Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(image);
    if (!uploadResult) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload sensor image'
      });
    }

    // ✅ Prepare image for Gemini analysis
    const imageDataForGemini = {
      base64: image,
      mimeType: 'image/jpeg'
    };

    // ✅ Auto-detect issue type and validate using Gemini
    const detectionPrompt = `Analyze this image from a surveillance camera/sensor and determine:
1. What type of civic issue is shown? (pothole, garbage, broken light, etc.)
2. Severity level (1-10)
3. Generate appropriate title and description
4. Validate if this is a real issue (not false positive)

Location: ${lat}, ${lng}
Source: ${source_id}
Timestamp: ${timestamp || new Date().toISOString()}

Return JSON format with:
{
  "isValid": <true/false>,
  "detectedCategory": "<category>",
  "title": "<auto-generated title>",
  "description": "<detailed description>",
  "severity": <1-10>,
  "confidence": <0-1>
}`;

    // ✅ Run Gemini detection
    const geminiAnalysis = await geminiService.analyzeIssuePriority({
      title: 'Auto-detected issue', // Temporary
      description: 'Analyzing sensor data...', // Temporary
      category: 'other', // Will be updated
      location: {
        address: `${lat}, ${lng}`,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
      },
      imageData: imageDataForGemini
    });

    // ❌ Reject if not valid
    if (!geminiAnalysis.data.isValid) {
      console.log('❌ Sensor data rejected by Gemini:', geminiAnalysis.data.rejectionReason);
      return res.status(400).json({
        success: false,
        message: 'AI validation failed',
        reason: geminiAnalysis.data.rejectionReason,
        confidence: geminiAnalysis.data.confidence
      });
    }

    // ✅ Map detected category
    const categoryMap = {
      'pothole': 'road_maintenance',
      'garbage': 'waste_management',
      'broken light': 'street_lighting',
      'water leak': 'water_supply',
      'power line': 'electricity',
      'drainage': 'drainage'
    };
    
    const detectedType = geminiAnalysis.data.detectedIssueType?.toLowerCase() || 'other';
    const category = categoryMap[detectedType] || 'other';

    // ✅ Generate title and description from AI reasoning
    const title = `${source_id}: ${geminiAnalysis.data.reasoning.split('.')[0]}`;
    const description = `AI-Detected Issue: ${geminiAnalysis.data.reasoning}\n\nConfidence: ${(geminiAnalysis.data.confidence * 100).toFixed(1)}%\nDetected at: ${timestamp || new Date().toISOString()}`;

    // ✅ Create issue in database
    const issueData = {
      title: title.substring(0, 100),
      description: description.substring(0, 1000),
      category,
      priority: geminiAnalysis.data.priorityLevel.toLowerCase(),
      location: {
        address: `Sensor location: ${lat}, ${lng}`,
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        }
      },
      reporter: systemUser._id,
      media: [{
        type: 'image',
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        filename: `sensor_${source_id}_${Date.now()}.jpg`,
        uploadedAt: new Date()
      }],
      aiAnalysis: {
        score: geminiAnalysis.data.priorityScore,
        validationScore: geminiAnalysis.data.validationScore,
        reasoning: geminiAnalysis.data.reasoning,
        confidence: geminiAnalysis.data.confidence,
        severityFactors: geminiAnalysis.data.severityFactors,
        recommendations: geminiAnalysis.data.recommendations,
        fraudCheck: geminiAnalysis.data.fraudCheck,
        validationDetails: geminiAnalysis.data.validationDetails,
        analyzedAt: new Date()
      },
      geminiStatus: 'accepted',
      expectedResolutionTime: geminiAnalysis.data.estimatedResolutionTime 
        ? new Date(Date.now() + geminiAnalysis.data.estimatedResolutionTime * 60 * 60 * 1000) 
        : null,
      timeline: [{
        action: 'submitted',
        timestamp: new Date(),
        user: systemUser._id,
        notes: `Auto-detected by sensor: ${source_id}`
      }],
      // ✅ Mark as sensor-detected
      tags: ['sensor-detected', source_id],
      visibility: 'public'
    };

    const issue = await Issue.create(issueData);
    await issue.populate('reporter', 'name email avatar');

    console.log('✅ Sensor issue created:', issue._id);

    // ✅ Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('sensor_issue_detected', {
        issueId: issue._id,
        title: issue.title,
        category: issue.category,
        priority: issue.priority,
        location: issue.location,
        source: source_id,
        confidence: geminiAnalysis.data.confidence
      });
    }

    // Return response in the format expected by detection prompt
    res.status(201).json({
      isValid: geminiAnalysis.data.isValid,
      detectedCategory: geminiAnalysis.data.detectedIssueType || category,
      title: issue.title,
      description: issue.description,
      severity: geminiAnalysis.data.severity,
      confidence: geminiAnalysis.data.confidence,
      issueId: issue._id,
      source_id: source_id
    });

  } catch (error) {
    console.error('❌ Sensor submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process sensor data',
      error: error.message
    });
  }
});

/**
 * @desc    Get all sensor-detected issues
 * @route   GET /api/sensor/sensor-detected
 * @access  Public
 */
router.get('/sensor-detected', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const issues = await Issue.find({
      tags: 'sensor-detected'
    })
      .populate('reporter', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Issue.countDocuments({ tags: 'sensor-detected' });

    // Extract source ID from tags
    const enrichedIssues = issues.map(issue => ({
      ...issue,
      sourceId: issue.tags.find(tag => tag !== 'sensor-detected') || 'unknown',
      upvoteCount: issue.upvotes?.length || 0,
      commentCount: issue.comments?.length || 0,
      confidence: issue.aiAnalysis?.confidence || 0
    }));

    res.json({
      success: true,
      data: {
        issues: enrichedIssues,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get sensor issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor-detected issues',
      error: error.message
    });
  }
});

module.exports = router;