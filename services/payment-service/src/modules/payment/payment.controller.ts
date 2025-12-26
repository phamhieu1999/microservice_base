import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentProvider } from '../../database/entities/payment.entity';

@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post()
  async create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    const userId = req.headers['x-user-id'] || req.user?.userId;
    return this.service.createPayment(dto, userId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getPaymentStatus(id);
  }

  @Post(':id/refund')
  async refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.service.refund(id, dto);
  }

  // Webhook endpoint cho các payment providers
  @Post('webhook/:provider')
  async webhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Query('signature') signature?: string,
    @Req() req: any,
  ) {
    // Lấy signature từ query hoặc header
    const webhookSignature = signature || req.headers['x-signature'] || req.headers['vnp-securehash'] || '';
    return this.service.handleWebhook(provider.toUpperCase() as PaymentProvider, payload, webhookSignature);
  }
}


