import { Body, Controller, Get, Post, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { LoyaltyProxyService } from './loyalty-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('loyalty')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyProxyController {
  constructor(private readonly loyaltyService: LoyaltyProxyService) {}

  @Get('points')
  @ApiOperation({
    summary: 'Get current loyalty points',
    description: 'Lấy thông tin điểm tích lũy hiện tại của user',
  })
  @ApiResponse({ status: 200, description: 'Thông tin điểm tích lũy' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Loyalty service is temporarily unavailable' })
  getPoints(@Req() req: any) {
    const userId = req.user?.userId || req.headers['x-user-id'];
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.loyaltyService.getPoints(userId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get loyalty point history',
    description: 'Lấy lịch sử giao dịch điểm tích lũy',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng records tối đa', example: 50 })
  @ApiQuery({ name: 'skip', required: false, description: 'Số lượng records bỏ qua', example: 0 })
  @ApiResponse({ status: 200, description: 'Danh sách lịch sử giao dịch điểm' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Loyalty service is temporarily unavailable' })
  getHistory(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const userId = req.user?.userId || req.headers['x-user-id'];
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.loyaltyService.getHistory(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redeem points or exchange for voucher',
    description: 'Đổi điểm tích lũy hoặc trừ điểm để sử dụng voucher',
  })
  @ApiBody({
    description: 'Thông tin đổi điểm',
    schema: {
      type: 'object',
      properties: {
        points: {
          type: 'number',
          example: 1000,
          minimum: 1,
          description: 'Số điểm cần đổi/trừ',
        },
        voucherId: {
          type: 'string',
          example: 'voucher-123',
          description: 'Voucher ID nếu muốn trừ điểm để sử dụng voucher (optional)',
        },
        description: {
          type: 'string',
          example: 'Đổi điểm lấy voucher giảm giá',
          description: 'Mô tả giao dịch (optional)',
        },
      },
      required: ['points'],
    },
  })
  @ApiResponse({ status: 200, description: 'Đổi điểm thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc không đủ điểm' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Loyalty service is temporarily unavailable' })
  redeem(@Req() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.headers['x-user-id'];
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.loyaltyService.redeem(userId, body);
  }

  @Post('referral')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create referral code for current user',
    description: 'Tạo mã giới thiệu cho user hiện tại',
  })
  @ApiResponse({ status: 201, description: 'Tạo mã giới thiệu thành công' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Loyalty service is temporarily unavailable' })
  createReferral(@Req() req: any) {
    const userId = req.user?.userId || req.headers['x-user-id'];
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.loyaltyService.createReferral(userId);
  }
}


