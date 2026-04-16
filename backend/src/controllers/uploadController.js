const { uploadToPinata, validateFile } = require('../services/pinataService');

/**
 * Upload NFT image to Pinata
 * POST /api/upload
 */
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file provided' },
      });
    }

    // Validate file
    validateFile(req.file.buffer, req.file.mimetype);

    // Upload to Pinata
    const result = await uploadToPinata(
      req.file.buffer,
      req.file.originalname,
      {
        uploadedAt: new Date().toISOString(),
        walletAddress: req.body.walletAddress || 'anonymous',
      }
    );

    res.status(200).json({
      success: true,
      data: {
        ipfsHash: result.ipfsHash,
        url: result.url,
        size: result.size,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImage };
