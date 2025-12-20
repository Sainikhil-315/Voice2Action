// server/services/geminiService.js - COMPLETE FILE
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class GeminiPriorityService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  /**
   * Analyze issue and generate priority score with VALIDATION
   * (Used for manual user submissions)
   */
  async analyzeIssuePriority(issueData) {
    try {
      console.log('🤖 Starting Gemini validation and analysis...');

      const { title, description, category, location, imageData } = issueData;

      // Construct comprehensive prompt with validation focus
      const prompt = `You are an expert civic issue validator and analyzer. Your PRIMARY job is to validate if this is a legitimate civic issue report.

ISSUE DETAILS:
Title: ${title}
Description: ${description}
Category: ${category}
Location: ${location.address}
Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}
Time Reported: ${new Date().toISOString()}

VALIDATION CHECKLIST (CRITICAL):
1. Title Quality Check:
   - Is the title meaningful and descriptive? (not random characters/gibberish)
   - Does it relate to the category?
   - Minimum quality threshold: Must be coherent English/local language

2. Description Quality Check:
   - Is the description clear and meaningful? (not random text like "jdshchfcnsdhcsdvhni")
   - Does it explain the actual problem?
   - Is it relevant to the category?
   - Minimum length: At least 10 meaningful words

3. Image Validation (if provided):
   - Does the image show a real civic issue?
   - Does the image match the title and description?
   - Is it a genuine photo (not meme, screenshot, unrelated image)?
   - Does the image content match the category?

4. Content Consistency:
   - Does title + description + image tell the same story?
   - Are there contradictions?
   - Does the location make sense for this type of issue?

5. Fraud Detection:
   - Is this spam/joke/test submission?
   - Stock photo detection
   - Duplicate/repeated content patterns

VALIDATION RULES:
- If title is gibberish/meaningless → REJECT
- If description is incoherent/random text → REJECT
- If image doesn't match description → REJECT
- If image is fake/meme/unrelated → REJECT
- If overall authenticity score < 60 → REJECT

RESPONSE FORMAT (JSON ONLY, NO MARKDOWN):
{
  "isValid": <true|false>,
  "validationScore": <0-100>,
  "rejectionReason": "<specific reason if rejected, null if valid>",
  "validationDetails": {
    "titleQuality": {
      "score": <0-10>,
      "isMeaningful": <true|false>,
      "issue": "<null or problem description>"
    },
    "descriptionQuality": {
      "score": <0-10>,
      "isMeaningful": <true|false>,
      "issue": "<null or problem description>"
    },
    "imageValidation": {
      "score": <0-10>,
      "matchesDescription": <true|false>,
      "isAuthentic": <true|false>,
      "issue": "<null or problem description>"
    },
    "contentConsistency": {
      "score": <0-10>,
      "isConsistent": <true|false>
    }
  },
  "priorityLevel": "<Low|Medium|High|Urgent>",
  "priorityScore": <0-100>,
  "confidence": <0.0-1.0>,
  "reasoning": "<detailed explanation of validation decision and priority>",
  "detectedIssueType": "<detected category>",
  "severityFactors": {
    "visualSeverity": <0-10>,
    "locationRisk": <0-10>,
    "textUrgency": <0-10>,
    "temporalContext": <0-10>
  },
  "recommendations": "<action recommendations>",
  "fraudCheck": {
    "isAuthentic": <true|false>,
    "imageMatchesDescription": <true|false>,
    "locationVerified": <true|false>,
    "duplicateCheck": <true|false>,
    "spamDetected": <true|false>
  },
  "estimatedResolutionTime": <hours>
}

IMPORTANT: Be strict with validation. Better to reject unclear submissions than approve spam.`;

      // Prepare content parts
      const parts = [{ text: prompt }];

      // Add image if available
      if (imageData) {
        parts.push({
          inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType
          }
        });
      }

      // Call Gemini API
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      console.log('📊 Raw Gemini response:', text);

      // Parse JSON response
      const analysisResult = this.parseGeminiResponse(text);

      console.log('✅ Gemini validation complete:', {
        isValid: analysisResult.isValid,
        validationScore: analysisResult.validationScore,
        rejectionReason: analysisResult.rejectionReason
      });

      return {
        success: true,
        data: analysisResult,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Gemini analysis error:', error);

      // Fallback to rule-based validation
      return this.fallbackValidationSystem(issueData);
    }
  }

  /**
   * Parse Gemini's JSON response with validation
   */
  parseGeminiResponse(text) {
    try {
      // Remove markdown code blocks if present
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate required fields
      const required = [
        'isValid',
        'validationScore',
        'priorityLevel',
        'priorityScore',
        'confidence'
      ];

      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Add default values for optional fields
      if (!parsed.rejectionReason) {
        parsed.rejectionReason = null;
      }

      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse Gemini response:', error);
      throw new Error('Invalid Gemini response format');
    }
  }

  /**
   * Fallback rule-based validation system
   */
  fallbackValidationSystem(issueData) {
    console.log('⚠️ Using fallback validation system');

    const { title, description, category, location } = issueData;

    // Basic validation rules
    let isValid = true;
    let rejectionReason = null;
    let validationScore = 70;

    // Title validation
    const titleWords = title.split(/\s+/).filter(w => w.length > 0);
    const hasRandomChars = /[^a-zA-Z0-9\s,.!?'-]/.test(title);
    const titleQuality = {
      score: 7,
      isMeaningful: titleWords.length >= 3 && !hasRandomChars,
      issue: null
    };

    if (titleWords.length < 3 || hasRandomChars) {
      isValid = false;
      rejectionReason = "Title appears to be gibberish or too short. Please provide a clear, descriptive title.";
      titleQuality.score = 2;
      titleQuality.issue = "Title is not meaningful";
      validationScore = 20;
    }

    // Description validation
    const descWords = description.split(/\s+/).filter(w => w.length > 0);
    const descHasRandomChars = /(.)\1{5,}/.test(description); // Repeated characters
    const descQuality = {
      score: 7,
      isMeaningful: descWords.length >= 10 && !descHasRandomChars,
      issue: null
    };

    if (descWords.length < 10 || descHasRandomChars) {
      isValid = false;
      rejectionReason = "Description is unclear or contains random text. Please describe the issue properly.";
      descQuality.score = 2;
      descQuality.issue = "Description is not meaningful";
      validationScore = 20;
    }

    // If valid, calculate priority
    let priorityScore = 50;
    let priorityLevel = 'Medium';

    if (isValid) {
      // Category-based adjustments
      const urgentCategories = ['fire_safety', 'water_supply', 'electricity'];
      if (urgentCategories.includes(category)) {
        priorityScore += 20;
      }

      // Location-based adjustments
      const address = location.address.toLowerCase();
      if (address.includes('school') || address.includes('hospital') || address.includes('college')) {
        priorityScore += 15;
      }

      // Determine priority level
      if (priorityScore >= 80) priorityLevel = 'Urgent';
      else if (priorityScore >= 65) priorityLevel = 'High';
      else if (priorityScore < 40) priorityLevel = 'Low';
    }

    return {
      success: true,
      data: {
        isValid,
        validationScore,
        rejectionReason,
        validationDetails: {
          titleQuality,
          descriptionQuality: descQuality,
          imageValidation: {
            score: 5,
            matchesDescription: true,
            isAuthentic: true,
            issue: null
          },
          contentConsistency: {
            score: 7,
            isConsistent: true
          }
        },
        priorityLevel,
        priorityScore,
        confidence: 0.6,
        reasoning: isValid
          ? 'Issue validated using fallback rule-based system.'
          : rejectionReason,
        detectedIssueType: category,
        severityFactors: {
          visualSeverity: 5,
          locationRisk: 5,
          textUrgency: 5,
          temporalContext: 5
        },
        recommendations: isValid
          ? 'Standard inspection recommended within 72 hours.'
          : 'Please resubmit with proper details.',
        fraudCheck: {
          isAuthentic: isValid,
          imageMatchesDescription: true,
          locationVerified: true,
          duplicateCheck: false,
          spamDetected: !isValid
        },
        estimatedResolutionTime: 48
      },
      fallback: true,
      timestamp: new Date()
    };
  }

  /**
   * ✨ NEW: Analyze sensor/surveillance data specifically
   * Optimized for automated detection without manual input
   */
  async analyzeSensorData(sensorData) {
    try {
      console.log('🤖 Starting Gemini SENSOR analysis...');

      const { imageData, lat, lng, source_id, timestamp } = sensorData;

      // ✅ SENSOR-SPECIFIC PROMPT - More precise for automated detection
      const sensorPrompt = `You are an expert AI system analyzing surveillance camera/sensor data for civic issue detection.

SENSOR INFORMATION:
Source: ${source_id}
Location: ${lat}, ${lng}
Timestamp: ${timestamp}

YOUR TASK:
Analyze this image from an automated surveillance system and determine:

1. ISSUE DETECTION:
   - Is there a visible civic infrastructure issue?
   - What type of issue is it? (pothole, garbage pile, broken streetlight, water leak, drainage problem, illegal dumping, etc.)
   - Is this a real issue or false positive (e.g., shadows, normal wear, construction work)?

2. CATEGORIZATION:
   - Classify into ONE category: pothole, road damage, garbage, waste, trash, broken light, streetlight, water leak, pipe burst, power line, drainage, blocked drain, flood, illegal construction, encroachment, or other

3. SEVERITY ASSESSMENT:
   - Rate severity: 1-10 (1=minor, 10=critical/emergency)
   - Consider: size, safety risk, environmental impact, public health concern

4. AUTO-GENERATE CONTENT:
   - Create a clear, concise title (max 80 characters)
   - Write a detailed description (100-200 words) as if reporting to authorities
   - Include: what you see, estimated size/extent, potential risks, urgency

5. VALIDATION CHECKS:
   - Is the image clear enough to identify an issue?
   - Is this a genuine civic problem or something else (construction, maintenance in progress, normal conditions)?
   - Confidence level in your assessment

CRITICAL: This is AUTOMATED detection. Be conservative - reject unclear images or false positives.

RESPONSE FORMAT (JSON ONLY, NO MARKDOWN):
{
  "isValid": <true|false>,
  "validationScore": <0-100>,
  "rejectionReason": "<specific reason if rejected, null if valid>",
  "detectedCategory": "<pothole|garbage|broken light|water leak|drainage|road damage|illegal construction|other>",
  "generatedTitle": "<concise title for the issue>",
  "generatedDescription": "<detailed description 100-200 words>",
  "severity": <1-10>,
  "priorityLevel": "<Low|Medium|High|Urgent>",
  "priorityScore": <0-100>,
  "confidence": <0.0-1.0>,
  "reasoning": "<explain what you detected and why>",
  "detectedIssueType": "<same as detectedCategory>",
  "validationDetails": {
    "imageQuality": {
      "score": <0-10>,
      "isClearEnough": <true|false>,
      "issue": "<null or description>"
    },
    "issueVisibility": {
      "score": <0-10>,
      "isClearlyVisible": <true|false>,
      "issue": "<null or description>"
    },
    "contextRelevance": {
      "score": <0-10>,
      "isRelevantToCivicIssues": <true|false>
    }
  },
  "severityFactors": {
    "visualSeverity": <0-10>,
    "locationRisk": <0-10>,
    "safetyHazard": <0-10>,
    "urgencyLevel": <0-10>
  },
  "recommendations": "<actions recommended for authorities>",
  "estimatedSize": "<small|medium|large>",
  "potentialRisks": ["<risk1>", "<risk2>"],
  "fraudCheck": {
    "isAuthentic": <true|false>,
    "isRealIssue": <true|false>,
    "isNotConstructionWork": <true|false>,
    "confidenceInDetection": <0-1>
  },
  "estimatedResolutionTime": <hours - rough estimate>
}

REJECTION CRITERIA:
- Reject if image is too blurry/dark to identify issue
- Reject if no civic issue is visible
- Reject if it's clearly ongoing maintenance/construction
- Reject if confidence < 0.6
- Reject if image shows people/vehicles only without infrastructure issue

IMPORTANT: Be precise with category detection. This affects automatic routing to correct authorities.`;

      // Prepare content parts
      const parts = [{ text: sensorPrompt }];

      // Add image
      if (imageData) {
        parts.push({
          inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType
          }
        });
      } else {
        // No image provided - cannot analyze
        return {
          success: false,
          error: 'Image data is required for sensor analysis',
          data: {
            isValid: false,
            validationScore: 0,
            rejectionReason: 'No image provided for analysis',
            confidence: 0
          }
        };
      }

      // Call Gemini API
      console.log('📡 Calling Gemini API for sensor analysis...');
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      console.log('📊 Raw Gemini sensor response:', text);

      // Parse JSON response
      const analysisResult = this.parseSensorResponse(text);

      console.log('✅ Gemini sensor analysis complete:', {
        isValid: analysisResult.isValid,
        detectedCategory: analysisResult.detectedCategory,
        severity: analysisResult.severity,
        confidence: analysisResult.confidence
      });

      return {
        success: true,
        data: analysisResult,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Gemini sensor analysis error:', error);

      // Fallback for sensor data
      return this.fallbackSensorValidation(sensorData);
    }
  }

  /**
   * ✨ NEW: Parse Gemini's sensor-specific JSON response
   */
  parseSensorResponse(text) {
    try {
      // Remove markdown code blocks if present
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate required sensor-specific fields
      const required = [
        'isValid',
        'detectedCategory',
        'confidence',
        'severity'
      ];

      for (const field of required) {
        if (!(field in parsed)) {
          console.warn(`⚠️ Missing field in sensor response: ${field}`);
        }
      }

      // Ensure backwards compatibility with standard analysis
      if (!parsed.priorityLevel) {
        // Derive from severity
        if (parsed.severity >= 8) parsed.priorityLevel = 'Urgent';
        else if (parsed.severity >= 6) parsed.priorityLevel = 'High';
        else if (parsed.severity >= 4) parsed.priorityLevel = 'Medium';
        else parsed.priorityLevel = 'Low';
      }

      if (!parsed.priorityScore) {
        parsed.priorityScore = parsed.severity * 10; // Convert 1-10 to 0-100
      }

      if (!parsed.validationScore) {
        parsed.validationScore = parsed.confidence * 100;
      }

      // Ensure detectedIssueType matches detectedCategory
      if (!parsed.detectedIssueType) {
        parsed.detectedIssueType = parsed.detectedCategory;
      }

      return parsed;

    } catch (error) {
      console.error('❌ Failed to parse Gemini sensor response:', error);
      console.error('Raw text:', text);
      throw new Error('Invalid Gemini sensor response format');
    }
  }

  /**
   * ✨ NEW: Fallback validation for sensor data
   */
  fallbackSensorValidation(sensorData) {
    console.log('⚠️ Using fallback sensor validation');

    const { source_id, lat, lng } = sensorData;

    return {
      success: true,
      data: {
        isValid: false, // Conservative - reject by default in fallback
        validationScore: 30,
        rejectionReason: 'AI analysis unavailable. Manual review required.',
        detectedCategory: 'other',
        generatedTitle: `${source_id}: Issue requires manual review`,
        generatedDescription: `Automated detection from ${source_id} at location ${lat}, ${lng}. AI analysis failed, manual inspection needed.`,
        severity: 5,
        priorityLevel: 'Medium',
        priorityScore: 50,
        confidence: 0.3,
        reasoning: 'Fallback validation - AI unavailable',
        detectedIssueType: 'other',
        validationDetails: {
          imageQuality: { score: 5, isClearEnough: true, issue: null },
          issueVisibility: { score: 5, isClearlyVisible: false, issue: 'AI analysis failed' },
          contextRelevance: { score: 5, isRelevantToCivicIssues: true }
        },
        severityFactors: {
          visualSeverity: 5,
          locationRisk: 5,
          safetyHazard: 5,
          urgencyLevel: 5
        },
        recommendations: 'Manual inspection recommended',
        estimatedSize: 'unknown',
        potentialRisks: ['Unknown - manual review needed'],
        fraudCheck: {
          isAuthentic: false,
          isRealIssue: false,
          isNotConstructionWork: true,
          confidenceInDetection: 0.3
        },
        estimatedResolutionTime: 48
      },
      fallback: true,
      timestamp: new Date()
    };
  }

  /**
   * Adjust priority based on community validation
   */
  adjustPriorityWithCommunity(aiScore, upvoteCount) {
    const communityBoost = upvoteCount * 1.5;
    const adjustedScore = Math.min(100, aiScore + communityBoost);

    let priorityLevel = 'Medium';
    if (adjustedScore >= 85) priorityLevel = 'Urgent';
    else if (adjustedScore >= 70) priorityLevel = 'High';
    else if (adjustedScore < 50) priorityLevel = 'Low';

    return {
      adjustedScore: Math.round(adjustedScore),
      priorityLevel,
      communityBoost,
      breakdown: {
        aiScore,
        communityBoost,
        total: adjustedScore
      }
    };
  }
}

module.exports = new GeminiPriorityService();