import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { ShippingProxyService } from './shipping-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('shipping')
@Controller()
export class ShippingProxyController {
  constructor(private readonly service: ShippingProxyService) {}

  // ========== Shipping Methods ==========
  @Get('shipping/methods')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả shipping methods',
    description: 'Lấy danh sách tất cả shipping methods đang active',
  })
  @ApiResponse({ status: 200, description: 'Danh sách shipping methods' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  getAllShippingMethods() {
    return this.service.getAllShippingMethods();
  }

  @Get('shipping/methods/:id')
  @ApiOperation({
    summary: 'Lấy shipping method theo ID',
    description: 'Lấy thông tin chi tiết của một shipping method',
  })
  @ApiParam({ name: 'id', description: 'Shipping method ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Thông tin shipping method' })
  @ApiResponse({ status: 404, description: 'Shipping method không tồn tại' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  getShippingMethodById(@Param('id') id: string) {
    return this.service.getShippingMethodById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('shipping/methods')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo shipping method mới',
    description: 'Tạo một shipping method mới (chỉ admin)',
  })
  @ApiBody({
    description: 'Thông tin shipping method',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Standard Shipping' },
        type: { type: 'string', enum: ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'SAME_DAY'], example: 'STANDARD' },
        baseFee: { type: 'number', example: 15000 },
        perItemFee: { type: 'number', example: 2000 },
        perKgFee: { type: 'number', example: 5000 },
        estimatedDays: { type: 'number', example: 3 },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' },
        description: { type: 'string', example: 'Standard delivery within 3-5 business days' },
      },
      required: ['name', 'type', 'baseFee', 'estimatedDays'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo shipping method thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  createShippingMethod(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createShippingMethod(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('shipping/methods/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật shipping method',
    description: 'Cập nhật thông tin shipping method (chỉ admin)',
  })
  @ApiParam({ name: 'id', description: 'Shipping method ID' })
  @ApiBody({
    description: 'Thông tin cập nhật',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Shipping' },
        baseFee: { type: 'number', example: 20000 },
        perItemFee: { type: 'number', example: 3000 },
        perKgFee: { type: 'number', example: 6000 },
        estimatedDays: { type: 'number', example: 2 },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Shipping method không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  updateShippingMethod(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.updateShippingMethod(authHeader, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('shipping/methods/:id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa shipping method',
    description: 'Xóa shipping method (soft delete - set to INACTIVE) (chỉ admin)',
  })
  @ApiParam({ name: 'id', description: 'Shipping method ID' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Shipping method không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  deleteShippingMethod(@Req() req: any, @Param('id') id: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.deleteShippingMethod(authHeader, id);
  }

  // ========== Quotes ==========
  @Post('shipping/quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy shipping quote',
    description: 'Tính toán phí vận chuyển cho tất cả methods hoặc một method cụ thể',
  })
  @ApiBody({
    description: 'Thông tin items và địa chỉ',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string', example: '123 Main Street, Ho Chi Minh City' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string', example: 'product-123' },
              sellerId: { type: 'string', example: 'seller-456' },
              price: { type: 'number', example: 100000 },
              quantity: { type: 'number', example: 2 },
              weight: { type: 'number', example: 1.5 },
            },
            required: ['productId', 'price', 'quantity'],
          },
        },
      },
      required: ['items'],
    },
  })
  @ApiQuery({ name: 'methodId', required: false, description: 'ID của shipping method cụ thể' })
  @ApiResponse({ status: 200, description: 'Danh sách quotes' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  getQuote(@Body() body: any, @Query('methodId') methodId?: string) {
    return this.service.getQuote(body, methodId);
  }

  @Get('shipping/quote/:id')
  @ApiOperation({
    summary: 'Lấy quote theo ID',
    description: 'Lấy thông tin chi tiết của một quote',
  })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Thông tin quote' })
  @ApiResponse({ status: 404, description: 'Quote không tồn tại' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  getQuoteById(@Param('id') id: string) {
    return this.service.getQuoteById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('shipping/quote/:id/accept')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chấp nhận quote',
    description: 'Chấp nhận một shipping quote để tạo order',
  })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Chấp nhận quote thành công' })
  @ApiResponse({ status: 400, description: 'Quote không thể chấp nhận (đã expired hoặc đã accepted)' })
  @ApiResponse({ status: 404, description: 'Quote không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  acceptQuote(@Req() req: any, @Param('id') id: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.acceptQuote(authHeader, id);
  }

  // ========== Shipping Orders ==========
  @UseGuards(JwtAuthGuard)
  @Post('shipping/orders')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo shipping order',
    description: 'Tạo shipping order từ một accepted quote',
  })
  @ApiBody({
    description: 'Thông tin shipping order',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'order-123' },
        quoteId: { type: 'string', example: 'quote-456' },
        destinationAddress: { type: 'string', example: '123 Main Street, Ho Chi Minh City' },
        originAddress: { type: 'string', example: '456 Warehouse Street, Hanoi' },
        recipientName: { type: 'string', example: 'John Doe' },
        recipientPhone: { type: 'string', example: '+84901234567' },
        carrier: { type: 'string', example: 'Vietnam Post' },
      },
      required: ['orderId', 'quoteId', 'destinationAddress'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo shipping order thành công' })
  @ApiResponse({ status: 400, description: 'Quote chưa được accept hoặc order đã tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  createShippingOrder(@Req() req: any, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.createShippingOrder(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('shipping/orders')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách shipping orders',
    description: 'Lấy danh sách tất cả shipping orders (có thể filter theo status)',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'] })
  @ApiResponse({ status: 200, description: 'Danh sách shipping orders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  getAllShippingOrders(@Query('status') status?: string) {
    return this.service.getAllShippingOrders(status);
  }

  @Get('shipping/orders/order/:orderId')
  @ApiOperation({
    summary: 'Lấy shipping order theo order ID',
    description: 'Lấy thông tin shipping order theo order ID',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID', example: 'order-123' })
  @ApiResponse({ status: 200, description: 'Thông tin shipping order' })
  @ApiResponse({ status: 404, description: 'Shipping order không tồn tại' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  getShippingOrderByOrderId(@Param('orderId') orderId: string) {
    return this.service.getShippingOrderByOrderId(orderId);
  }

  @Get('shipping/tracking/:trackingNumber')
  @ApiOperation({
    summary: 'Tra cứu vận đơn',
    description: 'Lấy thông tin tracking của shipping order theo tracking number',
  })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number', example: 'SHIP-1234567890-ABCD1234' })
  @ApiResponse({ status: 200, description: 'Thông tin tracking' })
  @ApiResponse({ status: 404, description: 'Shipping order không tồn tại' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  getShippingOrderByTrackingNumber(@Param('trackingNumber') trackingNumber: string) {
    return this.service.getShippingOrderByTrackingNumber(trackingNumber);
  }

  // ========== Tracking ==========
  @UseGuards(JwtAuthGuard)
  @Put('shipping/tracking/:trackingNumber')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật tracking status',
    description: 'Cập nhật trạng thái tracking của shipping order (chỉ admin hoặc carrier)',
  })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number' })
  @ApiBody({
    description: 'Thông tin cập nhật tracking',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'],
          example: 'IN_TRANSIT',
        },
        location: { type: 'string', example: 'Ho Chi Minh City Distribution Center' },
        note: { type: 'string', example: 'Package is in transit' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật tracking thành công' })
  @ApiResponse({ status: 404, description: 'Shipping order không tồn tại' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Shipping service is temporarily unavailable' })
  updateTracking(@Req() req: any, @Param('trackingNumber') trackingNumber: string, @Body() body: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.updateTracking(authHeader, trackingNumber, body);
  }
}

