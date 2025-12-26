import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MFAService } from './mfa.service';
import { SetupTOTPDto } from './dto/setup-totp.dto';
import { VerifyTOTPDto } from './dto/verify-totp.dto';

@Controller('auth/mfa')
@UseGuards(AuthGuard('jwt'))
export class MFAController {
  constructor(private readonly mfaService: MFAService) {}

  @Post('setup')
  async setupTOTP(@Req() req: any) {
    const userId = req.user.sub;
    const email = req.user.email;
    return this.mfaService.setupTOTP(userId, email);
  }

  @Post('verify')
  async verifyAndEnable(@Req() req: any, @Body() dto: VerifyTOTPDto) {
    const userId = req.user.sub;
    return this.mfaService.verifyAndEnableTOTP(userId, dto.token);
  }

  @Post('disable')
  async disable(@Req() req: any, @Body() body: { type?: 'TOTP' | 'SMS' }) {
    const userId = req.user.sub;
    return this.mfaService.disableMFA(userId, body.type || 'TOTP');
  }

  @Get('status')
  async getStatus(@Req() req: any) {
    const userId = req.user.sub;
    const enabled = await this.mfaService.isMFAEnabled(userId);
    return { enabled, type: enabled ? 'TOTP' : null };
  }
}

