import { Body, Controller, Get, Param, Post, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentProvider } from '../../database/entities/payment.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo payment mới', description: 'Tạo một payment request mới cho order' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const userId = req.headers['x-user-id'] || req.user?.userId;
    return this.service.createPayment(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy trạng thái payment', description: 'Lấy thông tin và trạng thái của payment theo ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Thông tin payment' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  @ApiBearerAuth('JWT-auth')
  async get(@Param('id') id: string) {
    return this.service.getPaymentStatus(id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Hoàn tiền payment', description: 'Thực hiện hoàn tiền cho payment đã thành công' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiBody({ type: RefundPaymentDto })
  @ApiResponse({ status: 200, description: 'Hoàn tiền thành công' })
  @ApiResponse({ status: 400, description: 'Không thể hoàn tiền' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  async refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.service.refund(id, dto);
  }

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Webhook từ payment provider', description: 'Endpoint nhận webhook từ các payment provider (VNPay, MoMo, etc.)' })
  @ApiParam({ name: 'provider', description: 'Payment provider (VNPAY, MOMO, STRIPE, MOCK)', enum: ['VNPAY', 'MOMO', 'STRIPE', 'MOCK'] })
  @ApiQuery({ name: 'signature', required: false, description: 'Webhook signature để verify' })
  @ApiBody({ description: 'Webhook payload từ provider' })
  @ApiResponse({ status: 200, description: 'Webhook được xử lý thành công' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature hoặc dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Payment không tồn tại' })
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Req() req: any,
    @Query('signature') signature?: string,
  ) {
    // Lấy signature từ query hoặc header
    const webhookSignature = signature || req.headers['x-signature'] || req.headers['vnp-securehash'] || '';
    return this.service.handleWebhook(provider.toUpperCase() as PaymentProvider, payload, webhookSignature);
  }
}


