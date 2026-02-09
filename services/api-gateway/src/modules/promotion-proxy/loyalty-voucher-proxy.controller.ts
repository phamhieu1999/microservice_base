import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoyaltyProxyService } from '../loyalty-proxy/loyalty-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('loyalty')
@Controller('loyalty-vouchers')
export class LoyaltyVoucherProxyController {
  constructor(private readonly loyaltyService: LoyaltyProxyService) {}

  @Post('exchange')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Exchange loyalty points for voucher',
    description: 'Đổi điểm tích lũy để lấy voucher. Loyalty service sẽ trừ điểm và gọi promotion service để tạo voucher.',
  })
  @ApiResponse({ status: 200, description: 'Voucher created successfully' })
  @ApiResponse({ status: 400, description: 'Not enough points to exchange' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Loyalty or Promotion service is temporarily unavailable' })
  @ApiBody({
    description: 'Loyalty points to exchange for voucher',
    schema: {
      type: 'object',
      properties: {
        points: {
          type: 'number',
          description: 'Loyalty points to exchange',
          example: 1000,
          minimum: 1,
        },
      },
      required: ['points'],
    },
  })
  async exchange(@Req() req: any, @Body() body: { points: number }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    // Gọi loyalty service để đổi điểm lấy voucher
    // Loyalty service sẽ tự động trừ điểm và gọi promotion service để tạo voucher
    return this.loyaltyService.redeem(userId, { points: body.points });
  }
}

