import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { CreateShippingOrderDto } from './dto/create-shipping-order.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  // ========== Shipping Methods CRUD ==========
  @Get('methods')
  @ApiOperation({ summary: 'Get all active shipping methods' })
  @ApiResponse({ status: 200, description: 'List of shipping methods' })
  getAllShippingMethods() {
    return this.service.getAllShippingMethods();
  }

  @Get('methods/:id')
  @ApiOperation({ summary: 'Get shipping method by ID' })
  @ApiParam({ name: 'id', description: 'Shipping method ID' })
  @ApiResponse({ status: 200, description: 'Shipping method details' })
  @ApiResponse({ status: 404, description: 'Shipping method not found' })
  getShippingMethodById(@Param('id') id: string) {
    return this.service.getShippingMethodById(id);
  }

  @Post('methods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new shipping method' })
  @ApiBody({ type: CreateShippingMethodDto })
  @ApiResponse({ status: 201, description: 'Shipping method created successfully' })
  createShippingMethod(@Body() dto: CreateShippingMethodDto) {
    return this.service.createShippingMethod(dto);
  }

  @Put('methods/:id')
  @ApiOperation({ summary: 'Update shipping method' })
  @ApiParam({ name: 'id', description: 'Shipping method ID' })
  @ApiBody({ type: CreateShippingMethodDto })
  @ApiResponse({ status: 200, description: 'Shipping method updated successfully' })
  @ApiResponse({ status: 404, description: 'Shipping method not found' })
  updateShippingMethod(@Param('id') id: string, @Body() dto: Partial<CreateShippingMethodDto>) {
    return this.service.updateShippingMethod(id, dto);
  }

  @Delete('methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete shipping method (soft delete - set to INACTIVE)' })
  @ApiParam({ name: 'id', description: 'Shipping method ID' })
  @ApiResponse({ status: 204, description: 'Shipping method deleted successfully' })
  @ApiResponse({ status: 404, description: 'Shipping method not found' })
  deleteShippingMethod(@Param('id') id: string) {
    return this.service.deleteShippingMethod(id);
  }

  // ========== Quote Management ==========
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get shipping quotes',
    description: 'Calculate shipping fees for all active methods or a specific method',
  })
  @ApiBody({ type: ShippingQuoteDto })
  @ApiQuery({ name: 'methodId', required: false, description: 'Specific shipping method ID' })
  @ApiResponse({ status: 200, description: 'Shipping quotes calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Shipping method not found' })
  quote(@Body() dto: ShippingQuoteDto, @Query('methodId') methodId?: string) {
    return this.service.quote(dto, methodId);
  }

  @Get('quote/:id')
  @ApiOperation({ summary: 'Get shipping quote by ID' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote details' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  getQuoteById(@Param('id') id: string) {
    return this.service.getQuoteById(id);
  }

  @Post('quote/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a shipping quote' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote accepted successfully' })
  @ApiResponse({ status: 400, description: 'Quote cannot be accepted' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  acceptQuote(@Param('id') id: string) {
    return this.service.acceptQuote(id);
  }

  // ========== Shipping Order Management ==========
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create shipping order from accepted quote' })
  @ApiBody({ type: CreateShippingOrderDto })
  @ApiResponse({ status: 201, description: 'Shipping order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or quote not accepted' })
  createShippingOrder(@Body() dto: CreateShippingOrderDto) {
    return this.service.createShippingOrder(dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all shipping orders' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'] })
  @ApiResponse({ status: 200, description: 'List of shipping orders' })
  getAllShippingOrders(@Query('status') status?: string) {
    return this.service.getAllShippingOrders(status as any);
  }

  @Get('orders/order/:orderId')
  @ApiOperation({ summary: 'Get shipping order by order ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Shipping order details' })
  @ApiResponse({ status: 404, description: 'Shipping order not found' })
  getShippingOrderByOrderId(@Param('orderId') orderId: string) {
    return this.service.getShippingOrderByOrderId(orderId);
  }

  @Get('tracking/:trackingNumber')
  @ApiOperation({ summary: 'Get shipping order by tracking number' })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number' })
  @ApiResponse({ status: 200, description: 'Shipping order tracking details' })
  @ApiResponse({ status: 404, description: 'Shipping order not found' })
  getShippingOrderByTrackingNumber(@Param('trackingNumber') trackingNumber: string) {
    return this.service.getShippingOrderByTrackingNumber(trackingNumber);
  }

  // ========== Tracking Management ==========
  @Put('tracking/:trackingNumber')
  @ApiOperation({ summary: 'Update shipping order tracking status' })
  @ApiParam({ name: 'trackingNumber', description: 'Tracking number' })
  @ApiBody({ type: UpdateTrackingDto })
  @ApiResponse({ status: 200, description: 'Tracking updated successfully' })
  @ApiResponse({ status: 404, description: 'Shipping order not found' })
  updateTracking(@Param('trackingNumber') trackingNumber: string, @Body() dto: UpdateTrackingDto) {
    return this.service.updateTracking(trackingNumber, dto);
  }
}


