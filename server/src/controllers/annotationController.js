const Annotation = require('../models/Annotation');
const AnswerCopy = require('../models/AnswerCopy');

// @desc    Get all annotations for a specific answer copy
// @route   GET /api/answer-copies/:id/annotations or GET /api/annotations/:copyId
// @access  Private (Evaluator / Admin)
exports.getAnnotations = async (req, res, next) => {
  try {
    const copyId = req.params.copyId || req.params.id;
    const { pageNumber } = req.query;

    const copy = await AnswerCopy.findById(copyId);
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    const query = { answerCopy: copy._id };
    if (pageNumber) {
      query.pageNumber = Number(pageNumber);
    }

    const annotations = await Annotation.find(query)
      .populate('evaluator', 'name email role')
      .sort({ pageNumber: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: annotations.length,
      annotations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Sync annotations for an answer copy
// @route   PUT /api/answer-copies/:id/annotations or POST /api/answer-copies/:id/annotations
// @access  Private (Evaluator / Admin)
exports.saveAnnotations = async (req, res, next) => {
  try {
    const copyId = req.params.copyId || req.params.id;
    const { annotations, pageNumber } = req.body;

    const copy = await AnswerCopy.findById(copyId);
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    const evaluatorId = req.user ? req.user._id : null;

    if (!Array.isArray(annotations)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: annotations must be an array'
      });
    }

    // If pageNumber is provided, only replace annotations for that page; otherwise replace all for the copy
    if (pageNumber !== undefined && pageNumber !== null) {
      await Annotation.deleteMany({
        answerCopy: copy._id,
        pageNumber: Number(pageNumber)
      });
    } else {
      await Annotation.deleteMany({
        answerCopy: copy._id
      });
    }

    // Prepare annotation documents to insert
    const docsToInsert = annotations.map((ann) => ({
      answerCopy: copy._id,
      answerCopyId: copy.copyId || copy._id.toString(),
      pageNumber: ann.pageNumber !== undefined ? ann.pageNumber : 1,
      evaluator: evaluatorId,
      evaluatorId: evaluatorId ? evaluatorId.toString() : '',
      type: ann.type || 'PEN',
      content: ann.content || '',
      coordinates: ann.coordinates || {},
      styling: ann.styling || {
        color: ann.color || '#ef4444',
        strokeWidth: ann.strokeWidth || 3,
        opacity: ann.opacity || 1,
        fontSize: ann.fontSize || 14
      }
    }));

    let savedAnnotations = [];
    if (docsToInsert.length > 0) {
      savedAnnotations = await Annotation.insertMany(docsToInsert);
    }

    // Fetch all current annotations for this copy to return updated full state
    const allAnnotations = await Annotation.find({ answerCopy: copy._id })
      .populate('evaluator', 'name email role')
      .sort({ pageNumber: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      message: 'Remarks and annotations saved successfully',
      count: allAnnotations.length,
      annotations: allAnnotations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all annotations for a specific page of an answer copy
// @route   DELETE /api/answer-copies/:id/annotations/page/:pageNumber
// @access  Private (Evaluator / Admin)
exports.clearPageAnnotations = async (req, res, next) => {
  try {
    const copyId = req.params.copyId || req.params.id;
    const pageNumber = Number(req.params.pageNumber);

    const copy = await AnswerCopy.findById(copyId);
    if (!copy) {
      return res.status(404).json({ success: false, message: 'Answer copy not found' });
    }

    await Annotation.deleteMany({
      answerCopy: copy._id,
      pageNumber
    });

    const remainingAnnotations = await Annotation.find({ answerCopy: copy._id })
      .populate('evaluator', 'name email role')
      .sort({ pageNumber: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      message: `All annotations cleared for page ${pageNumber}`,
      annotations: remainingAnnotations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a single annotation by ID
// @route   DELETE /api/annotations/:id
// @access  Private (Evaluator / Admin)
exports.deleteAnnotation = async (req, res, next) => {
  try {
    const annotation = await Annotation.findById(req.params.id);
    if (!annotation) {
      return res.status(404).json({ success: false, message: 'Annotation not found' });
    }

    await annotation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Annotation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
