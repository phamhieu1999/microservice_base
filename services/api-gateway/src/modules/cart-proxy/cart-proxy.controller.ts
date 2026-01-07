import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartProxyService } from './cart-proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CartItemDto } from './dto/cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
export class CartProxyController {
  constructor(private readonly service: CartProxyService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Get user cart',
    description: 'Retrieve the shopping cart for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Cart service is temporarily unavailable' })
  getCart(@Req() req: any) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.getCart(authHeader);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  @ApiOperation({
    summary: 'Add or update item in cart',
    description: 'Add a new item to cart or update existing item quantity',
  })
  @ApiBody({ type: CartItemDto })
  @ApiResponse({
    status: 201,
    description: 'Item added/updated successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Cart service is temporarily unavailable' })
  upsertItem(@Req() req: any, @Body() body: CartItemDto) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.upsertItem(authHeader, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:productId')
  @ApiOperation({
    summary: 'Remove item from cart',
    description: 'Remove a specific product from the cart',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to remove from cart',
    example: 'prod-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Cart service is temporarily unavailable' })
  removeItem(@Req() req: any, @Param('productId') productId: string) {
    const authHeader = req.headers['authorization'] as string;
    return this.service.removeItem(authHeader, productId);
  }
}


