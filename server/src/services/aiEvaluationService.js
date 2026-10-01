/**
 * AI Provider Architecture & Evaluation Service
 * Clean abstraction supporting Gemini / OpenAI / Semantic Heuristic Engine
 */

class AIProviderInterface {
  async evaluate({ questionText, studentAnswer, referenceAnswer, maxMarks, rubricCriteria }) {
    throw new Error('evaluate() method must be implemented by the provider');
  }
}

/**
 * Intelligent Semantic & Rubric-Aware Heuristic Provider
 * Analyzes student response against reference answer, criterion descriptions, and rubric keywords.
 */
class SemanticRubricProvider extends AIProviderInterface {
  async evaluate({ questionText, studentAnswer, referenceAnswer, maxMarks, rubricCriteria }) {
    const sAns = (studentAnswer || '').trim().toLowerCase();
    const rAns = (referenceAnswer || '').trim().toLowerCase();

    // If answer is empty
    if (!sAns) {
      const criteriaEvaluation = (rubricCriteria || []).map((crit) => ({
        criterion: crit.name || 'Criterion',
        marks: 0,
        maxMarks: Number(crit.maxMarks) || 1,
        feedback: 'No response provided for this criterion.'
      }));

      return {
        suggestedMarks: 0,
        maxMarks: Number(maxMarks) || 10,
        criteriaEvaluation,
        overallFeedback: 'No student answer was provided. Suggested score is 0.',
        modelUsed: 'heuristic-semantic-engine-v2'
      };
    }

    const defaultCriteria = rubricCriteria && rubricCriteria.length > 0
      ? rubricCriteria
      : [
          { name: 'Conceptual Understanding', maxMarks: Math.ceil(maxMarks * 0.4), keywords: [] },
          { name: 'Technical Accuracy & Explanation', maxMarks: Math.floor(maxMarks * 0.4), keywords: [] },
          { name: 'Examples / Structure', maxMarks: Math.floor(maxMarks * 0.2), keywords: [] }
        ];

    let totalEarned = 0;
    const criteriaEvaluation = [];

    // Tokenize reference answer for overlap measurement
    const refWords = new Set(
      rAns
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    for (const crit of defaultCriteria) {
      const cMax = Number(crit.maxMarks) || 1;
      const critName = crit.name || 'Evaluation Criterion';
      const critKeywords = Array.isArray(crit.keywords) ? crit.keywords : [];
      const critDescWords = (crit.description || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      let matchedKeywords = 0;
      let totalCheckedKeywords = critKeywords.length;

      if (totalCheckedKeywords > 0) {
        for (const kw of critKeywords) {
          if (sAns.includes(kw.toLowerCase().trim())) {
            matchedKeywords++;
          }
        }
      }

      // Check conceptual overlap
      let matchedRefTerms = 0;
      for (const term of critDescWords) {
        if (sAns.includes(term)) matchedRefTerms++;
      }

      let ratio = 0.5; // baseline moderate comprehension
      if (totalCheckedKeywords > 0) {
        const keywordScore = matchedKeywords / totalCheckedKeywords;
        ratio = 0.4 * keywordScore + 0.6 * (sAns.length > 80 ? 0.8 : 0.4);
      } else {
        // Measure overlap with reference answer keywords
        let generalOverlap = 0;
        refWords.forEach((word) => {
          if (sAns.includes(word)) generalOverlap++;
        });
        const overlapRatio = refWords.size > 0 ? generalOverlap / refWords.size : 0.5;
        ratio = Math.min(1.0, Math.max(0.2, overlapRatio * 1.3));
      }

      // Answer length sanity factor
      if (sAns.length < 30) {
        ratio = Math.min(ratio, 0.3);
      } else if (sAns.length > 150) {
        ratio = Math.min(1.0, ratio + 0.15);
      }

      let criterionMarks = Math.round(cMax * ratio * 2) / 2; // round to nearest 0.5
      if (criterionMarks > cMax) criterionMarks = cMax;
      if (criterionMarks < 0) criterionMarks = 0;

      totalEarned += criterionMarks;

      let feedback = '';
      if (criterionMarks >= cMax * 0.85) {
        feedback = `Strong coverage of ${critName}. Key concepts and terminology match expectations.`;
      } else if (criterionMarks >= cMax * 0.5) {
        feedback = `Adequate discussion of ${critName}, but lacks depth or complete technical precision.`;
      } else {
        feedback = `Insufficient coverage of ${critName}. Key reference points are missing or superficial.`;
      }

      criteriaEvaluation.push({
        criterion: critName,
        marks: criterionMarks,
        maxMarks: cMax,
        feedback
      });
    }

    // Ensure total marks do not exceed question maxMarks
    let finalSuggested = Math.round(totalEarned * 2) / 2;
    if (finalSuggested > maxMarks) finalSuggested = maxMarks;

    let overallFeedback = '';
    const percentage = (finalSuggested / maxMarks) * 100;
    if (percentage >= 80) {
      overallFeedback = `The answer demonstrates sound subject mastery and adheres closely to the marking rubric. Core principles and terminology are well-articulated.`;
    } else if (percentage >= 50) {
      overallFeedback = `The answer covers fundamental aspects reasonably well but misses specific technical nuances and supporting examples defined in the rubric.`;
    } else {
      overallFeedback = `The response is incomplete or brief. It omits significant components required by the reference answer and evaluation criteria.`;
    }

    return {
      suggestedMarks: finalSuggested,
      maxMarks: Number(maxMarks),
      criteriaEvaluation,
      overallFeedback,
      modelUsed: 'rubric-semantic-engine'
    };
  }
}

/**
 * Real Gemini API Provider (used when AI_API_KEY and GEMINI provider configured)
 */
class GeminiProvider extends AIProviderInterface {
  constructor(apiKey, model = 'gemini-1.5-pro') {
    super();
    this.apiKey = apiKey;
    this.model = model || 'gemini-1.5-pro';
  }

  async evaluate({ questionText, studentAnswer, referenceAnswer, maxMarks, rubricCriteria }) {
    const prompt = `You are a strict, fair academic examiner. Evaluate the student's answer against the reference answer and rubric.
Question: ${questionText}
Maximum Marks: ${maxMarks}
Reference Answer: ${referenceAnswer || 'Standard model answer covering core principles'}
Rubric Criteria: ${JSON.stringify(rubricCriteria || [])}
Student's Answer: ${studentAnswer || '(No written answer provided)'}

Return ONLY valid JSON matching this schema:
{
  "marksAwarded": number,
  "suggestedMarks": number,
  "maxMarks": ${maxMarks},
  "criteriaEvaluation": [
    {
      "criterion": "Criterion Name",
      "marks": number,
      "maxMarks": number,
      "feedback": "Concise feedback"
    }
  ],
  "feedback": "Concise summary feedback for this question",
  "overallFeedback": "Concise summary feedback for this question"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    // Strip possible markdown fences
    rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(rawText);

    const numericScore = Number(parsed.suggestedMarks ?? parsed.marksAwarded ?? 0);
    const sanitizedScore = Math.max(0, Math.min(Number(maxMarks), isNaN(numericScore) ? 0 : numericScore));

    return {
      suggestedMarks: sanitizedScore,
      marksAwarded: sanitizedScore,
      maxMarks: Number(maxMarks),
      criteriaEvaluation: Array.isArray(parsed.criteriaEvaluation) ? parsed.criteriaEvaluation : [],
      feedback: parsed.feedback || parsed.overallFeedback || 'AI evaluated against question reference and rubric.',
      overallFeedback: parsed.overallFeedback || parsed.feedback || 'AI evaluated against question reference and rubric.',
      modelUsed: `gemini-api-${this.model}`
    };
  }
}

const geminiService = require('./geminiService');

/**
 * Factory and Service Manager
 */
class AIEvaluationService {
  async evaluateAnswer({
    questionText,
    studentAnswer,
    referenceAnswer,
    maxMarks,
    rubricCriteria,
    unit,
    topic,
    scannedMedia
  }) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      try {
        const geminiResult = await geminiService.evaluateQuestionAnswer({
          questionText,
          maxMarks: Number(maxMarks),
          rubricCriteria,
          expectedAnswer: referenceAnswer,
          studentAnswer,
          unit,
          topic,
          scannedMedia
        });

        const score = Math.max(0, Math.min(Number(maxMarks), Number(geminiResult.marks_awarded ?? 0)));
        const criteriaList = (geminiResult.criteria || []).map((c) => ({
          criterion: c.criterion,
          marks: c.marks_awarded,
          marksAwarded: c.marks_awarded,
          maxMarks: c.maximum_marks,
          feedback: c.reason || ''
        }));

        return {
          suggestedMarks: score,
          marksAwarded: score,
          maxMarks: Number(maxMarks),
          criteriaEvaluation: criteriaList,
          feedback: geminiResult.feedback,
          overallFeedback: geminiResult.feedback,
          strengths: geminiResult.strengths || [],
          missing_points: geminiResult.missing_points || [],
          errors: geminiResult.errors || [],
          modelUsed: geminiResult.modelUsed || 'gemini-1.5-pro'
        };
      } catch (error) {
        console.warn('Gemini API evaluation failed, falling back to Semantic Rubric Engine:', error.message);
        // Fall back gracefully so system remains operational if network or quota issue occurs
      }
    }

    // Heuristic Fallback
    const fallback = new SemanticRubricProvider();
    const fbResult = await fallback.evaluate({
      questionText,
      studentAnswer,
      referenceAnswer,
      maxMarks: Number(maxMarks),
      rubricCriteria
    });

    const score = Math.max(0, Math.min(Number(maxMarks), Number(fbResult.suggestedMarks ?? fbResult.marksAwarded ?? 0)));
    return {
      ...fbResult,
      suggestedMarks: score,
      marksAwarded: score,
      feedback: fbResult.overallFeedback || 'Evaluated with rubric engine.',
      overallFeedback: fbResult.overallFeedback || 'Evaluated with rubric engine.'
    };
  }
}

module.exports = new AIEvaluationService();
