import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMFA } from '../../../database/entities/user-mfa.entity';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MFAService {
  constructor(
    @InjectRepository(UserMFA)
    private readonly mfaRepo: Repository<UserMFA>,
  ) {}

  // Tạo TOTP secret và QR code
  async setupTOTP(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `E-commerce (${email})`,
      issuer: 'E-commerce Platform',
    });

    // Lưu secret (trong production nên encrypt)
    const mfa = this.mfaRepo.create({
      userId,
      type: 'TOTP',
      secret: secret.base32,
      enabled: false,
    });
    await this.mfaRepo.save(mfa);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    };
  }

  // Verify TOTP code và enable MFA
  async verifyAndEnableTOTP(userId: string, token: string) {
    const mfa = await this.mfaRepo.findOne({
      where: { userId, type: 'TOTP' },
    });

    if (!mfa || !mfa.secret) {
      throw new BadRequestException('TOTP not set up');
    }

    const verified = speakeasy.totp.verify({
      secret: mfa.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) before/after
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    mfa.enabled = true;
    await this.mfaRepo.save(mfa);

    return { success: true };
  }

  // Verify TOTP code khi login
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const mfa = await this.mfaRepo.findOne({
      where: { userId, type: 'TOTP', enabled: true },
    });

    if (!mfa || !mfa.secret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: mfa.secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  // Disable MFA
  async disableMFA(userId: string, type: 'TOTP' | 'SMS') {
    await this.mfaRepo.delete({ userId, type });
    return { success: true };
  }

  // Check if MFA is enabled
  async isMFAEnabled(userId: string): Promise<boolean> {
    const mfa = await this.mfaRepo.findOne({
      where: { userId, enabled: true },
    });
    return !!mfa;
  }
}

