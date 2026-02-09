import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PromotionProxyService } from './promotion-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('vouchers')
@Controller('vouchers')
export class PromotionProxyController {
  constructor(private readonly service: PromotionProxyService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validate voucher code' })
  @ApiResponse({ status: 200, description: 'Voucher validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid voucher or validation failed' })
  @ApiBody({ description: 'Voucher code and cart items to validate' })
  validate(@Req() req: any, @Body() body: any) {
    const authorization = req.headers['authorization'] as string;
    // Tự động thêm userId từ JWT token nếu chưa có
    if (!body.userId && req.user) {
      body.userId = req.user.userId;
    }
    return this.service.validate(authorization, body);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Apply voucher to order' })
  @ApiResponse({ status: 200, description: 'Voucher applied successfully' })
  @ApiResponse({ status: 400, description: 'Failed to apply voucher' })
  @ApiBody({ description: 'Voucher ID and user ID to apply voucher' })
  apply(@Req() req: any, @Body() body: any) {
    const authorization = req.headers['authorization'] as string;
    // Tự động thêm userId từ JWT token nếu chưa có
    if (!body.userId && req.user) {
      body.userId = req.user.userId;
    }
    return this.service.apply(authorization, body);
  }
}

