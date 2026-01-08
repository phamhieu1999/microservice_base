import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SellerService } from './seller.service';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { SellerResponseDto, ShopResponseDto, PaginatedResponseDto } from './dto/seller-response.dto';

@ApiTags('sellers')
@Controller()
export class SellerController {
  constructor(private readonly service: SellerService) {}

  // Seller endpoints
  @Post('sellers/register')
  @ApiOperation({ summary: 'Register as seller and create first shop', description: 'Register a new seller account and create the first shop' })
  @ApiResponse({ status: 201, description: 'Seller registered successfully', type: SellerResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  register(@Req() req: any, @Body() dto: RegisterSellerDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.register(userId, dto);
  }

  @Get('sellers/me')
  @ApiTags('sellers')
  @ApiOperation({ summary: 'Get current seller information', description: 'Get the authenticated seller\'s information with all shops' })
  @ApiResponse({ status: 200, description: 'Seller information retrieved successfully', type: SellerResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @ApiBearerAuth('JWT-auth')
  me(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.getMe(userId);
  }

  @Get('sellers')
  @ApiTags('sellers')
  @ApiOperation({ summary: 'Get all sellers', description: 'Get a paginated list of all sellers with optional status filter' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Filter by seller status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Sellers retrieved successfully', type: PaginatedResponseDto<SellerResponseDto> })
  getAllSellers(@Query('status') status?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getAllSellers(status, page, limit);
  }

  @Get('sellers/:id')
  @ApiTags('sellers')
  @ApiOperation({ summary: 'Get seller by ID', description: 'Get detailed information about a specific seller' })
  @ApiParam({ name: 'id', description: 'Seller UUID', type: String })
  @ApiResponse({ status: 200, description: 'Seller retrieved successfully', type: SellerResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  getSeller(@Param('id') id: string) {
    return this.service.getSellerById(id);
  }

  @Patch('sellers/:id/status')
  @ApiTags('sellers')
  @ApiOperation({ summary: 'Update seller status', description: 'Update the approval status of a seller (admin only)' })
  @ApiParam({ name: 'id', description: 'Seller UUID', type: String })
  @ApiResponse({ status: 200, description: 'Seller status updated successfully', type: SellerResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @ApiBearerAuth('JWT-auth')
  updateSellerStatus(@Param('id') id: string, @Body() dto: UpdateSellerDto) {
    return this.service.updateSellerStatus(id, dto.status);
  }

  // Shop endpoints
  @Post('shops')
  @ApiTags('shops')
  @ApiOperation({ summary: 'Create a new shop', description: 'Create a new shop for the authenticated seller (seller must be APPROVED)' })
  @ApiResponse({ status: 201, description: 'Shop created successfully', type: ShopResponseDto })
  @ApiResponse({ status: 403, description: 'Seller not approved or forbidden' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  createShop(@Req() req: any, @Body() dto: CreateShopDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.createShop(userId, dto);
  }

  @Get('shops')
  @ApiTags('shops')
  @ApiOperation({ summary: 'Get all shops', description: 'Get a paginated list of all shops with optional seller filter' })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Shops retrieved successfully', type: PaginatedResponseDto<ShopResponseDto> })
  getShops(@Query('sellerId') sellerId?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.getShops(sellerId, page, limit);
  }

  @Get('shops/:id')
  @ApiTags('shops')
  @ApiOperation({ summary: 'Get shop by ID', description: 'Get detailed information about a specific shop' })
  @ApiParam({ name: 'id', description: 'Shop UUID', type: String })
  @ApiResponse({ status: 200, description: 'Shop retrieved successfully', type: ShopResponseDto })
  @ApiResponse({ status: 404, description: 'Shop not found' })
  getShop(@Param('id') id: string) {
    return this.service.getShop(id);
  }

  @Get('shops/me/all')
  @ApiTags('shops')
  @ApiOperation({ summary: 'Get all my shops', description: 'Get all shops belonging to the authenticated seller' })
  @ApiResponse({ status: 200, description: 'Shops retrieved successfully', type: [ShopResponseDto] })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @ApiBearerAuth('JWT-auth')
  getMyShops(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.getMyShops(userId);
  }

  @Put('shops/:id')
  @ApiTags('shops')
  @ApiOperation({ summary: 'Update shop', description: 'Update shop information (only shop owner can update)' })
  @ApiParam({ name: 'id', description: 'Shop UUID', type: String })
  @ApiResponse({ status: 200, description: 'Shop updated successfully', type: ShopResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - not shop owner' })
  @ApiResponse({ status: 404, description: 'Shop not found' })
  @ApiBearerAuth('JWT-auth')
  updateShop(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateShopDto) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.updateShop(userId, id, dto);
  }

  @Delete('shops/:id')
  @ApiTags('shops')
  @ApiOperation({ summary: 'Delete shop', description: 'Delete a shop (only shop owner can delete)' })
  @ApiParam({ name: 'id', description: 'Shop UUID', type: String })
  @ApiResponse({ status: 200, description: 'Shop deleted successfully', schema: { type: 'object', properties: { message: { type: 'string', example: 'Shop deleted successfully' } } } })
  @ApiResponse({ status: 403, description: 'Forbidden - not shop owner' })
  @ApiResponse({ status: 404, description: 'Shop not found' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  deleteShop(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.sub || 'mock-user';
    return this.service.deleteShop(userId, id);
  }
}


