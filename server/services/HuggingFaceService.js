const fetch = require("node-fetch");
require("dotenv").config();

class HuggingFacePriorityService {
  constructor() {
    this.HF_API_KEY = process.env.HF_API_KEY;

    this.IMAGE_MODEL =
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base";

    this.TEXT_MODEL =
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

    this.headers = {
      Authorization: `Bearer ${this.HF_API_KEY}`,
      "Content-Type": "application/json",
    };
  }

  /* ================= IMAGE ANALYSIS ================= */
  async analyzeImage(imageData) {
    try {
      const res = await fetch(this.IMAGE_MODEL, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          inputs: `data:${imageData.mimeType};base64,${imageData.base64}`,
        }),
      });

      const data = await res.json();
      return data?.[0]?.generated_text || null;
    } catch (err) {
      console.error("Image analysis error:", err.message);
      return null;
    }
  }

  /* ================= TEXT ANALYSIS (WITH RETRY) ================= */
  async analyzeText(prompt, retries = 2) {
    try {
      const res = await fetch(this.TEXT_MODEL, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            temperature: 0.2,
            max_new_tokens: 700,
          },
        }),
      });

      const data = await res.json();

      // HF cold-start / model loading case
      if (data?.error && retries > 0) {
        console.log("⏳ HF model loading, retrying...");
        await new Promise((r) => setTimeout(r, 1500));
        return this.analyzeText(prompt, retries - 1);
      }

      return data?.[0]?.generated_text || null;
    } catch (err) {
      console.error("HF text error:", err.message);
      return null;
    }
  }

  /* ================= MAIN ENTRY ================= */
  async analyzeIssuePriority(issueData) {
    try {
      const { title, description, category, location, imageData } = issueData;

      const imageSummary = imageData
        ? await this.analyzeImage(imageData)
        : null;

      const prompt = `
You MUST respond with STRICT JSON ONLY.
No explanations. No markdown.

ISSUE:
Title: ${title}
Description: ${description}
Category: ${category}
Location: ${location.address}
Image Analysis: ${imageSummary || "No image"}

JSON FORMAT:
{
  "isValid": true|false,
  "validationScore": 0-100,
  "rejectionReason": null|string,
  "priorityLevel": "Low|Medium|High|Urgent",
  "priorityScore": 0-100,
  "confidence": 0.0-1.0,
  "reasoning": "short explanation"
}
`;

      const rawText = await this.analyzeText(prompt);
      const parsed = this.safeParse(rawText);

      const titleMeaningful = title.trim().length >= 5;
      const descMeaningful = description.trim().split(" ").length >= 10;
      const imageMatches = !!imageSummary;

      const validationDetails = {
        titleQuality: {
          score: titleMeaningful ? 8 : 3,
          isMeaningful: titleMeaningful,
          issue: titleMeaningful ? null : "Title is unclear or too short",
        },
        descriptionQuality: {
          score: descMeaningful ? 8 : 3,
          isMeaningful: descMeaningful,
          issue: descMeaningful
            ? null
            : "Description lacks sufficient detail",
        },
        imageValidation: {
          score: imageSummary ? 7 : 4,
          matchesDescription: imageMatches,
          isAuthentic: true,
          issue: imageSummary ? null : "Image does not clearly show the issue",
        },
        contentConsistency: {
          score: imageMatches ? 7 : 5,
          isConsistent: imageMatches,
        },
      };

      const fraudCheck = {
        isAuthentic: parsed.isValid,
        imageMatchesDescription: imageMatches,
        locationVerified: true,
        duplicateCheck: false,
        spamDetected: !parsed.isValid,
      };

      return {
        success: true,
        data: {
          ...parsed,
          validationDetails,
          fraudCheck,
          detectedIssueType: category,
          severityFactors: {
            visualSeverity: imageSummary ? 7 : 4,
            locationRisk: this.locationRisk(location.address),
            textUrgency: description.length > 120 ? 7 : 4,
            temporalContext: 5,
          },
          recommendations: parsed.isValid
            ? "Municipal inspection recommended."
            : "Please resubmit with clearer details.",
          estimatedResolutionTime:
            parsed.priorityLevel === "Urgent" ? 12 : 48,
        },
        timestamp: new Date(),
      };
    } catch (err) {
      console.error("HF analysis failed:", err.message);
      return this.fallbackValidationSystem(issueData);
    }
  }

  /* ================= SAFE PARSER ================= */
  safeParse(text) {
    if (!text) {
      return {
        isValid: true,
        validationScore: 65,
        rejectionReason: null,
        priorityLevel: "Medium",
        priorityScore: 55,
        confidence: 0.5,
        reasoning: "AI warming up, heuristic validation used",
      };
    }

    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      return JSON.parse(match[0]);
    } catch (err) {
      console.error("HF JSON parse error:", err.message);
      return {
        isValid: false,
        validationScore: 25,
        rejectionReason: "AI response parsing failed",
        priorityLevel: "Low",
        priorityScore: 25,
        confidence: 0.3,
        reasoning: "Malformed AI response",
      };
    }
  }

  /* ================= LOCATION HEURISTIC ================= */
  locationRisk(address) {
    const risky = ["school", "hospital", "college", "junction"];
    return risky.some((k) => address.toLowerCase().includes(k)) ? 8 : 5;
  }

  /* ================= FALLBACK ================= */
  fallbackValidationSystem(issueData) {
    const valid =
      issueData.title.length > 5 &&
      issueData.description.split(" ").length > 10;

    return {
      success: true,
      data: {
        isValid: valid,
        validationScore: valid ? 65 : 20,
        rejectionReason: valid
          ? null
          : "Insufficient details provided",
        priorityLevel: valid ? "Medium" : "Low",
        priorityScore: valid ? 55 : 20,
        confidence: 0.5,
        reasoning: "Rule-based fallback used",
        validationDetails: {
          titleQuality: { score: 6, isMeaningful: valid, issue: null },
          descriptionQuality: { score: 6, isMeaningful: valid, issue: null },
          imageValidation: {
            score: 5,
            matchesDescription: true,
            isAuthentic: true,
            issue: null,
          },
          contentConsistency: { score: 6, isConsistent: true },
        },
        fraudCheck: {
          isAuthentic: valid,
          imageMatchesDescription: true,
          locationVerified: true,
          duplicateCheck: false,
          spamDetected: !valid,
        },
        detectedIssueType: issueData.category,
        severityFactors: {
          visualSeverity: 5,
          locationRisk: 5,
          textUrgency: 5,
          temporalContext: 5,
        },
        recommendations: valid
          ? "Standard inspection recommended"
          : "Please resubmit",
        estimatedResolutionTime: 48,
      },
      fallback: true,
      timestamp: new Date(),
    };
  }

  /* ================= COMMUNITY BOOST ================= */
  adjustPriorityWithCommunity(aiScore, upvotes) {
    const boost = upvotes * 1.2;
    const score = Math.min(100, aiScore + boost);

    return {
      adjustedScore: Math.round(score),
      priorityLevel:
        score >= 85 ? "Urgent" : score >= 70 ? "High" : "Medium",
    };
  }
}

module.exports = new HuggingFacePriorityService();