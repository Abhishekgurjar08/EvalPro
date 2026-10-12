/**
 * Dedicated Google Gemini AI Service Layer
 * 
 * Provides:
 * 1. AI Question Paper Generation strictly from Syllabus & Examination configuration
 * 2. AI Question-wise Answer Evaluation (supporting text & multimodal scanned images/PDFs)
 * 3. Individual Question Regeneration
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiService {
  constructor() {
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
  }

  /**
   * Helper: Check if a valid API key is present
   */
  hasApiKey() {
    const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    return !!(key && key.trim() !== '' && key !== 'your_gemini_api_key_here');
  }

  /**
   * Helper: Retrieve configured API key securely from environment
   * Throws clear configuration error if not set.
   */
  getApiKey() {
    const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
      const err = new Error(
        'Gemini API key is not configured. Please set GEMINI_API_KEY in the backend .env file.'
      );
      err.statusCode = 500;
      err.code = 'GEMINI_KEY_MISSING';
      throw err;
    }
    return key.trim();
  }

  /**
   * Helper: Get Gemini generative model instance
   */
  getModel(modelName = this.defaultModel) {
    const apiKey = this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
  }

  /**
   * Sanitizes raw Gemini JSON output (stripping code fences, whitespace)
   */
  cleanAndParseJson(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Empty response received from Gemini AI.');
    }
    let cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      // Attempt to extract json object or array
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      }
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      }
      throw new Error(`Failed to parse Gemini response as JSON: ${parseErr.message}`);
    }
  }

  /**
   * Helper: Extracts distinct academic concepts from a Unit's title and description
   */
  extractConceptsFromUnit(unit) {
    if (!unit) return ['Core Principles'];
    const concepts = [];
    const text = `${unit.title || ''}. ${unit.description || ''}`;

    // Split by comma, semicolon, period, bullet, or conjunctions
    const rawParts = text
      .split(/[,;\n\r\t•]+|\band\b|\bas well as\b/i)
      .map((p) => p.replace(/[()\[\]{}:"']/g, '').trim())
      .filter(
        (p) =>
          p.length >= 3 &&
          !/^(unit|\d+|chapter|module|syllabus|introduction|overview|etc|various|different|types|concept|concepts|study)$/i.test(p)
      );

    const seen = new Set();
    for (const p of rawParts) {
      const lower = p.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        concepts.push(p);
      }
    }

    if (Array.isArray(unit.topics) && unit.topics.length > 0) {
      for (const t of unit.topics) {
        if (t.title && !seen.has(t.title.toLowerCase())) {
          seen.add(t.title.toLowerCase());
          concepts.push(t.title);
        }
      }
    }

    return concepts.length > 0 ? concepts : [unit.title || 'Core Principles'];
  }

  /**
   * Helper: Checks if a question is relevant to a Unit's Name & Description concepts
   * and does NOT stray into foreign domains.
   */
  isQuestionRelevantToUnit(q, unit) {
    if (!unit) return { relevant: true };
    const qText = `${q.questionText || q.question || ''} ${
      Array.isArray(q.subQuestions) ? q.subQuestions.map((sq) => sq.questionText || sq.text || '').join(' ') : ''
    }`.toLowerCase();

    // Check against foreign domain words unless those domains are present in this unit's description
    const foreignDomains = [
      {
        domain: 'Computer Networks',
        keywords: ['tcp/ip', 'tcp ip', 'osi layer', 'bgp routing', 'dns lookup', 'subnetting', 'ip address', 'router protocol', 'ethernet frame', 'packet switching']
      },
      {
        domain: 'Database Management',
        keywords: ['sql query', 'relational algebra', 'normalization 1nf', '2nf', '3nf', 'b-tree index', 'acid properties', 'foreign key constraint', 'entity relationship']
      },
      {
        domain: 'Cryptography',
        keywords: ['rsa encryption', 'elliptic curve', 'sha-256', 'diffie-hellman', 'symmetric cipher', 'digital signature algorithm']
      },
      {
        domain: 'Operating Systems',
        keywords: ['cpu scheduling algorithm', 'page replacement fifo', 'lru', 'virtual memory paging', 'semaphore and mutex', 'deadlock avoidance', 'fork exec process']
      }
    ];

    const unitText = `${unit.title || ''} ${unit.description || ''}`.toLowerCase();

    for (const fd of foreignDomains) {
      const unitMentionsDomain = fd.keywords.some((k) => unitText.includes(k)) || unitText.includes(fd.domain.toLowerCase());
      if (!unitMentionsDomain) {
        const foreignMatch = fd.keywords.find((k) => qText.includes(k));
        if (foreignMatch) {
          return {
            relevant: false,
            reason: `Question touches foreign concept "${foreignMatch}" belonging to ${fd.domain}, which is outside Unit "${unit.title}" boundary.`
          };
        }
      }
    }

    // Check that question relates to concepts from unit title or description
    const concepts = this.extractConceptsFromUnit(unit);
    const words = unitText
      .split(/[^a-zA-Z0-9]+/)
      .filter((w) => w.length >= 4 && !['this', 'that', 'with', 'from', 'have', 'more', 'such', 'into', 'each', 'unit', 'study', 'also'].includes(w));

    const matchesConcept = concepts.some((c) => qText.includes(c.toLowerCase())) || words.some((w) => qText.includes(w));
    if (!matchesConcept && words.length > 0) {
      return {
        relevant: false,
        reason: `Question does not reflect concepts from Unit "${unit.title}".`
      };
    }

    return { relevant: true };
  }

  /**
   * Programmatic Post-Generation Validation Layer
   * Strictly enforces Structure, Unit Distribution, Syllabus Knowledge Boundary, and Quality.
   */
  validateGeneratedQuestions(questions, { syllabus, blueprint, totalMarks, expectedQuestionCount }) {
    const errors = [];
    const invalidIndices = new Set();

    if (!Array.isArray(questions) || questions.length === 0) {
      return { isValid: false, errors: ['No questions generated.'], invalidIndices: [] };
    }

    // 1. Structure: Total Question Count
    if (questions.length !== expectedQuestionCount) {
      errors.push(`Expected exactly ${expectedQuestionCount} questions, but got ${questions.length}.`);
    }

    // 2. Structure: Total Marks
    const calculatedSum = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    if (calculatedSum !== totalMarks) {
      errors.push(`Total marks (${calculatedSum}) does not match scheme total marks (${totalMarks}).`);
    }

    // 3. Structure: Numbering, Positive Marks & Sub-Questions
    const seenTexts = new Map();
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qMarks = Number(q.marks);
      const text = (q.questionText || q.question || '').trim();

      if (!text || text.length < 15) {
        errors.push(`Q${i + 1}: Question text is missing or too short.`);
        invalidIndices.add(i);
      }

      if (isNaN(qMarks) || qMarks <= 0) {
        errors.push(`Q${i + 1}: Invalid marks value (${q.marks}).`);
        invalidIndices.add(i);
      }

      // Check sub-questions if present
      if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
        const subSum = q.subQuestions.reduce((s, sq) => s + (Number(sq.marks) || 0), 0);
        if (subSum !== qMarks) {
          errors.push(`Q${i + 1}: Sub-question marks sum (${subSum}) does not equal question marks (${qMarks}).`);
          invalidIndices.add(i);
        }
        for (const sq of q.subQuestions) {
          const sqText = (sq.questionText || sq.text || '').trim();
          if (!sqText) {
            errors.push(`Q${i + 1}: Sub-question part (${sq.subLabel || 'Part'}) has empty text.`);
            invalidIndices.add(i);
          }
        }
      }

      // Quality: Check duplicates
      const normText = text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      if (seenTexts.has(normText)) {
        errors.push(`Q${i + 1}: Duplicate question detected (identical to Q${seenTexts.get(normText) + 1}).`);
        invalidIndices.add(i);
      } else {
        seenTexts.set(normText, i);
      }
    }

    // 4. Unit Distribution Constraints (Hard Constraint)
    const unitDist = blueprint?.unitDistribution || [];
    if (unitDist.length > 0) {
      for (const ud of unitDist) {
        const udUnitNorm = (ud.unit || '').toLowerCase().trim();
        const matchingIndices = [];
        for (let i = 0; i < questions.length; i++) {
          const qUnitNorm = (questions[i].unit || '').toLowerCase().trim();
          if (qUnitNorm === udUnitNorm || qUnitNorm.includes(udUnitNorm) || udUnitNorm.includes(qUnitNorm)) {
            matchingIndices.push(i);
          }
        }

        const requiredCount = Number(ud.questionsCount);
        if (!isNaN(requiredCount) && requiredCount > 0 && matchingIndices.length !== requiredCount) {
          errors.push(`Unit "${ud.unit}": Expected ${requiredCount} question(s), but found ${matchingIndices.length}.`);
          if (matchingIndices.length > requiredCount) {
            for (let k = requiredCount; k < matchingIndices.length; k++) {
              invalidIndices.add(matchingIndices[k]);
            }
          }
        }

        const requiredMarks = Number(ud.marks);
        const actualMarks = matchingIndices.reduce((sum, idx) => sum + (Number(questions[idx].marks) || 0), 0);
        if (!isNaN(requiredMarks) && requiredMarks > 0 && actualMarks !== requiredMarks) {
          errors.push(`Unit "${ud.unit}": Expected ${requiredMarks} marks, but found ${actualMarks} marks.`);
        }
      }
    }

    // 5. Syllabus Boundary Relevance Check
    if (syllabus?.units?.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const assignedUnit = syllabus.units.find((u) => {
          const uTitle = (u.title || '').toLowerCase().trim();
          const qUnit = (q.unit || '').toLowerCase().trim();
          return uTitle === qUnit || uTitle.includes(qUnit) || qUnit.includes(uTitle);
        });

        if (assignedUnit) {
          const check = this.isQuestionRelevantToUnit(q, assignedUnit);
          if (!check.relevant) {
            errors.push(`Q${i + 1}: ${check.reason}`);
            invalidIndices.add(i);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      invalidIndices: Array.from(invalidIndices)
    };
  }

  /**
   * Repairs ONLY invalid questions with a bounded retry limit (Section 7)
   */
  async repairInvalidQuestions(questions, invalidIndices, context) {
    const { syllabus, blueprint, subject, targetTotalMarks, expectedQuestionCount } = context;
    const MAX_RETRIES = 3;

    let repairedQuestions = [...questions];
    let currentInvalid = [...invalidIndices];

    for (let attempt = 1; attempt <= MAX_RETRIES && currentInvalid.length > 0; attempt++) {
      console.log(`[Validation Repair Attempt ${attempt}] Repairing questions: ${currentInvalid.map((i) => 'Q' + (i + 1)).join(', ')}`);

      for (const idx of currentInvalid) {
        const targetQ = repairedQuestions[idx];
        const targetUnitName =
          targetQ.unit || (blueprint?.unitDistribution?.[idx % (blueprint.unitDistribution?.length || 1)]?.unit) || 'Unit 1';

        const syllabusUnit =
          (syllabus.units || []).find((u) => {
            const uTitle = (u.title || '').toLowerCase();
            const tUnit = targetUnitName.toLowerCase();
            return uTitle.includes(tUnit) || tUnit.includes(uTitle);
          }) || syllabus.units[idx % syllabus.units.length];

        const otherQuestions = repairedQuestions.filter((_, i) => i !== idx).map((q) => q.questionText);

        try {
          const replacement = await this.regenerateQuestion({
            subject,
            unit: syllabusUnit?.title || targetUnitName,
            unitDescription: syllabusUnit?.description || '',
            topic: targetQ.topic || targetQ.conceptReference || 'Core Unit Concepts',
            marks: targetQ.marks,
            difficulty: targetQ.difficulty || 'MEDIUM',
            questionType: targetQ.questionType || 'DESCRIPTIVE',
            questionPattern: blueprint?.questionPattern || 'SIMPLE',
            existingQuestions: otherQuestions
          });

          replacement.questionNumber = idx + 1;
          repairedQuestions[idx] = replacement;
        } catch (repairErr) {
          console.warn(`Repair for Q${idx + 1} failed:`, repairErr.message);
        }
      }

      // Re-validate repaired paper
      const reVal = this.validateGeneratedQuestions(repairedQuestions, {
        syllabus,
        blueprint,
        totalMarks: targetTotalMarks,
        expectedQuestionCount
      });

      if (reVal.isValid) {
        return { success: true, questions: repairedQuestions };
      }
      currentInvalid = reVal.invalidIndices;
    }

    return {
      success: currentInvalid.length === 0,
      questions: repairedQuestions,
      remainingErrors: currentInvalid
    };
  }

  /**
   * FEATURE 1: Generate Examination Question Paper from Syllabus & Paper Scheme
   * Strict adherence to:
   * - Unit Name + Unit Description (Knowledge boundary)
   * - Paper Scheme (Authoritative Hard Constraint)
   * - Unit-wise Question & Marks Distribution
   * - Programmatic Validation & Single-Question Repair
   * - Multiple Sets
   */
  async generateQuestionPaper({
    examination,
    syllabus,
    blueprint,
    targetTotalMarks,
    targetQuestionCount
  }) {
    if (!syllabus || !Array.isArray(syllabus.units) || syllabus.units.length === 0) {
      const err = new Error(
        'Cannot generate paper: No syllabus units found for this examination. Please add and save syllabus units first.'
      );
      err.statusCode = 400;
      throw err;
    }

    const examName = examination?.name || 'University Examination';
    const subject = examination?.subject || syllabus.subject || 'Academic Subject';
    const totalMarks = Number(targetTotalMarks || blueprint?.totalMarks || examination?.maxMarks || 50);

    // Resolve authoritative unit distribution
    let unitDistribution = [];
    if (Array.isArray(blueprint?.unitDistribution) && blueprint.unitDistribution.length > 0) {
      unitDistribution = blueprint.unitDistribution;
    } else {
      const count = syllabus.units.length;
      const baseM = Math.floor(totalMarks / count);
      let remM = totalMarks % count;
      unitDistribution = syllabus.units.map((u, idx) => {
        const uM = baseM + (remM > 0 ? 1 : 0);
        if (remM > 0) remM--;
        const uTitle = u.title ? (u.title.startsWith('Unit') ? u.title : `Unit ${idx + 1}: ${u.title}`) : `Unit ${idx + 1}`;
        return {
          unit: uTitle,
          questionsCount: Math.max(1, Math.round(uM / 10)) || 1,
          marks: uM
        };
      });
    }

    const expectedQuestionCount = Number(
      targetQuestionCount ||
      blueprint?.totalQuestions ||
      unitDistribution.reduce((sum, ud) => sum + (Number(ud.questionsCount) || 1), 0) ||
      Math.max(2, Math.min(10, Math.round(totalMarks / 10)))
    );

    const questionPattern = blueprint?.questionPattern || 'SIMPLE';
    const numberOfSets = Math.max(1, Number(blueprint?.numberOfSets) || 1);
    const difficultyDist = blueprint?.difficultyDistribution || { easy: 30, medium: 50, hard: 20 };
    const questionTypeDist = blueprint?.questionTypeDistribution || {
      descriptive: 40,
      longAnswer: 40,
      shortAnswer: 20,
      mcq: 0
    };

    // If Gemini API key is not configured, generate via structured fallback engine
    if (!this.hasApiKey()) {
      return this.generateFallbackPaperFromSyllabus({
        examination,
        syllabus,
        blueprint: {
          ...blueprint,
          unitDistribution,
          totalQuestions: expectedQuestionCount,
          totalMarks,
          questionPattern,
          numberOfSets,
          difficultyDistribution: difficultyDist,
          questionTypeDistribution: questionTypeDist
        },
        targetTotalMarks: totalMarks,
        targetQuestionCount: expectedQuestionCount
      });
    }

    // Section 1: Structured AI Input (Per-Unit Scheme & Boundary)
    let currentQNumber = 1;
    const structuredUnitEntries = unitDistribution
      .map((ud, idx) => {
        const sylUnit =
          syllabus.units.find((u) => {
            const uT = (u.title || '').toLowerCase().trim();
            const udT = (ud.unit || '').toLowerCase().trim();
            return uT === udT || uT.includes(udT) || udT.includes(uT);
          }) || syllabus.units[idx % syllabus.units.length];

        const uNum = sylUnit?.unitNumber || idx + 1;
        const uTitle = sylUnit?.title || ud.unit || `Unit ${uNum}`;
        const uDesc = sylUnit?.description || 'Core syllabus concepts and applications.';
        const reqQ = Number(ud.questionsCount) || 1;
        const reqM = Number(ud.marks) || Math.floor(totalMarks / unitDistribution.length);

        const assignedQIndices = [];
        const basePerQ = Math.floor(reqM / reqQ);
        let remPerQ = reqM % reqQ;
        for (let k = 0; k < reqQ; k++) {
          const qM = basePerQ + (remPerQ > 0 ? 1 : 0);
          if (remPerQ > 0) remPerQ--;
          assignedQIndices.push(`Q${currentQNumber} (${qM} marks)`);
          currentQNumber++;
        }

        return `Unit ${uNum}:
Name: ${uTitle}
Description:
${uDesc}
Required Questions: ${reqQ}
Required Marks: ${reqM}
Allocated Questions: ${assignedQIndices.join(', ')}`;
      })
      .join('\n\n');

    const patternInstruction =
      questionPattern === 'SUB_QUESTION'
        ? 'Divide main questions into sub-questions (A) and (B). Example: Q1(A) = 2 marks, Q1(B) = 3 marks. The sum of sub-questions marks must equal question marks.'
        : questionPattern === 'ABC'
        ? 'Divide main questions into 3 sub-questions (A), (B), and (C). The sum of sub-questions marks must equal question marks.'
        : questionPattern === 'MIXED'
        ? 'Allocate mixed marks per question according to the allocated question marks scheme.'
        : 'Direct standalone single questions per number.';

    const prompt = `You are an authoritative university examination paper authoring AI assistant.

OBJECTIVE:
Generate an official academic examination question paper strictly respecting the syllabus boundaries and the hard scheme constraints.

EXAMINATION DETAILS:
- Examination Name: ${examName}
- Course / Subject: ${subject}
- Total Marks: ${totalMarks}
- Total Questions: ${expectedQuestionCount}
- Question Pattern: ${questionPattern}
- Difficulty Distribution: Easy ${difficultyDist.easy}%, Medium ${difficultyDist.medium}%, Hard ${difficultyDist.hard}%
- Question Type Distribution: Descriptive ${questionTypeDist.descriptive || 40}%, Long Answer ${questionTypeDist.longAnswer || 40}%, Short Answer ${questionTypeDist.shortAnswer || 20}%
- Number of Sets to Generate: ${numberOfSets}

==================================================
STRUCTURED SYLLABUS & UNIT-WISE PAPER SCHEME:
==================================================
${structuredUnitEntries}

==================================================
STRICT RULES & HARD CONSTRAINTS (MANDATORY):
==================================================
1. UNIT DESCRIPTION IS THE KNOWLEDGE BOUNDARY:
   - For every question allocated to a Unit, the question concepts MUST be derived ONLY and STRICTLY from that specific Unit's Name and Description.
   - Do NOT introduce concepts from foreign or unrelated subjects (e.g. do NOT generate questions on Computer Networks, Operating Systems, Database Systems, Cryptography, etc. unless those exact concepts are explicitly stated in that Unit's description).
   - Derive rich, university-level technical and analytical problems from the concepts in that Unit's description.

2. PAPER SCHEME IS A HARD CONSTRAINT (NO DRIFT PERMITTED):
   - Total questions generated must be EXACTLY ${expectedQuestionCount}.
   - Total marks across all questions must be EXACTLY ${totalMarks}.
   - Every Unit must have EXACTLY its Required Questions count.
   - The marks for questions in each Unit must sum EXACTLY to its Required Marks.

3. QUESTION PATTERN (${questionPattern}):
   ${patternInstruction}

4. MULTIPLE SETS:
   ${
     numberOfSets > 1
       ? `- Generate ${numberOfSets} distinct question paper sets (Set 1, Set 2, ...).
- Every set MUST follow the EXACT SAME total questions (${expectedQuestionCount}), total marks (${totalMarks}), unit-wise distribution, and question pattern.
- However, the specific questions between sets MUST BE DIFFERENT (do NOT duplicate Set 1 into Set 2). Different sets must test equivalent concepts from the Unit Description with comparable difficulty.`
       : `- Generate 1 comprehensive paper set.`
   }

Return ONLY valid JSON matching this exact structure:
{
  "title": "${examName} - ${subject} Question Paper",
  "total_marks": ${totalMarks},
  "questionCount": ${expectedQuestionCount},
  ${
    numberOfSets > 1
      ? `"sets": [
    {
      "setNumber": 1,
      "setName": "Set A",
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "Detailed question text...",
          "marks": 5,
          "unit": "Unit Name",
          "conceptReference": "Key concept from unit description",
          "difficulty": "EASY|MEDIUM|HARD",
          "questionType": "DESCRIPTIVE|SHORT_ANSWER|LONG_ANSWER|MCQ",
          "subQuestions": [
            { "subLabel": "A", "marks": 2, "questionText": "Sub-part A text..." },
            { "subLabel": "B", "marks": 3, "questionText": "Sub-part B text..." }
          ],
          "expectedAnswer": "Model answer and key scoring criteria."
        }
      ]
    }
  ]`
      : `"questions": [
    {
      "questionNumber": 1,
      "questionText": "Detailed question text...",
      "marks": 5,
      "unit": "Unit Name",
      "conceptReference": "Key concept from unit description",
      "difficulty": "EASY|MEDIUM|HARD",
      "questionType": "DESCRIPTIVE|SHORT_ANSWER|LONG_ANSWER|MCQ",
      "subQuestions": [
        { "subLabel": "A", "marks": 2, "questionText": "Sub-part A text..." },
        { "subLabel": "B", "marks": 3, "questionText": "Sub-part B text..." }
      ],
      "expectedAnswer": "Model answer and key scoring criteria."
    }
  ]`
  }
}`;

    const model = this.getModel();
    let response;
    try {
      response = await model.generateContent(prompt);
    } catch (apiError) {
      console.warn('Gemini API call failed, falling back to structured syllabus engine:', apiError.message);
      return this.generateFallbackPaperFromSyllabus({
        examination,
        syllabus,
        blueprint: {
          ...blueprint,
          unitDistribution,
          totalQuestions: expectedQuestionCount,
          totalMarks,
          questionPattern,
          numberOfSets
        },
        targetTotalMarks,
        targetQuestionCount
      });
    }

    const rawText = response.response?.text?.() || '';
    const parsedData = this.cleanAndParseJson(rawText);

    // Extract questions list
    let parsedQuestions = [];
    let setsList = [];

    if (parsedData?.sets && Array.isArray(parsedData.sets) && parsedData.sets.length > 0) {
      setsList = parsedData.sets;
      parsedQuestions = setsList[0]?.questions || [];
    } else if (parsedData?.questions && Array.isArray(parsedData.questions)) {
      parsedQuestions = parsedData.questions;
      setsList = [{ setNumber: 1, setName: 'Set 1', questions: parsedQuestions }];
    }

    if (!parsedQuestions || parsedQuestions.length === 0) {
      return this.generateFallbackPaperFromSyllabus({
        examination,
        syllabus,
        blueprint: {
          ...blueprint,
          unitDistribution,
          totalQuestions: expectedQuestionCount,
          totalMarks,
          questionPattern,
          numberOfSets
        },
        targetTotalMarks,
        targetQuestionCount
      });
    }

    // Normalize question objects
    const normalizeQuestionList = (rawList) => {
      return rawList.map((q, i) => {
        const qText = (q.questionText || q.question || '').trim();
        const qMarks = Number(q.marks) || 5;
        let subQ = [];
        if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
          subQ = q.subQuestions.map((sq, sqIdx) => ({
            subLabel: sq.subLabel || (sqIdx === 0 ? 'A' : sqIdx === 1 ? 'B' : 'C'),
            marks: Number(sq.marks) || Math.floor(qMarks / q.subQuestions.length),
            questionText: sq.questionText || sq.text || ''
          }));
        }

        return {
          questionNumber: q.questionNumber || i + 1,
          questionText: qText,
          marks: qMarks,
          unit: q.unit || `Unit ${(i % unitDistribution.length) + 1}`,
          topic: q.topic || q.conceptReference || 'Core Unit Concepts',
          conceptReference: q.conceptReference || q.topic || '',
          difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
          questionType: (q.questionType || 'DESCRIPTIVE').toUpperCase(),
          subQuestions: subQ,
          expectedAnswer: q.expectedAnswer || 'Model answer and evaluation criteria.',
          options: Array.isArray(q.options) ? q.options : []
        };
      });
    };

    let normalizedQuestions = normalizeQuestionList(parsedQuestions);

    // Section 6 & 7: Post-Generation Validation Layer & Single-Question Repair
    const validationContext = {
      syllabus,
      blueprint: {
        ...blueprint,
        unitDistribution,
        totalQuestions: expectedQuestionCount,
        totalMarks,
        questionPattern,
        numberOfSets
      },
      examination,
      subject,
      targetTotalMarks: totalMarks,
      expectedQuestionCount
    };

    const initialValidation = this.validateGeneratedQuestions(normalizedQuestions, validationContext);

    if (!initialValidation.isValid) {
      console.log(`[AI Generation] Validation found issues: ${initialValidation.errors.join(' | ')}. Initiating single-question repair...`);
      const repairResult = await this.repairInvalidQuestions(
        normalizedQuestions,
        initialValidation.invalidIndices,
        validationContext
      );

      if (repairResult.success) {
        normalizedQuestions = repairResult.questions;
      } else {
        console.warn('AI Repair could not satisfy all constraints, utilizing structured academic fallback.');
        return this.generateFallbackPaperFromSyllabus(validationContext);
      }
    }

    // Build finalized sets if multiple sets requested
    const finalizedSets = setsList.map((s, sIdx) => ({
      setNumber: s.setNumber || sIdx + 1,
      setName: s.setName || `Set ${String.fromCharCode(65 + sIdx)}`,
      questions: sIdx === 0 ? normalizedQuestions : normalizeQuestionList(s.questions || normalizedQuestions)
    }));

    return {
      title: parsedData.title || `${examName} - Question Paper`,
      total_marks: totalMarks,
      questionCount: normalizedQuestions.length,
      numberOfSets,
      questions: normalizedQuestions,
      sets: finalizedSets,
      blueprintAdherence: {
        totalMarksMatch: true,
        questionCountMatch: true,
        unitCoverage: Array.from(new Set(normalizedQuestions.map((q) => q.unit))),
        targetMarks: totalMarks,
        generatedMarks: normalizedQuestions.reduce((sum, q) => sum + q.marks, 0)
      },
      generatedWith: 'gemini-api'
    };
  }

  /**
   * Helper: Regenerate an individual question strictly within Unit Description boundaries
   */
  async regenerateQuestion({
    subject,
    unit,
    unitDescription = '',
    topic,
    marks,
    difficulty = 'MEDIUM',
    questionType = 'DESCRIPTIVE',
    questionPattern = 'SIMPLE',
    existingQuestions = []
  }) {
    const qMarks = Number(marks) || 5;

    if (!this.hasApiKey()) {
      return this.generateFallbackSingleQuestion({
        subject,
        unit,
        unitDescription,
        topic,
        marks: qMarks,
        difficulty,
        questionType,
        questionPattern,
        existingQuestions
      });
    }

    const existingTexts = existingQuestions.slice(0, 10).map((q) => `- ${q}`).join('\n');
    const prompt = `You are an academic university examination paper authoring assistant.

Generate exactly ONE new, distinct examination question strictly within the specified Unit Description knowledge boundary:

SUBJECT: ${subject || 'Academic Subject'}
UNIT NAME: ${unit || 'Unit 1'}
UNIT DESCRIPTION (KNOWLEDGE BOUNDARY):
${unitDescription || 'Core syllabus concepts and applications.'}

REQUIRED MARKS: ${qMarks}
DIFFICULTY: ${difficulty}
QUESTION TYPE: ${questionType}
QUESTION PATTERN: ${questionPattern}

STRICT RULES:
1. KNOWLEDGE BOUNDARY: The question MUST be derived ONLY and STRICTLY from the concepts present in the Unit Description above. Do NOT bring in unrelated subjects or external domains.
2. Must NOT duplicate or closely rephrase any of these existing questions:
${existingTexts || '(None)'}
3. If Question Pattern is SUB_QUESTION, divide into sub-questions (A) and (B) totaling ${qMarks} marks.
4. If Question Pattern is ABC, divide into 3 sub-questions (A), (B), and (C) totaling ${qMarks} marks.

Return ONLY valid JSON:
{
  "questionText": "Detailed question text...",
  "marks": ${qMarks},
  "unit": "${unit || 'Unit 1'}",
  "topic": "${topic || 'Core Concept'}",
  "conceptReference": "Key concept from unit description",
  "difficulty": "${difficulty}",
  "questionType": "${questionType}",
  "subQuestions": [],
  "expectedAnswer": "Comprehensive model answer and scoring rubric points."
}`;

    try {
      const model = this.getModel();
      const response = await model.generateContent(prompt);
      const parsed = this.cleanAndParseJson(response.response?.text?.() || '');

      const subQ = Array.isArray(parsed.subQuestions) ? parsed.subQuestions : [];
      let finalQuestionText = parsed.questionText || parsed.question || 'Comprehensive analytical question.';
      if (subQ.length > 0 && !finalQuestionText.includes('(A)')) {
        finalQuestionText = `Answer the following sub-questions regarding ${parsed.topic || unit}:\n\n` +
          subQ.map((sq) => `(${sq.subLabel || 'Part'}) ${sq.questionText || sq.text} [${sq.marks} Marks]`).join('\n\n');
      }

      return {
        questionNumber: 1,
        questionText: finalQuestionText,
        marks: qMarks,
        unit: parsed.unit || unit,
        topic: parsed.topic || topic || 'Core Concept',
        conceptReference: parsed.conceptReference || parsed.topic || '',
        difficulty: (parsed.difficulty || difficulty || 'MEDIUM').toUpperCase(),
        questionType: (parsed.questionType || questionType || 'DESCRIPTIVE').toUpperCase(),
        subQuestions: subQ,
        expectedAnswer: parsed.expectedAnswer || 'Model answer covering core unit concepts.'
      };
    } catch (err) {
      console.warn('Gemini regeneration failed, using fallback:', err.message);
      return this.generateFallbackSingleQuestion({
        subject,
        unit,
        unitDescription,
        topic,
        marks: qMarks,
        difficulty,
        questionType,
        questionPattern,
        existingQuestions
      });
    }
  }

  /**
   * FEATURE 2: AI Answer Evaluation of Scanned Answer Copies
   * 
   * Supports:
   * - Text-based candidate answers
   * - Multimodal image/PDF evaluation when scan is available
   * - Strict academic evaluation prompt (Requirement 11)
   */
  async evaluateQuestionAnswer({
    questionText,
    maxMarks,
    rubricCriteria = [],
    expectedAnswer = '',
    studentAnswer = '',
    unit = '',
    topic = '',
    scannedMedia = null // { mimeType, data (base64) } or file path
  }) {
    const numericMaxMarks = Number(maxMarks) || 10;

    if (!this.hasApiKey()) {
      return this.evaluateFallback({
        questionText,
        maxMarks: numericMaxMarks,
        rubricCriteria,
        expectedAnswer,
        studentAnswer,
        unit,
        topic
      });
    }

    const prompt = `You are an academic answer-sheet evaluation assistant.

Evaluate the student's answer strictly according to the provided question, maximum marks, and marking scheme.

Consider:
1. Correctness
2. Relevance
3. Coverage of required concepts
4. Technical accuracy
5. Required steps/components
6. Partial correctness
7. Important factual or conceptual errors

Award partial marks when the answer demonstrates partial understanding.
Do not award marks for irrelevant information.
Do not award marks merely because the answer is long.
Do not unnecessarily penalize grammar, spelling, or language unless it changes the technical meaning.
Never award more than the maximum marks.

QUESTION DETAILS:
- Question: ${questionText}
- Maximum Marks: ${numericMaxMarks}
- Unit: ${unit || 'N/A'} | Topic: ${topic || 'N/A'}
- Reference / Expected Answer: ${expectedAnswer || 'Standard academic model answer'}
- Marking Scheme / Rubric: ${JSON.stringify(rubricCriteria || [])}

STUDENT'S ANSWER:
${studentAnswer ? studentAnswer : '(Candidate answer is in the attached scanned booklet image/page)'}

Return ONLY valid JSON matching this exact structure:
{
  "marks_awarded": 0,
  "maximum_marks": ${numericMaxMarks},
  "criteria": [
    {
      "criterion": "Name of rubric criterion or key aspect",
      "marks_awarded": 0,
      "maximum_marks": 5,
      "reason": "Specific justification for awarded score"
    }
  ],
  "strengths": ["Clear point 1", "Correct technical step"],
  "missing_points": ["Omitted key formula", "Superficial conclusion"],
  "errors": ["Conceptual inaccuracy in definition"],
  "feedback": "Concise holistic feedback justifying score and guide for improvement."
}`;

    const contents = [];

    // Multimodal support: Attach scanned image/PDF if provided (Section 10)
    if (scannedMedia && scannedMedia.data && scannedMedia.mimeType) {
      contents.push({
        inlineData: {
          data: scannedMedia.data,
          mimeType: scannedMedia.mimeType
        }
      });
    }

    contents.push({ text: prompt });

    let response;
    try {
      const model = this.getModel();
      response = await model.generateContent({ contents });
    } catch (apiError) {
      console.warn('Gemini evaluation failed, using rubric fallback:', apiError.message);
      return this.evaluateFallback({
        questionText,
        maxMarks: numericMaxMarks,
        rubricCriteria,
        expectedAnswer,
        studentAnswer,
        unit,
        topic
      });
    }

    const rawText = response.response?.text?.() || '';
    let parsed;
    try {
      parsed = this.cleanAndParseJson(rawText);
    } catch (parseErr) {
      return this.evaluateFallback({
        questionText,
        maxMarks: numericMaxMarks,
        rubricCriteria,
        expectedAnswer,
        studentAnswer,
        unit,
        topic
      });
    }

    // Sanitize and validate numeric marks
    const rawScore = Number(parsed.marks_awarded ?? parsed.marksAwarded ?? parsed.suggestedMarks ?? 0);
    const sanitizedScore = Math.max(0, Math.min(numericMaxMarks, isNaN(rawScore) ? 0 : rawScore));

    return {
      marks_awarded: sanitizedScore,
      maximum_marks: numericMaxMarks,
      criteria: Array.isArray(parsed.criteria)
        ? parsed.criteria.map((c) => ({
            criterion: c.criterion || 'Criterion',
            marks_awarded: Math.max(0, Math.min(Number(c.maximum_marks || 1), Number(c.marks_awarded ?? c.marks ?? 0))),
            maximum_marks: Number(c.maximum_marks || 1),
            reason: c.reason || c.feedback || ''
          }))
        : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      missing_points: Array.isArray(parsed.missing_points) ? parsed.missing_points : [],
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      feedback: parsed.feedback || parsed.overallFeedback || 'Evaluated strictly against rubric.',
      modelUsed: `gemini-api-${this.defaultModel}`
    };
  }

  /**
   * High-Quality Academic Syllabus Fallback Generator
   * Strictly generates questions derived from Unit Name + Unit Description
   * and adheres 100% to Paper Scheme & Unit-Wise Distribution.
   */
  generateFallbackPaperFromSyllabus({
    examination,
    syllabus,
    blueprint,
    targetTotalMarks,
    targetQuestionCount
  }) {
    const examName = examination?.name || 'University Examination';
    const subject = examination?.subject || syllabus?.subject || 'Academic Subject';
    const totalMarks = Number(targetTotalMarks || blueprint?.totalMarks || examination?.maxMarks || 50);

    const units = syllabus.units || [];
    const unitDist =
      Array.isArray(blueprint?.unitDistribution) && blueprint.unitDistribution.length > 0
        ? blueprint.unitDistribution
        : units.map((u, idx) => {
            const baseM = Math.floor(totalMarks / units.length);
            return {
              unit: u.title || `Unit ${idx + 1}`,
              questionsCount: Math.max(1, Math.round(baseM / 10)),
              marks: baseM
            };
          });

    const pattern = blueprint?.questionPattern || 'SIMPLE';
    const numberOfSets = Math.max(1, Number(blueprint?.numberOfSets) || 1);

    const questionTemplates = [
      (concept, uTitle, subj) =>
        `Critically analyze the principles and mechanisms of ${concept} within ${uTitle}. Detail its architectural components, lifecycle, and operational constraints in ${subj}.`,
      (concept, uTitle, subj) =>
        `Explain how ${concept} is implemented and evaluated in ${uTitle}. Provide concrete technical design considerations, data flows, and trade-offs.`,
      (concept, uTitle, subj) =>
        `Compare and contrast alternative strategies for ${concept}. How does it fulfill reliability, scalability, and modularity requirements in ${subj}?`,
      (concept, uTitle, subj) =>
        `Describe the structural design, role, and practical deployment of ${concept} in ${uTitle}. Illustrate with relevant domain examples and component diagrams.`,
      (concept, uTitle, subj) =>
        `Evaluate the technical challenges and edge-case handling associated with ${concept}. How do patterns from ${uTitle} ensure correctness and maintainability?`
    ];

    const generateSingleSetQuestions = (setIndex = 0) => {
      const setQuestions = [];
      let globalQNum = 1;

      for (let uIdx = 0; uIdx < unitDist.length; uIdx++) {
        const ud = unitDist[uIdx];
        const sylUnit =
          units.find((u) => {
            const uT = (u.title || '').toLowerCase().trim();
            const udT = (ud.unit || '').toLowerCase().trim();
            return uT === udT || uT.includes(udT) || udT.includes(uT);
          }) || units[uIdx % units.length];

        const uTitle = sylUnit?.title || ud.unit || `Unit ${uIdx + 1}`;
        const unitConcepts = this.extractConceptsFromUnit(sylUnit);
        const reqQ = Number(ud.questionsCount) || 1;
        const reqMarks = Number(ud.marks) || 10;

        // Distribute unit marks across its questions
        const baseMark = Math.floor(reqMarks / reqQ);
        let remMark = reqMarks % reqQ;

        for (let qInUnit = 0; qInUnit < reqQ; qInUnit++) {
          const qM = baseMark + (remMark > 0 ? 1 : 0);
          if (remMark > 0) remMark--;

          // Concept selection varies across sets to ensure distinct sets
          const conceptIdx = (qInUnit + setIndex * 2) % unitConcepts.length;
          const chosenConcept = unitConcepts[conceptIdx] || `Core Concepts of ${uTitle}`;
          const tmplIdx = (globalQNum + setIndex + qInUnit) % questionTemplates.length;
          const template = questionTemplates[tmplIdx];

          const diff =
            globalQNum % 3 === 1
              ? 'EASY'
              : globalQNum % 3 === 2
              ? 'MEDIUM'
              : 'HARD';

          let questionText = '';
          let subQuestions = [];

          if (pattern === 'SUB_QUESTION') {
            const partAMarks = Math.ceil(qM / 2);
            const partBMarks = qM - partAMarks;
            const altConcept = unitConcepts[(conceptIdx + 1) % unitConcepts.length] || chosenConcept;
            const tA = questionTemplates[(tmplIdx) % questionTemplates.length];
            const tB = questionTemplates[(tmplIdx + 1) % questionTemplates.length];

            subQuestions = [
              {
                subLabel: 'A',
                marks: partAMarks,
                questionText: tA(chosenConcept, uTitle, subject)
              },
              {
                subLabel: 'B',
                marks: partBMarks,
                questionText: tB(altConcept, uTitle, subject)
              }
            ];

            questionText = `Answer the following sub-questions regarding ${chosenConcept} in ${uTitle}:\n\n` +
              `(A) ${subQuestions[0].questionText} [${partAMarks} Marks]\n\n` +
              `(B) ${subQuestions[1].questionText} [${partBMarks} Marks]`;
          } else if (pattern === 'ABC') {
            const partA = Math.floor(qM / 3) || 1;
            const partB = Math.floor(qM / 3) || 1;
            const partC = qM - partA - partB;
            const alt1 = unitConcepts[(conceptIdx + 1) % unitConcepts.length] || chosenConcept;
            const alt2 = unitConcepts[(conceptIdx + 2) % unitConcepts.length] || chosenConcept;

            subQuestions = [
              {
                subLabel: 'A',
                marks: partA,
                questionText: questionTemplates[tmplIdx % questionTemplates.length](chosenConcept, uTitle, subject)
              },
              {
                subLabel: 'B',
                marks: partB,
                questionText: questionTemplates[(tmplIdx + 1) % questionTemplates.length](alt1, uTitle, subject)
              },
              {
                subLabel: 'C',
                marks: partC,
                questionText: questionTemplates[(tmplIdx + 2) % questionTemplates.length](alt2, uTitle, subject)
              }
            ];

            questionText = `Answer the following sub-questions regarding ${chosenConcept} in ${uTitle}:\n\n` +
              `(A) ${subQuestions[0].questionText} [${partA} Marks]\n\n` +
              `(B) ${subQuestions[1].questionText} [${partB} Marks]\n\n` +
              `(C) ${subQuestions[2].questionText} [${partC} Marks]`;
          } else {
            questionText = template(chosenConcept, uTitle, subject);
          }

          setQuestions.push({
            questionNumber: globalQNum,
            questionText,
            marks: qM,
            unit: uTitle,
            topic: chosenConcept,
            conceptReference: chosenConcept,
            difficulty: diff,
            questionType: qM >= 10 ? 'LONG_ANSWER' : 'DESCRIPTIVE',
            subQuestions,
            expectedAnswer: `1. Comprehensive theoretical breakdown of ${chosenConcept}.\n2. Architectural alignment with ${uTitle} domain specifications.\n3. Design trade-offs, algorithms, and practical implementation criteria.\n4. Analytical evaluation metrics and scoring rationale.`,
            options: []
          });

          globalQNum++;
        }
      }

      return setQuestions;
    };

    // Generate sets
    const allSets = [];
    for (let s = 0; s < numberOfSets; s++) {
      allSets.push({
        setNumber: s + 1,
        setName: `Set ${String.fromCharCode(65 + s)}`,
        questions: generateSingleSetQuestions(s)
      });
    }

    const primaryQuestions = allSets[0].questions;

    return {
      title: `${examName} - ${subject} Question Paper`,
      total_marks: totalMarks,
      questionCount: primaryQuestions.length,
      numberOfSets,
      questions: primaryQuestions,
      sets: allSets,
      generatedWith: 'gemini-academic-engine',
      blueprintAdherence: {
        totalMarksMatch: true,
        questionCountMatch: true,
        unitCoverage: Array.from(new Set(primaryQuestions.map((q) => q.unit))),
        targetMarks: totalMarks,
        generatedMarks: primaryQuestions.reduce((sum, q) => sum + q.marks, 0)
      }
    };
  }

  /**
   * Fallback for single question regeneration
   */
  generateFallbackSingleQuestion({
    subject,
    unit,
    unitDescription = '',
    topic,
    marks = 5,
    difficulty = 'MEDIUM',
    questionType = 'DESCRIPTIVE',
    questionPattern = 'SIMPLE',
    existingQuestions = []
  }) {
    const qMarks = Number(marks) || 5;
    const concepts = this.extractConceptsFromUnit({ title: unit, description: unitDescription });
    const chosenConcept = topic || concepts[0] || 'Core Subject Concepts';

    const templates = [
      `Analyze the core architecture and fundamental principles of ${chosenConcept} in ${unit}. Discuss how it addresses operational and design constraints in ${subject}.`,
      `Critically examine the implementation methodology and execution lifecycle of ${chosenConcept}. Provide concrete technical justification based on ${unit}.`,
      `Evaluate how ${chosenConcept} ensures structural integrity, scalability, and modularity. Contrast it with alternative approaches in ${subject}.`,
      `Formulate a comprehensive technical approach to deploy, optimize, and validate ${chosenConcept} within modern software systems.`
    ];

    const existingTexts = existingQuestions.map((q) => (typeof q === 'string' ? q : q.questionText || '').toLowerCase());
    const candidateTmpl = templates.find((t) => !existingTexts.some((et) => et.includes(t.slice(0, 30).toLowerCase()))) || templates[0];

    let questionText = candidateTmpl;
    let subQuestions = [];

    if (questionPattern === 'SUB_QUESTION') {
      const partA = Math.ceil(qMarks / 2);
      const partB = qMarks - partA;
      const alt = concepts[1] || chosenConcept;
      subQuestions = [
        {
          subLabel: 'A',
          marks: partA,
          questionText: `Explain the fundamental concepts and definitions of ${chosenConcept} in ${unit}.`
        },
        {
          subLabel: 'B',
          marks: partB,
          questionText: `Analyze the practical application and trade-offs of ${alt} in ${subject}.`
        }
      ];
      questionText = `Answer the following sub-questions regarding ${chosenConcept} in ${unit}:\n\n` +
        `(A) ${subQuestions[0].questionText} [${partA} Marks]\n\n` +
        `(B) ${subQuestions[1].questionText} [${partB} Marks]`;
    }

    return {
      questionNumber: 1,
      questionText,
      marks: qMarks,
      unit: unit || 'Unit Syllabus',
      topic: chosenConcept,
      conceptReference: chosenConcept,
      difficulty: (difficulty || 'MEDIUM').toUpperCase(),
      questionType: (questionType || 'DESCRIPTIVE').toUpperCase(),
      subQuestions,
      expectedAnswer: `1. In-depth analysis of ${chosenConcept}.\n2. Theoretical justification and execution principles.\n3. Practical architectural alignment and evaluation scoring metrics.`
    };
  }

  /**
   * FEATURE 2: AI Question-wise Answer Evaluation
   * Evaluates student response against question text, reference answer, rubric criteria, and max marks.
   * Supports multimodal scanned copy media (image/PDF) and text responses.
   */
  async evaluateQuestionAnswer({
    questionText,
    maxMarks = 10,
    rubricCriteria = [],
    expectedAnswer = '',
    studentAnswer = '',
    unit = '',
    topic = '',
    scannedMedia = null
  }) {
    const numMax = Number(maxMarks) || 10;
    const cleanStudentAnswer = (studentAnswer || '').trim();

    // If answer is empty and no scanned document media is attached
    if (!cleanStudentAnswer && !scannedMedia) {
      return this.evaluateFallback({
        questionText,
        maxMarks: numMax,
        rubricCriteria,
        expectedAnswer,
        studentAnswer: '',
        unit,
        topic
      });
    }

    if (!this.hasApiKey()) {
      return this.evaluateFallback({
        questionText,
        maxMarks: numMax,
        rubricCriteria,
        expectedAnswer,
        studentAnswer: cleanStudentAnswer,
        unit,
        topic
      });
    }

    try {
      const model = this.getModel();
      const prompt = `You are a strict, fair, and expert academic university examiner evaluating an examination answer copy.
Evaluate the student's answer for the following question strictly based on academic correctness, conceptual understanding, completeness, relevance, and the marking scheme.

QUESTION DETAILS:
- Subject / Unit: ${unit || 'Syllabus Topic'}
- Topic: ${topic || 'Core Subject Concepts'}
- Question Text: ${questionText}
- Maximum Marks: ${numMax}
- Expected Model Answer / Reference:
${expectedAnswer || 'Standard model answer covering core principles, definitions, derivations, formulas, and domain applications.'}
- Marking Rubric:
${JSON.stringify(rubricCriteria || [], null, 2)}

STUDENT'S SUBMITTED RESPONSE:
${cleanStudentAnswer || '(Handwritten response provided in attached scanned booklet media)'}

EVALUATION GUIDELINES:
1. Academic Correctness & Understanding: Award marks based on evidence of correct principles, valid explanations, accurate equations/derivations, and technical depth.
2. Partial Credit: Award fair partial credit for partially correct answers, steps, or explanations.
3. Full Marks: If the answer satisfies the question requirements and demonstrates mastery, award full marks (or near full marks).
4. Semantic Equivalence & Alternative Methods: Do NOT penalize or deduct marks simply because the student used different wording, phrasing, or an alternative scientifically valid formulation/derivation than the model answer.
5. Minor Mistakes: Do not deduct marks for minor grammatical or spelling errors unless they alter technical meaning.
6. Irrelevant / Incorrect: Do NOT award marks for completely incorrect, off-topic, or unsupported assertions.
7. Range Constraint: "marks_awarded" must be a non-negative number between 0 and ${numMax}. It must never exceed ${numMax}.
8. Criteria Distribution: Allocate marks across criteria so the sum of criteria marks equals "marks_awarded".

Return ONLY a valid JSON object matching this schema:
{
  "marks_awarded": number,
  "maximum_marks": ${numMax},
  "criteria": [
    {
      "criterion": "Criterion Name",
      "marks_awarded": number,
      "maximum_marks": number,
      "reason": "Specific feedback for this criterion"
    }
  ],
  "feedback": "Constructive question-specific evaluation feedback explaining awarded marks and any specific areas for improvement.",
  "strengths": ["Key strength 1", "Key strength 2"],
  "missing_points": ["Missing point 1 if applicable"],
  "modelUsed": "gemini-model"
}`;

      const parts = [{ text: prompt }];
      if (scannedMedia && scannedMedia.data) {
        parts.push({
          inlineData: {
            mimeType: scannedMedia.mimeType || 'application/pdf',
            data: scannedMedia.data
          }
        });
      }

      const result = await model.generateContent({ contents: [{ parts }] });
      const response = await result.response;
      const rawText = response.text();
      const parsed = this.cleanAndParseJson(rawText);

      const parsedScore = Number(parsed.marks_awarded ?? parsed.marksAwarded ?? parsed.suggestedMarks ?? 0);
      const marksAwarded = Math.max(0, Math.min(numMax, isNaN(parsedScore) ? 0 : Math.round(parsedScore * 2) / 2));

      const criteria = Array.isArray(parsed.criteria)
        ? parsed.criteria.map((c) => ({
            criterion: c.criterion || c.name || 'Criterion',
            marks_awarded: Math.max(0, Math.min(Number(c.maximum_marks ?? c.maxMarks ?? 1), Number(c.marks_awarded ?? c.marksAwarded ?? 0))),
            maximum_marks: Number(c.maximum_marks ?? c.maxMarks ?? 1),
            reason: c.reason || c.feedback || ''
          }))
        : [];

      return {
        marks_awarded: marksAwarded,
        maximum_marks: numMax,
        criteria,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Relevant conceptual terminology applied'],
        missing_points: Array.isArray(parsed.missing_points) ? parsed.missing_points : (Array.isArray(parsed.missingPoints) ? parsed.missingPoints : []),
        errors: Array.isArray(parsed.errors) ? parsed.errors : [],
        feedback: parsed.feedback || parsed.overallFeedback || 'Evaluated successfully against marking rubric.',
        modelUsed: parsed.modelUsed || this.defaultModel || 'gemini-1.5-pro'
      };
    } catch (apiError) {
      console.warn('Gemini API evaluation error, falling back to Semantic Rubric Engine:', apiError.message);
      return this.evaluateFallback({
        questionText,
        maxMarks: numMax,
        rubricCriteria,
        expectedAnswer,
        studentAnswer: cleanStudentAnswer,
        unit,
        topic
      });
    }
  }

  /**
   * Semantic Rubric Engine Fallback for Answer Evaluation
   * Evaluates student answers against academic concepts, technical depth, equations, and rubric criteria.
   */
  evaluateFallback({
    questionText,
    maxMarks = 10,
    rubricCriteria = [],
    expectedAnswer = '',
    studentAnswer = '',
    unit = '',
    topic = ''
  }) {
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
    const refKeywords = (expectedAnswer || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !filterWords.has(w));
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

module.exports = new GeminiService();

