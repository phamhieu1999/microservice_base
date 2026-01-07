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

@ApiTags('loyalty')
@Controller('loyalty-vouchers')
export class LoyaltyVoucherProxyController {
  constructor(private readonly service: PromotionProxyService) {}

  @Post('exchange')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Exchange loyalty points for voucher' })
  @ApiResponse({ status: 200, description: 'Voucher created successfully' })
  @ApiResponse({ status: 400, description: 'Not enough points to exchange' })
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
    const authorization = req.headers['authorization'] as string;
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.service.exchangeLoyaltyVoucher(authorization, userId, body.points);
  }
}

