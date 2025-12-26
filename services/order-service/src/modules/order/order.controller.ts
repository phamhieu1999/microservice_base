import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { CreateOrderUseCase } from '../../application/order/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../application/order/use-cases/get-order.usecase';
import { CancelOrderUseCase } from '../../application/order/use-cases/cancel-order.usecase';
import { UpdateOrderStatusUseCase } from '../../application/order/use-cases/update-order-status.usecase';

// Ở đây skeleton: trong thực tế nên dùng JwtAuthGuard shared hoặc local guard
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly updateStatus: UpdateOrderStatusUseCase,
  ) {}

  @Post()
  // @UseGuards(JwtAuthGuard) // áp dụng khi tích hợp guard
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'mock-user';
    return this.createOrder.execute({
      userId,
      items: dto.items as any,
      orderGroupId: dto.orderGroupId,
      voucherId: dto.voucherId,
      discountAmount: dto.discountAmount,
      shippingFee: dto.shippingFee,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.getOrder.execute(id);
  }

  @Post(':id/cancel')
  // @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string, @Body() dto: CancelOrderDto, @Req() req: any) {
    const userId = req.user?.userId || req.headers['x-user-id'] || 'mock-user';
    await this.cancelOrder.execute({
      orderId: id,
      userId,
      reason: dto.reason,
    });
    return { success: true, message: 'Order cancelled successfully' };
  }

  @Patch(':id/status')
  // @UseGuards(JwtAuthGuard, RolesGuard) // @Roles('ADMIN')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: any,
  ) {
    const changedBy = req.user?.userId || req.headers['x-user-id'] || 'admin';
    await this.updateStatus.execute({
      orderId: id,
      status: dto.status,
      changedBy,
      note: dto.note,
      trackingNumber: dto.trackingNumber,
    });
    return { success: true, message: 'Order status updated successfully' };
  }

  @Get(':id/history')
  // @UseGuards(JwtAuthGuard)
  async getHistory(@Param('id') id: string) {
    // TODO: Implement order history repository và use case
    return { message: 'Order history endpoint - to be implemented' };
  }
}


