const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class GeminiPriorityService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  /**
   * Analyze issue and generate priority score
   */
  async analyzeIssuePriority(issueData) {
    try {
      console.log('🤖 Starting Gemini analysis for issue...');

      const { title, description, category, location, imageData } = issueData;

      // Construct comprehensive prompt
      const prompt = `You are an expert civic issue analyzer. Analyze this reported issue and provide a JSON response.

ISSUE DETAILS:
Title: ${title}
Description: ${description}
Category: ${category}
Location: ${location.address}
Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}
Time Reported: ${new Date().toISOString()}

ANALYSIS REQUIRED:
1. Validate if the issue is authentic (not spam/fraud)
2. Calculate priority score (0-100) based on:
   - Visual severity from image analysis
   - Safety/health risk level
   - Location context (schools, hospitals, high-traffic areas)
   - Urgency indicators in description
   - Impact on community

3. Provide detailed reasoning
4. Suggest recommended action timeline

RESPONSE FORMAT (JSON ONLY, NO MARKDOWN):
{
  "validationScore": <0-100>,
  "priorityLevel": "<Low|Medium|High|Urgent>",
  "priorityScore": <0-100>,
  "confidence": <0.0-1.0>,
  "reasoning": "<detailed explanation>",
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
    "duplicateCheck": <true|false>
  },
  "estimatedResolutionTime": <hours>
}`;

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

      console.log('✅ Gemini analysis complete:', analysisResult);

      return {
        success: true,
        data: analysisResult,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Gemini analysis error:', error);
      
      // Fallback to rule-based system
      return this.fallbackRuleBasedSystem(issueData);
    }
  }

  /**
   * Parse Gemini's JSON response
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
      const required = ['validationScore', 'priorityLevel', 'priorityScore', 'confidence'];
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse Gemini response:', error);
      throw new Error('Invalid Gemini response format');
    }
  }

  /**
   * Fallback rule-based priority system
   */
  fallbackRuleBasedSystem(issueData) {
    console.log('⚠️ Using fallback rule-based system');

    const { category, location } = issueData;
    
    // Simple priority rules
    let priorityScore = 50; // Base score

    // Category-based adjustments
    const urgentCategories = ['fire_safety', 'water_supply', 'electricity'];
    if (urgentCategories.includes(category)) {
      priorityScore += 20;
    }

    // Location-based adjustments (near schools, hospitals)
    const address = location.address.toLowerCase();
    if (address.includes('school') || address.includes('hospital') || address.includes('college')) {
      priorityScore += 15;
    }

    // Determine priority level
    let priorityLevel = 'Medium';
    if (priorityScore >= 80) priorityLevel = 'Urgent';
    else if (priorityScore >= 65) priorityLevel = 'High';
    else if (priorityScore < 40) priorityLevel = 'Low';

    return {
      success: true,
      data: {
        validationScore: 70,
        priorityLevel,
        priorityScore,
        confidence: 0.6,
        reasoning: 'Analyzed using fallback rule-based system due to API unavailability.',
        detectedIssueType: category,
        severityFactors: {
          visualSeverity: 5,
          locationRisk: 5,
          textUrgency: 5,
          temporalContext: 5
        },
        recommendations: 'Standard inspection recommended within 72 hours.',
        fraudCheck: {
          isAuthentic: true,
          imageMatchesDescription: true,
          locationVerified: true,
          duplicateCheck: false
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
    const communityBoost = upvoteCount * 1.5; // 1.5 points per upvote
    const adjustedScore = Math.min(100, aiScore + communityBoost);

    // Recalculate priority level
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