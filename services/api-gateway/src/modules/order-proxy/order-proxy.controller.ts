import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrderProxyService } from './order-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrderProxyController {
  constructor(private readonly service: OrderProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('USER', 'ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60 } }) // 10 requests per minute
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo đơn hàng mới' })
  @ApiBody({
    description: 'Payload tạo đơn hàng, được forward sang Order Service',
    schema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          description: 'Danh sách sản phẩm trong đơn hàng',
          items: {
            type: 'object',
            required: ['productId', 'quantity', 'unitPrice'],
            properties: {
              productId: { type: 'string', example: 'prod-001', description: 'ID sản phẩm' },
              quantity: { type: 'number', example: 2, minimum: 1, description: 'Số lượng' },
              unitPrice: { type: 'number', example: 649500, minimum: 0, description: 'Giá đơn vị' },
              sellerId: { type: 'string', example: 'seller-001', description: 'ID người bán (optional)' },
            },
          },
        },
        orderGroupId: { type: 'string', example: 'GRP-2024-001', description: 'ID nhóm đơn (nếu gộp nhiều đơn)' },
        voucherId: { type: 'string', example: 'VOUCHER-001', description: 'ID mã giảm giá (optional)' },
        voucherCode: { type: 'string', example: 'SAVE20', description: 'Mã giảm giá (optional, để validate)' },
        discountAmount: { type: 'number', example: 50000, description: 'Số tiền giảm (optional)' },
        shippingFee: { type: 'number', example: 30000, description: 'Phí vận chuyển (optional)' },
        address: {
          type: 'object',
          description: 'Địa chỉ giao hàng (optional, để tính shipping fee)',
          properties: {
            street: { type: 'string', example: '123 Đường ABC' },
            city: { type: 'string', example: 'Hà Nội' },
            district: { type: 'string', example: 'Quận 1' },
            ward: { type: 'string', example: 'Phường 1' },
          },
        },
      },
      examples: {
        'Đơn hàng đơn giản': {
          value: {
            items: [
              {
                productId: 'prod-001',
                quantity: 2,
                unitPrice: 649500,
                sellerId: 'seller-001',
              },
            ],
            shippingFee: 30000,
          },
        },
        'Đơn hàng có voucher': {
          value: {
            items: [
              {
                productId: 'prod-001',
                quantity: 2,
                unitPrice: 649500,
                sellerId: 'seller-001',
              },
              {
                productId: 'prod-002',
                quantity: 1,
                unitPrice: 299000,
                sellerId: 'seller-001',
              },
            ],
            voucherCode: 'SAVE20',
            discountAmount: 50000,
            shippingFee: 30000,
            address: {
              street: '123 Đường ABC',
              city: 'Hà Nội',
              district: 'Quận 1',
              ward: 'Phường 1',
            },
          },
        },
        'Đơn hàng nhiều sản phẩm': {
          value: {
            items: [
              {
                productId: 'prod-003',
                quantity: 1,
                unitPrice: 2499000,
                sellerId: 'seller-002',
              },
              {
                productId: 'prod-004',
                quantity: 2,
                unitPrice: 949500,
                sellerId: 'seller-002',
              },
              {
                productId: 'prod-005',
                quantity: 3,
                unitPrice: 1199000,
                sellerId: 'seller-001',
              },
            ],
            orderGroupId: 'GRP-2024-001',
            shippingFee: 50000,
          },
        },
      },
    },
  })
  create(@Body() body: any, @Req() req: any) {
    const user = req.user;
    const authorization = req.headers.authorization || req.headers['authorization'];
    return this.service.forwardCreate(user, body, authorization);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('USER', 'ADMIN')
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo ID' })
  @ApiParam({ name: 'id', description: 'ID đơn hàng' })
  get(@Param('id') id: string) {
    return this.service.forwardGet(id);
  }
}


