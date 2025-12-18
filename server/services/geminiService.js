const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class GeminiPriorityService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  /**
   * Analyze issue and generate priority score with VALIDATION
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