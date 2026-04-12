const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db/prisma');
const config = require('../configs');
const stellarService = require('./stellarService');

class AuthService {
  generateNonce() {
    return uuidv4();
  }

  async getOrCreateUser(walletAddress) {
    if (!stellarService.validateAddress(walletAddress)) {
      throw Object.assign(new Error('Invalid Stellar address'), { statusCode: 400 });
    }

    const normalized = walletAddress.trim().toUpperCase();

    let user = await prisma.user.findUnique({
      where: { walletAddress: normalized },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: normalized,
          nonce: this.generateNonce(),
        },
      });
    } else if (!user.nonce) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { nonce: this.generateNonce() },
      });
    }

    return user;
  }

  async getNonce(walletAddress) {
    const user = await this.getOrCreateUser(walletAddress);
    return { walletAddress: user.walletAddress, nonce: user.nonce };
  }

  verifySignature(walletAddress, nonce, signature, message) {
    try {
      const StellarSdk = require('@stellar/stellar-sdk');
      const signedMessage = `${message || 'Sign this message'}:${nonce}`;
      const verifyPayload = Buffer.from(signedMessage).toString('base64');
      const decoded = Buffer.from(signature, 'base64');
      const keypair = StellarSdk.Keypair.fromPublicKey(walletAddress);
      return keypair.verify(Buffer.from(verifyPayload), decoded);
    } catch (err) {
      console.error('Signature verification failed:', err.message);
      return false;
    }
  }

  async verifyAndLogin(walletAddress, signature, message) {
    const user = await this.getOrCreateUser(walletAddress);

    if (!signature) {
      throw Object.assign(new Error('Signature is required'), { statusCode: 400 });
    }

    const valid = this.verifySignature(walletAddress, user.nonce, signature, message);

    if (!valid) {
      throw Object.assign(new Error('Invalid signature'), { statusCode: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { nonce: this.generateNonce() },
    });

    const token = jwt.sign(
      {
        walletAddress: updatedUser.walletAddress,
        userId: updatedUser.id,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      walletAddress: updatedUser.walletAddress,
      userId: updatedUser.id,
    };
  }
}

module.exports = new AuthService();
