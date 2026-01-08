import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SettlementProxyService } from './settlement-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('settlements')
@Controller()
export class SettlementProxyController {
  constructor(private readonly service: SettlementProxyService) {}

  // Balance endpoints
  @UseGuards(JwtAuthGuard)
  @Get('settlements/seller/:sellerId/balance')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin balance của seller',
    description: 'Lấy thông tin balance (available và pending) của một seller. Nếu balance chưa tồn tại sẽ được tạo với số tiền 0.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', example: 'seller-1' })
  @ApiResponse({ status: 200, description: 'Thông tin balance' })
  @ApiResponse({ status: 404, description: 'Seller không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Settlement service is temporarily unavailable' })
  getBalance(@Req() req: any, @Param('sellerId') sellerId: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getSellerBalance(authHeader, sellerId);
  }

  // Payout endpoints
  @UseGuards(JwtAuthGuard)
  @Get('settlements/seller/:sellerId/payouts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách payout requests của seller',
    description: 'Lấy danh sách payout requests của một seller với phân trang và lọc theo status. Kết quả được sắp xếp theo ngày tạo (mới nhất trước).',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', example: 'seller-1' })
  @ApiQuery({ name: 'status', required: false, enum: ['REQUESTED', 'APPROVED', 'PAID', 'REJECTED'], description: 'Lọc theo status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số items mỗi trang (mặc định: 20)' })
  @ApiResponse({ status: 200, description: 'Danh sách payout requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Settlement service is temporarily unavailable' })
  getPayouts(@Req() req: any, @Param('sellerId') sellerId: string, @Query() query: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.listPayouts(authHeader, sellerId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('settlements/seller/:sellerId/payouts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Yêu cầu payout',
    description: 'Yêu cầu rút tiền từ available balance. Số tiền yêu cầu sẽ được chuyển từ available sang pending. Một payout request sẽ được tạo với status REQUESTED.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID', example: 'seller-1' })
  @ApiBody({
    description: 'Thông tin payout request',
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 1000000, minimum: 0.01, description: 'Số tiền rút (VND)' },
        note: { type: 'string', example: 'Monthly payout request', description: 'Ghi chú (tùy chọn)' },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({ status: 201, description: 'Payout request được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Số tiền available không đủ' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Settlement service is temporarily unavailable' })
  @HttpCode(HttpStatus.CREATED)
  requestPayout(@Req() req: any, @Param('sellerId') sellerId: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.requestPayout(authHeader, sellerId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settlements/payouts/:payoutId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy thông tin payout request theo ID',
    description: 'Lấy thông tin chi tiết của một payout request bao gồm status, amount, và timestamps.',
  })
  @ApiParam({ name: 'payoutId', description: 'Payout request UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Thông tin payout request' })
  @ApiResponse({ status: 404, description: 'Payout request không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Settlement service is temporarily unavailable' })
  getPayout(@Req() req: any, @Param('payoutId') payoutId: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getPayoutById(authHeader, payoutId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settlements/payouts/:payoutId/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật status của payout request',
    description: 'Cập nhật status của payout request (chỉ admin). Khi status chuyển sang PAID, pending amount được chuyển về 0. Khi status chuyển sang REJECTED, số tiền được trả lại available balance.',
  })
  @ApiParam({ name: 'payoutId', description: 'Payout request UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    description: 'Status mới và note (tùy chọn)',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['APPROVED', 'PAID', 'REJECTED'], example: 'APPROVED' },
        note: { type: 'string', example: 'Payout approved and processed', description: 'Ghi chú (tùy chọn)' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật status thành công' })
  @ApiResponse({ status: 404, description: 'Payout request không tồn tại' })
  @ApiResponse({ status: 400, description: 'Status transition không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Settlement service is temporarily unavailable' })
  updatePayoutStatus(@Req() req: any, @Param('payoutId') payoutId: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.updatePayoutStatus(authHeader, payoutId, body);
  }

  // Commission config endpoints
  @UseGuards(JwtAuthGuard)
  @Post('settlements/commission-configs')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo commission configuration',
    description: 'Tạo một commission configuration mới cho seller hoặc category. Phải cung cấp sellerId hoặc categoryId. Commission rate là số thập phân (0.15 = 15%).',
  })
  @ApiBody({
    description: 'Thông tin commission config',
    schema: {
      type: 'object',
      properties: {
        sellerId: { type: 'string', example: 'seller-1', description: 'Seller ID (nếu dành cho seller cụ thể)' },
        categoryId: { type: 'string', example: 'electronics', description: 'Category ID (nếu dành cho category cụ thể)' },
        commissionRate: { type: 'number', example: 0.15, minimum: 0, maximum: 1, description: 'Tỷ lệ commission (0.15 = 15%)' },
      },
      required: ['commissionRate'],
    },
  })
  @ApiResponse({ status: 201, description: 'Commission config được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Phải cung cấp sellerId hoặc categoryId' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Settlement service is temporarily unavailable' })
  @HttpCode(HttpStatus.CREATED)
  createCommissionConfig(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createCommissionConfig(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settlements/commission-configs')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách commission configurations',
    description: 'Lấy danh sách commission configurations với các bộ lọc tùy chọn. Có thể lọc theo sellerId, categoryId, hoặc cả hai. Trả về tất cả configurations khớp.',
  })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Lọc theo seller ID' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Lọc theo category ID' })
  @ApiResponse({ status: 200, description: 'Danh sách commission configs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Settlement service is temporarily unavailable' })
  getCommissionConfigs(@Req() req: any, @Query() query: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getCommissionConfigs(authHeader, query);
  }
}

