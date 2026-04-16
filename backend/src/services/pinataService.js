const axios = require('axios');
const FormData = require('form-data');

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PINATA_JWT = process.env.PINATA_JWT;

/**
 * Upload file to Pinata IPFS
 * @param {Buffer|Stream} fileBuffer - File buffer or stream
 * @param {string} filename - Original filename
 * @param {object} metadata - Optional metadata
 * @returns {Promise<{ipfsHash: string, url: string}>}
 */
const uploadToPinata = async (fileBuffer, filename, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    // Add metadata if provided
    if (Object.keys(metadata).length > 0) {
      formData.append(
        'pinataMetadata',
        JSON.stringify({
          name: metadata.name || filename,
          keyvalues: metadata,
        })
      );
    }

    const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      timeout: 30000,
    });

    const ipfsHash = response.data.IpfsHash;
    const pinataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return {
      ipfsHash,
      url: pinataUrl,
      size: response.data.PinSize,
    };
  } catch (error) {
    console.error('Pinata upload error:', error.response?.data || error.message);
    throw new Error(`Failed to upload image to Pinata: ${error.message}`);
  }
};

/**
 * Validate file before upload
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimetype - File MIME type
 * @param {number} maxSize - Max file size in bytes (default 10MB)
 * @returns {boolean}
 */
const validateFile = (fileBuffer, mimetype, maxSize = 10 * 1024 * 1024) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (!allowedMimeTypes.includes(mimetype)) {
    throw new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`);
  }

  if (fileBuffer.length > maxSize) {
    throw new Error(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
  }

  return true;
};

/**
 * Unpin file from Pinata
 * @param {string} ipfsHash - IPFS hash to unpin
 * @returns {Promise<void>}
 */
const unpinFromPinata = async (ipfsHash) => {
  try {
    await axios.delete(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });
  } catch (error) {
    console.error('Pinata unpin error:', error.message);
    // Don't throw - unpinning failures shouldn't break the flow
  }
};

module.exports = {
  uploadToPinata,
  validateFile,
  unpinFromPinata,
};
