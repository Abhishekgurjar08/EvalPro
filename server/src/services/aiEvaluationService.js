/**
 * AI Provider Architecture & Evaluation Service
 * Clean abstraction supporting Gemini / OpenAI / Semantic Rubric Engine
 */

class AIProviderInterface {
  async evaluate({ questionText, studentAnswer, referenceAnswer, maxMarks, rubricCriteria, unit, topic }) {
    throw new Error('evaluate() method must be implemented by the provider');
  }
}

/**
 * Intelligent Semantic & Rubric-Aware Academic Provider
 * Evaluates student answers against academic concepts, technical depth, equations, and rubric criteria.
 */
class SemanticRubricProvider extends AIProviderInterface {
  async evaluate({ questionText, studentAnswer, referenceAnswer, maxMarks, rubricCriteria, unit, topic }) {
    const numMax = Number(maxMarks) || 10;
    const sAnsRaw = (studentAnswer || '').trim();

    // 1. If student answer is completely empty
    if (!sAnsRaw) {
      const emptyCriteria = (rubricCriteria && rubricCriteria.length > 0
        ? rubricCriteria
        : [
            { name: 'Conceptual Understanding & Definitions', maxMarks: Math.round(numMax * 0.4 * 2) / 2 },
            { name: 'Technical Depth & Derivations', maxMarks: Math.round(numMax * 0.4 * 2) / 2 },
            { name: 'Completeness & Application', maxMarks: Math.max(0.5, Math.round((numMax - Math.round(numMax * 0.4 * 2)) * 2) / 2) }
          ]
      ).map((c) => ({
        criterion: c.name || c.criterion || 'Criterion',
        marks: 0,
        marksAwarded: 0,
        marks_awarded: 0,
        maxMarks: Number(c.maxMarks || c.maximum_marks || 1),
        maximum_marks: Number(c.maxMarks || c.maximum_marks || 1),
        reason: 'No response submitted for this question.',
        feedback: 'No response submitted for this question.'
      }));

      return {
        marks_awarded: 0,
        suggestedMarks: 0,
        maximum_marks: numMax,
        maxMarks: numMax,
        criteria: emptyCriteria,
        criteriaEvaluation: emptyCriteria,
        strengths: [],
        missing_points: ['Question was not attempted or no legible response was detected in the booklet.'],
        errors: [],
        feedback: 'No answer submitted for this question. Zero marks awarded.',
        overallFeedback: 'No answer submitted for this question. Zero marks awarded.',
        modelUsed: 'semantic-rubric-engine'
      };
    }

    const sAns = sAnsRaw.toLowerCase();
    const sWords = sAns.split(/\s+/).filter((w) => w.length > 2);
    const wordCount = sWords.length;

    // Filter words: common English stop words + question boilerplate + syllabus meta-words
    const filterWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'this', 'that', 'with', 'from', 'have', 'has', 'had',
      'for', 'and', 'nor', 'but', 'or', 'yet', 'so', 'in', 'into', 'to', 'of', 'by', 'as', 'are', 'was',
      'were', 'be', 'been', 'being', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
      'now', 'these', 'those', 'whose', 'whom', 'what', 'where', 'when', 'how', 'why',
      'explain', 'describe', 'discuss', 'critically', 'analyze', 'evaluate', 'compare', 'contrast', 'state', 'define',
      'comprehensive', 'theoretical', 'breakdown', 'architectural', 'alignment', 'domain', 'specifications',
      'practical', 'implementation', 'criteria', 'analytical', 'evaluation', 'metrics', 'scoring', 'rationale',
      'detailed', 'candidate', 'explanation', 'addressing', 'principles', 'foundations', 'mathematical',
      'derivations', 'applications', 'considerations', 'tradeoffs', 'trade', 'offs', 'lifecycle', 'constraints',
      'associated', 'patterns', 'ensure', 'correctness', 'maintainability', 'operational', 'structural', 'relevant',
      'provide', 'detail', 'diagram', 'diagrams', 'illustrate', 'examples', 'component', 'components', 'system',
      'approach', 'methodology', 'overview', 'introduction'
    ]);

    // Extract core domain concepts from question, topic, unit, and reference answer
    const qKeywords = (questionText || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !filterWords.has(w));
    const topicKeywords = `${topic || ''} ${unit || ''}`.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !filterWords.has(w));
    const refKeywords = (referenceAnswer || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !filterWords.has(w));
    const domainTerms = Array.from(new Set([...qKeywords, ...topicKeywords, ...refKeywords]));

    let matchedDomainCount = 0;
    const matchedTerms = [];
    for (const term of domainTerms) {
      if (sAns.includes(term)) {
        matchedDomainCount++;
        matchedTerms.push(term);
      }
    }

    // Detect presence of formulas, mathematical notation, symbols, or equations
    const hasMath = /[=λψ∇ℏωπεμναβγ+\-*/^√∫±²³∝·]/.test(sAnsRaw) ||
      /\b(?:vp|vg|e\s*=\s*|p\s*=\s*|h\s*\/\s*|psi|omega|delta|lambda|sin|cos|tan|exp|log|lim|dt|dx|curl|div|apf|hkl)\b/i.test(sAns);

    // Check relevance: If domain terms exist, but student has 0 match and no math, and wrote words
    if (domainTerms.length > 0 && matchedDomainCount === 0 && !hasMath) {
      const zeroCriteria = (rubricCriteria && rubricCriteria.length > 0 ? rubricCriteria : [
        { name: 'Conceptual Understanding', maxMarks: Math.ceil(numMax * 0.4) },
        { name: 'Technical Accuracy & Explanation', maxMarks: Math.floor(numMax * 0.4) },
        { name: 'Examples / Structure', maxMarks: Math.max(1, Math.floor(numMax * 0.2)) }
      ]).map((c) => ({
        criterion: c.name || c.criterion || 'Criterion',
        marks: 0,
        marksAwarded: 0,
        marks_awarded: 0,
        maxMarks: Number(c.maxMarks || c.maximum_marks || 1),
        maximum_marks: Number(c.maxMarks || c.maximum_marks || 1),
        feedback: 'The response does not address the required topic or question principles.',
        reason: 'The response does not address the required topic or question principles.'
      }));

      return {
        marks_awarded: 0,
        suggestedMarks: 0,
        maximum_marks: numMax,
        maxMarks: numMax,
        criteria: zeroCriteria,
        criteriaEvaluation: zeroCriteria,
        strengths: [],
        missing_points: ['Response is off-topic or irrelevant to the question.'],
        errors: ['Unrelated response submitted.'],
        feedback: 'Response is off-topic and fails to address the question requirements. Zero marks awarded.',
        overallFeedback: 'Response is off-topic and fails to address the question requirements. Zero marks awarded.',
        modelUsed: 'semantic-rubric-engine'
      };
    }

    // Calculate domain relevance and depth ratio
    const targetTermsCount = Math.min(domainTerms.length, 5);
    const domainRatio = targetTermsCount > 0 ? Math.min(1.0, matchedDomainCount / targetTermsCount) : 0.5;

    let baseScore = domainRatio * 0.45;
    if (matchedTerms.length >= 4) baseScore += 0.25;
    else if (matchedTerms.length >= 2) baseScore += 0.15;
    else if (matchedTerms.length >= 1) baseScore += 0.08;

    if (hasMath) baseScore += 0.15;

    // Length and completeness weighting
    if (wordCount >= 70 && domainRatio >= 0.6) {
      baseScore += 0.18; // Comprehensive, deep answer
    } else if (wordCount >= 40 && domainRatio >= 0.4) {
      baseScore += 0.10; // Competent, detailed
    } else if (wordCount < 12) {
      baseScore = Math.min(baseScore, 0.25); // Very brief sentence
    } else if (wordCount < 25) {
      baseScore = Math.min(baseScore, 0.45); // Brief response
    }

    const qualityRatio = Math.max(0, Math.min(1.0, baseScore));
    const earnedMarks = Math.max(0, Math.min(numMax, Math.round(numMax * qualityRatio * 2) / 2));

    // Build criteria with exact total sum === numMax
    let criteriaDefs = [];
    if (rubricCriteria && Array.isArray(rubricCriteria) && rubricCriteria.length > 0) {
      criteriaDefs = rubricCriteria.map((c) => ({
        name: c.name || c.criterion || 'Criterion',
        maxMarks: Number(c.maxMarks || c.maximum_marks || 1)
      }));
    } else {
      const c1M = Math.round(numMax * 0.4 * 2) / 2;
      const c2M = Math.round(numMax * 0.4 * 2) / 2;
      const c3M = Math.max(0.5, Math.round((numMax - c1M - c2M) * 2) / 2);
      criteriaDefs = [
        { name: 'Conceptual Understanding & Definitions', maxMarks: c1M },
        { name: 'Technical Accuracy & Principles', maxMarks: c2M },
        { name: 'Formulas, Derivations & Application', maxMarks: c3M }
      ];
    }

    // Distribute earned marks proportionally across criteria
    let remainingEarned = earnedMarks;
    const criteriaEvaluation = [];
    for (let idx = 0; idx < criteriaDefs.length; idx++) {
      const cDef = criteriaDefs[idx];
      const isLast = idx === criteriaDefs.length - 1;
      let cScore = 0;
      if (isLast) {
        cScore = Math.min(cDef.maxMarks, Math.max(0, remainingEarned));
      } else {
        const cRatio = cDef.maxMarks / numMax;
        cScore = Math.min(cDef.maxMarks, Math.max(0, Math.round(earnedMarks * cRatio * 2) / 2));
        remainingEarned = Math.max(0, remainingEarned - cScore);
      }

      const cPercent = (cScore / cDef.maxMarks) * 100;
      let reason = '';
      if (cPercent >= 85) {
        reason = `Strong demonstration of ${cDef.name}. Technical concepts and vocabulary align with standard curriculum.`;
      } else if (cPercent >= 60) {
        reason = `Satisfactory coverage of ${cDef.name}. Basic principles present, but secondary derivations or nuances can be improved.`;
      } else if (cPercent > 0) {
        reason = `Partial coverage of ${cDef.name}. Essential formulas or detailed explanations are missing.`;
      } else {
        reason = `Insufficient coverage of ${cDef.name}.`;
      }

      criteriaEvaluation.push({
        criterion: cDef.name,
        marks: cScore,
        marksAwarded: cScore,
        marks_awarded: cScore,
        maxMarks: cDef.maxMarks,
        maximum_marks: cDef.maxMarks,
        feedback: reason,
        reason
      });
    }

    const percentTotal = (earnedMarks / numMax) * 100;
    let feedback = '';
    const strengths = [];
    const missingPoints = [];

    if (percentTotal >= 85) {
      feedback = 'Comprehensive and technically sound explanation. Demonstrates clear subject mastery, accurate principles, and appropriate equations.';
      strengths.push('Thorough conceptual explanation', 'Accurate scientific terminology', 'Well-structured response');
    } else if (percentTotal >= 65) {
      feedback = `Good answer demonstrating solid understanding of ${topic || 'the topic'}. Covers main ideas well, with minor omissions in analytical derivation.`;
      strengths.push('Solid conceptual grasp', 'Appropriate technical context');
      missingPoints.push('Could include more mathematical steps or specific boundary conditions.');
    } else if (percentTotal >= 40) {
      feedback = 'Partially correct answer addressing basic concepts. Lacks deeper technical explanation, derivations, or supporting equations.';
      strengths.push('Familiarity with foundational terms');
      missingPoints.push('Omitted core derivations and formulas', 'Incomplete technical depth');
    } else {
      feedback = 'Brief or superficial response. Mentions introductory points but lacks substantive theoretical and analytical development.';
      strengths.push('Introductory terminology mentioned');
      missingPoints.push('Lacks detailed explanations, equations, and proper academic structure.');
    }

    return {
      marks_awarded: earnedMarks,
      suggestedMarks: earnedMarks,
      maximum_marks: numMax,
      maxMarks: numMax,
      criteria: criteriaEvaluation,
      criteriaEvaluation,
      strengths,
      missing_points: missingPoints,
      errors: [],
      feedback,
      overallFeedback: feedback,
      modelUsed: 'semantic-rubric-engine'
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
    const geminiService = require('./geminiService');
    return geminiService.evaluateQuestionAnswer({
      questionText,
      studentAnswer,
      expectedAnswer: referenceAnswer,
      maxMarks,
      rubricCriteria
    });
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

        const score = Math.max(0, Math.min(Number(maxMarks), Number(geminiResult.marks_awarded ?? geminiResult.marksAwarded ?? 0)));
        const criteriaList = (geminiResult.criteria || geminiResult.criteriaEvaluation || []).map((c) => ({
          criterion: c.criterion || c.name || 'Criterion',
          marks: Number(c.marks_awarded ?? c.marksAwarded ?? 0),
          marksAwarded: Number(c.marks_awarded ?? c.marksAwarded ?? 0),
          maxMarks: Number(c.maximum_marks ?? c.maxMarks ?? 1),
          feedback: c.reason || c.feedback || ''
        }));

        return {
          suggestedMarks: score,
          marksAwarded: score,
          maxMarks: Number(maxMarks),
          criteriaEvaluation: criteriaList,
          feedback: geminiResult.feedback || 'Evaluated successfully.',
          overallFeedback: geminiResult.feedback || 'Evaluated successfully.',
          strengths: geminiResult.strengths || [],
          missing_points: geminiResult.missing_points || [],
          errors: geminiResult.errors || [],
          modelUsed: geminiResult.modelUsed || 'gemini-1.5-pro'
        };
      } catch (error) {
        console.warn('Gemini API evaluation failed, falling back to Semantic Rubric Engine:', error.message);
      }
    }

    // Heuristic Fallback
    const fallback = new SemanticRubricProvider();
    const fbResult = await fallback.evaluate({
      questionText,
      studentAnswer,
      referenceAnswer,
      maxMarks: Number(maxMarks),
      rubricCriteria,
      unit,
      topic
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
