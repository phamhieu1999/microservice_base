import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CartItemDto } from './dto/cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart', description: 'Retrieve the shopping cart for the authenticated user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCart(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add or update item in cart', description: 'Add a new item to cart or update existing item quantity' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CartItemDto })
  @ApiResponse({
    status: 201,
    description: 'Item added/updated successfully',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  upsertItem(@Req() req: any, @Body() dto: CartItemDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.upsertItem(userId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart', description: 'Remove a specific product from the cart' })
  @ApiBearerAuth('JWT-auth')
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
  removeItem(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.removeItem(userId, productId);
  }
}


