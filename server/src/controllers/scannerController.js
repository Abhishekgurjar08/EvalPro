const scannerIntegrationService = require('../services/scannerIntegrationService');
const { logAudit } = require('../services/auditService');

exports.getScannerStatus = async (req, res, next) => {
  try {
    const status = await scannerIntegrationService.getStatus();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

exports.ingestScannedBatch = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const batchPayload = req.body;

    const result = await scannerIntegrationService.ingestScannedBatch(examinationId, batchPayload);

    await logAudit({
      req,
      action: 'SCANNER_BATCH_INGESTED',
      entity: 'AnswerCopy',
      entityId: examinationId,
      details: {
        ingestedCount: result.ingestedCount,
        scannerModel: result.scannerModel
      }
    });

    res.status(201).json({
      success: true,
      message: `Scanner Integration Layer successfully ingested ${result.ingestedCount} physical answer copies.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.triggerScannerFeed = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const { batchSize = 3 } = req.body;

    const result = await scannerIntegrationService.triggerScannerFeed(examinationId, Number(batchSize));

    await logAudit({
      req,
      action: 'SCANNER_FEED_TRIGGERED',
      entity: 'Examination',
      entityId: examinationId,
      details: {
        ingestedCount: result.ingestedCount
      }
    });

    res.status(201).json({
      success: true,
      message: `Successfully pulled ${result.ingestedCount} answer copies from physical scanner station.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
