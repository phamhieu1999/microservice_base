import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { PaymentProxyService } from './payment-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('payments')
@Controller()
export class PaymentProxyController {
  constructor(private readonly service: PaymentProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('payments')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo payment mới',
    description: 'Tạo một payment request mới cho order',
  })
  @ApiBody({
    description: 'Thông tin payment',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'order-123', description: 'Order ID cần thanh toán' },
        amount: { type: 'number', example: 100000, minimum: 0, description: 'Số tiền thanh toán' },
        method: {
          type: 'string',
          enum: ['CARD', 'EWALLET', 'BANK_TRANSFER', 'COD'],
          example: 'CARD',
          description: 'Phương thức thanh toán',
        },
        provider: {
          type: 'string',
          enum: ['VNPAY', 'MOMO', 'STRIPE', 'MOCK'],
          example: 'VNPAY',
          description: 'Payment provider',
        },
        idempotencyKey: {
          type: 'string',
          example: 'unique-key-123',
          description: 'Idempotency key để tránh duplicate payment',
        },
        description: {
          type: 'string',
          example: 'Thanh toán đơn hàng #123',
          description: 'Mô tả payment',
        },
      },
      required: ['orderId', 'amount'],
    },
  })
  @ApiResponse({ status: 201, description: 'Payment được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Payment service is temporarily unavailable' })
  createPayment(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    const userId = req.user?.userId || req.headers['x-user-id'] || '';
    return this.service.createPayment(authHeader, userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payments/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy trạng thái payment',
    description: 'Lấy thông tin và trạng thái của payment theo ID',
  })
  @ApiParam({ name: 'id', description: 'Payment ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Thông tin payment' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Payment service is temporarily unavailable' })
  getPaymentStatus(@Req() req: any, @Param('id') id: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getPaymentStatus(authHeader, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('payments/:id/refund')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hoàn tiền payment',
    description: 'Thực hiện hoàn tiền cho payment đã thành công',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({
    description: 'Thông tin hoàn tiền',
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          example: 50000,
          minimum: 0,
          description: 'Số tiền hoàn lại',
        },
        reason: {
          type: 'string',
          example: 'Khách hàng yêu cầu hủy đơn hàng',
          description: 'Lý do hoàn tiền',
        },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({ status: 200, description: 'Hoàn tiền thành công' })
  @ApiResponse({ status: 400, description: 'Không thể hoàn tiền' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Payment service is temporarily unavailable' })
  refundPayment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.refundPayment(authHeader, id, body);
  }

  @Post('payments/webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook từ payment provider',
    description: 'Endpoint nhận webhook từ các payment provider (VNPay, MoMo, etc.)',
  })
  @ApiParam({
    name: 'provider',
    description: 'Payment provider (VNPAY, MOMO, STRIPE, MOCK)',
    enum: ['VNPAY', 'MOMO', 'STRIPE', 'MOCK'],
    example: 'VNPAY',
  })
  @ApiQuery({ name: 'signature', required: false, description: 'Webhook signature để verify' })
  @ApiBody({
    description: 'Webhook payload từ provider',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  })
  @ApiResponse({ status: 200, description: 'Webhook được xử lý thành công' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature hoặc dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  @ApiResponse({ status: 503, description: 'Payment service is temporarily unavailable' })
  handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Query('signature') signature?: string,
  ) {
    return this.service.handleWebhook(provider, body, signature);
  }
}

